import { randomInt } from "crypto";

export function generateTemporaryPassword(): string {
  return `bz${randomInt(100000, 999999)}`;
}
