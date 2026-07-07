import { unstable_noStore as noStore } from "next/cache";

export function markDataFetchDynamic(): void {
  noStore();
}
