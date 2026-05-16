import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const commentSchema = z.object({
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  comment: z.string().min(1),
});

export async function addComment(req: AuthRequest, res: Response) {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const comment = await prisma.checkinComment.create({
    data: { sheetId: req.params.sheetId, managerId: req.user!.userId, ...parsed.data },
    include: { manager: { select: { name: true } } },
  });
  res.status(201).json(comment);
}

export async function getComments(req: AuthRequest, res: Response) {
  const comments = await prisma.checkinComment.findMany({
    where: { sheetId: req.params.sheetId },
    include: { manager: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(comments);
}
