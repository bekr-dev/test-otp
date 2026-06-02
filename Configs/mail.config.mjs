import nodemailer from "nodemailer"

const email = "noreply@medcn.tech"
    //process.env.EMAIL
const password = "MWE'avv8WuXXRyF"
    //process.env.EMAIL_PASSWORD

export const transporter = nodemailer.createTransport({
    host: 'smtp.titan.email', // السيرفر الخاص بـ Titan Mail
    port: 465,                // المنفذ الآمن المخصص لـ SMTP
    secure: true,             // تفعيل التشفير لأننا نستخدم المنفذ 465
    auth: {
        user: email,          // إيميلك الكامل (مثال: info@yourdomain.tech)
        pass: password        // كلمة السر العادية لحساب الإيميل هذا
    }
})
