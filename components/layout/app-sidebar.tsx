"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  MessageSquare,
  Menu,
  PhoneCall,
  BarChart3,
  GitBranch,
  Settings,
  Radio,
  type LucideIcon,
} from "lucide-react";
import type { AppRouteDefinition, AppRouteId } from "@/lib/auth/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const ROUTE_ICONS: Record<AppRouteId, LucideIcon> = {
  dashboard: LayoutDashboard,
  candidates: Users,
  "call-leads": PhoneCall,
  communications: MessageSquare,
  kpi: BarChart3,
  analytics: GitBranch,
  "team-status": Radio,
  "candidates-new": UserPlus,
  settings: Settings,
};

function NavLinks({
  navRoutes,
  onNavigate,
}: {
  navRoutes: AppRouteDefinition[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navRoutes.map(({ id, href, label, matchPrefix, exclude }) => {
        const Icon = ROUTE_ICONS[id];
        const isActive =
          pathname === href ||
          (matchPrefix !== undefined &&
            pathname.startsWith(matchPrefix) &&
            pathname !== exclude);

        return (
          <Link
            key={id}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar({ navRoutes }: { navRoutes: AppRouteDefinition[] }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="text-lg font-bold text-primary">
          CA CRM
        </Link>
      </div>
      <div className="p-4">
        <NavLinks navRoutes={navRoutes} />
      </div>
    </aside>
  );
}

export function MobileNav({ navRoutes }: { navRoutes: AppRouteDefinition[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">メニュー</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-14 items-center border-b px-6">
          <span className="text-lg font-bold text-primary">CA CRM</span>
        </div>
        <div className="p-4">
          <NavLinks navRoutes={navRoutes} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
