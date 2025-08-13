import { Routes } from '@angular/router';
import { YearComponent } from './year-component/year-component';
import { InfoComponent } from './info-component/info-component';
import { MonthComponent } from './month-component/month-component';
import { PlanComponent } from './plan-component/plan-component';
import { AdminComponent } from './admin-component/admin-component';
import { AuthComponent } from './auth-component/auth-component';

export const routes: Routes = [
    {
        path: "",
        component: YearComponent,
        title: "Jahresansicht - CLOCKWORK"
    },
    {
        path: "wiki",
        component: InfoComponent,
        title: "Wiki - CLOCKWORK"

    },
    {
        path: "admin",
        component: AdminComponent,
        title: "Adminansicht - CLOCKWORK"
    },
    {
        path: "auth",
        component: AuthComponent,
        title: "Anmeldung - CLOCKWORK"
    },
    {
        path: "/:year",
        component: MonthComponent,
        title: "Monatsansicht - CLOCKWORK"
    },
    {
        path: "/:year/:month",
        component: PlanComponent,
        title: "Dienstplan - CLOCKWORK"
    }
];