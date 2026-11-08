import type { NavItem } from "@/components/bottom-nav";

export function kidNavItems(id: number): NavItem[] {
  const base = `/hijo/${id}`;
  return [
    { href: base, match: base, exact: true, label: "Hoy", icon: "home" },
    { href: `${base}/tabla`, match: `${base}/tabla`, label: "Tabla", icon: "grid" },
    { href: `${base}/premios`, match: `${base}/premios`, label: "Premios", icon: "gift" },
    { href: `${base}/perfil`, match: `${base}/perfil`, label: "Perfil", icon: "user" },
  ];
}

export function parentNavItems(childId?: number, pendingRewards?: number): NavItem[] {
  const q = childId ? `?hijo=${childId}` : "";
  return [
    { href: `/padres${q}`, match: "/padres", exact: true, label: "Semana", icon: "calendar" },
    { href: `/padres/premios${q}`, match: "/padres/premios", label: "Premios", icon: "gift", badge: pendingRewards },
    { href: `/padres/tareas${q}`, match: "/padres/tareas", label: "Tareas", icon: "list" },
  ];
}
