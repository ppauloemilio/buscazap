"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const BARE_PATHS = ["/parceiro"] as const;

function isBarePath(pathname: string): boolean {
  return BARE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = isBarePath(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      {!bare && <Header />}
      <main className="flex-1">{children}</main>
      {!bare && <Footer />}
    </div>
  );
}
