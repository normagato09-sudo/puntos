"use client";

import { useEffect } from "react";
import { idbGet, idbSet } from "@/lib/offline/idb";
import type { TaskState } from "@/lib/offline/types";

// Datos que cada pantalla guarda en el dispositivo para poder verse sin conexión.

export type GoalInfo = { id: number; name: string; price: number; requested: boolean };

export type KidTodayData = {
  /** Momento en que el servidor generó los datos. */
  stamp: number;
  kind: "kidToday";
  childId: number;
  name: string;
  color: string;
  points: number;
  /** Día al que corresponden los estados de `logs`. */
  day: string;
  tasks: { id: number; name: string; days: string }[];
  logs: Record<string, TaskState>;
  goals: GoalInfo[];
};

export type ParentWeekData = {
  /** Momento en que el servidor generó los datos. */
  stamp: number;
  kind: "parentWeek";
  childId: number;
  points: number;
  monday: string;
  today: string;
  day: string;
  tasks: { id: number; name: string; days: string }[];
  logs: Record<string, TaskState>;
  goals: GoalInfo[];
};

export type KidTableData = {
  /** Momento en que el servidor generó los datos. */
  stamp: number;
  kind: "kidTable";
  childId: number;
  points: number;
  goals: GoalInfo[];
  page?: number;
};

export type RewardInfo = {
  id: number;
  name: string;
  status: string;
  price: number | null;
  photo: string | null;
  redeemedAt: string | null;
};

export type KidRewardsData = {
  /** Momento en que el servidor generó los datos. */
  stamp: number;
  kind: "kidRewards";
  childId: number;
  points: number;
  rewards: RewardInfo[];
};

export type ProfileInfo = { id: number; name: string; color: string; points: number };

export const snapKey = {
  kidToday: (id: number) => `snap:kid:${id}:hoy`,
  kidTable: (id: number) => `snap:kid:${id}:tabla`,
  kidRewards: (id: number) => `snap:kid:${id}:premios`,
  parentWeek: (id: number) => `snap:parent:${id}:semana`,
  profiles: "snap:profiles",
};

/** Guarda en IndexedDB los últimos datos que llegaron del servidor. */
export function useSaveSnapshot(key: string, data: { stamp: number }, enabled = true) {
  const json = JSON.stringify(data);
  useEffect(() => {
    if (!enabled) return;
    const next = JSON.parse(json) as { stamp: number };
    // Una página guardada en caché (más antigua) no pisa datos más nuevos.
    idbGet<{ stamp?: number }>(key).then((prev) => {
      if (!prev?.stamp || prev.stamp <= next.stamp) idbSet(key, next);
    });
  }, [key, json, enabled]);
}

/** Meta: el regalo aprobado más cercano que aún no alcanza; si alcanza todos, el más caro. */
export function pickGoal(goals: GoalInfo[], points: number) {
  const sorted = [...goals].sort((a, b) => a.price - b.price);
  const pending = sorted.find((g) => g.price > points);
  if (pending) return { goal: pending, reached: false };
  const last = sorted.at(-1);
  return last ? { goal: last, reached: true } : null;
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
