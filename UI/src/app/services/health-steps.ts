import { Injectable, signal } from '@angular/core';
import { BackgroundRunner } from '@capacitor/background-runner';
import { Preferences } from '@capacitor/preferences';
import { Health } from '@capgo/capacitor-health';
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
      const available = await Health.isAvailable();
      if (!available.available) {
        console.warn(
          '[Health] Not available on this device:',
          available.reason,
        );
        return false;
      }

      await Health.requestAuthorization({ read: ['steps'] });
      this.hasPermission.set(true);
      return true;
    } catch (err) {
      console.error('[Health] Permission denied', err);
      this.hasPermission.set(false);
      return false;
    }
  }

  // ── Read steps for a single day ───────────────────────────────────────────

  /**
   * Uses queryAggregated with bucket='day' — returns a single summed value
   * for the day rather than hundreds of individual step samples.
   */
  async getStepsForDay(date: Date): Promise<number> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    // endDate is exclusive in this plugin — use start of next day
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    try {
      const result = await Health.queryAggregated({
        dataType: 'steps',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bucket: 'day',
        aggregation: 'sum',
      });

      // result.samples is an array of AggregatedSample — one per bucket
      return result.samples?.[0]?.value ?? 0;
    } catch (err) {
      console.error(
        '[Health] Error reading steps for',
        toDateString(date),
        err,
      );
      return 0;
    }
  }

  // ── Read last N days ──────────────────────────────────────────────────────

  /**
   * Fetches all days in a single queryAggregated call — much more efficient
   * than one call per day.
   */
  async getStepsForLastDays(days = 7): Promise<DailySteps[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    try {
      const result = await Health.queryAggregated({
        dataType: 'steps',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bucket: 'day',
        aggregation: 'sum',
      });

      return (result.samples ?? []).map((sample) => ({
        date: toDateString(new Date(sample.startDate)),
        steps: sample.value ?? 0,
      }));
    } catch (err) {
      console.error('[Health] Error reading last', days, 'days', err);
      return [];
    }
  }

  // ── Sync today to backend ─────────────────────────────────────────────────

  /**
   * Reads today's steps and upserts them on the backend.
   * Safe to call multiple times — the backend uses a unique { user, date }
   * index so it always updates the same record, never creates duplicates.
   */
  async syncToday(): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);

    try {
      const today = new Date();
      const steps = await this.getStepsForDay(today);
      const date = toDateString(today);

      // Cache in CapacitorKV so runner.js can POST to the backend
      // even when the app is not in the foreground
      await Promise.all([
        Preferences.set({ key: 'cached_steps_today', value: String(steps) }),
        Preferences.set({ key: 'cached_steps_date', value: date }),
      ]);

      // Also POST directly while we are in the foreground
      await new Promise<void>((resolve, reject) => {
        this.stepsService
          .logSteps({ steps, date })
          .subscribe({ next: () => resolve(), error: reject });
      });

      this.lastSyncAt.set(new Date());
      console.log(`[HealthSync] Synced ${steps} steps for today : ${date}`);
    } catch (err) {
      console.error('[HealthSync] syncToday failed', err);
    } finally {
      this.syncing.set(false);
    }
  }

  // ── Backfill last N days ──────────────────────────────────────────────────

  /**
   * Reads and syncs the last N days in one go — one aggregated health query,
   * then one POST per day. Safe to run multiple times (upsert on backend).
   */
  async backfill(days = 7): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);
    console.log(`[HealthSync] Backfilling last ${days} days...`);

    try {
      const dailySteps = await this.getStepsForLastDays(days);

      console.log(
        `[HealthSync] Backfilling ${dailySteps.length} days:`,
        dailySteps,
      );

      for (const { date, steps } of dailySteps) {
        await new Promise<void>((resolve, reject) => {
          this.stepsService
            .logSteps({ steps, date })
            .subscribe({ next: () => resolve(), error: reject });
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

  // ── Background sync ───────────────────────────────────────────────────────

  async registerBackgroundSync(): Promise<void> {
    try {
      await BackgroundRunner.dispatchEvent({
        label: 'com.yourapp.stepchallenge.sync',
        event: 'syncSteps',
        details: {},
      });
      console.log('[BackgroundRunner] Sync registered');
    } catch (err) {
      console.error('[BackgroundRunner] Registration failed', err);
    }
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toLocaleDateString('en-CA'); // yyyy-MM-dd
}
