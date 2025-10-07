"use client";

import { usePathname } from "next/navigation";
import AppHeader from "@/components/AppHeader";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const noHeaderPaths = ["/login", "/signup"];
  const shouldShowHeader = !noHeaderPaths.includes(pathname);

  return (
    <>
      {shouldShowHeader && <AppHeader />}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </>
  );
}
