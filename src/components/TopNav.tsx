"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Search, ShieldCheck, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { clsx } from "clsx";

const baseLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

const adminLink = { href: "/admin", label: "Admin", icon: ShieldCheck };

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdminOrAbove = role === "ADMIN" || role === "SUPERADMIN";
  const links = isAdminOrAbove ? [...baseLinks, adminLink] : baseLinks;

  return (
    <header className="hidden border-b border-gray-200 bg-white/90 backdrop-blur lg:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold text-violet-600">
          Hackathon App
        </Link>
        <nav className="flex items-center gap-2">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-50 text-violet-600"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
