"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, GiftIcon, GridIcon, HomeIcon, ListIcon, UserIcon } from "./icons";

const ICONS = {
  home: HomeIcon,
  grid: GridIcon,
  gift: GiftIcon,
  user: UserIcon,
  calendar: CalendarIcon,
  list: ListIcon,
};

export type NavItem = {
  href: string;
  /** Ruta base que marca la pestaña como activa. */
  match: string;
  exact?: boolean;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
};

export function BottomNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-[76px] max-w-md" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((it) => {
          const active = it.exact ? path === it.match : path === it.match || path.startsWith(it.match + "/");
          const Icon = ICONS[it.icon];
          return (
            <Link
              key={it.label}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 text-xs ${
                active ? "font-extrabold text-brand" : "font-bold text-muted"
              }`}
            >
              <span className="relative">
                <Icon size={24} />
                {!!it.badge && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sun px-1 text-[11px] font-extrabold text-ink">
                    {it.badge}
                  </span>
                )}
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
