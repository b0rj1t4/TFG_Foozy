import { Injectable, signal } from '@angular/core';
import { Health } from '@capgo/capacitor-health';
import { BackgroundRunner } from '@capacitor/background-runner';
import { StepsService } from './steps';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailySteps {
  date: string; // yyyy-MM-dd
  steps: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class HealthStepsService {
  syncing = signal(false);
  lastSyncAt = signal<Date | null>(null);
  hasPermission = signal(false);

  constructor(private stepsService: StepsService) {}

  // ── Permissions ───────────────────────────────────────────────────────────

  async requestPermissions(): Promise<boolean> {
    try {
      await Health.requestAuthorization({
        read: ['steps'],
      });
      this.hasPermission.set(true);
      return true;
    } catch (err) {
      console.error('Health permission denied', err);
      this.hasPermission.set(false);
      return false;
    }
  }

  // ── Read steps for a single day ───────────────────────────────────────────

  async getStepsForDay(date: Date): Promise<number> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    try {
      const result = await Health.readSamples({
        dataType: 'steps',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 0,
        ascending: false,
      });

      // Sum all step samples for the day
      return result.samples.reduce(
        (sum: number, sample: any) => sum + (sample.quantity ?? 0),
        0,
      );
    } catch (err) {
      console.error('Error reading steps for', date, err);
      return 0;
    }
  }

  // ── Read last N days ──────────────────────────────────────────────────────

  async getStepsForLastDays(days = 7): Promise<DailySteps[]> {
    const results: DailySteps[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const steps = await this.getStepsForDay(date);
      results.push({
        date: toDateString(date),
        steps,
      });
    }

    return results;
  }

  // ── Sync today's steps to backend ─────────────────────────────────────────

  /**
   * Reads today's steps from the health API and upserts them on the backend.
   * The backend Step model uses a unique index on { user, date } so calling
   * this multiple times per day is safe — it always updates the same record.
   */
  async syncToday(): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);

    try {
      const today = new Date();
      const steps = await this.getStepsForDay(today);

      await new Promise<void>((resolve, reject) => {
        this.stepsService
          .logSteps({
            steps,
            date: toDateString(today),
          })
          .subscribe({ next: () => resolve(), error: reject });
      });

      this.lastSyncAt.set(new Date());
      console.log(`[HealthSync] Synced ${steps} steps for today`);
    } catch (err) {
      console.error('[HealthSync] Sync failed', err);
    } finally {
      this.syncing.set(false);
    }
  }

  // ── Backfill last N days ──────────────────────────────────────────────────

  /**
   * Reads and syncs the last N days in one go.
   * Useful on first launch — fills in historical data.
   * Safe to call multiple times — the backend upserts by date.
   */
  async backfill(days = 7): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);

    try {
      const dailySteps = await this.getStepsForLastDays(days);

      for (const { date, steps } of dailySteps) {
        await new Promise<void>((resolve, reject) => {
          this.stepsService.logSteps({ steps, date }).subscribe({
            next: () => resolve(),
            error: reject,
          });
        });
        console.log(`[HealthSync] Backfilled ${steps} steps for ${date}`);
      }

      this.lastSyncAt.set(new Date());
    } catch (err) {
      console.error('[HealthSync] Backfill failed', err);
    } finally {
      this.syncing.set(false);
    }
  }

  // ── Background sync setup ─────────────────────────────────────────────────

  /**
   * Registers a background task that syncs today's steps every 15 minutes.
   * Call once after the user grants health permissions.
   *
   * The background runner calls the 'syncSteps' event defined in
   * runner.js (see below) which re-reads and posts today's step count.
   */
  async registerBackgroundSync(): Promise<void> {
    try {
      await BackgroundRunner.dispatchEvent({
        label: 'com.yourapp.stepchallenge.sync',
        event: 'syncSteps',
        details: {},
      });
      console.log('[BackgroundRunner] Background sync registered');
    } catch (err) {
      console.error('[BackgroundRunner] Registration failed', err);
    }
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]; // yyyy-MM-dd
}
