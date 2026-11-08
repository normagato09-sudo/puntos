"use client";

import { SendIcon } from "@/components/icons";
import { useSync } from "@/components/sync-provider";

/** Aprobaciones hechas sin conexión que todavía no han llegado al servidor. */
export function QueuedRewardOps({ childId }: { childId: number }) {
  const { ops } = useSync();
  const list = ops.filter((o) => o.type === "parent.reward" && o.childId === childId);
  if (!list.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {list.map(
        (o) =>
          o.type === "parent.reward" && (
            <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-sun-line bg-sun-soft px-3.5 py-2.5">
              <SendIcon size={18} className="flex-none text-sun-ink" />
              <span className="text-sm font-bold">
                {o.rewardName}:{" "}
                {o.decision === "approve" ? `aprobado por ${o.price} puntos` : "ahora no"}
                <span className="font-semibold text-muted"> · se enviará al volver la conexión</span>
              </span>
            </div>
          ),
      )}
    </div>
  );
}
