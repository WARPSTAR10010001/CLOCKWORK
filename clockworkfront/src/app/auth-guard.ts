import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth-service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

/**
 * This guard protects routes that should only be accessible to logged-in users.
 */
export const AuthGuard: CanActivateFn = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // This is the reactive way to check for authentication.
  return authService.authStatus$.pipe(
    // take(1) ensures the observable completes after getting the first value.
    take(1), 
    map(authStatus => {
      const isLoggedIn = authStatus?.loggedIn || false;
      
      if (isLoggedIn) {
        return true; // User is logged in, allow access.
      } else {
        // User is not logged in, redirect to the login page.
        router.navigate(['/auth']);
        return false; // Block access.
      }
    })
  );
};


/**
 * This guard protects the /auth route itself.
 * It prevents already logged-in users from seeing the login page again.
 */
export const LoginGuard: CanActivateFn = (): Observable<boolean> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authStatus$.pipe(
        take(1),
        map(authStatus => {
            const isLoggedIn = authStatus?.loggedIn || false;

            if (isLoggedIn) {
                // User is already logged in, redirect them away from the login page.
                router.navigate(['/plan']);
                return false; // Block access to /auth.
            } else {
                return true; // User is not logged in, allow access to /auth.
            }
        })
    );
};
