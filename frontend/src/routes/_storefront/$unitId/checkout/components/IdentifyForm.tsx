import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type Channel = "email" | "whatsapp";
type Step = "form" | "email-sent";

interface IdentifyFormProps {
	unitSlug?: string;
}

const RESEND_COOLDOWN_SECONDS = 30;

function MailIcon({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
		>
			<rect height="16" rx="3" width="20" x="2" y="4" />
			<path d="m2 7 10 7 10-7" />
		</svg>
	);
}

function WhatsAppIcon({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
			<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5 13.9c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.7s.6-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.2.4-.2.6-.1l2.1 1c.2.1.4.2.4.3.1.1.1.6-.1 1.1Z" />
		</svg>
	);
}

function CheckCircleIcon({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="m8 12.5 2.5 2.5L16 9.5" />
		</svg>
	);
}

function AlertIcon({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 8v4m0 4h.01" />
		</svg>
	);
}

function Spinner({ className }: { className?: string }) {
	return (
		<svg aria-hidden="true" className={cn("animate-spin", className)} fill="none" viewBox="0 0 24 24">
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
			<path className="opacity-75" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" fill="currentColor" />
		</svg>
	);
}

export function IdentifyForm({ unitSlug }: IdentifyFormProps) {
	const { t } = useTranslation();
	const [channel, setChannel] = useState<Channel>("email");
	const [step, setStep] = useState<Step>("form");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [usePassword, setUsePassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cooldown, setCooldown] = useState(0);
	const [resent, setResent] = useState(false);

	const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	const passwordIsValid = password.length > 0;

	useEffect(() => {
		if (cooldown <= 0) return;
		const id = setTimeout(() => setCooldown(current => current - 1), 1000);
		return () => clearTimeout(id);
	}, [cooldown]);

	async function requestMagicLink({ isResend = false } = {}) {
		setError(null);
		setLoading(true);
		const { error: caught } = await authClient.signIn.magicLink({
			email,
			metadata: { unitId: unitSlug ?? "" },
		});
		setLoading(false);
		if (caught) {
			setError(t("store.checkout.identify.errors.send"));
			return;
		}
		setCooldown(RESEND_COOLDOWN_SECONDS);
		setResent(isResend);
		setStep("email-sent");
	}

	async function signInWithPassword() {
		setError(null);
		setLoading(true);
		const { error: caught } = await authClient.signIn.email({
			email,
			password,
		});
		setLoading(false);
		if (caught) {
			setError(t("store.checkout.identify.errors.invalidCredentials"));
		}
	}

	const channels: { key: Channel; label: string; icon: typeof MailIcon; disabled?: boolean }[] = [
		{ icon: MailIcon, key: "email", label: t("store.checkout.identify.channels.email") },
		{
			disabled: true,
			icon: WhatsAppIcon,
			key: "whatsapp",
			label: t("store.checkout.identify.channels.whatsapp"),
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex rounded-pill bg-muted p-1" role="tablist">
				{channels.map(option => {
					const isActive = channel === option.key;
					return (
						<button
							aria-selected={isActive}
							className={cn(
								"flex flex-1 items-center justify-center gap-2 rounded-pill px-3 py-2.5 font-semibold text-sm transition-all duration-300",
								isActive && "bg-primary text-primary-foreground shadow-sm",
								!isActive && !option.disabled && "text-foreground hover:bg-background/70",
								option.disabled && "cursor-not-allowed text-muted-foreground/60",
							)}
							disabled={option.disabled}
							key={option.key}
							onClick={() => {
								setChannel(option.key);
								setStep("form");
								setError(null);
							}}
							role="tab"
							type="button"
						>
							<option.icon className="size-4" />
							{option.label}
							{option.disabled && (
								<span className="rounded-pill bg-accent px-1.5 py-0.5 font-bold text-[10px] text-accent-foreground uppercase tracking-wide">
									{t("store.checkout.identify.channels.soon")}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{channel === "email" && step === "form" && (
				<form
					className="animate-slide-in-3d space-y-4"
					onSubmit={event => {
						event.preventDefault();
						if (usePassword) {
							void signInWithPassword();
							return;
						}
						void requestMagicLink();
					}}
				>
					<Label>
						{t("store.checkout.identify.email")}
						<div className="relative">
							<MailIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/70" />
							<Input
								autoComplete="email"
								className={cn("h-12 rounded-pill pr-10 pl-10", emailIsValid && "border-success/60")}
								onChange={event => {
									setEmail(event.currentTarget.value);
									setError(null);
								}}
								placeholder="voce@email.com"
								type="email"
								value={email}
							/>
							{emailIsValid && (
								<CheckCircleIcon className="absolute top-1/2 right-3.5 size-4.5 -translate-y-1/2 animate-slide-in-3d text-success" />
							)}
						</div>
					</Label>
					<p className="text-muted-foreground text-xs">{t("store.checkout.identify.emailHint")}</p>
					{usePassword && (
						<Label className="animate-slide-in-3d">
							{t("store.checkout.identify.password")}
							<Input
								autoComplete="current-password"
								className="h-12 rounded-pill"
								onChange={event => {
									setPassword(event.currentTarget.value);
									setError(null);
								}}
								placeholder={t("store.checkout.identify.passwordPlaceholder")}
								type="password"
								value={password}
							/>
						</Label>
					)}

					{error && (
						<div
							className="flex animate-slide-in-3d items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-destructive text-sm"
							role="alert"
						>
							<AlertIcon className="size-4 shrink-0" />
							{error}
						</div>
					)}

					<Button
						className="h-12 w-full rounded-pill font-bold text-base shadow-glow-blue transition-shadow disabled:shadow-none"
						disabled={loading || !emailIsValid || (usePassword && !passwordIsValid)}
						type="submit"
					>
						{loading && <Spinner className="size-4" />}
						{loading
							? t(usePassword ? "store.checkout.identify.signingIn" : "store.checkout.identify.sending")
							: t(usePassword ? "store.checkout.identify.signInWithPassword" : "store.checkout.identify.sendLink")}
					</Button>
					<button
						className="w-full cursor-pointer text-muted-foreground text-sm underline underline-offset-4"
						onClick={() => {
							setUsePassword(current => !current);
							setError(null);
						}}
						type="button"
					>
						{usePassword
							? t("store.checkout.identify.signInWithLink")
							: t("store.checkout.identify.signInWithPassword")}
					</button>
				</form>
			)}

			{channel === "email" && step === "email-sent" && (
				<div className="animate-slide-in-3d space-y-4 text-center">
					<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
						<CheckCircleIcon className="size-7" />
					</div>
					<div className="space-y-1.5">
						<p className="font-bold text-foreground text-lg">{t("store.checkout.identify.linkSentTitle")}</p>
						<p className="text-muted-foreground text-sm">
							<Trans
								components={{ strong: <strong className="font-semibold text-foreground" /> }}
								i18nKey="store.checkout.identify.linkSent"
								values={{ email }}
							/>
						</p>
					</div>

					{resent && !loading && (
						<p className="font-medium text-success text-xs">{t("store.checkout.identify.linkResent")}</p>
					)}

					{error && (
						<div
							className="flex animate-slide-in-3d items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-left text-destructive text-sm"
							role="alert"
						>
							<AlertIcon className="size-4 shrink-0" />
							{error}
						</div>
					)}

					<div className="space-y-2">
						<Button
							className="h-11 w-full rounded-pill"
							disabled={loading || cooldown > 0}
							onClick={() => void requestMagicLink({ isResend: true })}
							type="button"
							variant="outline"
						>
							{loading && <Spinner className="size-4" />}
							{cooldown > 0
								? t("store.checkout.identify.resendIn", { seconds: cooldown })
								: t("store.checkout.identify.resend")}
						</Button>
						<Button
							className="h-11 w-full rounded-pill text-muted-foreground"
							onClick={() => {
								setStep("form");
								setError(null);
								setResent(false);
							}}
							type="button"
							variant="outline"
						>
							{t("store.checkout.identify.changeEmail")}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
