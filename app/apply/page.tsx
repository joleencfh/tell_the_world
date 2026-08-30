"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { submitApplication } from "@/lib/applications/actions";
import { Field, FormSection, SelectInput, TextareaInput, TextInput } from "./form-fields";
import { CreatorFields, JournalistFields, ExpertFields, OrganisationFields, CommsSpecialistFields, ExtrasFields } from "./role-sections";
import {
  EMPTY,
  EMAIL_ERROR,
  ERROR_LABELS,
  URL_ERROR,
  isValidEmail,
  isValidUrl,
  validate,
} from "./validation";
import type { Errors, FormValues, Role } from "./validation";

export default function ApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const role = form.desired_role as Role | "";

  function set(field: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleBlur(field: keyof FormValues) {
    const value = (form[field] as string).trim();
    if (field === "email") {
      if (value && !isValidEmail(value))
        setErrors((prev) => ({ ...prev, email: EMAIL_ERROR }));
      return;
    }
    const urlFields: (keyof FormValues)[] = [
      "website_url",
      "platform_url",
      "publication_url",
      "credibility_url",
      "sample_work_url",
    ];
    if (urlFields.includes(field) && value && !isValidUrl(value))
      setErrors((prev) => ({ ...prev, [field]: URL_ERROR }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot check — bots fill hidden fields, humans don't see them
    if (form.honeypot) {
      router.push("/apply/pending"); // Silently pretend it worked
      return;
    }

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    // Validation here is UX only — the server action re-validates, rate
    // limits, inserts the row, and sends the confirmation email. The browser
    // never talks to Supabase or Resend directly.
    const result = await submitApplication(form);

    setSubmitting(false);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    if (result.emailFailed) {
      // Stay on page so the message is readable — the application was saved successfully
      setSubmitError(
        "Your application was saved, but the confirmation email failed to send. We have your application — no need to resubmit.",
      );
      return;
    }

    router.push("/apply/pending");
  }

  // Bio label / hint change for organisations
  const bioLabel =
    role === "organisation" ? "About your organisation" : "Bio";
  const bioHint =
    role === "organisation"
      ? "Describe who you are, what you do, and why AI safety communication matters to your organisation."
      : "Tell us who you are and what you do. A short paragraph is fine.";
  const bioPH =
    role === "organisation"
      ? "Tell us about your organisation and its mission…"
      : "A short introduction…";

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b-2 border-ink px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between py-4">
          <Logo href="/" />
          <Link
            href="/login"
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">

          {/* Page heading */}
          <div className="mb-12">
            <div className="mb-5 inline-flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-soft shrink-0" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-soft">
                Applications open
              </span>
            </div>
            <h1 className="font-display uppercase leading-[0.96] tracking-tight text-[2.75rem] sm:text-[4rem] text-ink mb-5">
              Apply to join
            </h1>
            <p className="font-body text-base leading-[1.8] text-ink-soft max-w-lg">
              Tell us about yourself and what you want to do on the platform. We
              review every application personally and aim to get back to you
              within a few days.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Honeypot — visually hidden, must stay empty; bots fill it, humans don't see it */}
            <div className="absolute left-[-9999px] w-px h-px overflow-hidden" aria-hidden="true">
              <label htmlFor="hp_address">Address</label>
              <input
                type="text"
                id="hp_address"
                name="address"
                value={form.honeypot}
                onChange={(e) => set("honeypot", e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* ── Section: About you ─────────────────────────────────────── */}
            <FormSection legend="About you">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="First name" error={errors.first_name} required fieldId="first_name">
                  <TextInput
                    type="text"
                    value={form.first_name}
                    onChange={(v) => set("first_name", v)}
                    placeholder="First name"
                    autoComplete="given-name"
                    hasError={!!errors.first_name}
                  />
                </Field>
                <Field label="Last name" error={errors.last_name} required fieldId="last_name">
                  <TextInput
                    type="text"
                    value={form.last_name}
                    onChange={(v) => set("last_name", v)}
                    placeholder="Last name"
                    autoComplete="family-name"
                    hasError={!!errors.last_name}
                  />
                </Field>
              </div>

              <Field label="Email address" error={errors.email} required fieldId="email">
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  onBlur={() => handleBlur("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                  hasError={!!errors.email}
                />
              </Field>

              <Field
                label="I am applying as a"
                error={errors.desired_role}
                required
                fieldId="desired_role"
              >
                <SelectInput
                  value={form.desired_role}
                  onChange={(v) => {
                    // Reset role-specific fields when the role changes
                    setForm({ ...EMPTY, first_name: form.first_name, last_name: form.last_name, email: form.email, bio: form.bio, website_url: form.website_url, desired_role: v as Role });
                    setErrors({});
                  }}
                  hasError={!!errors.desired_role}
                >
                  <option value="">Select a role…</option>
                  <option value="creator">Creator</option>
                  <option value="journalist">Journalist</option>
                  <option value="expert">Expert / Researcher</option>
                  <option value="organisation">Organisation</option>
                  <option value="comms_specialist">Communications Specialist</option>
                  <option value="other">Other</option>
                </SelectInput>
              </Field>

              {role === "other" && (
                <Field
                  label="Please describe your role"
                  hint="Tell us what you do and how you'd like to contribute to the platform."
                  error={errors.desired_role_other}
                  required
                  fieldId="desired_role_other"
                >
                  <TextInput
                    type="text"
                    value={form.desired_role_other}
                    onChange={(v) => set("desired_role_other", v)}
                    placeholder=""
                    hasError={!!errors.desired_role_other}
                  />
                </Field>
              )}

              <Field
                label={bioLabel}
                hint={bioHint}
                error={errors.bio}
                required
                fieldId="bio"
              >
                <TextareaInput
                  value={form.bio}
                  onChange={(v) => set("bio", v)}
                  placeholder={bioPH}
                  rows={4}
                  hasError={!!errors.bio}
                />
              </Field>

              <Field
                label="Website"
                hint="Your personal site, YouTube channel, LinkedIn, etc. (optional)"
                error={errors.website_url}
                fieldId="website_url"
              >
                <TextInput
                  type="url"
                  value={form.website_url}
                  onChange={(v) => set("website_url", v)}
                  onBlur={() => handleBlur("website_url")}
                  placeholder="https://"
                  hasError={!!errors.website_url}
                />
              </Field>
            </FormSection>

            {/* ── Role-specific sections ─────────────────────────────────── */}
            {role === "creator" && (
              <CreatorFields form={form} errors={errors} set={set} handleBlur={handleBlur} />
            )}
            {role === "journalist" && (
              <JournalistFields form={form} errors={errors} set={set} handleBlur={handleBlur} />
            )}
            {role === "expert" && (
              <ExpertFields form={form} errors={errors} set={set} handleBlur={handleBlur} />
            )}
            {role === "organisation" && (
              <OrganisationFields form={form} errors={errors} set={set} />
            )}
            {role === "comms_specialist" && (
              <CommsSpecialistFields form={form} errors={errors} set={set} handleBlur={handleBlur} />
            )}

            {/* ── Universal bottom section ──────────────────────────────── */}
            {role !== "" && <ExtrasFields form={form} set={set} />}

            {/* ── Submit ───────────────────────────────────────────────────── */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 border border-red-200 bg-red-50 p-5" role="alert" aria-live="polite">
                <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-red-700 mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" aria-hidden />
                  A few fields need your attention
                </p>
                <ul className="flex flex-col gap-1.5">
                  {(Object.keys(errors) as (keyof FormValues)[])
                    .filter((key) => ERROR_LABELS[key])
                    .map((key) => (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById(key)
                              ?.scrollIntoView({ behavior: "smooth", block: "center" })
                          }
                          className="font-body text-sm text-red-600 hover:underline text-left"
                        >
                          {ERROR_LABELS[key]}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {submitError && (
              <p className="mb-6 font-mono text-[11px] text-red-600" role="alert">
                Something went wrong: {submitError}
              </p>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-line pt-8">
              <button
                type="submit"
                disabled={submitting}
                className="font-display uppercase tracking-widest text-sm bg-ink text-paper px-8 py-4 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit application"}
              </button>
              <p className="font-mono text-[10px] text-ink-soft leading-relaxed max-w-xs">
                We&rsquo;ll review your application and get back to you by email
                within a few days.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
