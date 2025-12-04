import { Routes } from '@angular/router';
import { YearComponent } from './year-component/year-component';
import { DocumentationComponent } from './documentation-component/documentation-component';
import { ChangelogComponent } from './changelog-component/changelog-component';
import { MonthComponent } from './month-component/month-component';
import { PlanComponent } from './plan-component/plan-component';
import { AdminComponent } from './admin-component/admin-component';
import { AuthComponent } from './auth-component/auth-component';
import { CreditComponent } from './credit-component/credit-component';
import { ModPlanComponent } from './mod-plan-component/mod-plan-component';
import { ModOverviewComponent } from './mod-overview-component/mod-overview-component';
import { ModEmployeeComponent } from './mod-employee-component/mod-employee-component';
import { AuthGuard, ModGuard, AdminGuard, LoginGuard } from './auth-guard';
import { ModEditPlanComponent } from './mod-edit-plan-component/mod-edit-plan-component';
import { AdminDeptGuard } from './admin-dept-guard';
import { FeedbackComponent } from './feedback-component/feedback-component';
import { LogComponent } from './log-component/log-component';

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
        path: 'docs',
        component: DocumentationComponent,
        title: 'Dokumentation - CLOCKWORK'
    },
    {
        path: 'docs/:sectionId',
        component: DocumentationComponent,
        title: 'Dokumentation - CLOCKWORK'
    },
    {
        path: 'docs/:sectionId/:pageId',
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
        canActivate: [AuthGuard, AdminGuard]
    },
    {
        path: 'admin/feedback',
        component: FeedbackComponent,
        title: 'Feedback - CLOCKWORK',
        canActivate: [AuthGuard, AdminGuard]
    },
    {
        path: 'mod',
        component: ModOverviewComponent,
        title: 'Modübersicht - CLOCKWORK',
        canActivate: [AuthGuard, ModGuard]
    },
    {
        path: 'mod/plans',
        component: ModPlanComponent,
        title: 'Neuer Plan - CLOCKWORK',
        canActivate: [AuthGuard, ModGuard, AdminDeptGuard]
    },
    {
        path: 'mod/employees',
        component: ModEmployeeComponent,
        title: 'Mitarbeiter verwalten - CLOCKWORK',
        canActivate: [AuthGuard, ModGuard, AdminDeptGuard]
    },
    {
        path: 'auth',
        component: AuthComponent,
        title: 'Anmeldung - CLOCKWORK',
        canActivate: [LoginGuard]
    },
    {
        path: 'plan/edit/:year',
        component: ModEditPlanComponent,
        title: 'Dienstplan bearbeiten - CLOCKWORK',
        canActivate: [AuthGuard, ModGuard, AdminDeptGuard]
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
    {
        path: 'plan/:year/:month/logs',
        component: LogComponent,
        title: 'Logs - CLOCKWORK',
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        redirectTo: 'years'
    }
];