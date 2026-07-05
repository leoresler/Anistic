import type { FastifyInstance } from "fastify";
import { and, eq, isNull, or } from "drizzle-orm";

import { createDb, users, type User } from "@template/database";
import type { AuthResponse, AuthUser } from "@template/shared";

import { env } from "../env";
import { verifyGoogleIdToken } from "../lib/google";
import { hashPassword, verifyPassword } from "../lib/password";

export const { db } = createDb(env.DATABASE_URL);

const publicUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  googleId: user.googleId,
  name: user.name,
  avatarUrl: user.avatarUrl,
  isAdmin: user.isAdmin,
});

const issueAuthResponse = async (app: FastifyInstance, user: User): Promise<AuthResponse> => ({
  user: publicUser(user),
  token: await app.jwt.sign({ sub: user.id }, { expiresIn: "7d" }),
});

// Promotes the user to admin when their email matches ADMIN_EMAIL.
// Returns true when the user was promoted. If ADMIN_EMAIL was unset at
// registration time, the user will NOT be retroactively promoted until their
// next login/register flow.
export const ensureAdminFlag = async (userId: string, email: string | null): Promise<boolean> => {
  if (email && email === env.ADMIN_EMAIL) {
    await db.update(users).set({ isAdmin: true }).where(eq(users.id, userId));
    return true;
  }
  return false;
};

export const getUserById = async (userId: string) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return user ? publicUser(user) : null;
};

export const registerEmail = async (
  app: FastifyInstance,
  input: { email: string; password: string },
) => {
  const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (existing) {
    throw new Error("Ya existe un usuario con ese email");
  }

  const [user] = await db
    .insert(users)
    .values({ email: input.email, password: await hashPassword(input.password) })
    .returning();

  const promoted = await ensureAdminFlag(user.id, user.email);
  if (promoted) user.isAdmin = true;
  return issueAuthResponse(app, user);
};

export const loginEmail = async (
  app: FastifyInstance,
  input: { email: string; password: string },
) => {
  const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });

  if (!user || !(await verifyPassword(input.password, user.password))) {
    throw new Error("Credenciales invalidas");
  }

  const promoted = await ensureAdminFlag(user.id, user.email);
  if (promoted) user.isAdmin = true;
  return issueAuthResponse(app, user);
};

export const registerPhone = async (
  app: FastifyInstance,
  input: { phone: string; password: string },
) => {
  const existing = await db.query.users.findFirst({ where: eq(users.phone, input.phone) });
  if (existing) {
    throw new Error("Ya existe un usuario con ese telefono");
  }

  const [user] = await db
    .insert(users)
    .values({ phone: input.phone, password: await hashPassword(input.password) })
    .returning();

  return issueAuthResponse(app, user);
};

export const loginPhone = async (
  app: FastifyInstance,
  input: { phone: string; password: string },
) => {
  const user = await db.query.users.findFirst({ where: eq(users.phone, input.phone) });

  if (!user || !(await verifyPassword(input.password, user.password))) {
    throw new Error("Credenciales invalidas");
  }

  return issueAuthResponse(app, user);
};

export const loginGoogle = async (app: FastifyInstance, input: { idToken: string }) => {
  const profile = await verifyGoogleIdToken(input.idToken, env.GOOGLE_CLIENT_ID);

  const existing = await db.query.users.findFirst({
    where: profile.email
      ? or(eq(users.googleId, profile.googleId), and(eq(users.email, profile.email), isNull(users.googleId)))
      : eq(users.googleId, profile.googleId),
  });

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        googleId: profile.googleId,
        email: existing.email ?? profile.email,
        name: profile.name ?? existing.name,
        avatarUrl: profile.avatarUrl ?? existing.avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();

    const promoted = await ensureAdminFlag(updated.id, updated.email);
    if (promoted) updated.isAdmin = true;
    return issueAuthResponse(app, updated);
  }

  const [user] = await db
    .insert(users)
    .values({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    })
    .returning();

  const promoted = await ensureAdminFlag(user.id, user.email);
  if (promoted) user.isAdmin = true;
  return issueAuthResponse(app, user);
};
