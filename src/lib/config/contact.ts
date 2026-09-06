// Dynamic (not static) so a deployment missing these vars fails gracefully
// at runtime instead of breaking the build; the form self-disables via
// `contactFormReady` below.
import { env } from "$env/dynamic/public";

/**
 * EmailJS configuration for the contact form.
 *
 * These are *public* values by design — EmailJS's browser SDK authenticates
 * with a public API key, and rate limiting is configured in the EmailJS
 * dashboard. Never put private keys in PUBLIC_* variables.
 */
export const EMAILJS = {
  serviceId: env.PUBLIC_EMAILJS_SERVICE_ID ?? "",
  templateId: env.PUBLIC_EMAILJS_TEMPLATE_ID ?? "",
  publicKey: env.PUBLIC_EMAILJS_PUBLIC_KEY ?? "",
} as const;

/** True when the form can actually send — all three IDs are configured. */
export const contactFormReady = Boolean(
  EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey,
);
