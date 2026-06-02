

import { send } from "../Controllers/mail.controller.mjs";

const mailRouter = Router();

mailRouter.post('/send', send);

export default mailRouter;
