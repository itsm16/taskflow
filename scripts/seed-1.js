/**
 * Minimal / test seed — only orgs + users + minimal org membership.
 * No projects, tasks, assignments or comments.
 * Use this for quick local testing / onboarding via API.
 * For the full dataset (projects + 13 tasks etc.) use: pnpm seed
 */
import { db } from "../src/common/db/index.js"
import { orgTable, orgMembersTable, usersTable } from "../src/modules/auth/auth.schema.js"
import { projectTable } from "../src/modules/project/project.schema.js"
import { tasksTable, taskAssignments, taskComments } from "../src/modules/task/task.schema.js"
import bcrypt from "bcrypt"

const SALT = Number(process.env.SALT ?? 10)

async function seed() {
  console.log("Wiping tables (FK-safe order)...")

  await db.delete(taskComments)
  await db.delete(taskAssignments)
  await db.delete(tasksTable)
  await db.delete(projectTable)
  await db.delete(orgMembersTable)
  await db.delete(usersTable)
  await db.delete(orgTable)

  console.log("Seeding organizations (minimal)...")

  const orgs = await db
    .insert(orgTable)
    .values([{ name: "Acme Corp" }, { name: "Globex Inc" }])
    .returning()

  const password = await bcrypt.hash("password123", SALT)

  const users = await db
    .insert(usersTable)
    .values([
      { name: "Alice Admin", email: "alice@taskflow.dev", password, role: "org_admin" },
      { name: "Bob Builder", email: "bob@taskflow.dev", password, role: "member" },
      { name: "Carol Coder", email: "carol@taskflow.dev", password, role: "member" },
      { name: "Dave Boss", email: "dave@taskflow.dev", password, role: "org_admin" },
      { name: "Eve Tester", email: "eve@taskflow.dev", password, role: "member" },
    ])
    .returning()

  // admins are already members of their org so checkOrg passes;
  // everyone else is left unassigned for you to add via POST /api/auth/members/:userId
  await db.insert(orgMembersTable).values([
    { user_id: users[0].id, assigned_organization: orgs[0].id }, // Alice -> Acme Corp
    { user_id: users[3].id, assigned_organization: orgs[1].id }, // Dave  -> Globex Inc
  ])

  console.log(`\nOrganizations:`)
  for (const org of orgs) {
    console.log(`  - ${org.name} : ${org.id}`)
  }

  console.log(`\nUsers (all password: password123):`)
  for (const user of users) {
    console.log(`  - ${user.name} <${user.email}> role=${user.role} : ${user.id}`)
  }

  console.log(`\nOrg members (admins only):`)
  console.log(`  - Alice Admin -> Acme Corp`)
  console.log(`  - Dave Boss -> Globex Inc`)
  console.log(`\nUnassigned (add via API): Bob, Carol, Eve`)
  console.log(`  POST /api/auth/members/:userId  { orgId }  (as org_admin)`)
}

seed()
  .then(() => {
    console.log("\nMinimal seed complete. (For full dataset run: pnpm seed)")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
