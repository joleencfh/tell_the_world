"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Field, { Select, Textarea, TextInput } from "@/components/ui/Field";
import Footer from "@/components/ui/Footer";
import FormSection from "@/components/ui/FormSection";
import SiteHeader from "@/components/ui/SiteHeader";
import { submitApplication } from "@/lib/applications/actions";
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
    <div className="flex min-h-screen flex-col bg-parchment font-ui text-umber">
      <SiteHeader action={{ href: "/login", label: "Log in" }} />

      <main className="flex-1 px-4 py-section md:px-gutter">
        <div className="mx-auto max-w-reading">

          {/* Page heading */}
          <div className="mb-12">
            <p className="mb-3 font-mono text-label uppercase text-umber-soft">Applications open</p>
            <h1 className="mb-4 font-serif text-title text-umber">Apply to join</h1>
            <p className="max-w-prose font-serif text-lead text-umber-soft">
              Tell us about yourself and what you want to do on the platform. We
              review every application personally and aim to get back to you
              within a few days.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-10">
            <p className="font-ui text-ui-sm text-umber-soft">
              All fields are required unless marked Optional.
            </p>

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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field id="first_name" label="First name" error={errors.first_name}>
                  {(p) => (
                    <TextInput
                      {...p}
                      value={form.first_name}
                      onChange={(e) => set("first_name", e.target.value)}
                      placeholder="First name"
                      autoComplete="given-name"
                    />
                  )}
                </Field>
                <Field id="last_name" label="Last name" error={errors.last_name}>
                  {(p) => (
                    <TextInput
                      {...p}
                      value={form.last_name}
                      onChange={(e) => set("last_name", e.target.value)}
                      placeholder="Last name"
                      autoComplete="family-name"
                    />
                  )}
                </Field>
              </div>

              <Field id="email" label="Email address" error={errors.email}>
                {(p) => (
                  <TextInput
                    {...p}
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                )}
              </Field>

              <Field id="desired_role" label="I am applying as a" error={errors.desired_role}>
                {(p) => (
                  <Select
                    {...p}
                    value={form.desired_role}
                    onChange={(e) => {
                      // Reset role-specific fields when the role changes
                      setForm({ ...EMPTY, first_name: form.first_name, last_name: form.last_name, email: form.email, bio: form.bio, website_url: form.website_url, desired_role: e.target.value as Role });
                      setErrors({});
                    }}
                  >
                    <option value="">Select a role…</option>
                    <option value="creator">Creator</option>
                    <option value="journalist">Journalist</option>
                    <option value="expert">Expert / Researcher</option>
                    <option value="organisation">Organisation</option>
                    <option value="comms_specialist">Communications Specialist</option>
                    <option value="other">Other</option>
                  </Select>
                )}
              </Field>

              {role === "other" && (
                <Field
                  id="desired_role_other"
                  label="Please describe your role"
                  hint="Tell us what you do and how you'd like to contribute to the platform."
                  error={errors.desired_role_other}
                >
                  {(p) => (
                    <TextInput
                      {...p}
                      value={form.desired_role_other}
                      onChange={(e) => set("desired_role_other", e.target.value)}
                    />
                  )}
                </Field>
              )}

              <Field id="bio" label={bioLabel} hint={bioHint} error={errors.bio}>
                {(p) => (
                  <Textarea
                    {...p}
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder={bioPH}
                    rows={4}
                  />
                )}
              </Field>

              <Field
                id="website_url"
                label="Website"
                optional
                hint="Your personal site, YouTube channel, LinkedIn, etc."
                error={errors.website_url}
              >
                {(p) => (
                  <TextInput
                    {...p}
                    type="url"
                    value={form.website_url}
                    onChange={(e) => set("website_url", e.target.value)}
                    onBlur={() => handleBlur("website_url")}
                    placeholder="https://"
                  />
                )}
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
              <Alert tone="danger" lead="A few fields need your attention">
                <ul className="mt-2 flex flex-col">
                  {(Object.keys(errors) as (keyof FormValues)[])
                    .filter((key) => ERROR_LABELS[key])
                    .map((key) => (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(key);
                            el?.scrollIntoView({ behavior: "smooth", block: "center" });
                            el?.focus({ preventScroll: true });
                          }}
                          className="min-h-11 rounded-control text-left underline underline-offset-4 hover:decoration-2 focus-ring"
                        >
                          {ERROR_LABELS[key]}
                        </button>
                      </li>
                    ))}
                </ul>
              </Alert>
            )}

            {submitError && <Alert tone="danger">Something went wrong: {submitError}</Alert>}

            <div className="flex flex-col gap-4 border-t border-rule pt-8 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" pending={submitting}>
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
              <p className="max-w-xs font-ui text-caption text-umber-soft">
                We&rsquo;ll review your application and get back to you by email
                within a few days.
              </p>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
