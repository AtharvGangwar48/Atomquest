import { Role, SheetStatus, GoalStatus, UomType, Quarter } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: Role;
  email: string;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
  adminOverride?: boolean;
}

export { Role, SheetStatus, GoalStatus, UomType, Quarter };
