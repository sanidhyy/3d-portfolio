import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { toast } from "sonner";

import { EarthCanvas } from "./canvas";
import { SectionWrapper } from "../hoc";
import {
  CONTACT_RECAPTCHA_ACTION,
  isValidContactEmail,
  isValidContactMessage,
  isValidContactName,
  type ContactFormFields,
} from "../lib/contact";
import { styles } from "../styles";
import { slideIn } from "../utils/motion";

const FIELD_VALIDATORS: Record<
  keyof ContactFormFields,
  (value: string) => boolean
> = {
  name: isValidContactName,
  email: isValidContactEmail,
  message: isValidContactMessage,
};

const ContactForm = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const formRef = useRef<HTMLFormElement | null>(null);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const hasAttemptedSubmit = useRef(false);
  const [form, setForm] = useState<ContactFormFields>({
    name: "",
    email: "",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: false,
    email: false,
    message: false,
  });
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    const el = messageRef.current;
    if (!el) return;

    el.style.overflowY = "hidden";
    el.style.height = "auto";

    const nextHeight = el.scrollHeight;
    const maxHeight = Number.parseFloat(getComputedStyle(el).maxHeight);

    if (Number.isFinite(maxHeight) && nextHeight >= maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = "auto";
      return;
    }

    el.style.height = `${nextHeight}px`;
  }, [form.message]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const field = e.target.name as keyof ContactFormFields;
    const value = e.target.value;

    setForm((prev) => ({ ...prev, [field]: value }));

    if (!hasAttemptedSubmit.current) return;

    const isInvalid = !FIELD_VALIDATORS[field](value);
    setFieldErrors((prev) =>
      prev[field] === isInvalid ? prev : { ...prev, [field]: isInvalid },
    );
  };

  const validateForm = () => {
    hasAttemptedSubmit.current = true;

    const nextErrors = {
      name: !isValidContactName(form.name),
      email: !isValidContactEmail(form.email),
      message: !isValidContactMessage(form.message),
    };

    setFieldErrors(nextErrors);

    return !nextErrors.name && !nextErrors.email && !nextErrors.message;
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!executeRecaptcha) {
      toast.error("reCAPTCHA is not ready. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const recaptchaToken = await executeRecaptcha(CONTACT_RECAPTCHA_ACTION);

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          recaptchaToken,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        toast.error(data?.error ?? "Something went wrong.");
        return;
      }

      toast.success("Thanks for contacting me.");
      setForm({
        name: "",
        email: "",
        message: "",
      });
      setFieldErrors({
        name: false,
        email: false,
        message: false,
      });
    } catch (error) {
      console.error("[CONTACT_ERROR]: ", error);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mt-12 flex flex-col gap-8"
    >
      <label htmlFor="name" className="flex flex-col">
        <span className="text-white font-medium mb-4">Your Name*</span>
        <input
          type="text"
          name="name"
          id="name"
          value={form.name}
          onChange={handleChange}
          placeholder="John Doe"
          title="What's your name?"
          maxLength={200}
          disabled={loading}
          aria-disabled={loading}
          className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-hidden border-none font-medium disabled:bg-tertiary/20 disabled:text-white/60"
        />

        <span
          className={`text-red-400 mt-2 ${fieldErrors.name ? "" : "hidden"}`}
          id="name-error"
        >
          Invalid Name!
        </span>
      </label>

      <label htmlFor="email" className="flex flex-col">
        <span className="text-white font-medium mb-4">Your Email*</span>
        <input
          type="email"
          name="email"
          id="email"
          value={form.email}
          onChange={handleChange}
          placeholder="johndoe@email.com"
          title="What's your email?"
          maxLength={100}
          disabled={loading}
          aria-disabled={loading}
          className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-hidden border-none font-medium disabled:bg-tertiary/20 disabled:text-white/60"
        />

        <span
          className={`text-red-400 mt-2 ${fieldErrors.email ? "" : "hidden"}`}
          id="email-error"
        >
          Invalid E-mail!
        </span>
      </label>

      <label htmlFor="message" className="flex flex-col">
        <span className="text-white font-medium mb-4">Your Message*</span>
        <textarea
          ref={messageRef}
          rows={7}
          name="message"
          id="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Hello there!"
          title="What do you want to say?"
          maxLength={500}
          disabled={loading}
          aria-disabled={loading}
          className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outline-hidden border-none font-medium resize-none overflow-hidden max-h-96 disabled:bg-tertiary/20 disabled:text-white/60"
        />

        <span
          className={`text-red-400 mt-2 ${fieldErrors.message ? "" : "hidden"}`}
          id="message-error"
        >
          Invalid Message!
        </span>
      </label>

      <button
        type="submit"
        title={loading ? "Sending..." : "Send"}
        className="bg-tertiary py-3 px-8 outline-hidden w-fit text-white font-bold shadow-md shadow-primary rounded-xl disabled:bg-tertiary/20 disabled:text-white/60"
        disabled={loading}
        aria-disabled={loading}
      >
        {loading ? "Sending..." : "Send"}
      </button>
      <p className="mt-3 text-xs text-secondary/70">
        This site is protected by reCAPTCHA.
      </p>
    </form>
  );
};

export const Contact = () => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  return (
    <SectionWrapper idName="contact">
      <div className="xl:mt-12 xl:flex-row flex-col-reverse flex gap-10 overflow-hidden">
        <motion.div
          variants={slideIn("left", "tween", 0.2, 1)}
          className="flex-[0.75] bg-black-100 p-8 rounded-2xl"
        >
          <p className={styles.sectionSubText}>Get in touch</p>
          <h3 className={styles.sectionHeadText}>Contact.</h3>

          {siteKey ? (
            <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
              <ContactForm />
            </GoogleReCaptchaProvider>
          ) : (
            <p className="mt-12 text-secondary">
              Contact form is currently unavailable.
            </p>
          )}
        </motion.div>

        <motion.div
          variants={slideIn("right", "tween", 0.2, 1)}
          className="xl:flex-1 xl:h-auto md:h-137.5 h-87.5"
        >
          <EarthCanvas />
        </motion.div>
      </div>
    </SectionWrapper>
  );
};
