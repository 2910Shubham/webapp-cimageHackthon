"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Search, ShieldCheck, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { clsx } from "clsx";

const baseTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

const adminTab = { href: "/admin", label: "Admin", icon: ShieldCheck };

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdminOrAbove = role === "ADMIN" || role === "SUPERADMIN";
  const tabs = isAdminOrAbove ? [...baseTabs, adminTab] : baseTabs;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex w-full border-t border-gray-100 bg-white pb-safe shadow-[0_-8px_24px_rgba(15,23,42,0.06)] lg:hidden">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors duration-150",
              isActive ? "text-violet-600" : "text-gray-400",
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
