import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export type AvatarColor =
  | 'primary'
  | 'success'
  | 'tertiary'
  | 'warning'
  | 'danger';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarInitials: string;
  avatarColor: AvatarColor;
  avatarUrl: string | null;
  stepsToday: number;
  totalSteps: number;
  friends: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Friend extends Pick<
  User,
  | '_id'
  | 'name'
  | 'avatarInitials'
  | 'avatarColor'
  | 'avatarUrl'
  | 'stepsToday'
  | 'totalSteps'
> {
  isFriend?: boolean;
  sharedChallenges?: number;
}

export interface UpdateProfilePayload {
  name?: string;
  avatarColor?: AvatarColor;
}

export interface SearchResult extends Friend {
  isFriend: boolean;
}

export interface FriendProfileResponse {
  friend: Friend;
  sharedChallenges: SharedChallenge[];
}

export interface SharedChallenge {
  id: string;
  title: string;
  targetSteps: number;
  status: 'active' | 'completed' | 'upcoming';
  endDate: string;
  mySteps: number;
  friendSteps: number;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class UserService {
  // Reactive current user — components can read this signal directly
  currentUser = signal<User | null>(null);

  constructor(private api: ApiService) {}

  // ── Own profile ────────────────────────────────────────────────────────────

  /**
   * GET /users/me
   * Fetches the logged-in user's profile and updates the currentUser signal.
   */
  getMe(): Observable<{ user: User }> {
    return this.api
      .get<{ user: User }>('/users/me')
      .pipe(tap((res) => this.currentUser.set(res.user)));
  }

  /**
   * PUT /users/me
   * Updates name and/or avatarColor.
   */
  updateProfile(payload: UpdateProfilePayload): Observable<{ user: User }> {
    return this.api
      .put<{ user: User }>('/users/me', payload)
      .pipe(tap((res) => this.currentUser.set(res.user)));
  }

  /**
   * PUT /users/me  (multipart/form-data)
   * Updates profile with an avatar image file.
   */
  updateProfileWithAvatar(
    payload: UpdateProfilePayload,
    avatarFile: File,
  ): Observable<{ user: User }> {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    if (payload.name) formData.append('name', payload.name);
    if (payload.avatarColor)
      formData.append('avatarColor', payload.avatarColor);

    return this.api
      .putMultipart<{ user: User }>('/users/me', formData)
      .pipe(tap((res) => this.currentUser.set(res.user)));
  }

  // ── Search & discover ──────────────────────────────────────────────────────

  /**
   * GET /users/search?q=
   * Searches users by name or email. Returns both friends and non-friends
   * with an isFriend flag on each result.
   */
  searchUsers(query: string): Observable<{ users: SearchResult[] }> {
    return this.api.get<{ users: SearchResult[] }>('/users/search', {
      q: query,
    });
  }

  /**
   * GET /users/:id
   * Gets any user's public profile.
   */
  getUserById(
    userId: string,
  ): Observable<{ user: Friend & { isFriend: boolean } }> {
    return this.api.get(`/users/${userId}`);
  }

  // ── Friends ────────────────────────────────────────────────────────────────

  /**
   * GET /friends
   * Returns the full friends list for the logged-in user.
   */
  getFriends(): Observable<{ friends: Friend[] }> {
    return this.api.get('/friends');
  }

  /**
   * GET /friends/:id
   * Returns a friend's profile plus challenges shared with the logged-in user.
   */
  getFriendProfile(friendId: string): Observable<FriendProfileResponse> {
    return this.api.get(`/friends/${friendId}`);
  }

  /**
   * POST /friends/:id
   * Adds a friend (mutual — both users are linked).
   */
  addFriend(userId: string): Observable<{ message: string }> {
    return this.api.post(`/friends/${userId}`).pipe(
      tap(() => {
        // Optimistically increment the friends array on the local signal
        const user = this.currentUser();
        if (user) {
          this.currentUser.set({
            ...user,
            friends: [...user.friends, userId],
          });
        }
      }),
    );
  }

  /**
   * DELETE /friends/:id
   * Removes a friend (mutual).
   */
  removeFriend(userId: string): Observable<{ message: string }> {
    return this.api.delete(`/friends/${userId}`).pipe(
      tap(() => {
        // Optimistically remove from the local signal
        const user = this.currentUser();
        if (user) {
          this.currentUser.set({
            ...user,
            friends: user.friends.filter((id) => id !== userId),
          });
        }
      }),
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Returns true if the given userId is in the current user's friends list.
   */
  isFriend(userId: string): boolean {
    return this.currentUser()?.friends.includes(userId) ?? false;
  }

  /**
   * Clears the cached user — call on logout.
   */
  clearUser(): void {
    this.currentUser.set(null);
  }
}
