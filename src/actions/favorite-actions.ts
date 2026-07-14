"use server";

import { findAdvertisementsByIds } from "@/application/services/advertisement-service";

export async function getFavoriteAdvertisementsAction(ids: string[]) {
  const unique = [...new Set(ids)].slice(0, 50);
  return findAdvertisementsByIds(unique);
}
