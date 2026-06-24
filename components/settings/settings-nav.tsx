"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

type SettingsNavItem = {
  href: string;
  label: string;
  roles?: UserRole[];
};

const SETTINGS_NAV: SettingsNavItem[] = [
  { href: "/settings/tenant", label: "組織情報" },
  { href: "/settings/members", label: "メンバー" },
  {
    href: "/settings/tenants",
    label: "テナント一覧",
    roles: [UserRole.DEVELOP],
  },
];

export function SettingsNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = SETTINGS_NAV.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-4">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
