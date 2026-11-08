// Acciones que se pueden hacer sin conexión. Cada una lleva un id único
// para que el servidor no la aplique dos veces aunque se envíe repetida.

export type TaskState = "waiting" | "done" | "missed";

type Base = { id: string; childId: number; at: number };

export type Op =
  | (Base & { type: "kid.done"; taskId: number; date: string })
  | (Base & { type: "parent.task"; taskId: number; date: string; status: "done" | "missed" | null })
  | (Base & { type: "kid.wish"; name: string; price: number | null; link: string | null; photo: string | null })
  | (Base & {
      type: "parent.reward";
      rewardId: number;
      rewardName: string;
      decision: "approve" | "reject";
      price: number | null;
    });

/** Sin el id ni la fecha, que añade la cola. */
export type NewOp = Op extends infer T ? (T extends Op ? Omit<T, "id" | "at"> : never) : never;

export const PARENT_OPS: Op["type"][] = ["parent.task", "parent.reward"];

export type QueueItem = { op: Op; needsParent?: boolean };

/** Respuesta de POST /api/ops */
export type OpResult = { ok: true; duplicate?: boolean } | { ok: false; error: string };

/** Estado de una tarea en un día, aplicando encima las acciones pendientes de enviar. */
export function effectiveStatus(
  server: TaskState | null,
  taskId: number,
  date: string,
  ops: Op[],
): TaskState | null {
  let s = server;
  for (const op of ops) {
    if ((op.type === "kid.done" || op.type === "parent.task") && op.taskId === taskId && op.date === date) {
      if (op.type === "parent.task") s = op.status;
      else if (s === null) s = "waiting";
    }
  }
  return s;
}
