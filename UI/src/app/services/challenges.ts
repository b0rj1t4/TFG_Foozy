import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api';
import { AvatarColor } from '../shared/avatar/avatar.component';

// ── Types ────────────────────────────────────────────────────────────────────

export type ChallengeStatus = 'active' | 'completed' | 'upcoming';

export interface Participant {
  user: {
    _id: string;
    name: string;
    avatarInitials: string;
    avatarColor: AvatarColor;
  };
  steps: number;
  joinedAt: string;
}

export interface RankingEntry {
  rank: number;
  user: {
    _id: string;
    name: string;
    avatarInitials: string;
    avatarColor: AvatarColor;
    avatarUrl?: string | null;
  };
  steps: number;
  pct: number;
  isMe: boolean;
}

export interface Challenge {
  _id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  targetSteps: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  createdBy: {
    _id: string;
    name: string;
    avatarInitials: string;
    avatarColor: string;
  };
  participants: Participant[];
  // Extra fields returned on list endpoints
  mySteps?: number | null;
  myRank?: number | null;
  joined?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChallengePayload {
  title: string;
  description?: string;
  targetSteps: number;
  startDate: string;
  endDate: string;
  coverUrl?: string;
}

export interface UpdateChallengePayload {
  title?: string;
  description?: string;
  targetSteps?: number;
  startDate?: string;
  endDate?: string;
}

export interface GetChallengesParams {
  status?: ChallengeStatus;
  joined?: boolean;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ChallengeService {
  // Cached list — components read this signal directly
  challenges = signal<Challenge[]>([]);

  // Currently viewed challenge detail
  activeChallenge = signal<Challenge | null>(null);

  constructor(private api: ApiService) {}

  // ── List ───────────────────────────────────────────────────────────────────

  /**
   * GET /challenges
   * Optionally filter by status and/or only show challenges the user joined.
   */
  getChallenges(
    params?: GetChallengesParams,
  ): Observable<{ challenges: Challenge[] }> {
    const query: Record<string, string> = {};
    if (params?.status) query['status'] = params.status;
    if (params?.joined) query['joined'] = 'true';

    return this.api
      .get<{ challenges: Challenge[] }>('/challenges', query)
      .pipe(tap((res) => this.challenges.set(res.challenges)));
  }

  // ── Single ─────────────────────────────────────────────────────────────────

  /**
   * GET /challenges/:id
   * Fetches full challenge detail including all participants.
   */
  getChallengeById(id: string): Observable<{ challenge: Challenge }> {
    return this.api
      .get<{ challenge: Challenge }>(`/challenges/${id}`)
      .pipe(tap((res) => this.activeChallenge.set(res.challenge)));
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  /**
   * POST /challenges  (JSON body)
   * Use when no cover image file is being uploaded.
   */
  createChallenge(
    payload: CreateChallengePayload,
  ): Observable<{ challenge: Challenge }> {
    return this.api.post<{ challenge: Challenge }>('/challenges', payload).pipe(
      tap((res) => {
        // Prepend to the cached list
        this.challenges.update((list) => [res.challenge, ...list]);
      }),
    );
  }

  /**
   * POST /challenges  (multipart/form-data)
   * Use when uploading a cover image file at the same time.
   */
  createChallengeWithCover(
    payload: CreateChallengePayload,
    coverFile: File,
  ): Observable<{ challenge: Challenge }> {
    const formData = new FormData();
    formData.append('cover', coverFile);
    formData.append('title', payload.title);
    formData.append('targetSteps', String(payload.targetSteps));
    formData.append('startDate', payload.startDate);
    formData.append('endDate', payload.endDate);
    if (payload.description)
      formData.append('description', payload.description);

    // POST with FormData — use a raw HttpClient call via a dedicated method
    return this.api
      .postMultipart<{ challenge: Challenge }>('/challenges', formData)
      .pipe(
        tap((res) => {
          this.challenges.update((list) => [res.challenge, ...list]);
        }),
      );
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  /**
   * PUT /challenges/:id
   * Only the challenge owner can update. Returns the updated challenge.
   */
  updateChallenge(
    id: string,
    payload: UpdateChallengePayload,
  ): Observable<{ challenge: Challenge }> {
    return this.api
      .put<{ challenge: Challenge }>(`/challenges/${id}`, payload)
      .pipe(
        tap((res) => {
          this.activeChallenge.set(res.challenge);
          this.challenges.update((list) =>
            list.map((c) => (c._id === id ? res.challenge : c)),
          );
        }),
      );
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  /**
   * DELETE /challenges/:id
   * Only the challenge owner can delete.
   */
  deleteChallenge(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/challenges/${id}`).pipe(
      tap(() => {
        this.challenges.update((list) => list.filter((c) => c._id !== id));
        if (this.activeChallenge()?._id === id) {
          this.activeChallenge.set(null);
        }
      }),
    );
  }

  // ── Join ───────────────────────────────────────────────────────────────────

  /**
   * POST /challenges/:id/join
   * Joins the logged-in user to the challenge.
   */
  joinChallenge(id: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/challenges/${id}/join`).pipe(
      tap(() => {
        // Mark as joined in the cached list
        this.challenges.update((list) =>
          list.map((c) => (c._id === id ? { ...c, joined: true } : c)),
        );
      }),
    );
  }

  leaveChallenge(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/challenges/${id}/leave`).pipe(
      tap(() => {
        this.challenges.update((list) =>
          list.map((c) => (c._id === id ? { ...c, joined: false } : c)),
        );
      }),
    );
  }

  // ── Ranking ────────────────────────────────────────────────────────────────

  /**
   * GET /challenges/:id/ranking
   * Returns participants sorted by steps descending with rank, pct and isMe flags.
   */
  getRanking(id: string): Observable<{ ranking: RankingEntry[] }> {
    return this.api.get(`/challenges/${id}/ranking`);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Returns challenges from the cache filtered by status.
   * Useful for the activity page dropdowns without a new network request.
   */
  filterByStatus(status: ChallengeStatus): Challenge[] {
    return this.challenges().filter((c) => c.status === status);
  }

  /**
   * Returns only challenges the logged-in user has joined.
   */
  joinedChallenges(): Challenge[] {
    return this.challenges().filter((c) => c.joined);
  }

  /**
   * Clears cached state — call on logout.
   */
  clear(): void {
    this.challenges.set([]);
    this.activeChallenge.set(null);
  }
}
