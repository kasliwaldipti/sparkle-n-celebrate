import "server-only";

// Reads env vars lazily (at call time, not import time) so `next build` works in CI without secrets.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
