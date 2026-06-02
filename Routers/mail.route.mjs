import { Router } from "express";
import mailController from "../Controllers/mail.controller.mjs";

const mailRouter = Router()

mailRouter.post(`/send`, mailController.send)
//mailRouter.get(`/verify`, mailController.verify)

export default mailRouter
