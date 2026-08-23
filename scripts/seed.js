import { db } from "../src/common/db/index.js"
import { orgTable, orgMembersTable, usersTable } from "../src/modules/auth/auth.schema.js"
import { projectTable } from "../src/modules/project/project.schema.js"
import { tasksTable, taskAssignments, taskComments } from "../src/modules/task/task.schema.js"
import bcrypt from "bcrypt"

const SALT = Number(process.env.SALT ?? 10)

async function seed() {
  console.log("Seeding database...")

  // wipe existing data (FK-safe order)
  await db.delete(taskComments)
  await db.delete(taskAssignments)
  await db.delete(tasksTable)
  await db.delete(projectTable)
  await db.delete(orgMembersTable)
  await db.delete(usersTable)
  await db.delete(orgTable)

  const password = await bcrypt.hash("password123", SALT)

  // ---- organizations (2) ----
  const [acme, globex] = await db.insert(orgTable).values([
    { name: "Acme Corp" },
    { name: "Globex Inc" }
  ]).returning()

  // ---- users (5) ----
  const [alice, bob, carol, dave, eve] = await db.insert(usersTable).values([
    { name: "Alice Admin", email: "alice@taskflow.dev", password, role: "org_admin" },
    { name: "Bob Builder", email: "bob@taskflow.dev", password, role: "member" },
  ]).returning()

  console.log(`Seeded`)
}

seed()
  .then(() => {
    console.log("Seed complete.")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
