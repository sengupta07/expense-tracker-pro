"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Wallet,
  LayoutDashboard,
  List,
  Target,
  User,
  LogOut,
  Menu,
} from "lucide-react";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const navLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/expenses", icon: List, label: "Expenses" },
    { href: "/goals", icon: Target, label: "Goals" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <header className="max-w-6xl mx-auto sticky top-0 z-50 p-4">
      <div className="glassmorphism flex h-16 items-center justify-between rounded-2xl px-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-indigo-400" />
          <Link
            href="/dashboard"
            className="font-semibold tracking-tight text-white"
          >
            Expense Tracker
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-gray-300">
                {user.email}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              asChild
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <Link href="/login">Login</Link>
            </Button>
          )}

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/10 hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="glassmorphism border-0 text-white w-72">
              <div className="flex items-center gap-2 p-4 border-b border-white/10">
                <Wallet className="h-6 w-6 text-indigo-400" />
                <span className="font-semibold tracking-tight text-white">
                  Expense Tracker
                </span>
              </div>
              <nav className="flex flex-col gap-2 p-4">
                {navLinks.map((link) => (
                  <NavLink key={link.href} href={link.href}>
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// NavLink component to handle active styles
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-white/20 text-white"
          : "text-gray-300 hover:bg-white/10 hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}
