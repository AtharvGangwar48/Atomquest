import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export async function getMe(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true, managerId: true, manager: { select: { id: true, name: true } } },
  });
  res.json(user);
}

export async function getUsers(req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, managerId: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
}

export async function getMyReports(req: AuthRequest, res: Response) {
  const reports = await prisma.user.findMany({
    where: { managerId: req.user!.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(reports);
}
