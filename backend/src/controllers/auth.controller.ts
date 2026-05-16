import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { syncAzureUser } from '../services/sso.service';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
