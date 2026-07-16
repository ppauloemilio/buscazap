import { headers } from "next/headers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const BARE_PATHS = ["/parceiro", "/parceiros"] as const;

function isBarePath(pathname: string): boolean {
  return BARE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const bare = isBarePath(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      {!bare && <Header />}
      <main className="flex-1">{children}</main>
      {!bare && <Footer />}
    </div>
  );
}
