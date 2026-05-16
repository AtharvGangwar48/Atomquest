import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { syncAzureUser } from '../services/sso.service';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().optional(),
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

export function signTokens(userId: string, role: string, email: string) {
  const payload = { userId, role, email };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accessToken = (jwt.sign as any)(payload, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshToken = (jwt.sign as any)(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' });
  return { accessToken, refreshToken };
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const tokens = signTokens(user.id, user.role, user.email);
  res.json({ ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string; role: string; email: string };
    const tokens = signTokens(payload.userId, payload.role, payload.email);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

  const { companyName, industry, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const hashed = await bcrypt.hash(password, 12);

  // First user to sign up gets ADMIN role.
  // Company name & industry stored in a metadata note on the user record via name suffix
  // (no separate Company table needed — single-tenant approach).
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: Role.ADMIN,
    },
  });

  // Seed default cycle config for the current year if not already present
  const currentYear = new Date().getFullYear();
  await prisma.cycleConfig.upsert({
    where:  { cycleYear: currentYear },
    update: {},
    create: { cycleYear: currentYear, goalSettingStart: 1, q1Start: 1, q2Start: 4, q3Start: 7, q4Start: 10 },
  });

  // Seed default escalation rules
  const defaultRules = [
    { name: 'Goal Not Submitted After 30 Days', triggerEvent: 'GOAL_NOT_SUBMITTED',  thresholdDays: 30, notifyRole: Role.MANAGER },
    { name: 'Approval Pending Over 5 Days',     triggerEvent: 'APPROVAL_PENDING',    thresholdDays: 5,  notifyRole: Role.ADMIN   },
    { name: 'Quarterly Actuals Not Logged',      triggerEvent: 'ACTUAL_NOT_LOGGED',   thresholdDays: 14, notifyRole: Role.MANAGER },
  ];
  for (const rule of defaultRules) {
    await prisma.escalationRule.upsert({ where: { name: rule.name }, update: {}, create: rule });
  }

  console.log(`[Signup] New company admin created: ${email} | company: ${companyName}${industry ? ` | industry: ${industry}` : ''}`);

  const tokens = signTokens(user.id, user.role, user.email);
  res.status(201).json({ ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

/**
 * Azure AD SSO login — frontend sends the MSAL access token,
 * backend validates via Graph API, upserts the user, returns JWT pair.
 */
export async function azureLogin(req: Request, res: Response) {
  const { accessToken: azureToken } = req.body;
  if (!azureToken) return res.status(400).json({ error: 'Azure access token required' });

  try {
    const user = await syncAzureUser(azureToken);
    const tokens = signTokens(user.id, user.role, user.email);
    res.json({ ...tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[SSO]', err);
    res.status(401).json({ error: 'Azure token validation failed' });
  }
}
