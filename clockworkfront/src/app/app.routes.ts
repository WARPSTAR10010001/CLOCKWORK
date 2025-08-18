import { Routes } from '@angular/router';
import { YearComponent } from './year-component/year-component';
import { WikiComponent } from './wiki-component/wiki-component';
import { ChangelogComponent } from './changelog-component/changelog-component';
import { MonthComponent } from './month-component/month-component';
import { PlanComponent } from './plan-component/plan-component';
import { AdminComponent } from './admin-component/admin-component';
import { AuthComponent } from './auth-component/auth-component';
import { AuthGuard } from './auth-guard';
import { AdminGuard } from './admin-guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'plan',
        pathMatch: 'full'
    },
    {
        path: 'plan',
        component: YearComponent,
        title: 'Jahresübersicht - CLOCKWORK',
        canActivate: [AuthGuard]
    },
    {
        path: 'wiki',
        component: WikiComponent,
        title: 'Wiki - CLOCKWORK'
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
        canActivate: [AdminGuard]
    },
    {
        path: 'auth',
        component: AuthComponent,
        title: 'Anmeldung - CLOCKWORK'
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
    }
];