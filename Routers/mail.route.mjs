import { Router } from "express";
// استيراد الدالة مباشرة بين أقواس {}
import { send } from "../Controllers/mail.controller.mjs";

const mailRouter = Router();

// استدعاء الدالة مباشرة دون استخدام كائن
mailRouter.post('/send', send);
mailRouter.get('/send2', send);

export default mailRouter;
