import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);
const ITERATIONS = 210_000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

  return `pbkdf2:${ITERATIONS}:${salt}:${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (password: string, storedHash: string | null) => {
  if (!storedHash) {
    return false;
  }

  const [algorithm, iterations, salt, key] = storedHash.split(":");
  if (algorithm !== "pbkdf2" || !iterations || !salt || !key) {
    return false;
  }

  const derivedKey = await pbkdf2Async(password, salt, Number(iterations), KEY_LENGTH, DIGEST);
  const storedKey = Buffer.from(key, "hex");

  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
};
