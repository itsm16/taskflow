import { pgTable, timestamp, varchar, uuid } from "drizzle-orm/pg-core";
import { orgTable } from "../../common/db/schema.js";

export const projectTable = pgTable("projects", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  organization_id: uuid().references(() => orgTable.id).notNull(),
  deleted_at: timestamp(),
});
