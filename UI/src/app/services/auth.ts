import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, tap, switchMap } from 'rxjs';
import { ApiService } from './api';
import { TokenStorageService } from './token';
import { UserService, User } from './user';
import { ChallengeService } from './challenges';
import { StepsService } from './steps';
import { AchievementService } from './achievement';

// ── Types ────────────────────────────────────────────────────────────────────

export type AvatarColor =
  | 'primary'
  | 'success'
  | 'tertiary'
  | 'warning'
  | 'danger';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  avatarColor?: AvatarColor;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
  // True while the app is checking stored tokens on startup
  isInitialising = signal(true);

  // Derived — components can check this instead of reading UserService directly
  isLoggedIn = computed(() => !!this.userService.currentUser());

  constructor(
    private api: ApiService,
    private tokenStorage: TokenStorageService,
    private userService: UserService,
    private challengeService: ChallengeService,
    private stepsService: StepsService,
    private achievementService: AchievementService,
    private router: Router,
  ) {}

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  /**
   * Call once in app.component.ts ngOnInit.
   * Checks for a stored access token and loads the user profile if found.
   * Redirects to /login if no valid session exists.
   */
  async init(): Promise<void> {
    try {
      const token = await this.tokenStorage.getAccessToken();

      if (!token) {
        this.redirectToLogin();
        return;
      }

      // Load the user profile — if the token is expired the interceptor
      // will refresh it automatically before this request completes
      await new Promise<void>((resolve, reject) => {
        this.userService.getMe().subscribe({
          next: () => resolve(),
          error: () => reject(),
        });
      });
    } catch {
      // Refresh failed or no session — send to login
      await this.tokenStorage.clearTokens();
      this.redirectToLogin();
    } finally {
      this.isInitialising.set(false);
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────

  /**
   * POST /auth/register
   * Creates a new account, stores tokens and sets the current user.
   */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/register', payload)
      .pipe(tap((res) => this.handleAuthResponse(res)));
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  /**
   * POST /auth/login
   * Authenticates the user, stores tokens and sets the current user.
   */
  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/login', payload)
      .pipe(tap((res) => this.handleAuthResponse(res)));
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  /**
   * POST /auth/logout
   * Invalidates the refresh token on the server, then clears local state.
   */
  logout(): Observable<{ message: string }> {
    return this.api
      .post<{ message: string }>('/auth/logout')
      .pipe(tap(() => this.clearSession()));
  }

  /**
   * Clears local session without calling the server.
   * Use when the server is unreachable or already returned 401.
   */
  async forceLogout(): Promise<void> {
    await this.clearSession();
  }

  // ── Refresh ────────────────────────────────────────────────────────────────

  /**
   * POST /auth/refresh
   * Exchanges the stored refresh token for a new token pair.
   * The interceptor calls this automatically — you rarely need to call it manually.
   */
  refresh(): Observable<RefreshResponse> {
    return from(this.tokenStorage.getRefreshToken()).pipe(
      switchMap((refreshToken) =>
        this.api.post<RefreshResponse>('/auth/refresh', { refreshToken }),
      ),
      tap((res) =>
        from(this.tokenStorage.setTokens(res.accessToken, res.refreshToken)),
      ),
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private handleAuthResponse(res: AuthResponse): void {
    // Store tokens (fire-and-forget — storage is async but non-blocking)
    this.tokenStorage.setTokens(res.accessToken, res.refreshToken);

    // Update the shared user signal
    this.userService.currentUser.set(res.user);
  }

  private async clearSession(): Promise<void> {
    await this.tokenStorage.clearTokens();
    this.userService.clearUser();
    this.challengeService.clear();
    this.stepsService.clear();
    this.achievementService.clear();
    this.redirectToLogin();
  }

  private redirectToLogin(): void {
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
