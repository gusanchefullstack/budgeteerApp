import prisma from '../prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/AppError';
import type { RegisterInput, LoginInput } from '../validators/auth.validators';

export async function registerUser(data: RegisterInput): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    throw new AppError(409, 'Username already taken');
  }

  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName:  data.lastName,
      username:  data.username,
      password:  hashed,
    },
  });

  return signToken({ userId: user.id });
}

export async function loginUser(data: LoginInput): Promise<string> {
  const user = await prisma.user.findUnique({ where: { username: data.username } });
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await comparePassword(data.password, user.password);
  if (!valid) {
    throw new AppError(401, 'Invalid credentials');
  }

  return signToken({ userId: user.id });
}

export async function deleteUser(userId: string): Promise<void> {
  // Prisma onDelete: Cascade removes related Budget and Transaction documents
  await prisma.user.delete({ where: { id: userId } });
}
