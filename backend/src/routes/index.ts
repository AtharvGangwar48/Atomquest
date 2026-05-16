import { Router } from 'express';
import { login, refresh } from '../controllers/auth.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { guardApprovedSheet } from '../middleware/stateMachine.middleware';
import { createSheet, getMySheets, getSheetById, transitionSheet, getTeamSheets, getSheetScore } from '../controllers/sheet.controller';
import { createGoal, updateGoal, deleteGoal, logActual, updateGoalStatus, getQuarterlyProgress } from '../controllers/goal.controller';
import { addComment, getComments } from '../controllers/checkin.controller';
import { getMe, getUsers, getMyReports } from '../controllers/user.controller';
import { getCurrentCycle, upsertCycleConfig, getCycleConfigs } from '../controllers/cycle.controller';
import { exportAchievementReport, getCompletionDashboard } from '../controllers/report.controller';
import { unlockSheet, getSheetUnlocks, getAuditTrail, getAllUsers } from '../controllers/admin.controller';
import { getQoQTrends, getCompletionHeatmap, getUomBreakdown, getEscalationLogs } from '../controllers/analytics.controller';
import { listRules, upsertRule, deleteRule } from '../controllers/escalation.controller';
import { azureLogin } from '../controllers/auth.controller';

const router = Router();

// Auth
router.post('/auth/login', login);
router.post('/auth/refresh', refresh);
router.post('/auth/azure', azureLogin);

// Users
router.get('/users/me', authenticate, getMe);
router.get('/users', authenticate, requireRole('MANAGER', 'ADMIN'), getUsers);
router.get('/users/reports', authenticate, requireRole('MANAGER', 'ADMIN'), getMyReports);

// Cycle
router.get('/cycle/current', authenticate, getCurrentCycle);
router.get('/cycle/configs', authenticate, requireRole('ADMIN'), getCycleConfigs);
router.put('/cycle/config', authenticate, requireRole('ADMIN'), upsertCycleConfig);

// Goal Sheets
router.post('/sheets', authenticate, requireRole('EMPLOYEE'), createSheet);
router.get('/sheets', authenticate, getMySheets);
router.get('/sheets/team', authenticate, requireRole('MANAGER', 'ADMIN'), getTeamSheets);
router.get('/sheets/:sheetId', authenticate, getSheetById);
router.patch('/sheets/:sheetId/status', authenticate, transitionSheet);
router.get('/sheets/:sheetId/score', authenticate, getSheetScore);
router.get('/sheets/:sheetId/progress', authenticate, getQuarterlyProgress);

// Goals (within a sheet)
router.post('/sheets/:sheetId/goals', authenticate, guardApprovedSheet, createGoal);
router.patch('/goals/:goalId', authenticate, guardApprovedSheet, updateGoal);
router.delete('/goals/:goalId', authenticate, guardApprovedSheet, deleteGoal);
router.patch('/goals/:goalId/status', authenticate, requireRole('MANAGER', 'ADMIN'), updateGoalStatus);

// Actuals
router.post('/goals/:goalId/actuals', authenticate, logActual);

// Check-in Comments (append-only)
router.post('/sheets/:sheetId/comments', authenticate, requireRole('MANAGER', 'ADMIN'), addComment);
router.get('/sheets/:sheetId/comments', authenticate, getComments);

// Reports
router.get('/reports/achievement', authenticate, exportAchievementReport);
router.get('/reports/dashboard', authenticate, requireRole('MANAGER', 'ADMIN'), getCompletionDashboard);

// Admin
router.post('/admin/sheets/:sheetId/unlock', authenticate, requireRole('ADMIN'), unlockSheet);
router.get('/admin/sheets/:sheetId/unlocks', authenticate, requireRole('ADMIN'), getSheetUnlocks);
router.get('/admin/audit', authenticate, requireRole('ADMIN'), getAuditTrail);
router.get('/admin/users', authenticate, requireRole('ADMIN'), getAllUsers);

// Analytics
router.get('/analytics/qoq', authenticate, getQoQTrends);
router.get('/analytics/heatmap', authenticate, requireRole('MANAGER', 'ADMIN'), getCompletionHeatmap);
router.get('/analytics/uom', authenticate, getUomBreakdown);
router.get('/analytics/escalations', authenticate, requireRole('ADMIN'), getEscalationLogs);

// Escalation rules
router.get('/escalation/rules', authenticate, requireRole('ADMIN'), listRules);
router.put('/escalation/rules', authenticate, requireRole('ADMIN'), upsertRule);
router.delete('/escalation/rules/:ruleId', authenticate, requireRole('ADMIN'), deleteRule);

export default router;
