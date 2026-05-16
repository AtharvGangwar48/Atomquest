export type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type SheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REWORK';
export type GoalStatus = 'PENDING' | 'ON_TRACK' | 'COMPLETED';
export type UomType = 'PERCENTAGE' | 'NUMBER' | 'CURRENCY' | 'BOOLEAN';
export type ScoringType = 'MAX' | 'MIN' | 'TIMELINE' | 'ZERO';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type ActivePeriod = 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface CycleWindow {
  activePeriod: ActivePeriod;
  cycleYear: number;
  writableQuarter: Quarter | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  managerId?: string;
  manager?: { id: string; name: string };
}

export interface GoalActual {
  id: string;
  goalId: string;
  quarter: Quarter;
  actualValue: number;
  completedDate?: string;
  score: number;
  loggedAt: string;
}

export interface Goal {
  id: string;
  sheetId: string;
  thrustArea: string;
  title: string;
  description?: string;
  uomType: UomType;
  scoringType: ScoringType;
  target: number;
  deadline?: string;
  weightage: number;
  isShared: boolean;
  sharedOwnerId?: string;
  status: GoalStatus;
  actuals: GoalActual[];
}

export interface QuarterlyProgressRow {
  goalId: string;
  title: string;
  thrustArea: string;
  uomType: UomType;
  scoringType: ScoringType;
  target: number;
  weightage: number;
  status: GoalStatus;
  actuals: Record<Quarter, { value: number; score: number } | undefined>;
}

export interface QuarterlyProgress {
  rows: QuarterlyProgressRow[];
  activePeriod: ActivePeriod;
  writableQuarter: Quarter | null;
}

export interface GoalSheet {
  id: string;
  employeeId: string;
  employee?: User;
  cycleYear: number;
  status: SheetStatus;
  goals: Goal[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckinComment {
  id: string;
  sheetId: string;
  managerId: string;
  manager: { name: string };
  quarter: Quarter;
  comment: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface GoalUnlock {
  id: string;
  sheetId: string;
  grantedBy: string;
  admin: { name: string; email: string };
  justification: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changedBy: string;
  changer: { name: string; email: string; role: Role };
  oldValue: unknown;
  newValue: unknown;
  changedAt: string;
}

export interface DashboardEmployee {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  sheetId: string;
  sheetStatus: SheetStatus;
  totalGoals: number;
  completed: number;
  onTrack: number;
  pending: number;
  avgScore: number;
}

export interface DashboardData {
  cycleYear: number;
  totals: {
    totalEmployees: number;
    sheetsApproved: number;
    sheetsSubmitted: number;
    sheetsDraft: number;
    avgScore: number;
  };
  employees: DashboardEmployee[];
}

export interface AuditPage {
  total: number;
  page: number;
  limit: number;
  pages: number;
  logs: AuditLog[];
}

export interface QoQTrend {
  quarter: Quarter;
  avgScore: number;
  count: number;
}

export interface HeatmapRow {
  thrustArea: string;
  Q1?: number;
  Q2?: number;
  Q3?: number;
  Q4?: number;
}

export interface PieSlice {
  name: string;
  value: number;
}

export interface UomBreakdown {
  cycleYear: number;
  totalGoals: number;
  uomBreakdown: PieSlice[];
  scoringBreakdown: PieSlice[];
  statusBreakdown: PieSlice[];
}

export interface EscalationRule {
  id: string;
  name: string;
  triggerEvent: string;
  thresholdDays: number;
  notifyRole: Role;
  isActive: boolean;
}

export interface EscalationLogEntry {
  id: string;
  message: string;
  sentAt: string;
  channel: string;
  rule: { name: string; triggerEvent: string };
  user: { name: string; email: string };
}
