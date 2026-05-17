import api from './client';
import type { AuthTokens, GoalSheet, User, CheckinComment, CycleWindow, QuarterlyProgress, DashboardData, AuditPage, GoalUnlock, UomBreakdown, HeatmapRow, QoQTrend, EscalationRule, EscalationLogEntry } from '../types';

// Auth
export const login = (email: string, password: string) =>
  api.post<AuthTokens>('/api/auth/login', { email, password }).then((r) => r.data);

export const signup = (data: { companyName: string; industry?: string; name: string; email: string; password: string }) =>
  api.post<AuthTokens>('/api/auth/signup', data).then((r) => r.data);

// Users
export const getMe = () => api.get<User>('/api/users/me').then((r) => r.data);
export const getUsers = () => api.get<User[]>('/api/users').then((r) => r.data);
export const getMyReports = () => api.get<User[]>('/api/users/reports').then((r) => r.data);

// Cycle
export const getCurrentCycle = (year?: number) =>
  api.get<CycleWindow>('/api/cycle/current', { params: { year } }).then((r) => r.data);
export const upsertCycleConfig = (data: object) =>
  api.put('/api/cycle/config', data).then((r) => r.data);

// Sheets
export const getMySheets = () => api.get<GoalSheet[]>('/api/sheets').then((r) => r.data);
export const getTeamSheets = () => api.get<GoalSheet[]>('/api/sheets/team').then((r) => r.data);
export const getSheet = (id: string) => api.get<GoalSheet>(`/api/sheets/${id}`).then((r) => r.data);
export const createSheet = (cycleYear: number) => api.post<GoalSheet>('/api/sheets', { cycleYear }).then((r) => r.data);
export const transitionSheet = (id: string, status: string) =>
  api.patch<GoalSheet>(`/api/sheets/${id}/status`, { status }).then((r) => r.data);
export const getSheetScore = (id: string, quarter?: string) =>
  api.get<{ score: number; percentage: number }>(`/api/sheets/${id}/score`, { params: { quarter } }).then((r) => r.data);
export const getQuarterlyProgress = (sheetId: string) =>
  api.get<QuarterlyProgress>(`/api/sheets/${sheetId}/progress`).then((r) => r.data);

// Goals
export const createGoal = (sheetId: string, data: object) =>
  api.post(`/api/sheets/${sheetId}/goals`, data).then((r) => r.data);
export const updateGoal = (goalId: string, data: object) =>
  api.patch(`/api/goals/${goalId}`, data).then((r) => r.data);
export const deleteGoal = (goalId: string) => api.delete(`/api/goals/${goalId}`);
export const logActual = (goalId: string, quarter: string, actualValue: number, completedDate?: string) =>
  api.post(`/api/goals/${goalId}/actuals`, { quarter, actualValue, ...(completedDate ? { completedDate } : {}) }).then((r) => r.data);

// Comments
export const getComments = (sheetId: string) =>
  api.get<CheckinComment[]>(`/api/sheets/${sheetId}/comments`).then((r) => r.data);
export const addComment = (sheetId: string, quarter: string, comment: string) =>
  api.post<CheckinComment>(`/api/sheets/${sheetId}/comments`, { quarter, comment }).then((r) => r.data);

// Reports
export const getDashboard = (cycleYear?: number) =>
  api.get<DashboardData>('/api/reports/dashboard', { params: { cycleYear } }).then((r) => r.data);
export const downloadAchievementReport = (cycleYear?: number) =>
  api.get('/api/reports/achievement', { params: { cycleYear }, responseType: 'blob' }).then((r) => r.data);

// Admin
export const getAuditTrail = (params: { entityType?: string; entityId?: string; page?: number; limit?: number }) =>
  api.get<AuditPage>('/api/admin/audit', { params }).then((r) => r.data);
export const unlockSheet = (sheetId: string, justification: string, expiresInHours: number) =>
  api.post<GoalUnlock>(`/api/admin/sheets/${sheetId}/unlock`, { justification, expiresInHours }).then((r) => r.data);
export const getSheetUnlocks = (sheetId: string) =>
  api.get<GoalUnlock[]>(`/api/admin/sheets/${sheetId}/unlocks`).then((r) => r.data);
export const getCycleConfigs = () =>
  api.get('/api/cycle/configs').then((r) => r.data);
export const getAdminUsers = () =>
  api.get<User[]>('/api/admin/users').then((r) => r.data);

// Analytics
export const getQoQTrends = (cycleYear?: number) =>
  api.get<{ cycleYear: number; trends: QoQTrend[] }>('/api/analytics/qoq', { params: { cycleYear } }).then((r) => r.data);
export const getCompletionHeatmap = (cycleYear?: number) =>
  api.get<{ cycleYear: number; heatmap: HeatmapRow[] }>('/api/analytics/heatmap', { params: { cycleYear } }).then((r) => r.data);
export const getUomBreakdown = (cycleYear?: number) =>
  api.get<UomBreakdown>('/api/analytics/uom', { params: { cycleYear } }).then((r) => r.data);
export const getEscalationLogs = () =>
  api.get<EscalationLogEntry[]>('/api/analytics/escalations').then((r) => r.data);

// Escalation rules
export const listEscalationRules = () =>
  api.get<EscalationRule[]>('/api/escalation/rules').then((r) => r.data);
export const upsertEscalationRule = (data: object) =>
  api.put<EscalationRule>('/api/escalation/rules', data).then((r) => r.data);
export const deleteEscalationRule = (ruleId: string) =>
  api.delete(`/api/escalation/rules/${ruleId}`);
