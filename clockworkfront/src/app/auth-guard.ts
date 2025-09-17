import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth-service';
import { map, take, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

/**
 * Dieser Guard schützt Routen für eingeloggte Nutzer.
 */
export const AuthGuard: CanActivateFn = (): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authStatus$.pipe(
    // HIER IST DIE MAGIE: Wir warten, bis der Status nicht mehr der initiale 'null'-Wert ist.
    // Das stellt sicher, dass wir entweder das Ergebnis von checkStatus() (beim Neuladen)
    // oder von login() abwarten.
    filter(status => status !== null), 
    
    take(1), // Nimm den ersten "echten" Status, der durch den Filter kommt
    map(authStatus => {
      const isLoggedIn = authStatus?.loggedIn || false;
      
      if (isLoggedIn) {
        return true; // Zugriff erlaubt
      } else {
        router.navigate(['/auth']); // Nicht eingeloggt, zum Login umleiten
        return false; // Zugriff blockieren
      }
    })
  );
};

/**
 * Dieser Guard schützt die Login-Seite selbst.
 */
export const LoginGuard: CanActivateFn = (): Observable<boolean> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authStatus$.pipe(
        // Auch hier warten wir auf den ersten echten Status
        filter(status => status !== null),
        
        take(1),
        map(authStatus => {
            const isLoggedIn = authStatus?.loggedIn || false;

            if (isLoggedIn) {
                // Bereits eingeloggt? Weg von der Login-Seite, hin zur Jahresübersicht
                router.navigate(['/years']); 
                return false; // Zugriff auf /auth blockieren
            } else {
                return true; // Nicht eingeloggt? Zugriff auf /auth erlauben
            }
        })
    );
};


/**
 * NEU: Dieser Guard schützt Routen, die nur für Moderatoren und Admins zugänglich sein sollen.
 */
export const ModGuard: CanActivateFn = (): Observable<boolean> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authStatus$.pipe(
        // Wir warten wieder auf den ersten echten Status, um Race Conditions zu vermeiden
        filter(status => status !== null),
        take(1),
        map(authStatus => {
            const role = authStatus?.user?.role;

            // Prüfe, ob die Rolle entweder 'mod' oder 'admin' ist
            if (role === 'mod' || role === 'admin') {
                return true; // Zugriff erlaubt
            } else {
                // Wenn nicht, wird der Nutzer zum Login umgeleitet
                router.navigate(['/auth']);
                return false; // Zugriff blockieren
            }
        })
    );
};

export const AdminGuard: CanActivateFn = (): Observable<boolean> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authStatus$.pipe(
        // Wir warten wieder auf den ersten echten Status, um Race Conditions zu vermeiden
        filter(status => status !== null),
        take(1),
        map(authStatus => {
            const role = authStatus?.user?.role;

            // Prüfe, ob die Rolle entweder 'mod' oder 'admin' ist
            if (role === 'admin') {
                return true; // Zugriff erlaubt
            } else {
                // Wenn nicht, wird der Nutzer zum Login umgeleitet
                router.navigate(['/auth']);
                return false; // Zugriff blockieren
            }
        })
    );
};