import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // 1. إعداد المحرك بتفصيل أكتر للسيرفرات
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465, // بورت آمن للـ SSL
        secure: true, // استخدام SSL
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // إضافة إعدادات الـ Timeout عشان ما يهنجش السيرفر
        connectionTimeout: 10000, // 10 ثواني
    });

    const mailOptions = {
        from: `"NYLA Beauty" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    // 2. محاولة الإرسال مع صيد الإيرور فوراً
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("❌ NODEMAILER ERROR:", error);
        throw error; // عشان الكنترولر يحس بالإيرور
    }
};

export default sendEmail;