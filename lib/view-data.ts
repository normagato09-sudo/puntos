import type { Reward } from "@/db/schema";
import type { GoalInfo, RewardInfo } from "@/components/views/snapshot";
import { openGoals } from "./data";

/** Regalos aprobados (aún sin canjear) en el formato que usan las pantallas. */
export function goalInfos(rewards: Reward[]): GoalInfo[] {
  return openGoals(rewards).map((r) => ({
    id: r.id,
    name: r.name,
    price: r.approvedPrice ?? 0,
    requested: r.status === "redeem_requested",
  }));
}

export function rewardInfos(rewards: Reward[]): RewardInfo[] {
  return rewards.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    price: r.approvedPrice,
    photo: r.photo,
    redeemedAt: r.redeemedAt ? r.redeemedAt.toISOString() : null,
  }));
}

/** Momento en que se generan los datos (para no pisar datos guardados más nuevos). */
export function serverStamp() {
  return Date.now();
}
