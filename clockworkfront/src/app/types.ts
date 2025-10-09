export interface PlanListItem {
  id: number;
  departmentId: number;
  year: number;
  createdAt: string;
}

export interface PlanDetails {
  id: number;
  departmentId: number;
  year: number;
  createdAt: string;
  employees: Array<{
    planEmployeeId: number;
    employeeId: number;
    name: string;
    startMonth: string | null;
    endMonth: string | null;
    annualLeaveDays: number;
    carryoverDays: number;
    initialBalance: number;
    usedVacationDays: number;
    availableVacationDays: number;
    remainingVacationDays: number;
  }>;
}

export type PlanEntryStatus =
  | 'PRESENCE' | 'HOME' | 'FLEXTIME'
  | 'TRAINING' | 'VACATION' | 'SICK' | 'OTHER' | 'APPOINTMENT';

export interface PlanEntry {
  id: number;
  employee_id: number;        // server returns snake_case for joins in our code
  entry_date: string;         // YYYY-MM-DD
  status: PlanEntryStatus;
  description: string | null;
  created_at: string;
  // optional convenience added client-side:
  display_name?: string;
}

export interface CreatePlanBody {
  departmentId: number;
  year: number;
  employees: Array<{
    employeeId: number;
    startMonth: string;     // 'YYYY-MM-01'
    endMonth?: string | null;
    initialBalance: number; // Resturlaub zum Jahresstart
  }>;
}

export interface CreateEntryBody {
  planId: number;
  departmentId: number;
  employeeId: number;
  date: string;               // 'YYYY-MM-DD'
  status: PlanEntryStatus;
  description?: string | null;
}