import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    console.log('📧 Sending email to:', options.email);
    console.log('📧 Using SMTP host:', process.env.EMAIL_HOST, 'port:', process.env.EMAIL_PORT);
    console.log('📧 Using SMTP user:', process.env.EMAIL_USER);

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
};

export default sendEmail;