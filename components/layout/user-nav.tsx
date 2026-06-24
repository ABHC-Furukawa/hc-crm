"use client";

import type { UserRole } from "@prisma/client";
import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { USER_ROLE_LABELS } from "@/lib/auth/rbac";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

export function UserNav({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: UserRole;
}) {
  const [pending, startTransition] = useTransition();

  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    startTransition(() => {
      void logoutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
          <p className="mt-1 text-xs text-muted-foreground">{USER_ROLE_LABELS[role]}</p>
        </div>
        <DropdownMenuItem
          disabled={pending}
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault();
            handleLogout();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {pending ? "ログアウト中..." : "ログアウト"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
