import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const family = pgTable("family", {
  id: serial("id").primaryKey(),
  /** Código familiar que se pide al abrir la app por primera vez. */
  code: text("code").notNull(),
  /** PIN de 4 dígitos del perfil "Padres". */
  pin: text("pin").notNull(),
  /** Secreto aleatorio para firmar las cookies. */
  secret: text("secret").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const child = pgTable("child", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id")
    .notNull()
    .references(() => family.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const task = pgTable(
  "task",
  {
    id: serial("id").primaryKey(),
    childId: integer("child_id")
      .notNull()
      .references(() => child.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** 7 caracteres "1"/"0", de lunes a domingo. */
    days: text("days").notNull().default("1111111"),
    /** Las tareas borradas se archivan para no perder los puntos ya ganados. */
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("task_child_idx").on(t.childId)],
);

export const taskLog = pgTable(
  "task_log",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    /** Fecha local YYYY-MM-DD. */
    date: text("date").notNull(),
    /** waiting | done | missed */
    status: text("status").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("task_log_task_date_idx").on(t.taskId, t.date)],
);

export const reward = pgTable(
  "reward",
  {
    id: serial("id").primaryKey(),
    childId: integer("child_id")
      .notNull()
      .references(() => child.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Precio aproximado que pone el hijo, en euros. */
    childPrice: integer("child_price"),
    link: text("link"),
    /** Foto reducida como data URL (JPEG pequeño). */
    photo: text("photo"),
    /** Precio real aprobado por los padres = puntos necesarios. */
    approvedPrice: integer("approved_price"),
    /** pending | approved | redeem_requested | redeemed | rejected */
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    redeemRequestedAt: timestamp("redeem_requested_at", { withTimezone: true }),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  },
  (t) => [index("reward_child_idx").on(t.childId)],
);

export type Family = typeof family.$inferSelect;
export type Child = typeof child.$inferSelect;
export type Task = typeof task.$inferSelect;
export type TaskLog = typeof taskLog.$inferSelect;
export type Reward = typeof reward.$inferSelect;
export type TaskStatus = "waiting" | "done" | "missed";
export type RewardStatus = "pending" | "approved" | "redeem_requested" | "redeemed" | "rejected";
