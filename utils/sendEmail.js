import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"NYLA Beauty" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message, // النص العادي عشان فلاتر السبام ترتاح
        html: options.html,    // هنا الـ HTML الشيك بتاعك
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;