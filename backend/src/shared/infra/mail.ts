import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
	auth: {
		pass: process.env.MAIL_PASS,
		user: process.env.MAIL_USER,
	},
	host: process.env.MAIL_HOST,
	port: Number(process.env.MAIL_PORT),
	secure: Number(process.env.MAIL_PORT) === 465,
});
