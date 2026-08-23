import { db } from "../src/common/db/index.js"
import { orgTable, orgMembersTable, usersTable } from "../src/modules/auth/auth.schema.js"
import { projectTable } from "../src/modules/project/project.schema.js"
import { tasksTable, taskAssignments, taskComments } from "../src/modules/task/task.schema.js"
import bcrypt from "bcrypt"

const SALT = Number(process.env.SALT ?? 10)

async function seed() {
  console.log("Seeding database (full dataset)...")

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
  const [acme, globex] = await db
    .insert(orgTable)
    .values([{ name: "Acme Corp" }, { name: "Globex Inc" }])
    .returning()
  console.log(`  orgs: ${acme.name} (${acme.id}), ${globex.name} (${globex.id})`)

  // ---- users (5) ----
  const [alice, bob, carol, dave, eve] = await db
    .insert(usersTable)
    .values([
      { name: "Alice Admin", email: "alice@taskflow.dev", password, role: "org_admin" },
      { name: "Bob Builder", email: "bob@taskflow.dev", password, role: "member" },
      { name: "Carol Coder", email: "carol@taskflow.dev", password, role: "member" },
      { name: "Dave Boss", email: "dave@taskflow.dev", password, role: "org_admin" },
      { name: "Eve Tester", email: "eve@taskflow.dev", password, role: "member" },
    ])
    .returning()
  console.log(`  users: 5 seeded (alice, bob, carol, dave, eve)`)

  // ---- org memberships (all assigned) ----
  await db.insert(orgMembersTable).values([
    { user_id: alice.id, assigned_organization: acme.id },   // Alice -> Acme
    { user_id: bob.id, assigned_organization: acme.id },     // Bob   -> Acme
    { user_id: carol.id, assigned_organization: acme.id },   // Carol -> Acme
    { user_id: dave.id, assigned_organization: globex.id },  // Dave  -> Globex
    { user_id: eve.id, assigned_organization: globex.id },   // Eve   -> Globex
  ])
  console.log(`  members: 5 org assignments`)

  // ---- projects (4) ----
  const [acmeWeb, acmeMobile, globexPlat, globexResearch] = await db
    .insert(projectTable)
    .values([
      { name: "Acme Website Redesign", organization_id: acme.id },
      { name: "Acme Mobile App", organization_id: acme.id },
      { name: "Globex Platform", organization_id: globex.id },
      { name: "Globex Research", organization_id: globex.id },
    ])
    .returning()
  console.log(`  projects: 4 seeded`)

  // ---- tasks (13) ----
  const tasks = await db
    .insert(tasksTable)
    .values([
      // Acme Website (4)
      { name: "Design new homepage", description: "Figma mockups for landing page", project_id: acmeWeb.id, organization_id: acme.id, status: "todo", priority: "high" },
      { name: "Implement auth flow", description: "Login / refresh / logout", project_id: acmeWeb.id, organization_id: acme.id, status: "in_progress", priority: "urgent" },
      { name: "Write API docs", description: "OpenAPI spec + Swagger", project_id: acmeWeb.id, organization_id: acme.id, status: "review", priority: "medium" },
      { name: "Deploy to staging", description: "Docker + CI pipeline", project_id: acmeWeb.id, organization_id: acme.id, status: "done", priority: "low" },
      // Acme Mobile (3)
      { name: "Setup React Native", description: "Init repo and navigation", project_id: acmeMobile.id, organization_id: acme.id, status: "todo", priority: "medium" },
      { name: "Push notifications", description: "FCM integration", project_id: acmeMobile.id, organization_id: acme.id, status: "in_progress", priority: "high" },
      { name: "Beta testing", description: "Testflight distribution", project_id: acmeMobile.id, organization_id: acme.id, status: "todo", priority: "low" },
      // Globex Platform (4)
      { name: "Design DB schema", description: "Drizzle schema for multi-tenant", project_id: globexPlat.id, organization_id: globex.id, status: "done", priority: "urgent" },
      { name: "Build task service", description: "CRUD + tenant check", project_id: globexPlat.id, organization_id: globex.id, status: "in_progress", priority: "high" },
      { name: "BullMQ email queue", description: "Welcome mail after register", project_id: globexPlat.id, organization_id: globex.id, status: "review", priority: "medium" },
      { name: "Write integration tests", description: "Supertest + pg-test", project_id: globexPlat.id, organization_id: globex.id, status: "todo", priority: "medium" },
      // Globex Research (2)
      { name: "Market analysis Q3", description: "Competitor report", project_id: globexResearch.id, organization_id: globex.id, status: "done", priority: "low" },
      { name: "Prototype AI feature", description: "RAG pipeline spike", project_id: globexResearch.id, organization_id: globex.id, status: "in_progress", priority: "urgent" },
    ])
    .returning()
  console.log(`  tasks: ${tasks.length} seeded`)

  // ---- task assignments (spread across orgs) ----
  await db.insert(taskAssignments).values([
    { task_id: tasks[0].id, user_id: alice.id },
    { task_id: tasks[1].id, user_id: bob.id },
    { task_id: tasks[1].id, user_id: carol.id },
    { task_id: tasks[2].id, user_id: carol.id },
    { task_id: tasks[5].id, user_id: bob.id },
    { task_id: tasks[7].id, user_id: dave.id },
    { task_id: tasks[8].id, user_id: dave.id },
    { task_id: tasks[8].id, user_id: eve.id },
    { task_id: tasks[9].id, user_id: eve.id },
    { task_id: tasks[12].id, user_id: dave.id },
  ])
  console.log(`  assignments: 10 seeded`)

  // ---- task comments (few samples) ----
  await db.insert(taskComments).values([
    { task_id: tasks[1].id, user_id: alice.id, content: "Please add refresh token rotation." },
    { task_id: tasks[1].id, user_id: bob.id, content: "Working on it, PR by EOD." },
    { task_id: tasks[8].id, user_id: eve.id, content: "Tenant check looks good!" },
    { task_id: tasks[12].id, user_id: dave.id, content: "Need eval metrics before merging." },
  ])
  console.log(`  comments: 4 seeded`)

  console.log(`\nSeeded summary:`)
  console.log(`  Orgs: Acme Corp (${acme.id}), Globex Inc (${globex.id})`)
  console.log(`  Users: alice@taskflow.dev (org_admin), bob@taskflow.dev, carol@taskflow.dev, dave@taskflow.dev (org_admin), eve@taskflow.dev — all password: password123`)
  console.log(`  Projects: ${[acmeWeb.name, acmeMobile.name, globexPlat.name, globexResearch.name].join(", ")}`)
  console.log(`  Tasks: ${tasks.length} across 4 projects (todo/in_progress/review/done)`)
}

seed()
  .then(() => {
    console.log("\nSeed complete.")
    process.exit(0)
  })
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
