"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Cog, History, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const NAVS = [
  { href: "/", label: "首页", icon: Sparkles },
  { href: "/generate", label: "生成", icon: BarChart3 },
  { href: "/history", label: "历史", icon: History },
  { href: "/settings", label: "设置", icon: Cog },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {NAVS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs text-muted-foreground transition hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
