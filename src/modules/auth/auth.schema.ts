import { integer, text, pgTable, varchar, uuid, pgEnum, timestamp } from "drizzle-orm/pg-core";

export const orgTable = pgTable("organizations", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
});

export const orgMembersTable = pgTable("organization_members", {
  id: uuid().primaryKey().defaultRandom(),
  assigned_organization: uuid().references(() => orgTable.id).notNull(),
  user_id: uuid().references(() => usersTable.id).notNull(),
});

export const roleEnum = pgEnum("roles", ["member", "org_admin"])

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: text().notNull(),
  refresh_token: text(),
  // access_token: text(),
  refresh_token_expiry: timestamp(),
  // access_token_expiry: timestamp(),
  role: roleEnum(),
});

