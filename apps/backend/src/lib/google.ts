import { z } from "zod";

const googleTokenInfoSchema = z.object({
  aud: z.string(),
  sub: z.string(),
  email: z.email().optional(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
});

export type GoogleProfile = {
  googleId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export const verifyGoogleIdToken = async (idToken: string, clientId: string): Promise<GoogleProfile> => {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );

  if (!response.ok) {
    throw new Error("Google token invalido");
  }

  const tokenInfo = googleTokenInfoSchema.parse(await response.json());

  if (tokenInfo.aud !== clientId) {
    throw new Error("Google token audience invalida");
  }

  return {
    googleId: tokenInfo.sub,
    email: tokenInfo.email ?? null,
    name: tokenInfo.name ?? null,
    avatarUrl: tokenInfo.picture ?? null,
  };
};
