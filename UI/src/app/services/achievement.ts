import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export type AchievementCategory = 'steps' | 'streaks' | 'wins' | 'social';
export type AchievementStatus = 'unlocked' | 'in-progress' | 'locked';

export interface Achievement {
  _id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  // Fields added by the API when returning per-user status
  status: AchievementStatus;
  unlockedAt: string | null;
  progress: number; // 0–1
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AchievementService {
  // Full catalogue with own unlock status
  achievements = signal<Achievement[]>([]);

  // Convenient derived signals — components use these directly
  unlocked = computed(() =>
    this.achievements().filter((a) => a.status === 'unlocked'),
  );
  inProgress = computed(() =>
    this.achievements().filter((a) => a.status === 'in-progress'),
  );
  locked = computed(() =>
    this.achievements().filter((a) => a.status === 'locked'),
  );

  unlockedCount = computed(() => this.unlocked().length);
  totalCount = computed(() => this.achievements().length);
  completionPct = computed(() =>
    this.totalCount() > 0
      ? Math.round((this.unlockedCount() / this.totalCount()) * 100)
      : 0,
  );

  byCategory = computed(() => {
    const map: Record<AchievementCategory, Achievement[]> = {
      steps: [],
      streaks: [],
      wins: [],
      social: [],
    };
    for (const a of this.achievements()) {
      map[a.category].push(a);
    }
    return map;
  });

  constructor(private api: ApiService) {}

  // ── Own achievements ───────────────────────────────────────────────────────

  /**
   * GET /achievements
   * Returns the full catalogue with the logged-in user's unlock status
   * (unlocked / in-progress / locked) on each entry.
   */
  getAll(): Observable<{ achievements: Achievement[] }> {
    return this.api
      .get<{ achievements: Achievement[] }>('/achievements')
      .pipe(tap((res) => this.achievements.set(res.achievements)));
  }

  /**
   * GET /achievements/me
   * Returns only the achievements the logged-in user has unlocked.
   * Updates the signal by merging unlock status into the cached catalogue.
   */
  getMine(): Observable<{ achievements: Achievement[] }> {
    return this.api
      .get<{ achievements: Achievement[] }>('/achievements/me')
      .pipe(
        tap((res) => {
          const unlockedIds = new Set(res.achievements.map((a) => a._id));
          // Merge into the existing catalogue if already loaded
          if (this.achievements().length > 0) {
            this.achievements.update((list) =>
              list.map((a) =>
                unlockedIds.has(a._id)
                  ? { ...a, status: 'unlocked' as AchievementStatus }
                  : a,
              ),
            );
          }
        }),
      );
  }

  // ── Friend achievements ────────────────────────────────────────────────────

  /**
   * GET /achievements/:userId
   * Returns the full catalogue with a friend's unlock status.
   * Does NOT update the local signal — returned as a plain observable
   * so the friend page can display it without affecting own state.
   */
  getFriendAchievements(
    userId: string,
  ): Observable<{ achievements: Achievement[] }> {
    return this.api.get(`/achievements/${userId}`);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Returns achievements for a specific category from the cache.
   */
  forCategory(category: AchievementCategory): Achievement[] {
    return this.byCategory()[category];
  }

  /**
   * Clears cached achievement data — call on logout.
   */
  clear(): void {
    this.achievements.set([]);
  }
}
