import { integer, pgTable, timestamp, varchar, uuid, pgEnum } from "drizzle-orm/pg-core";
import { orgTable, usersTable } from "../../common/db/schema.js";

export const projectTable = pgTable("projects", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  organization_id: uuid().references(() => orgTable.id).notNull(),
  deleted_at: timestamp(),
});

export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "review","done"]);

export const tasksTable = pgTable("tasks", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  project_id: uuid().references(() => projectTable.id).notNull(),
  organization_id: uuid().references(() => orgTable.id).notNull(),
  status: taskStatusEnum().notNull().default("todo"),
  deleted_at: timestamp(),
});

export const taskAssignments = pgTable("task_assignments", {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid().references(() => usersTable.id).notNull(),
    task_id: uuid().references(() => tasksTable.id).notNull(),
})