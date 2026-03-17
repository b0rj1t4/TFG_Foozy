import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { from, throwError, EMPTY } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../environments/environment';

// Tracks whether a refresh is already in flight so parallel 401s don't
// each trigger their own refresh call
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  // Skip auth header for login / register / refresh endpoints
  const isPublic = ['/auth/login', '/auth/register', '/auth/refresh'].some(
    (path) => req.url.includes(path),
  );

  if (isPublic) return next(req);

  return from(tokenStorage.getAccessToken()).pipe(
    switchMap((token) => {
      const authReq = token ? addToken(req, token) : req;

      return next(authReq).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status !== 401 || isRefreshing) {
            return throwError(() => err);
          }

          isRefreshing = true;

          // Try to refresh
          return from(tokenStorage.getRefreshToken()).pipe(
            switchMap((refreshToken) => {
              if (!refreshToken) {
                return handleLogout(tokenStorage, router);
              }

              return from(
                fetch(`${environment.apiUrl}/auth/refresh`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refreshToken }),
                }).then((r) => r.json()),
              ).pipe(
                switchMap(async (res) => {
                  isRefreshing = false;

                  if (!res.accessToken) {
                    await tokenStorage.clearTokens();
                    router.navigateByUrl('/login', { replaceUrl: true });
                    return EMPTY;
                  }

                  await tokenStorage.setTokens(
                    res.accessToken,
                    res.refreshToken,
                  );
                  return next(addToken(req, res.accessToken));
                }),
                switchMap((obs) => obs as any),
                catchError(async () => {
                  isRefreshing = false;
                  await tokenStorage.clearTokens();
                  router.navigateByUrl('/login', { replaceUrl: true });
                  return throwError(() => err);
                }),
              );
            }),
          );
        }),
      );
    }),
  );
};

function addToken(
  req: HttpRequest<unknown>,
  token: string,
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function handleLogout(tokenStorage: TokenStorageService, router: Router) {
  return from(
    tokenStorage.clearTokens().then(() => {
      router.navigateByUrl('/login', { replaceUrl: true });
    }),
  ).pipe(switchMap(() => EMPTY));
}
