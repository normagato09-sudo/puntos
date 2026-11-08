"use client";

import { useSyncExternalStore } from "react";
import { todayISO } from "@/lib/dates";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** Si el navegador dice que hay conexión. */
export function useBrowserOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

function subscribeDay(cb: () => void) {
  const t = window.setInterval(cb, 60_000);
  document.addEventListener("visibilitychange", cb);
  return () => {
    window.clearInterval(t);
    document.removeEventListener("visibilitychange", cb);
  };
}

/** Fecha de hoy calculada en el dispositivo (en el servidor, la que venga en los datos). */
export function useToday(serverDay: string) {
  return useSyncExternalStore(subscribeDay, todayISO, () => serverDay);
}

/** Navegación completa (sin pasar por el router), útil cuando no hay conexión. */
export function hardNavigate(path: string) {
  window.location.assign(new URL(path, window.location.origin).href);
}
