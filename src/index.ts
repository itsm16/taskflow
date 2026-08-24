import express from 'express'
import {initialize} from 'express-openapi'
import swagger from 'swagger-ui-express'
import cookieParser from 'cookie-parser'
import apiDoc from './api-doc/api-doc.js'
import healthService from './api-doc/services/healthService.js'
import authService from './api-doc/services/authService.js'
import projectService from './api-doc/services/projectService.js'
import taskService from './api-doc/services/taskService.js'
import authRoutes from './modules/auth/auth.route.js'
import projectRoutes from './modules/project/project.route.js'
import taskRoutes from './modules/task/task.route.js'
import { getJobs } from './common/utils/api-email.js'
import ApiError from './common/utils/api-error.js'
import type { NextFunction, Request, Response } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 8000

const app: express.Express = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use("/api/auth", authRoutes)
app.use("/api/project", projectRoutes)
app.use("/api/task", taskRoutes)

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "Taskflow API — see /docs and /health",
        docs: "/docs",
        health: "/health"
    })
})

app.get("/health", (req, res)=>{
    res.json({
        status: "ok"
    })
})

app.get("/api/jobs", async (req, res) => {
    try {
        res.json(await getJobs())
    } catch (err) {
        console.error("Failed to fetch jobs:", err)
        res.status(503).json({ message: "Job queue unavailable" })
    }
})

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if(err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message })
    }

    console.error("Unhandled error:", err)
    return res.status(500).json({ message: "Internal server error" })
}

app.use(errorHandler)

const args = await initialize({
    app,
    apiDoc,
    dependencies: {
        healthService,
        authService,
        projectService,
        taskService
    },
    paths: path.join(__dirname, 'api-doc/paths')
})

app.get('/v1/api-doc.json', (req, res) => {
    res.json(args.apiDoc)
})

app.use("/docs", swagger.serve, swagger.setup(undefined, {
    swaggerOptions: { url: '/v1/api-doc.json' }
}))

export default app

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('Server started on port: ' + PORT)
  })
}
