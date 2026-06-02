import { transporter } from "../Configs/mail.config.mjs";
import { Mail } from "../Model/mail.schema.mjs";

export const mailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/

export const sendOTP = async (to, subject="Email Verification") => {
    const min = 100000; const max = 999999;
    const otp = Math.floor(Math.random() * (max - min)) + min
    const mailOptions = {
        from: process.env.EMAIL,
        to: to,
        subject: subject,
        html: `<code>Your OTP is: ${ otp }</code>`
    }
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, async (err, res) => {
            if (err) {
                reject({ status: false })
            } else {
                const res = await Mail.findOne({ email: to })
                if (!res) {
                    await Mail.create({
                        email: to,
                        otp,
                        deadline: Math.floor(new Date().getTime() / 1000) + 300
                    })
                } else {
                    await Mail.updateOne({ email: to }, {
                        $set: {
                            verified: false,
                            otp,
                            deadline: Math.floor(new Date().getTime() / 1000) + 300
                        }
                    })
                }
                resolve({ status: true })
            }
        })
    })
}
