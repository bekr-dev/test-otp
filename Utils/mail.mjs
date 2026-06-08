import { transporter } from "../Configs/mail.config.mjs";
import { Mail } from "../Model/mail.schema.mjs";

export const mailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/
export const codeRegex = /^\d{6}$/

export const sendOTP = async (to,code, subject="Email Verification") => {
    const min = 100000; const max = 999999;
    //const otp = Math.floor(Math.random() * (max - min)) + min
    const mailOptions = {
        from: '"MediConnect <h1>test@univ,edu,dz</h1>" <' + process.env.EMAIL + '>',
        to: to,
        subject: subject,
        html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">رمز التحقق الخاص بك</h2>
            <p style="font-size: 16px; color: #555;">يرجى استخدام رمز التحقق (OTP) التالي لإتمام العملية.</p>
            <p style="font-size: 16px; color: #555;"> الرمز صالح لمدة 5 دقائق:</p>

            <div style="text-align: center; margin: 30px 0;">
                <code 
                style="font-size: 28px; font-weight: bold; background-color: #f4f4f5; padding: 10px 20px;
                border-radius: 4px; color: #111; letter-spacing: 5px;">
                ${code}</code>
            </div>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #999; text-align: center; direction: ltr;">If you didn't request this code, please ignore this email.</p>
        </div>
        `
    }
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, async (err, res) => {
            if (err) {
                reject({ status: false,error:err })
            } else {
                /*
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
                }*/
                resolve({ status: true })
            }
        })
    })
}
