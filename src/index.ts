import express from 'express'
import {initialize} from 'express-openapi'
import swagger from 'swagger-ui-express'
import apiDoc from './api-doc/api-doc.js'
import healthService from './api-doc/services/healthService.js'

const app = express()

app.get("/health", (req, res)=>{
    res.json({
        status: "ok"
    })
})

const args = await initialize({
    app,
    apiDoc,
    dependencies: {
        healthService
    },
    paths: './dist/api-doc/paths'
})

app.get('/v1/api-doc.json', (req, res) => {
    res.json(args.apiDoc)
})

app.use("/docs", swagger.serve, swagger.setup(undefined, {
    swaggerOptions: { url: '/v1/api-doc.json' }
}))

app.listen(3000, () => {
  console.log('Server started on port 3000')
})
