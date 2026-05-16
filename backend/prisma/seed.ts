import { PrismaClient, Role, SheetStatus, GoalStatus, UomType, ScoringType, Quarter } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hash = (p: string) => bcrypt.hash(p, 10);

// ── helpers ──────────────────────────────────────────────────────────────────
function computeScore(scoringType: ScoringType, target: number, actual: number): number {
  switch (scoringType) {
    case ScoringType.MAX:      return Math.min(actual / target, 1);
    case ScoringType.MIN:      return actual <= target ? 1 : Math.max(0, 1 - (actual - target) / target);
    case ScoringType.ZERO:     return actual === 0 ? 1 : Math.max(0, 1 - actual / 100);
    case ScoringType.TIMELINE: return 1; // timeline treated as achieved when logged
    default:                   return 0;
  }
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {

  // ─── Users ──────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@company.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@company.com', password: await hash('Admin@123'), role: Role.ADMIN },
  });

  const manager = await prisma.user.upsert({
    where:  { email: 'manager@company.com' },
    update: {},
    create: { name: 'Jane Manager', email: 'manager@company.com', password: await hash('Manager@123'), role: Role.MANAGER },
  });

  const employee = await prisma.user.upsert({
    where:  { email: 'employee@company.com' },
    update: { managerId: manager.id },
    create: { name: 'John Employee', email: 'employee@company.com', password: await hash('Employee@123'), role: Role.EMPLOYEE, managerId: manager.id },
  });

  // two extra employees under the same manager (for richer Team view)
  const emp2 = await prisma.user.upsert({
    where:  { email: 'alice@company.com' },
    update: { managerId: manager.id },
    create: { name: 'Alice Chen', email: 'alice@company.com', password: await hash('Employee@123'), role: Role.EMPLOYEE, managerId: manager.id },
  });

  const emp3 = await prisma.user.upsert({
    where:  { email: 'bob@company.com' },
    update: { managerId: manager.id },
    create: { name: 'Bob Singh', email: 'bob@company.com', password: await hash('Employee@123'), role: Role.EMPLOYEE, managerId: manager.id },
  });

  console.log('✓ Users seeded');

  // ─── Cycle Config ────────────────────────────────────────────────────────
  const cycle = await prisma.cycleConfig.upsert({
    where:  { cycleYear: 2026 },
    update: {},
    create: { cycleYear: 2026, goalSettingStart: 1, q1Start: 1, q2Start: 4, q3Start: 7, q4Start: 10 },
  });
  await prisma.cycleConfig.upsert({
    where:  { cycleYear: 2025 },
    update: {},
    create: { cycleYear: 2025, goalSettingStart: 1, q1Start: 1, q2Start: 4, q3Start: 7, q4Start: 10 },
  });
  console.log('✓ Cycle configs seeded');

  // ─── Helper: upsert a GoalSheet and return it ────────────────────────────
  async function upsertSheet(employeeId: string, year: number, status: SheetStatus) {
    const existing = await prisma.goalSheet.findUnique({ where: { employeeId_cycleYear: { employeeId, cycleYear: year } } });
    if (existing) {
      return prisma.goalSheet.update({ where: { id: existing.id }, data: { status } });
    }
    return prisma.goalSheet.create({ data: { employeeId, cycleYear: year, status } });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOHN EMPLOYEE — 2026 sheet APPROVED with full actuals
  // ═══════════════════════════════════════════════════════════════════════════
  const johnSheet = await upsertSheet(employee.id, 2026, SheetStatus.APPROVED);

  const johnGoalDefs = [
    { thrustArea: 'Revenue Growth',          title: 'Increase quarterly pipeline value',    description: 'Grow qualified sales pipeline by engaging new enterprise accounts.', uomType: UomType.CURRENCY,    scoringType: ScoringType.MAX,  target: 500000, weightage: 25, actuals: { Q1: 420000, Q2: 510000, Q3: 488000, Q4: 550000 } },
    { thrustArea: 'Customer Success',        title: 'Achieve NPS score above 70',           description: 'Drive customer satisfaction through proactive engagement.', uomType: UomType.NUMBER,      scoringType: ScoringType.MAX,  target: 70,     weightage: 20, actuals: { Q1: 68, Q2: 74, Q3: 72, Q4: 77 } },
    { thrustArea: 'Operational Excellence',  title: 'Reduce support ticket SLA breaches',   description: 'Keep SLA breach rate below 5% of total tickets.', uomType: UomType.PERCENTAGE,  scoringType: ScoringType.MIN,  target: 5,      weightage: 20, actuals: { Q1: 6.2, Q2: 4.8, Q3: 3.9, Q4: 3.1 } },
    { thrustArea: 'People & Culture',        title: 'Complete 40 hours of L&D training',    description: 'Attend workshops, courses, and internal training sessions.', uomType: UomType.NUMBER,      scoringType: ScoringType.MAX,  target: 40,     weightage: 15, actuals: { Q1: 8, Q2: 12, Q3: 10, Q4: 14 } },
    { thrustArea: 'Innovation',              title: 'Submit 2 process improvement ideas',   description: 'Contribute to the company innovation portal with vetted proposals.', uomType: UomType.NUMBER,      scoringType: ScoringType.MAX,  target: 2,      weightage: 10, actuals: { Q1: 0, Q2: 1, Q3: 1, Q4: 2 } },
    { thrustArea: 'Compliance',              title: 'Complete all mandatory certifications', description: 'Finish data privacy, security awareness, and code-of-conduct modules.', uomType: UomType.BOOLEAN,     scoringType: ScoringType.TIMELINE, target: 1, weightage: 10, actuals: { Q1: 0, Q2: 0, Q3: 1, Q4: 1 } },
  ];

  for (const def of johnGoalDefs) {
    const existing = await prisma.goal.findFirst({ where: { sheetId: johnSheet.id, title: def.title } });
    const goal = existing ?? await prisma.goal.create({
      data: {
        sheetId: johnSheet.id, thrustArea: def.thrustArea, title: def.title,
        description: def.description, uomType: def.uomType, scoringType: def.scoringType,
        target: def.target, weightage: def.weightage, isShared: false,
        status: GoalStatus.COMPLETED,
      },
    });

    for (const [q, value] of Object.entries(def.actuals) as [Quarter, number][]) {
      const score = computeScore(def.scoringType, def.target, value);
      await prisma.goalActual.upsert({
        where: { goalId_quarter: { goalId: goal.id, quarter: q } },
        update: { actualValue: value, score },
        create: { goalId: goal.id, quarter: q, actualValue: value, score },
      });
    }
  }
  console.log('✓ John Employee 2026 sheet + actuals seeded');

  // John — 2025 sheet (APPROVED, prior year reference data)
  const johnSheet25 = await upsertSheet(employee.id, 2025, SheetStatus.APPROVED);
  const johnGoals25 = [
    { thrustArea: 'Revenue Growth',         title: 'Grow annual recurring revenue',     uomType: UomType.CURRENCY,   scoringType: ScoringType.MAX, target: 400000, weightage: 30, actuals: { Q1: 390000, Q2: 405000, Q3: 415000, Q4: 430000 } },
    { thrustArea: 'Customer Success',       title: 'Reduce churn rate to under 3%',     uomType: UomType.PERCENTAGE, scoringType: ScoringType.MIN, target: 3,      weightage: 25, actuals: { Q1: 3.8, Q2: 3.2, Q3: 2.9, Q4: 2.5 } },
    { thrustArea: 'Operational Excellence', title: 'Automate 5 manual reporting tasks', uomType: UomType.NUMBER,     scoringType: ScoringType.MAX, target: 5,      weightage: 25, actuals: { Q1: 1, Q2: 2, Q3: 4, Q4: 5 } },
    { thrustArea: 'People & Culture',       title: 'Mentor two junior team members',    uomType: UomType.NUMBER,     scoringType: ScoringType.MAX, target: 2,      weightage: 20, actuals: { Q1: 0, Q2: 1, Q3: 1, Q4: 2 } },
  ];
  for (const def of johnGoals25) {
    const existing = await prisma.goal.findFirst({ where: { sheetId: johnSheet25.id, title: def.title } });
    const goal = existing ?? await prisma.goal.create({
      data: { sheetId: johnSheet25.id, thrustArea: def.thrustArea, title: def.title, uomType: def.uomType, scoringType: def.scoringType, target: def.target, weightage: def.weightage, status: GoalStatus.COMPLETED },
    });
    for (const [q, value] of Object.entries(def.actuals) as [Quarter, number][]) {
      const score = computeScore(def.scoringType, def.target, value);
      await prisma.goalActual.upsert({
        where: { goalId_quarter: { goalId: goal.id, quarter: q } },
        update: { actualValue: value, score },
        create: { goalId: goal.id, quarter: q, actualValue: value, score },
      });
    }
  }
  console.log('✓ John Employee 2025 sheet seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // JANE MANAGER — 2026 sheet APPROVED
  // ═══════════════════════════════════════════════════════════════════════════
  const janeSheet = await upsertSheet(manager.id, 2026, SheetStatus.APPROVED);
  const janeGoalDefs = [
    { thrustArea: 'People & Culture',       title: 'Achieve team engagement score ≥ 80%', description: 'Run quarterly pulse surveys; action plans for gaps.',           uomType: UomType.PERCENTAGE, scoringType: ScoringType.MAX, target: 80, weightage: 30, actuals: { Q1: 75, Q2: 82, Q3: 85, Q4: 88 } },
    { thrustArea: 'Revenue Growth',         title: 'Team quarterly sales target $2M',      description: 'Aggregate of all direct reports\' pipeline contributions.',      uomType: UomType.CURRENCY,   scoringType: ScoringType.MAX, target: 2000000, weightage: 30, actuals: { Q1: 1850000, Q2: 2100000, Q3: 2050000, Q4: 2300000 } },
    { thrustArea: 'Operational Excellence', title: 'Reduce team avg ticket resolve time',  description: 'Drive MTTR from 48h to under 24h.',                             uomType: UomType.NUMBER,     scoringType: ScoringType.MIN, target: 24, weightage: 20, actuals: { Q1: 38, Q2: 29, Q3: 24, Q4: 20 } },
    { thrustArea: 'Innovation',             title: 'Launch 1 cross-functional initiative', description: 'Lead at least one initiative spanning two or more departments.', uomType: UomType.NUMBER,     scoringType: ScoringType.MAX, target: 1, weightage: 20, actuals: { Q1: 0, Q2: 0, Q3: 1, Q4: 1 } },
  ];
  for (const def of janeGoalDefs) {
    const existing = await prisma.goal.findFirst({ where: { sheetId: janeSheet.id, title: def.title } });
    const goal = existing ?? await prisma.goal.create({
      data: { sheetId: janeSheet.id, thrustArea: def.thrustArea, title: def.title, description: def.description, uomType: def.uomType, scoringType: def.scoringType, target: def.target, weightage: def.weightage, status: GoalStatus.ON_TRACK },
    });
    for (const [q, value] of Object.entries(def.actuals) as [Quarter, number][]) {
      const score = computeScore(def.scoringType, def.target, value);
      await prisma.goalActual.upsert({
        where: { goalId_quarter: { goalId: goal.id, quarter: q } },
        update: { actualValue: value, score },
        create: { goalId: goal.id, quarter: q, actualValue: value, score },
      });
    }
  }
  console.log('✓ Jane Manager 2026 sheet seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN USER — 2026 sheet APPROVED
  // ═══════════════════════════════════════════════════════════════════════════
  const adminSheet = await upsertSheet(admin.id, 2026, SheetStatus.APPROVED);
  const adminGoalDefs = [
    { thrustArea: 'Compliance',             title: 'Achieve ISO 27001 certification',        description: 'Drive full certification process across all departments.',          uomType: UomType.BOOLEAN,    scoringType: ScoringType.TIMELINE, target: 1, weightage: 30, actuals: { Q1: 0, Q2: 0, Q3: 0, Q4: 1 } },
    { thrustArea: 'Operational Excellence', title: 'Platform uptime SLA ≥ 99.9%',           description: 'Maintain service reliability with automated failover.',             uomType: UomType.PERCENTAGE, scoringType: ScoringType.MAX, target: 99.9, weightage: 25, actuals: { Q1: 99.95, Q2: 99.87, Q3: 99.93, Q4: 99.98 } },
    { thrustArea: 'People & Culture',       title: 'Hire 10 engineers across product teams', description: 'Close open headcount in backend, frontend, and data teams.',        uomType: UomType.NUMBER,     scoringType: ScoringType.MAX, target: 10, weightage: 25, actuals: { Q1: 2, Q2: 4, Q3: 7, Q4: 10 } },
    { thrustArea: 'Innovation',             title: 'Ship AI-powered analytics module',       description: 'Deliver ML insights into the goal analytics dashboard by Q4.',      uomType: UomType.BOOLEAN,    scoringType: ScoringType.TIMELINE, target: 1, weightage: 20, actuals: { Q1: 0, Q2: 0, Q3: 0, Q4: 1 } },
  ];
  for (const def of adminGoalDefs) {
    const existing = await prisma.goal.findFirst({ where: { sheetId: adminSheet.id, title: def.title } });
    const goal = existing ?? await prisma.goal.create({
      data: { sheetId: adminSheet.id, thrustArea: def.thrustArea, title: def.title, description: def.description, uomType: def.uomType, scoringType: def.scoringType, target: def.target, weightage: def.weightage, status: GoalStatus.ON_TRACK },
    });
    for (const [q, value] of Object.entries(def.actuals) as [Quarter, number][]) {
      const score = computeScore(def.scoringType, def.target, value);
      await prisma.goalActual.upsert({
        where: { goalId_quarter: { goalId: goal.id, quarter: q } },
        update: { actualValue: value, score },
        create: { goalId: goal.id, quarter: q, actualValue: value, score },
      });
    }
  }
  console.log('✓ Admin 2026 sheet seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // ALICE CHEN — 2026 sheet SUBMITTED (awaiting manager approval)
  // ═══════════════════════════════════════════════════════════════════════════
  const aliceSheet = await upsertSheet(emp2.id, 2026, SheetStatus.SUBMITTED);
  const aliceGoalDefs = [
    { thrustArea: 'Revenue Growth',         title: 'Close 15 new SMB accounts',           description: 'Focus on the SMB segment with targeted outbound outreach.',   uomType: UomType.NUMBER,     scoringType: ScoringType.MAX, target: 15, weightage: 35 },
    { thrustArea: 'Customer Success',       title: 'Onboard 20 new customers in CRM',     description: 'Ensure all new accounts are fully configured within 14 days.',uomType: UomType.NUMBER,     scoringType: ScoringType.MAX, target: 20, weightage: 25 },
    { thrustArea: 'People & Culture',       title: 'Lead monthly team knowledge session',  description: 'Facilitate a 45-min knowledge-share for the team each month.', uomType: UomType.NUMBER,     scoringType: ScoringType.MAX, target: 12, weightage: 20 },
    { thrustArea: 'Operational Excellence', title: 'Reduce quote turnaround time to 2h',  description: 'Streamline approval chain to cut quote generation time.',       uomType: UomType.NUMBER,     scoringType: ScoringType.MIN, target: 2,  weightage: 20 },
  ];
  for (const def of aliceGoalDefs) {
    const existing = await prisma.goal.findFirst({ where: { sheetId: aliceSheet.id, title: def.title } });
    if (!existing) {
      await prisma.goal.create({
        data: { sheetId: aliceSheet.id, thrustArea: def.thrustArea, title: def.title, description: def.description, uomType: def.uomType, scoringType: def.scoringType, target: def.target, weightage: def.weightage },
      });
    }
  }
  console.log('✓ Alice Chen 2026 sheet (SUBMITTED) seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // BOB SINGH — 2026 sheet REWORK
  // ═══════════════════════════════════════════════════════════════════════════
  const bobSheet = await upsertSheet(emp3.id, 2026, SheetStatus.REWORK);
  const bobGoalDefs = [
    { thrustArea: 'Revenue Growth',   title: 'Upsell 8 existing enterprise clients', uomType: UomType.NUMBER, scoringType: ScoringType.MAX, target: 8,  weightage: 40 },
    { thrustArea: 'Customer Success', title: 'Achieve CSAT score of 4.5/5',          uomType: UomType.NUMBER, scoringType: ScoringType.MAX, target: 4.5, weightage: 35 },
    { thrustArea: 'Compliance',       title: 'Complete GDPR refresher training',     uomType: UomType.BOOLEAN, scoringType: ScoringType.TIMELINE, target: 1, weightage: 25 },
  ];
  for (const def of bobGoalDefs) {
    const existing = await prisma.goal.findFirst({ where: { sheetId: bobSheet.id, title: def.title } });
    if (!existing) {
      await prisma.goal.create({
        data: { sheetId: bobSheet.id, thrustArea: def.thrustArea, title: def.title, uomType: def.uomType, scoringType: def.scoringType, target: def.target, weightage: def.weightage },
      });
    }
  }
  console.log('✓ Bob Singh 2026 sheet (REWORK) seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK-IN COMMENTS (manager on john's sheet)
  // ═══════════════════════════════════════════════════════════════════════════
  const existingComments = await prisma.checkinComment.count({ where: { sheetId: johnSheet.id } });
  if (existingComments === 0) {
    await prisma.checkinComment.createMany({
      data: [
        { sheetId: johnSheet.id, managerId: manager.id, quarter: Quarter.Q1, comment: 'Good start John! Pipeline is slightly below target but directionally solid. Let\'s push for a stronger Q2 close.' },
        { sheetId: johnSheet.id, managerId: manager.id, quarter: Quarter.Q1, comment: 'NPS score is just under 70 — recommend scheduling an additional customer review call this quarter.' },
        { sheetId: johnSheet.id, managerId: manager.id, quarter: Quarter.Q2, comment: 'Excellent Q2! Pipeline has exceeded target. The focus on enterprise accounts is clearly paying off. Keep it up.' },
        { sheetId: johnSheet.id, managerId: manager.id, quarter: Quarter.Q2, comment: 'SLA breach rate is now below target — great improvement from Q1. Document the process change for the team.' },
        { sheetId: johnSheet.id, managerId: manager.id, quarter: Quarter.Q3, comment: 'Solid Q3 overall. Innovation goal hit — great to see the process improvement proposal accepted by leadership.' },
        { sheetId: johnSheet.id, managerId: manager.id, quarter: Quarter.Q4, comment: 'Exceptional year John. All goals met or exceeded. You\'re on track for an Outstanding rating in the annual review.' },
      ],
    });
    // Manager's own sheet comments from admin
    await prisma.checkinComment.createMany({
      data: [
        { sheetId: janeSheet.id, managerId: admin.id, quarter: Quarter.Q1, comment: 'Team engagement below target at 75% — the pulse survey results highlight a need for more 1:1 conversations. Action plan looks good.' },
        { sheetId: janeSheet.id, managerId: admin.id, quarter: Quarter.Q2, comment: 'Impressive turnaround — engagement up to 82% and team revenue target exceeded. The cross-functional initiative is gaining traction.' },
        { sheetId: janeSheet.id, managerId: admin.id, quarter: Quarter.Q3, comment: 'MTTR hit target exactly. The process streamlining is working. Consider sharing the playbook with other managers.' },
      ],
    });
  }
  console.log('✓ Check-in comments seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT LOGS
  // ═══════════════════════════════════════════════════════════════════════════
  const existingLogs = await prisma.auditLog.count();
  if (existingLogs < 5) {
    const johnGoals = await prisma.goal.findMany({ where: { sheetId: johnSheet.id }, take: 3 });
    const entries = [
      { entityType: 'GoalSheet', entityId: johnSheet.id, action: 'CREATE', changedBy: employee.id, oldValue: null, newValue: { status: 'DRAFT', cycleYear: 2026 }, changedAt: daysAgo(120) },
      { entityType: 'GoalSheet', entityId: johnSheet.id, action: 'UPDATE', changedBy: employee.id, oldValue: { status: 'DRAFT' }, newValue: { status: 'SUBMITTED' }, changedAt: daysAgo(100) },
      { entityType: 'GoalSheet', entityId: johnSheet.id, action: 'UPDATE', changedBy: manager.id, oldValue: { status: 'SUBMITTED' }, newValue: { status: 'APPROVED' }, changedAt: daysAgo(95) },
      { entityType: 'Goal',      entityId: johnGoals[0]?.id ?? johnSheet.id, action: 'CREATE', changedBy: employee.id, oldValue: null, newValue: { title: johnGoals[0]?.title, weightage: johnGoals[0]?.weightage }, changedAt: daysAgo(118) },
      { entityType: 'Goal',      entityId: johnGoals[1]?.id ?? johnSheet.id, action: 'UPDATE', changedBy: manager.id, oldValue: { target: 400000 }, newValue: { target: 500000 }, changedAt: daysAgo(98) },
      { entityType: 'GoalActual',entityId: johnGoals[0]?.id ?? johnSheet.id, action: 'CREATE', changedBy: employee.id, oldValue: null, newValue: { quarter: 'Q1', actualValue: 420000, score: 0.84 }, changedAt: daysAgo(85) },
      { entityType: 'GoalActual',entityId: johnGoals[0]?.id ?? johnSheet.id, action: 'UPDATE', changedBy: employee.id, oldValue: { actualValue: 420000 }, newValue: { actualValue: 430000, score: 0.86 }, changedAt: daysAgo(80) },
      { entityType: 'GoalSheet', entityId: aliceSheet.id, action: 'CREATE', changedBy: emp2.id, oldValue: null, newValue: { status: 'DRAFT', cycleYear: 2026 }, changedAt: daysAgo(60) },
      { entityType: 'GoalSheet', entityId: aliceSheet.id, action: 'UPDATE', changedBy: emp2.id, oldValue: { status: 'DRAFT' }, newValue: { status: 'SUBMITTED' }, changedAt: daysAgo(14) },
      { entityType: 'GoalSheet', entityId: bobSheet.id,   action: 'UPDATE', changedBy: manager.id, oldValue: { status: 'SUBMITTED' }, newValue: { status: 'REWORK' }, changedAt: daysAgo(7) },
      { entityType: 'GoalSheet', entityId: adminSheet.id, action: 'UPDATE', changedBy: admin.id, oldValue: { status: 'SUBMITTED' }, newValue: { status: 'APPROVED' }, changedAt: daysAgo(90) },
      { entityType: 'GoalSheet', entityId: janeSheet.id,  action: 'UPDATE', changedBy: admin.id, oldValue: { status: 'SUBMITTED' }, newValue: { status: 'APPROVED' }, changedAt: daysAgo(88) },
    ];
    for (const entry of entries) {
      await prisma.auditLog.create({ data: entry as any });
    }
  }
  console.log('✓ Audit logs seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // ESCALATION RULES
  // ═══════════════════════════════════════════════════════════════════════════
  const ruleNames = [
    'Goal Not Submitted After 30 Days',
    'Approval Pending Over 5 Days',
    'Quarterly Actuals Not Logged',
    'No Check-in Comment for Quarter',
  ];
  const ruleDefs = [
    { name: ruleNames[0], triggerEvent: 'GOAL_NOT_SUBMITTED',   thresholdDays: 30, notifyRole: Role.MANAGER, isActive: true  },
    { name: ruleNames[1], triggerEvent: 'APPROVAL_PENDING',     thresholdDays: 5,  notifyRole: Role.ADMIN,   isActive: true  },
    { name: ruleNames[2], triggerEvent: 'ACTUAL_NOT_LOGGED',    thresholdDays: 14, notifyRole: Role.MANAGER, isActive: true  },
    { name: ruleNames[3], triggerEvent: 'ACTUAL_NOT_LOGGED',    thresholdDays: 21, notifyRole: Role.EMPLOYEE,isActive: false },
  ];
  const rules: Record<string, any> = {};
  for (const rd of ruleDefs) {
    const rule = await prisma.escalationRule.upsert({
      where:  { name: rd.name },
      update: { isActive: rd.isActive },
      create: rd,
    });
    rules[rd.name] = rule;
  }
  console.log('✓ Escalation rules seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // ESCALATION LOGS
  // ═══════════════════════════════════════════════════════════════════════════
  const existingEscLogs = await prisma.escalationLog.count();
  if (existingEscLogs === 0) {
    const r1 = rules[ruleNames[0]];
    const r2 = rules[ruleNames[1]];
    const r3 = rules[ruleNames[2]];
    await prisma.escalationLog.createMany({
      data: [
        { ruleId: r1.id, userId: emp2.id, message: 'Alice Chen has not submitted her 2026 goal sheet after 30 days in Goal Setting period.', sentAt: daysAgo(30), channel: 'EMAIL' },
        { ruleId: r2.id, userId: manager.id, message: 'Alice Chen\'s submitted goal sheet has been awaiting approval for 5 days.',            sentAt: daysAgo(9),  channel: 'EMAIL' },
        { ruleId: r1.id, userId: emp3.id, message: 'Bob Singh has not submitted his 2026 goal sheet after 30 days.',                         sentAt: daysAgo(45), channel: 'EMAIL' },
        { ruleId: r3.id, userId: employee.id, message: 'John Employee has not logged Q1 actuals for 2 goals after 14 days.',                 sentAt: daysAgo(75), channel: 'EMAIL' },
        { ruleId: r2.id, userId: admin.id, message: 'Three goal sheets have been pending approval for over 5 days.',                         sentAt: daysAgo(101),channel: 'TEAMS' },
      ],
    });
  }
  console.log('✓ Escalation logs seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // GOAL UNLOCK (admin unlocked John's sheet once for target adjustment)
  // ═══════════════════════════════════════════════════════════════════════════
  const existingUnlocks = await prisma.goalUnlock.count({ where: { sheetId: johnSheet.id } });
  if (existingUnlocks === 0) {
    const exp = new Date();
    exp.setDate(exp.getDate() - 90); // already expired
    await prisma.goalUnlock.create({
      data: {
        sheetId: johnSheet.id,
        grantedBy: admin.id,
        justification: 'Target value for pipeline goal updated following Q1 market analysis and revised annual plan.',
        expiresAt: exp,
        createdAt: daysAgo(95),
      },
    });
  }
  console.log('✓ Goal unlock record seeded');

  console.log('\n✅ All sample data seeded successfully!');
  console.log('   Users:  employee@company.com · manager@company.com · admin@company.com · alice@company.com · bob@company.com');
  console.log('   Sheets: John (APPROVED 2026+2025) · Jane (APPROVED 2026) · Admin (APPROVED 2026) · Alice (SUBMITTED 2026) · Bob (REWORK 2026)');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
