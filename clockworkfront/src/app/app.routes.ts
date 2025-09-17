import { Routes } from '@angular/router';
import { YearComponent } from './year-component/year-component';
import { DocumentationComponent } from './documentation-component/documentation-component';
import { ChangelogComponent } from './changelog-component/changelog-component';
import { MonthComponent } from './month-component/month-component';
import { PlanComponent } from './plan-component/plan-component';
import { AdminComponent } from './admin-component/admin-component';
import { AuthComponent } from './auth-component/auth-component';
import { CreditComponent } from './credit-component/credit-component';
import { ModeratorComponent } from './moderator-component/moderator-component';
import { AuthGuard, ModGuard, AdminGuard, LoginGuard } from './auth-guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'years', // Startseite ist die Jahresübersicht
        pathMatch: 'full'
    },
    {
        path: 'years', // Klarer Pfadname für die Jahresübersicht
        component: YearComponent,
        title: 'Jahresübersicht - CLOCKWORK',
        canActivate: [AuthGuard] // Muss eingeloggt sein
    },
    {
        path: 'documentation',
        component: DocumentationComponent,
        title: 'Dokumentation - CLOCKWORK'
    },
    {
        path: 'credit',
        component: CreditComponent,
        title: 'Mitwirkende - CLOCKWORK'
    },
    {
        path: 'changelog',
        component: ChangelogComponent,
        title: 'Changelog - CLOCKWORK'
    },
    {
        path: 'admin',
        component: AdminComponent,
        title: 'Adminpanel - CLOCKWORK',
        // Guards werden nacheinander ausgeführt: Erst eingeloggt? Dann Admin?
        canActivate: [AuthGuard, AdminGuard]
    },
    {
        path: 'mod',
        component: ModeratorComponent,
        title: 'Modpanel - CLOCKWORK',
        canActivate: [AuthGuard, ModGuard]
    },
    {
        path: 'auth',
        component: AuthComponent,
        title: 'Anmeldung - CLOCKWORK',
        canActivate: [LoginGuard]
    },
    {
        path: 'plan/:year',
        component: MonthComponent,
        title: 'Monatsübersicht - CLOCKWORK',
        canActivate: [AuthGuard]
    },
    {
        path: 'plan/:year/:month',
        component: PlanComponent,
        title: 'Dienstplan - CLOCKWORK',
        canActivate: [AuthGuard]
    },
    // Fängt alle unbekannten URLs ab und leitet sie sicher weiter
    {
        path: '**',
        redirectTo: 'years'
    }
];