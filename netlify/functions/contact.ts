import type { Config } from "@netlify/functions";
import { Resend } from "resend";

import {
  CONTACT_EMAIL_FALLBACK,
  CONTACT_RECAPTCHA_ACTION,
  validateContactForm,
} from "../../src/lib/contact";

type RecaptchaVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
};

type ContactRequestBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  recaptchaToken?: unknown;
};

const json = (body: unknown, status = 200) =>
  Response.json(body, { status });

const getClientIp = (request: Request): string | undefined => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return (
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-real-ip") ??
    undefined
  );
};

const verifyRecaptcha = async (
  token: string,
  remoteIp?: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("RECAPTCHA_SECRET_KEY is not set.");
    return {
      ok: false,
      status: 500,
      error: "Server configuration error.",
    };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  let data: RecaptchaVerifyResponse;
  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );
    data = (await response.json()) as RecaptchaVerifyResponse;
  } catch (error) {
    console.error("reCAPTCHA verification request failed:", error);
    return {
      ok: false,
      status: 502,
      error: "Unable to verify reCAPTCHA. Please try again.",
    };
  }

  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");
  const score = data.score ?? 0;

  if (
    !data.success ||
    data.action !== CONTACT_RECAPTCHA_ACTION ||
    Number.isNaN(minScore) ||
    score < minScore
  ) {
    console.error("reCAPTCHA verification failed:", {
      success: data.success,
      action: data.action,
      errorCodes: data["error-codes"],
    });
    return {
      ok: false,
      status: 403,
      error: "reCAPTCHA verification failed. Please try again.",
    };
  }

  return { ok: true };
};

export default async (request: Request) => {
  let payload: ContactRequestBody;
  try {
    payload = (await request.json()) as ContactRequestBody;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const name = typeof payload.name === "string" ? payload.name : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  const message = typeof payload.message === "string" ? payload.message : "";
  const recaptchaToken =
    typeof payload.recaptchaToken === "string" ? payload.recaptchaToken : "";

  if (!recaptchaToken) {
    return json({ error: "reCAPTCHA token is missing." }, 400);
  }

  const validationError = validateContactForm({ name, email, message });
  if (validationError) {
    return json({ error: validationError }, 400);
  }

  const recaptchaResult = await verifyRecaptcha(
    recaptchaToken,
    getClientIp(request),
  );
  if (!recaptchaResult.ok) {
    return json(
      { error: recaptchaResult.error },
      recaptchaResult.status,
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const userTemplateId = process.env.RESEND_TEMPLATE_CONTACT_USER;
  const adminTemplateId = process.env.RESEND_TEMPLATE_CONTACT_ADMIN;
  const adminEmail = process.env.CONTACT_TO_EMAIL || CONTACT_EMAIL_FALLBACK;
  const siteUrl = (process.env.CONTACT_SITE_URL || "").replace(/\/$/, "");

  if (!apiKey || !from || !userTemplateId || !adminTemplateId || !siteUrl) {
    console.error("Missing Resend environment variables.");
    return json({ error: "Server configuration error." }, 500);
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.batch.send([
      {
        from,
        to: trimmedEmail,
        replyTo: adminEmail,
        template: {
          id: userTemplateId,
          variables: {
            USER_NAME: trimmedName,
            USER_MESSAGE: trimmedMessage,
            SITE_URL: siteUrl,
          },
        },
      },
      {
        from,
        to: adminEmail,
        replyTo: trimmedEmail,
        template: {
          id: adminTemplateId,
          variables: {
            USER_NAME: trimmedName,
            USER_EMAIL: trimmedEmail,
            USER_MESSAGE: trimmedMessage,
            SITE_URL: siteUrl,
          },
        },
      },
    ]);

    if (error) {
      console.error("Resend batch send failed:", error);
      return json(
        { error: "Failed to send message. Please try again." },
        502,
      );
    }
  } catch (error) {
    console.error("Unexpected error while sending email:", error);
    return json(
      { error: "Failed to send message. Please try again." },
      500,
    );
  }

  return json({ ok: true });
};

export const config: Config = {
  path: "/api/contact",
  method: "POST",
};
