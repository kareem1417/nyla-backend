import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 2525,
        secure: false,
        auth: {
            user: 'ab3114001@smtp-brevo.com', // 👈 حطينا اليوزر بإيدنا
            pass: 'xsmtpsib-81eb68923c60d72b12732a469330357d940623a538077a6d74b19e4f83dba2b5-4vTYGD209MVg4UHP', // 👈 والباسورد كمان
        },
    });

    const mailOptions = {
        from: `"NYLA Beauty" <nylaabeauty@gmail.com>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail; س