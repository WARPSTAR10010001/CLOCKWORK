export interface PlanDay {
  date: string;
  weekday: number;
}

export interface PlanEntries {
  [username: string]: {
    [isoDate: string]: { type: string };
  };
}

export interface Plan {
  year: number;
  month: number;
  users: string[];
  entries: PlanEntries;
  days: PlanDay[];
}