import api from './client';
import type { AuthTokens, GoalSheet, User, CheckinComment, CycleWindow, QuarterlyProgress, DashboardData, AuditPage, GoalUnlock, UomBreakdown, HeatmapRow, QoQTrend, EscalationRule, EscalationLogEntry } from '../types';

// Auth
export const login = (email: string, password: string) =>
  api.post<AuthTokens>('/auth/login', { email, password }).then((r) => r.data);

// Users
export const getMe = () => api.get<User>('/users/me').then((r) => r.data);
export const getUsers = () => api.get<User[]>('/users').then((r) => r.data);
export const getMyReports = () => api.get<User[]>('/users/reports').then((r) => r.data);

// Cycle
export const getCurrentCycle = (year?: number) =>
  api.get<CycleWindow>('/cycle/current', { params: { year } }).then((r) => r.data);
export const upsertCycleConfig = (data: object) =>
  api.put('/cycle/config', data).then((r) => r.data);

// Sheets
export const getMySheets = () => api.get<GoalSheet[]>('/sheets').then((r) => r.data);
export const getTeamSheets = () => api.get<GoalSheet[]>('/sheets/team').then((r) => r.data);
export const getSheet = (id: string) => api.get<GoalSheet>(`/sheets/${id}`).then((r) => r.data);
export const createSheet = (cycleYear: number) => api.post<GoalSheet>('/sheets', { cycleYear }).then((r) => r.data);
export const transitionSheet = (id: string, status: string) =>
  api.patch<GoalSheet>(`/sheets/${id}/status`, { status }).then((r) => r.data);
export const getSheetScore = (id: string, quarter?: string) =>
  api.get<{ score: number; percentage: number }>(`/sheets/${id}/score`, { params: { quarter } }).then((r) => r.data);
export const getQuarterlyProgress = (sheetId: string) =>
  api.get<QuarterlyProgress>(`/sheets/${sheetId}/progress`).then((r) => r.data);

// Goals
export const createGoal = (sheetId: string, data: object) =>
  api.post(`/sheets/${sheetId}/goals`, data).then((r) => r.data);
export const updateGoal = (goalId: string, data: object) =>
  api.patch(`/goals/${goalId}`, data).then((r) => r.data);
export const deleteGoal = (goalId: string) => api.delete(`/goals/${goalId}`);
export const logActual = (goalId: string, quarter: string, actualValue: number, completedDate?: string) =>
  api.post(`/goals/${goalId}/actuals`, { quarter, actualValue, ...(completedDate ? { completedDate } : {}) }).then((r) => r.data);

// Comments
export const getComments = (sheetId: string) =>
  api.get<CheckinComment[]>(`/sheets/${sheetId}/comments`).then((r) => r.data);
export const addComment = (sheetId: string, quarter: string, comment: string) =>
  api.post<CheckinComment>(`/sheets/${sheetId}/comments`, { quarter, comment }).then((r) => r.data);

// Reports
export const getDashboard = (cycleYear?: number) =>
  api.get<DashboardData>('/reports/dashboard', { params: { cycleYear } }).then((r) => r.data);
export const downloadAchievementReport = (cycleYear?: number) =>
  api.get('/reports/achievement', { params: { cycleYear }, responseType: 'blob' }).then((r) => r.data);

// Admin
export const getAuditTrail = (params: { entityType?: string; entityId?: string; page?: number; limit?: number }) =>
  api.get<AuditPage>('/admin/audit', { params }).then((r) => r.data);
export const unlockSheet = (sheetId: string, justification: string, expiresInHours: number) =>
  api.post<GoalUnlock>(`/admin/sheets/${sheetId}/unlock`, { justification, expiresInHours }).then((r) => r.data);
export const getSheetUnlocks = (sheetId: string) =>
  api.get<GoalUnlock[]>(`/admin/sheets/${sheetId}/unlocks`).then((r) => r.data);
export const getCycleConfigs = () =>
  api.get('/cycle/configs').then((r) => r.data);
export const getAdminUsers = () =>
  api.get<User[]>('/admin/users').then((r) => r.data);

// Analytics
export const getQoQTrends = (cycleYear?: number) =>
  api.get<{ cycleYear: number; trends: QoQTrend[] }>('/analytics/qoq', { params: { cycleYear } }).then((r) => r.data);
export const getCompletionHeatmap = (cycleYear?: number) =>
  api.get<{ cycleYear: number; heatmap: HeatmapRow[] }>('/analytics/heatmap', { params: { cycleYear } }).then((r) => r.data);
export const getUomBreakdown = (cycleYear?: number) =>
  api.get<UomBreakdown>('/analytics/uom', { params: { cycleYear } }).then((r) => r.data);
export const getEscalationLogs = () =>
  api.get<EscalationLogEntry[]>('/analytics/escalations').then((r) => r.data);

// Escalation rules
export const listEscalationRules = () =>
  api.get<EscalationRule[]>('/escalation/rules').then((r) => r.data);
export const upsertEscalationRule = (data: object) =>
  api.put<EscalationRule>('/escalation/rules', data).then((r) => r.data);
export const deleteEscalationRule = (ruleId: string) =>
  api.delete(`/escalation/rules/${ruleId}`);
