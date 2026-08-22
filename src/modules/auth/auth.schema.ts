import { integer, pgTable, varchar, uuid } from "drizzle-orm/pg-core";

export const orgTable = pgTable("organizations", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
});

export const orgMembersTable = pgTable("organization_members", {
  id: uuid().primaryKey().defaultRandom(),
  assigned_organization: uuid().references(() => orgTable.id).notNull(),
  user_id: uuid().references(() => usersTable.id).notNull(),
});

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});
