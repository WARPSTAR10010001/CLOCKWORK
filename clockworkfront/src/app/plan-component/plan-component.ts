import { Component, OnInit, HostListener } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { OverlayService } from "../overlay-service";
import { PlanService } from "../plan-service";
import { PlanEntry, PlanEntryStatus, PlanDetails } from "../plan-service";
import { LogService } from "../log-service";
import { Employee, EmployeeService } from "../employee-service";
import { switchMap, map, catchError, take } from "rxjs/operators";
import { forkJoin, of } from "rxjs";
import { AuthService } from "../auth-service";
import { ImpersonationService } from "../impersonation-service";
import { HolidayService } from "../holiday-service";
import { PlanOptionsService } from "../plan-options-service";

interface SelectedCell {
  employeeId: number;
  day: Date;
}

@Component({
  selector: "app-plan",
  imports: [CommonModule, RouterLink],
  templateUrl: "./plan-component.html",
  styleUrl: "./plan-component.css"
})
export class PlanComponent implements OnInit {
  private holidaySet = new Set<number>();

  year!: number;
  month!: number;

  planId: number | null = null;
  departmentId: number | null = null;

  employees: Employee[] = [];
  monthEntries: PlanEntry[] = [];
  daysForMonth: Date[] = [];

  planEmployeeDetails: PlanDetails["employees"] = [];
  vacationUsedBeforeMonthByEmployee = new Map<number, number>();
  vacationRows: Array<{
    name: string;
    remainingAfterMonth: number;
    usedThisMonth: number;
    diffToPrevMonth: number;
  }> = [];


  private entryMap = new Map<string, PlanEntry>();

  selectedCells: SelectedCell[] = [];
  anchorCell: SelectedCell | null = null;

  weekdays: string[] = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  canGoPrev = false;
  canGoNext = false;
  availablePlanYears: number[] = [];

  showWeekends = false;
  showShortcuts = false;
  hideVacationTable = false;
  compressRows = false;

  private readonly WEEKENDS_COOKIE = "clockwork_show_weekends";
  private readonly SHORTCUTS_COOKIE = "clockwork_show_shortcuts";
  private readonly VACATIONTABLE_COOKIE = "clockwork_hide_vacationtable";
  private readonly COMPRESSROWS_COOKIE = "clockwork_compress_rows";

  constructor(
    private plan: PlanService,
    private employeeService: EmployeeService,
    private auth: AuthService,
    private imp: ImpersonationService,
    private activatedRoute: ActivatedRoute,
    private overlay: OverlayService,
    private router: Router,
    private holidays: HolidayService,
    private log: LogService,
    private planOptions: PlanOptionsService
  ) {}

  ngOnInit(): void {
    this.overlay.noteChanged$
      .subscribe(() => {
        this.reloadCurrentMonth();
      });

    this.activatedRoute.paramMap.subscribe(params => {
      this.year = Number(params.get("year"));
      this.month = Number(params.get("month"));

      this.daysForMonth = this.generateDaysForMonth(this.year, this.month, this.showWeekends);
      this.deselect();

      this.loadHolidays(this.year);

      this.loadPlan();
    });
  }

  private getSelectionSummary(): {
    employeeId: number;
    dateFrom: string;
    dateTo: string;
    dayCount: number;
    dates: string[];
  } | null {
    if (this.selectedCells.length === 0) return null;

    const employeeId = this.selectedCells[0].employeeId;

    const uniqueIso = Array.from(
      new Set(this.selectedCells.map(c => this.toIso(c.day)))
    ).sort();

    if (uniqueIso.length === 0) return null;

    return {
      employeeId,
      dateFrom: uniqueIso[0],
      dateTo: uniqueIso[uniqueIso.length - 1],
      dayCount: uniqueIso.length,
      dates: uniqueIso
    };
  }

  reloadCurrentMonth() {
    if (!this.planId) return;

    const monthKey = this.monthKey(this.year, this.month);

    this.plan.getPlanEntriesForMonth(this.planId, monthKey)
      .pipe(take(1))
      .subscribe(res => {
        this.monthEntries = res.entries;
        this.buildEntryMap();
        this.rebuildVacationRows();
      });
  }

  private loadHolidays(year: number): void {
    this.holidays.getForYear(year).pipe(take(1)).subscribe({
      next: set => {
        this.holidaySet = set;
      },
      error: err => {
        console.error("Feiertage laden fehlgeschlagen:", err);
        this.holidaySet = new Set();
      }
    });
  }

  isHoliday(day: Date): boolean {
    return this.holidaySet.has(this.dayKeyFromDate(day));
  }

  private countVacationInEntries(entries: PlanEntry[], employeeId: number): number {
    return (entries || []).filter(e => {
      if (e.employee_id !== employeeId) return false;
      if ((e.status ?? (e as any).entry_type) !== "VACATION") return false;

      const d = new Date(String(e.entry_date).slice(0, 10) + "T00:00:00");
      if (this.isHoliday(d)) return false;

      return true;
    }).length;
  }

  private loadVacationUsedBeforeMonth(planId: number) {
    this.vacationUsedBeforeMonthByEmployee.clear();

    if (this.month <= 1) {
      return of(void 0);
    }

    const calls = [];
    for (let m = 1; m <= this.month - 1; m++) {
      const key = this.monthKey(this.year, m);
      calls.push(
        this.plan.getPlanEntriesForMonth(planId, key).pipe(
          catchError(() => of({ entries: [], departmentId: this.departmentId ?? 0 }))
        )
      );
    }

    return forkJoin(calls).pipe(
      map((resArr: any[]) => {
        const mapCounts = new Map<number, number>();

        for (const res of resArr) {
          for (const e of (res.entries || [])) {
            const status = e.status ?? e.entry_type ?? null;
            if (status !== "VACATION") continue;

            const d = new Date(String(e.entry_date).slice(0, 10) + "T00:00:00");
            if (this.isHoliday(d)) continue;

            const empId = e.employee_id;
            mapCounts.set(empId, (mapCounts.get(empId) ?? 0) + 1);
          }
        }

        this.vacationUsedBeforeMonthByEmployee = mapCounts;
      }),
      map(() => void 0)
    );
  }

  private rebuildVacationRows(): void {
    const detailByEmpId = new Map<number, PlanDetails["employees"][0]>(
      (this.planEmployeeDetails || []).map(pe => [pe.employeeId, pe])
    );

    this.vacationRows = (this.employees || []).map(emp => {
      const pe = detailByEmpId.get(emp.id);

      const annual = pe?.annualLeaveDays ?? 0;
      const carry = pe?.carryoverDays ?? 0;
      const initial = pe?.initialBalance ?? 0;

      const startTotal = annual + carry + initial;

      const usedBefore = this.vacationUsedBeforeMonthByEmployee.get(emp.id) ?? 0;
      const usedThis = this.countVacationInEntries(this.monthEntries, emp.id);

      const remainingPrev = Math.max(0, startTotal - usedBefore);
      const remainingAfter = Math.max(0, remainingPrev - usedThis);

      return {
        name: pe?.name ?? emp.name,
        remainingAfterMonth: remainingAfter,
        usedThisMonth: usedThis,
        diffToPrevMonth: remainingPrev
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  private isEmployeeActiveInMonth(emp: Employee, monthStart: Date, monthEnd: Date): boolean {
    const parseYmd = (s?: string | null) => {
      if (!s) return null;
      const y = parseInt(s.slice(0, 4), 10);
      const m = parseInt(s.slice(5, 7), 10) - 1;
      const d = parseInt(s.slice(8, 10), 10);
      return new Date(y, m, d);
    };

    const start = parseYmd(emp.start_month) || monthStart;
    const end = parseYmd(emp.end_month) || monthEnd;

    return start <= monthEnd && end >= monthStart;
  }

  private loadPlan(): void {
    this.auth.authStatus$.pipe(
      take(1),
      map(status => {
        const impDep = this.imp.getEffectiveDepartmentId();
        const fromJwt = status?.user?.departmentId ?? null;
        const depId = this.auth.isAdmin() ? (impDep ?? null) : fromJwt ?? null;
        this.departmentId = depId;
        return depId;
      }),
      switchMap(depId => {
        if (!depId) {
          if (this.auth.isAdmin()) {
            this.overlay.showOverlay("info", "Bitte zuerst einen Fachbereich im Modpanel auswählen.");
            this.router.navigate(["/mod"]);
            return of(null);
          }
          this.overlay.showOverlay("error", "Kein Fachbereich im Login gefunden.");
          this.router.navigate(["/auth"]);
          return of(null);
        }

        return this.plan.getPlansForDepartment(depId).pipe(
          map(res => ({ depId, plans: res.plans }))
        );
      }),
      switchMap(data => {
        if (!data) return of(null);
        const { depId, plans } = data;

        this.availablePlanYears = (plans || []).map(p => p.year);

        const plan = plans.find(p => p.year === this.year) || null;
        if (!plan) {
          this.overlay.showOverlay("error", `Für ${this.year} existiert noch kein Plan.`);
          this.router.navigate(["/mod"]);
          return of(null);
        }
        this.planId = plan.id;
        const monthStr = this.monthKey(this.year, this.month);

        return forkJoin({
          employees: this.employeeService.getEmployeesForDepartment(depId),
          entries: this.plan.getPlanEntriesForMonth(plan.id, monthStr),
          planDetails: this.plan.getPlanDetails(plan.id),
          holidays: this.holidays.getForYear(this.year)
        }).pipe(
          map(({ employees, entries, planDetails, holidays }) => ({
            employees,
            entries,
            planDetails,
            holidays
          }))
        );
      }),

      catchError(err => {
        console.error("Fehler beim Laden der Plandaten:", err);
        this.overlay.showOverlay("error", "Fehler beim Laden der Plandaten.");
        return of(null);
      })
    ).subscribe(bundle => {
      if (!bundle) return;

      this.holidaySet = bundle.holidays || new Set<number>();

      this.monthEntries = (bundle.entries.entries || []).map((e: any) => {
        const entry_date = String(e.entry_date).slice(0, 10);
        const status = e.status ?? e.entry_type ?? null;
        return { ...e, entry_date, status };
      });
      this.buildEntryMap();

      const monthStart = new Date(this.year, this.month - 1, 1);
      const monthEnd = new Date(this.year, this.month, 0);

      const employeeById = new Map<number, Employee>(
        (bundle.employees || []).map(e => [e.id, e])
      );

      const activeIds = new Set<number>();

      for (const pe of bundle.planDetails.employees || []) {
        const emp = employeeById.get(pe.employeeId);
        if (!emp) continue;

        if (this.isEmployeeActiveInMonth(emp, monthStart, monthEnd)) {
          activeIds.add(emp.id);
        }
      }

      this.employees = (bundle.employees || []).filter(e => activeIds.has(e.id));

      this.planEmployeeDetails = bundle.planDetails?.employees || [];

      if (this.planId) {
        this.loadVacationUsedBeforeMonth(this.planId)
          .pipe(take(1))
          .subscribe(() => this.rebuildVacationRows());
      } else {
        this.rebuildVacationRows();
      }

      this.updateNavAvailability();
    });
  }

  private updateNavAvailability(): void {
    if (!this.availablePlanYears || this.availablePlanYears.length === 0) {
      this.canGoPrev = false;
      this.canGoNext = false;
      return;
    }

    const years = this.availablePlanYears;
    const prevYearExists = years.includes(this.year - 1);
    const nextYearExists = years.includes(this.year + 1);

    this.canGoPrev = this.month > 1 || (this.month === 1 && prevYearExists);
    this.canGoNext = this.month < 12 || (this.month === 12 && nextYearExists);
  }

  private pad2(n: number): string { return String(n).padStart(2, "0"); }
  private monthKey(year: number, month: number): string { return `${year}-${this.pad2(month)}`; }

  private buildEntryMap(): void {
    this.entryMap.clear();
    this.monthEntries.forEach((entry: any) => {
      const key = `${entry.employee_id}-${entry.entry_date}`;
      this.entryMap.set(key, entry);
    });
  }

  private generateDaysForMonth(year: number, month: number, includeWeekends: boolean): Date[] {
    const days: Date[] = [];
    const d = new Date(year, month - 1, 1);
    while (d.getMonth() === month - 1) {
      const dow = d.getDay();
      if (includeWeekends || (dow !== 0 && dow !== 6)) {
        days.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = this.pad2(d.getMonth() + 1);
    const day = this.pad2(d.getDate());
    return `${y}-${m}-${day}`;
  }

  isWeekend(day: Date): boolean {
    const dow = day.getDay();
    return dow === 0 || dow === 6;
  }

  getHeaderClasses(day: Date): any {
    return {
      "holiday": this.isHoliday(day),
      "weekend-header": this.isWeekend(day)
    };
  }

  getCellClasses(employeeId: number, day: Date): any {
    const type = this.getCellType(employeeId, day);
    const classes: { [key: string]: boolean } = {
      "cell": true,
      "selected": this.isSelected(employeeId, day),
      "weekend-col": this.isWeekend(day)
    };
    if (type) {
      classes[`${type.toLowerCase()}-cell`] = true;
    }
    return classes;
  }

  getCellType(employeeId: number, day: Date): string | null {
    const key = `${employeeId}-${this.toIso(day)}`;
    return this.entryMap.get(key)?.status || null;
  }

  private getEntry(employeeId: number, day: Date): PlanEntry | undefined {
    const key = `${employeeId}-${this.toIso(day)}`;
    return this.entryMap.get(key);
  }

  hasNote(employeeId: number, day: Date): boolean {
    const entry = this.getEntry(employeeId, day);
    return !!entry && !!entry.notes && entry.notes.trim().length > 0;
  }

  selectCell(employeeId: number, day: Date, event: MouseEvent): void {
    event.preventDefault();
    if (this.isWeekend(day)) return;

    const newSelection: SelectedCell = { employeeId, day };

    if (this.selectedCells.length > 0 && this.selectedCells[0].employeeId !== employeeId) {
      this.anchorCell = newSelection;
      this.selectedCells = [newSelection];
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      this.anchorCell = newSelection;
      const index = this.selectedCells.findIndex(c => this.isSameCell(c, newSelection));
      if (index > -1) {
        this.selectedCells.splice(index, 1);
      } else {
        this.selectedCells.push(newSelection);
      }
    } else if (event.shiftKey && this.anchorCell) {
      this.selectedCells = this.getCellsInRange(this.anchorCell, newSelection);
    } else {
      this.anchorCell = newSelection;
      this.selectedCells = [newSelection];
    }
  }

  private getCellsInRange(start: SelectedCell, end: SelectedCell): SelectedCell[] {
    if (start.employeeId !== end.employeeId) return [end];
    const employeeId = start.employeeId;
    const allDaysInView = this.daysForMonth;
    const startIndex = allDaysInView.findIndex(d => d.getTime() === start.day.getTime());
    const endIndex = allDaysInView.findIndex(d => d.getTime() === end.day.getTime());
    if (startIndex === -1 || endIndex === -1) return [];
    const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
    return allDaysInView.slice(min, max + 1).map(day => ({ employeeId, day }));
  }

  isSelected(employeeId: number, day: Date): boolean {
    return this.selectedCells.some(c => this.isSameCell(c, { employeeId, day }));
  }

  private isSameCell(a: SelectedCell, b: SelectedCell): boolean {
    return a.employeeId === b.employeeId && a.day.getTime() === b.day.getTime();
  }

  deselect(): void {
    this.selectedCells = [];
    this.anchorCell = null;
  }

  private mapUiTypeToStatus(type: string): PlanEntryStatus | null {
    switch ((type || "").trim().toUpperCase()) {
      case "U": return "VACATION";
      case "H": return "HOME";
      case "K": return "SICK";
      case "L": return "TRAINING";
      case "G": return "FLEXTIME";
      case "T": return "APPOINTMENT";
      case "O": return "OTHER";
      case "": return null;
      default: return null;
    }
  }

  setEntry(type: string): void {
    if (!this.planId || !this.departmentId) return;

    if (this.selectedCells.length === 0) {
      this.overlay.showOverlay("error", "Es müssen zuerst Zellen ausgewählt werden.");
      return;
    }

    const status = this.mapUiTypeToStatus(type);

    const summary = this.getSelectionSummary();
    if (!summary) {
      this.deselect();
      return;
    }

    const groupedByEmployee = new Map<number, string[]>();
    this.selectedCells.forEach(cell => {
      if (!this.isWeekend(cell.day)) {
        const dates = groupedByEmployee.get(cell.employeeId) || [];
        dates.push(this.toIso(cell.day));
        groupedByEmployee.set(cell.employeeId, dates);
      }
    });

    const calls: any[] = [];
    groupedByEmployee.forEach((dates, employeeId) => {
      if (!status) {
        calls.push(this.plan.deleteEntriesByDates(this.planId!, employeeId, dates));
      } else {
        calls.push(
          this.plan.createEntriesBatch(
            {
              planId: this.planId!,
              departmentId: this.departmentId!,
              employeeId,
              status
            },
            dates,
            status
          )
        );
      }
    });

    if (calls.length === 0) {
      this.deselect();
      return;
    }

    const affectedDays = summary.dayCount;

    forkJoin(calls).pipe(
      switchMap(() => {
        const log$ = (this.planId && this.departmentId && affectedDays > 0)
          ? this.log.createPlanLog({
            planId: this.planId!,
            departmentId: this.departmentId!,
            employeeId: summary.employeeId,
            actionType: status ? "SET" : "DELETE",
            statusCode: status ?? null,
            dateFrom: summary.dateFrom,
            dateTo: summary.dateTo,
            dayCount: summary.dayCount,
            dates: summary.dates
          }).pipe(
            catchError(err => {
              console.error("Plan-Log konnte nicht geschrieben werden:", err);
              return of(null);
            })
          )
          : of(null);

        return log$.pipe(
          switchMap(() =>
            this.plan.getPlanEntriesForMonth(this.planId!, this.monthKey(this.year, this.month))
          )
        );
      })
    ).subscribe({
      next: (res) => {
        this.monthEntries = res.entries;
        this.buildEntryMap();
        this.rebuildVacationRows();
        this.deselect();
      },
      error: (err) => {
        this.overlay.showOverlay("error", err?.error?.error || "Aktion konnte nicht ausgeführt werden.");
        this.deselect();
      }
    });
  }

  getStatus(employeeId: number, day: Date): PlanEntryStatus | null {
    const key = `${employeeId}-${this.toIso(day)}`;
    const e: any = this.entryMap.get(key);
    return (e?.status ?? e?.entry_type ?? null) as PlanEntryStatus | null;
  }

  statusLabel(status: PlanEntryStatus | null): string {
    if (!status) return "";
    const map: Record<PlanEntryStatus, string> = {
      VACATION: "U",
      HOME: "H",
      SICK: "K",
      TRAINING: "L",
      FLEXTIME: "G",
      APPOINTMENT: "T",
      OTHER: "O",
      PRESENCE: "P"
    };
    return map[status] ?? "";
  }

  private dayKeyFromDate(d: Date): number {
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor(local.getTime() / 86400000);
  }

  editNote(employeeId?: number, day?: Date, event?: MouseEvent): void {
    event?.preventDefault();

    if (!this.planId || !this.departmentId) return;

    let targetEmployeeId: number | null = null;
    let targetDay: Date | null = null;

    if (typeof employeeId === "number" && day instanceof Date) {
      if (this.isWeekend(day)) return;
      targetEmployeeId = employeeId;
      targetDay = day;
    } else {
      if (this.selectedCells.length !== 1) {
        this.overlay.showOverlay("error", "Bitte genau eine Zelle auswählen, um die Notiz zu bearbeiten.");
        return;
      }
      const sel = this.selectedCells[0];
      if (this.isWeekend(sel.day)) return;

      targetEmployeeId = sel.employeeId;
      targetDay = sel.day;
    }

    const isoDate = this.toIso(targetDay);
    const monthKey = this.monthKey(this.year, this.month);

    this.plan.getPlanEntriesForMonth(this.planId, monthKey)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          const entry = (res.entries || []).find((e: any) =>
            e.employee_id === targetEmployeeId &&
            String(e.entry_date).slice(0, 10) === isoDate
          );

          if (!entry) {
            this.overlay.showOverlay("error", "Für diese Zelle existiert noch kein Eintrag, daher kann auch keine Notiz gespeichert werden.");
            return;
          }

          const note = entry.notes ?? null;
          const status = entry.status ?? null;

          this.overlay.openPlanNote(note, {
            entryId: entry.id,
            employeeId: targetEmployeeId,
            date: isoDate,
            planId: this.planId,
            departmentId: this.departmentId,
            statusCode: status
          });
        },
        error: (err) => {
          console.error("Fehler beim Laden der Notiz:", err);
          this.overlay.showOverlay("error", "Die Beschreibung konnte nicht geladen werden.");
        }
      });
  }

  toMonthName(month: number) {
    const months = ["null", "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    return months[month];
  }

  @HostListener("document:keydown.u", ["$event"])
  onUHandler(event: Event) {
    if (!this.overlay.current.show) {
      this.setEntry("U");
    }
  }

  @HostListener("document:keydown.k", ["$event"])
  onKHandler(event: Event) {
    if (!this.overlay.current.show) {
      this.setEntry("K");
    }
  }

  @HostListener("document:keydown.h", ["$event"])
  onHHandler(event: Event) {
    if (!this.overlay.current.show) {
      this.setEntry("H");
    }
  }

  @HostListener("document:keydown.l", ["$event"])
  onLHandler(event: Event) {
    if (!this.overlay.current.show) {
      this.setEntry("L");
    }
  }

  @HostListener("document:keydown.g", ["$event"])
  onGHandler(event: Event) {
    if (!this.overlay.current.show) {
      this.setEntry("G");
    }
  }

  @HostListener("document:keydown.t", ["$event"])
  onTHandler(event: Event) {
    if (!this.overlay.current.show) {
      this.setEntry("T");
    }
  }

  @HostListener("document:keydown.o", ["$event"])
  onOHandler(event: Event) {
    if (!this.overlay.current.show) {
      this.setEntry("O");
    }
  }

  @HostListener("document:keydown.delete", ["$event"])
  onDelHandler(event: Event) {
    if (!this.overlay.current.show) {
      this.setEntry("");
    }
  }

  @HostListener("document:keydown.escape", ["$event"])
  onEscHandler(event: Event) {
    if (!this.overlay.current.show) {
      this.deselect();
    }
  }

  @HostListener("document:keydown.enter", ["$event"])
  onEnterHandler(event: Event) {
    if (!this.overlay.current.show) {
      this.editNote();
    }
  }

  @HostListener("document:keydown.ArrowRight", ["$event"])
  onRightHandler(event: Event) {
    if (this.canGoNext) {
      this.loadNextPlan();
    }
  }

  @HostListener("document:keydown.ArrowLeft", ["$event"])
  onLeftHandler(event: Event) {
    if (this.canGoPrev) {
      this.loadPrevPlan();
    }
  }

  loadNextPlan(): void {
    const currentYear = Number(this.activatedRoute.snapshot.paramMap.get("year"));
    const currentMonth = Number(this.activatedRoute.snapshot.paramMap.get("month"));
    let nextYear = currentYear;
    let nextMonth = currentMonth;

    if (currentMonth === 12) {
      nextMonth = 1;
      nextYear++;
    } else {
      nextMonth++;
    }

    this.router.navigate(["/plan", nextYear, nextMonth]);
  }

  loadPrevPlan(): void {
    const currentYear = Number(this.activatedRoute.snapshot.paramMap.get("year"));
    const currentMonth = Number(this.activatedRoute.snapshot.paramMap.get("month"));
    let nextYear = currentYear;
    let nextMonth = currentMonth;

    if (currentMonth === 1) {
      nextMonth = 12;
      nextYear--;
    } else {
      nextMonth--;
    }

    this.router.navigate(["/plan", nextYear, nextMonth]);
  }

  openPlanOptions(): void {
    this.overlay.showOverlay("planOptions");
  }

  openShortcuts(): void {
    this.overlay.showOverlay("planShortcuts");
  }

  toggleWeekends(): void {
    const newValue = !this.showWeekends;
    this.showWeekends = newValue;
    this.planOptions.saveWeekendPreference();

    this.daysForMonth = this.generateDaysForMonth(this.year, this.month, this.showWeekends);
    this.deselect();

    if (newValue) {
      this.overlay.showOverlay(
        "info",
        "Das Anzeigen der Wochenendtage dient nur zur erleichterten visuellen Orientierung, daher können keine Einträge an diesen Tagen vorgenommen werden."
      );
    }
  }
}