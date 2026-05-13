import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT, // هيقرا 2525 من المتغيرات
        secure: false, // لازم false عشان ده بورت 2525
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        // ده الاسم والإيميل اللي هيظهر للعميل (إيميل البراند بتاعكم)
        from: `"NYLA Beauty" <nylaabeauty@gmail.com>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;