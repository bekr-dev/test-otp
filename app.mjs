import express, { json } from "express"
//import * as db from "./Configs/db.config.mjs"
import mailRouter from "./Routers/mail.route.mjs"
import cors from "cors"

const app = express()

//db.config()

app.use(cors({
    origin: "*",
    methods: "*"
}))

app.use(json())

app.use("/v1/mail", mailRouter)

app.listen(process.env.PORT || 8080, err => {
    if (err) return process.exit(1)
    console.log("Running...")
})

//export default app;
