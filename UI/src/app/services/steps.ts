import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export type StepPeriod = 'today' | 'week' | 'month' | 'year';

export interface StepRecord {
  _id: string;
  user: string;
  steps: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface StepSummary {
  steps: StepRecord[];
  total: number;
}

export interface LogStepsPayload {
  steps: number;
  date?: string; // ISO 8601 — omit for today
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StepsService {
  // Cached summaries per period — components read these signals directly
  today = signal<StepSummary>({ steps: [], total: 0 });
  week = signal<StepSummary>({ steps: [], total: 0 });
  month = signal<StepSummary>({ steps: [], total: 0 });
  year = signal<StepSummary>({ steps: [], total: 0 });

  // Convenience computed values
  stepsToday = computed(() => this.today().total);
  stepsWeek = computed(() => this.week().total);
  stepsMonth = computed(() => this.month().total);
  stepsYear = computed(() => this.year().total);

  constructor(private api: ApiService) {}

  // ── Log ────────────────────────────────────────────────────────────────────

  /**
   * POST /steps
   * Logs steps for today or a specific date (upsert — one record per day).
   * Refreshes all period caches after a successful log.
   */
  logSteps(payload: LogStepsPayload): Observable<{ record: StepRecord }> {
    return this.api.post<{ record: StepRecord }>('/steps', payload).pipe(
      tap(() => {
        // Refresh all three periods so totals stay in sync
        this.getMySteps('today').subscribe();
        this.getMySteps('week').subscribe();
        this.getMySteps('month').subscribe();
        this.getMySteps('year').subscribe();
      }),
    );
  }

  // ── Own steps ──────────────────────────────────────────────────────────────

  /**
   * GET /steps/me?period=today|month|year
   * Fetches the logged-in user's step history for the given period
   * and updates the corresponding signal.
   */
  getMySteps(period: StepPeriod): Observable<StepSummary> {
    return this.api
      .get<StepSummary>('/steps/me', { period })
      .pipe(tap((res) => this.setPeriod(period, res)));
  }

  /**
   * Loads all three periods in one go — useful on app init or
   * when navigating to the activity page.
   */
  loadAll(): void {
    this.getMySteps('today').subscribe();
    this.getMySteps('week').subscribe();
    this.getMySteps('month').subscribe();
    this.getMySteps('year').subscribe();
  }

  // ── Friend steps ───────────────────────────────────────────────────────────

  /**
   * GET /steps/:userId?period=today|month|year
   * Fetches a friend's step history for the given period.
   * Returns the observable directly — no signal cached since it's per-friend.
   */
  getFriendSteps(userId: string, period: StepPeriod): Observable<StepSummary> {
    return this.api.get<StepSummary>(`/steps/${userId}`, { period });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Returns the step goal for a given period.
   * Adjust these values to match your app's goals.
   */
  goalFor(period: StepPeriod): number {
    const goals: Record<StepPeriod, number> = {
      today: 10000,
      week: 70000,
      month: 300000,
      year: 3650000,
    };
    return goals[period];
  }

  /**
   * Returns completion percentage (0–100) for a given period.
   */
  pctFor(period: StepPeriod): number {
    const total = this[period]().total;
    return Math.min(100, Math.round((total / this.goalFor(period)) * 100));
  }

  /**
   * Clears all cached step data — call on logout.
   */
  clear(): void {
    const empty = { steps: [], total: 0 };
    this.today.set(empty);
    this.week.set(empty);
    this.month.set(empty);
    this.year.set(empty);
  }

  private setPeriod(period: StepPeriod, data: StepSummary): void {
    this[period].set(data);
  }
}
