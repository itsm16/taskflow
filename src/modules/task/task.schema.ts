import { integer, pgTable, text, timestamp, varchar, uuid, pgEnum } from "drizzle-orm/pg-core";
import { orgTable, usersTable } from "../../common/db/schema.js";
import { projectTable } from "../project/project.schema.js";

export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "review","done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);

export const tasksTable = pgTable("tasks", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  project_id: uuid().references(() => projectTable.id).notNull(),
  organization_id: uuid().references(() => orgTable.id).notNull(),
  status: taskStatusEnum().notNull().default("todo"),
  priority: taskPriorityEnum().notNull().default("medium"),
  deleted_at: timestamp(),
});

export const taskAssignments = pgTable("task_assignments", {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid().references(() => usersTable.id).notNull(),
    task_id: uuid().references(() => tasksTable.id).notNull(),
})

export const taskComments = pgTable("task_comments", {
    id: uuid().primaryKey().defaultRandom(),
    task_id: uuid().references(() => tasksTable.id).notNull(),
    user_id: uuid().references(() => usersTable.id).notNull(),
    content: text().notNull(),
    created_at: timestamp().notNull().defaultNow(),
})
