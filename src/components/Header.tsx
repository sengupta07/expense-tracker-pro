"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      {children}
    </Link>
  );
};

export function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <Mountain className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              ExpenseTracker
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/expenses">Expenses</NavLink>
            <NavLink href="/goals">Goals</NavLink>
            <NavLink href="/profile">Profile</NavLink>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Can add search bar here */}
          </div>
          <Button onClick={logout} variant="ghost">
            Logout
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <Link
              href="/dashboard"
              className="mr-6 flex items-center space-x-2"
            >
              <Mountain className="h-6 w-6" />
              <span className="font-bold">ExpenseTracker</span>
            </Link>
            <div className="grid gap-2 py-6">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/expenses">Expenses</NavLink>
              <NavLink href="/goals">Goals</NavLink>
              <NavLink href="/profile">Profile</NavLink>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
