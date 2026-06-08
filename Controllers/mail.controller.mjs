import { Mail } from "../Model/mail.schema.mjs"
import { mailRegex,codeRegex, sendOTP } from "../Utils/mail.mjs"

export const send = async (request, response) => {
    try {
//        const { email, code } = request.body
const { email, code } = request.body && Object.keys(request.body).length > 0 ? request.body : request.query
        if (!code) return response.status(400).send({
            status: false,
            message: "Code is required!"
        })
        if (!email) return response.status(400).send({
            status: false,
            message: "Email is required!"
        })
        
        if (!mailRegex.test(email)) return response.status(400).send({
            status: false,
            message: "Enter a valid email!"
        })
        if (!codeRegex.test(code)) return response.status(400).send({
            status: false,
            message: "Enter a valid code !"
        })
        const res = await sendOTP(email,code,"رمز التحقق الخاص بك - Verification Code")
        return response.status(200).send(res)
    } catch (err) {
        console.error("خطأ في السيرفر الداخلي:", err); 
    
    // إرسال تفاصيل الخطأ الحقيقية في الرد للمتصفح لرؤيتها فوراً
    return response.status(500).send({
        status: false,
        message: "Internal server error",
        error: err,
    })
    }
}

export const verify = async (request, response) => {
    try {
        const { email, otp } = request.query
        if (!email || !otp) return response.status(400).send({
            status: false,
            message: "Email and OTP are required!"
        })
        if (!mailRegex.test(email)) return response.status(400).send({
            status: false,
            message: "Enter a valid email!"
        })
        const res = await Mail.findOne({ email })
        if (!res) return response.status(404).send({
            status: false,
            message: "Not found"
        })
        const currentTime = Math.floor(new Date().getTime() / 1000)
        if (currentTime > res.deadline) return response.status(400).send({
            status: false,
            message: "Invalid otp!"
        })
        if (res.otp == otp) {
            if (res.verified) {
                return response.status(200).send({
                    status: true,
                    message: "You're already verified"
                })
            }
            await Mail.updateOne({ email }, { $set: { verified: true } })
            return response.status(200).send({
                status: true,
                message: "verified"
            })
        }
        return response.status(400).send({
            status: false,
            message: "Invalid OTP"
        }) 
    } catch (err) {
        console.log(err.message)
        return response.status(500).send({
            message: "Internal server error"
        })
    }
}

export default {
    send,
    verify
}
