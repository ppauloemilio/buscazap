"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminViewSwitcherProps {
  readonly className?: string;
  readonly onNavigate?: () => void;
  readonly fullWidth?: boolean;
}

export function AdminViewSwitcher({
  className,
  onNavigate,
  fullWidth = false,
}: AdminViewSwitcherProps) {
  const pathname = usePathname();
  const inAdmin = pathname.startsWith("/admin");

  return (
    <Button
      variant={inAdmin ? "outline" : "whatsapp"}
      size="sm"
      className={cn(fullWidth && "w-full justify-start", className)}
      asChild
    >
      <Link href={inAdmin ? "/painel" : "/admin"} onClick={onNavigate}>
        {inAdmin ? (
          <>
            <LayoutDashboard className="h-4 w-4" />
            Visão anunciante
          </>
        ) : (
          <>
            <Shield className="h-4 w-4" />
            Visão admin
          </>
        )}
      </Link>
    </Button>
  );
}
