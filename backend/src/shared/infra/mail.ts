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

export async function sendOrderStatusEmail(email: string, status: string, orderId: string, message: string): Promise<void> {
	await mailer.sendMail({
		from: process.env.MAIL_FROM ?? process.env.MAIL_USER,
		subject: `Atualização do pedido ${orderId}`,
		text: `${message}\n\nStatus: ${status}`,
		to: email,
	});
}
