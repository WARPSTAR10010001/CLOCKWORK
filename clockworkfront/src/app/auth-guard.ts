import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth-service';
import { map, take, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const AuthGuard: CanActivateFn = (): Observable<boolean> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authStatus$.pipe(
        filter(status => status !== null),

        take(1),
        map(authStatus => {
            const isLoggedIn = authStatus?.loggedIn || false;

            if (isLoggedIn) {
                return true;
            } else {
                router.navigate(['/auth']);
                return false;
            }
        })
    );
};

export const LoginGuard: CanActivateFn = (): Observable<boolean> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authStatus$.pipe(
        filter(status => status !== null),

        take(1),
        map(authStatus => {
            const isLoggedIn = authStatus?.loggedIn || false;

            if (isLoggedIn) {
                if (authService.isAdmin()) {
                    router.navigate(['/admin']);
                } else {
                    router.navigate(['/']);
                }
                return false;
            } else {
                return true;
            }
        })
    );
};

export const ModGuard: CanActivateFn = (): Observable<boolean> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authStatus$.pipe(
        filter(status => status !== null),
        take(1),
        map(authStatus => {
            const role = authStatus?.user?.role;
            if (role === 'mod' || role === 'admin') {
                return true;
            } else {
                router.navigate(['/auth']);
                return false;
            }
        })
    );
};

export const AdminGuard: CanActivateFn = (): Observable<boolean> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authStatus$.pipe(
        filter(status => status !== null),
        take(1),
        map(authStatus => {
            const role = authStatus?.user?.role;

            if (role === 'admin') {
                return true;
            } else {
                router.navigate(['/auth']);
                return false;
            }
        })
    );
};