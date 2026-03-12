"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sendApplicationConfirmation } from "@/lib/email/send-application-confirmation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = "creator" | "expert" | "organisation" | "journalist" | "other";

interface FormValues {
  // Universal
  first_name: string;
  last_name: string;
  email: string;
  desired_role: Role | "";
  bio: string;
  website_url: string;
  // Creator + journalist
  primary_platform: string;
  platform_url: string;
  audience_size: string;
  content_language: string;
  // Journalist
  publication_name: string;
  publication_url: string;
  reporting_beat: string;
  // Expert
  affiliation: string;
  job_title: string;
  credibility_url: string;
  // Organisation
  org_name: string;
  org_size: string;
  // Work sample — creator, journalist, expert
  sample_work_url: string;
  // Universal (bottom section)
  referral_source: string;
  referral_source_other: string;
  additional_info: string;
  // "Other" specify fields
  desired_role_other: string;
  primary_platform_other: string;
  // Honeypot — must stay empty; filled value = bot
  honeypot: string;
}

type Errors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = {
  first_name: "",
  last_name: "",
  email: "",
  desired_role: "",
  bio: "",
  website_url: "",
  primary_platform: "",
  platform_url: "",
  audience_size: "",
  content_language: "",
  publication_name: "",
  publication_url: "",
  reporting_beat: "",
  affiliation: "",
  job_title: "",
  credibility_url: "",
  org_name: "",
  org_size: "",
  sample_work_url: "",
  referral_source: "",
  referral_source_other: "",
  additional_info: "",
  desired_role_other: "",
  primary_platform_other: "",
  honeypot: "",
};

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true; // Empty is fine — required check handles that separately
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const URL_ERROR = "Please enter a valid URL (e.g. https://example.com)";
const EMAIL_ERROR = "Please enter a valid email address";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(f: FormValues): Errors {
  const e: Errors = {};

  // Always required
  if (!f.first_name.trim()) e.first_name = "Required";
  if (!f.last_name.trim()) e.last_name = "Required";
  if (!f.email.trim()) e.email = "Required";
  else if (!isValidEmail(f.email)) e.email = EMAIL_ERROR;
  if (!f.desired_role) e.desired_role = "Please select a role";
  if (!f.bio.trim()) e.bio = "Required";

  // "Other" role specify
  if (f.desired_role === "other" && !f.desired_role_other.trim())
    e.desired_role_other = "Required";

  // Creator
  if (f.desired_role === "creator") {
    if (!f.primary_platform) e.primary_platform = "Required";
    if (f.primary_platform === "other" && !f.primary_platform_other.trim())
      e.primary_platform_other = "Required";
    if (!f.platform_url.trim()) e.platform_url = "Required";
    else if (!isValidUrl(f.platform_url)) e.platform_url = URL_ERROR;
  }

  // Journalist
  if (f.desired_role === "journalist") {
    if (!f.publication_name.trim()) e.publication_name = "Required";
  }

  // Expert
  if (f.desired_role === "expert") {
    if (!f.affiliation.trim()) e.affiliation = "Required";
    if (!f.job_title.trim()) e.job_title = "Required";
  }

  // Organisation
  if (f.desired_role === "organisation") {
    if (!f.org_name.trim()) e.org_name = "Required";
  }

  // URL format checks — apply to all optional URL fields when non-empty
  if (!isValidUrl(f.website_url))     e.website_url     = URL_ERROR;
  if (!isValidUrl(f.publication_url)) e.publication_url = URL_ERROR;
  if (!isValidUrl(f.credibility_url)) e.credibility_url = URL_ERROR;
  if (!isValidUrl(f.sample_work_url)) e.sample_work_url = URL_ERROR;

  return e;
}

// Human-readable labels for the error summary near the submit button.
// Keys match FormValues field names; only required fields need an entry.
const ERROR_LABELS: Partial<Record<keyof FormValues, string>> = {
  first_name:            "First name",
  last_name:             "Last name",
  email:                 "Email address",
  desired_role:          "Role",
  desired_role_other:    "Role description",
  bio:                   "Bio",
  website_url:           "Website URL",
  primary_platform:      "Primary platform",
  primary_platform_other:"Platform name",
  platform_url:          "Channel / profile URL",
  publication_name:      "Publication name",
  publication_url:       "Publication URL",
  affiliation:           "Affiliation",
  job_title:             "Job title",
  credibility_url:       "Credibility link",
  org_name:              "Organisation name",
  sample_work_url:       "Work sample URL",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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

    const supabase = createClient();

    const payload: Record<string, unknown> = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      // Keep full_name populated for admin convenience / existing queries
      full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
      email: form.email.trim().toLowerCase(),
      desired_role: form.desired_role,
      bio: form.bio.trim(),
      status: "pending",
    };

    if (form.website_url.trim()) payload.website_url = form.website_url.trim();

    // "Other" role: store the description in its own column
    if (form.desired_role_other.trim())
      payload.desired_role_other = form.desired_role_other.trim();

    // referral_source: if "other" was chosen, store the typed value instead
    if (form.referral_source) {
      payload.referral_source =
        form.referral_source === "other" && form.referral_source_other.trim()
          ? form.referral_source_other.trim()
          : form.referral_source;
    }

    if (form.additional_info.trim()) payload.additional_info = form.additional_info.trim();
    if (form.sample_work_url.trim()) payload.sample_work_url = form.sample_work_url.trim();

    if (role === "creator") {
      // If "other" platform was chosen, store the typed value instead
      if (form.primary_platform) {
        payload.primary_platform =
          form.primary_platform === "other" && form.primary_platform_other.trim()
            ? form.primary_platform_other.trim()
            : form.primary_platform;
      }
      if (form.platform_url.trim()) payload.platform_url = form.platform_url.trim();
      if (form.audience_size.trim()) {
        const n = parseInt(form.audience_size, 10);
        if (!isNaN(n)) payload.audience_size = n;
      }
      if (form.content_language.trim())
        payload.content_language = form.content_language.trim();
    }

    if (role === "journalist") {
      if (form.publication_name.trim())
        payload.publication_name = form.publication_name.trim();
      if (form.publication_url.trim())
        payload.publication_url = form.publication_url.trim();
      if (form.reporting_beat.trim())
        payload.reporting_beat = form.reporting_beat.trim();
      if (form.content_language.trim())
        payload.content_language = form.content_language.trim();
    }

    if (role === "expert") {
      if (form.affiliation.trim()) payload.affiliation = form.affiliation.trim();
      if (form.job_title.trim()) payload.job_title = form.job_title.trim();
      if (form.credibility_url.trim())
        payload.credibility_url = form.credibility_url.trim();
    }

    if (role === "organisation") {
      if (form.org_name.trim()) payload.org_name = form.org_name.trim();
      if (form.org_size) payload.org_size = form.org_size;
      // Bio doubles as mission for orgs — mirror it into org_mission for admin queries
      payload.org_mission = form.bio.trim();
    }

    const { error } = await supabase.from("applications").insert(payload);

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    // Send confirmation email — capture any error into a local variable so we
    // can surface it in the UI and avoid navigating away before the user sees it.
    let emailError: string | null = null;
    await sendApplicationConfirmation({
      first_name:           form.first_name.trim(),
      last_name:            form.last_name.trim(),
      email:                form.email.trim().toLowerCase(),
      desired_role:         form.desired_role,
      desired_role_other:   form.desired_role_other.trim() || undefined,
      bio:                  form.bio.trim(),
      website_url:          form.website_url.trim() || undefined,
      primary_platform:     form.primary_platform || undefined,
      primary_platform_other: form.primary_platform_other.trim() || undefined,
      platform_url:         form.platform_url.trim() || undefined,
      audience_size:        form.audience_size.trim() || undefined,
      content_language:     form.content_language.trim() || undefined,
      publication_name:     form.publication_name.trim() || undefined,
      publication_url:      form.publication_url.trim() || undefined,
      reporting_beat:       form.reporting_beat.trim() || undefined,
      affiliation:          form.affiliation.trim() || undefined,
      job_title:            form.job_title.trim() || undefined,
      credibility_url:      form.credibility_url.trim() || undefined,
      org_name:             form.org_name.trim() || undefined,
      org_size:             form.org_size || undefined,
      sample_work_url:      form.sample_work_url.trim() || undefined,
      referral_source:      form.referral_source || undefined,
      referral_source_other: form.referral_source_other.trim() || undefined,
      additional_info:      form.additional_info.trim() || undefined,
    }).catch((err: unknown) => {
      emailError = err instanceof Error ? err.message : String(err);
      console.error("Confirmation email failed:", emailError);
    });

    if (emailError) {
      // Stay on page so the error is readable — the application was saved successfully
      setSubmitError(`Your application was saved, but the confirmation email failed: ${emailError}`);
      setSubmitting(false);
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
    <div className="min-h-screen bg-base text-text">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-base/95 backdrop-blur-sm border-b border-edge px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between py-4">
          <Link
            href="/"
            className="font-serif text-base font-bold tracking-tight text-text"
          >
            Tell <em className="italic text-live">The</em> World
          </Link>
          <Link
            href="/login"
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors"
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
              <span className="h-1.5 w-1.5 rounded-full bg-live shrink-0" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-soft">
                Applications open
              </span>
            </div>
            <h1 className="font-display uppercase leading-[0.96] tracking-tight text-[2.75rem] sm:text-[4rem] text-dark mb-5">
              Apply to join
            </h1>
            <p className="font-serif text-base leading-[1.8] text-soft max-w-lg">
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

            {/* ── Role-specific: Creator ────────────────────────────────── */}
            {role === "creator" && (
              <FormSection legend="Your content">
                <Field
                  label="Primary platform"
                  hint="Where is most of your content published?"
                  error={errors.primary_platform}
                  required
                  fieldId="primary_platform"
                >
                  <SelectInput
                    value={form.primary_platform}
                    onChange={(v) => set("primary_platform", v)}
                    hasError={!!errors.primary_platform}
                  >
                    <option value="">Select a platform…</option>
                    <option value="youtube">YouTube</option>
                    <option value="podcast">Podcast</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="other">Other</option>
                  </SelectInput>
                </Field>

                {form.primary_platform === "other" && (
                  <Field
                    label="Please specify your platform"
                    error={errors.primary_platform_other}
                    required
                    fieldId="primary_platform_other"
                  >
                    <TextInput
                      type="text"
                      value={form.primary_platform_other}
                      onChange={(v) => set("primary_platform_other", v)}
                      placeholder="e.g. Substack, Twitch, blog…"
                      hasError={!!errors.primary_platform_other}
                    />
                  </Field>
                )}

                <Field
                  label="Channel / profile URL"
                  error={errors.platform_url}
                  required
                  fieldId="platform_url"
                >
                  <TextInput
                    type="url"
                    value={form.platform_url}
                    onChange={(v) => set("platform_url", v)}
                    onBlur={() => handleBlur("platform_url")}
                    placeholder="https://"
                    hasError={!!errors.platform_url}
                  />
                </Field>

                <Field
                  label="Audience size"
                  hint="Approximate total subscribers or followers across your main platform."
                >
                  <TextInput
                    type="number"
                    value={form.audience_size}
                    onChange={(v) => set("audience_size", v)}
                    placeholder="e.g. 50000"
                    hasError={false}
                    min="0"
                  />
                </Field>

                <Field
                  label="Content language"
                  hint="The primary language your content is in."
                >
                  <TextInput
                    type="text"
                    value={form.content_language}
                    onChange={(v) => set("content_language", v)}
                    placeholder="e.g. English, Spanish"
                    hasError={false}
                  />
                </Field>

                <Field
                  label="Work sample"
                  hint="Link to a piece of your content relevant to AI safety, or one you're proud of and think would resonate with an audience interested in it."
                  error={errors.sample_work_url}
                  fieldId="sample_work_url"
                >
                  <TextInput
                    type="url"
                    value={form.sample_work_url}
                    onChange={(v) => set("sample_work_url", v)}
                    onBlur={() => handleBlur("sample_work_url")}
                    placeholder="https://"
                    hasError={!!errors.sample_work_url}
                  />
                </Field>
              </FormSection>
            )}

            {/* ── Role-specific: Journalist ─────────────────────────────── */}
            {role === "journalist" && (
              <FormSection legend="Your journalism">
                <Field
                  label="Publication name"
                  error={errors.publication_name}
                  required
                  fieldId="publication_name"
                >
                  <TextInput
                    type="text"
                    value={form.publication_name}
                    onChange={(v) => set("publication_name", v)}
                    placeholder="e.g. MIT Technology Review"
                    hasError={!!errors.publication_name}
                  />
                </Field>

                <Field
                  label="Publication URL"
                  error={errors.publication_url}
                  fieldId="publication_url"
                >
                  <TextInput
                    type="url"
                    value={form.publication_url}
                    onChange={(v) => set("publication_url", v)}
                    onBlur={() => handleBlur("publication_url")}
                    placeholder="https://"
                    hasError={!!errors.publication_url}
                  />
                </Field>

                <Field
                  label="Reporting beat"
                  hint="What topics do you primarily cover?"
                >
                  <TextInput
                    type="text"
                    value={form.reporting_beat}
                    onChange={(v) => set("reporting_beat", v)}
                    placeholder="e.g. AI and emerging technology"
                    hasError={false}
                  />
                </Field>

                <Field
                  label="Language you write in"
                  hint="The primary language of your journalism."
                >
                  <TextInput
                    type="text"
                    value={form.content_language}
                    onChange={(v) => set("content_language", v)}
                    placeholder="e.g. English, Italian"
                    hasError={false}
                  />
                </Field>

                <Field
                  label="Article sample"
                  hint="Link to a published article relevant to AI safety, or one that showcases the kind of work you'd like to do on this platform."
                  error={errors.sample_work_url}
                  fieldId="sample_work_url"
                >
                  <TextInput
                    type="url"
                    value={form.sample_work_url}
                    onChange={(v) => set("sample_work_url", v)}
                    onBlur={() => handleBlur("sample_work_url")}
                    placeholder="https://"
                    hasError={!!errors.sample_work_url}
                  />
                </Field>
              </FormSection>
            )}

            {/* ── Role-specific: Expert ─────────────────────────────────── */}
            {role === "expert" && (
              <FormSection legend="Your expertise">
                <Field
                  label="Affiliation"
                  hint="Your institution, university, or organisation."
                  error={errors.affiliation}
                  required
                  fieldId="affiliation"
                >
                  <TextInput
                    type="text"
                    value={form.affiliation}
                    onChange={(v) => set("affiliation", v)}
                    placeholder="e.g. Oxford Future of Humanity Institute"
                    hasError={!!errors.affiliation}
                  />
                </Field>

                <Field label="Job title" error={errors.job_title} required fieldId="job_title">
                  <TextInput
                    type="text"
                    value={form.job_title}
                    onChange={(v) => set("job_title", v)}
                    placeholder="e.g. Research Scientist"
                    hasError={!!errors.job_title}
                  />
                </Field>

                <Field
                  label="Credibility link"
                  hint="A Google Scholar page, institutional profile, personal website, or similar."
                  error={errors.credibility_url}
                  fieldId="credibility_url"
                >
                  <TextInput
                    type="url"
                    value={form.credibility_url}
                    onChange={(v) => set("credibility_url", v)}
                    onBlur={() => handleBlur("credibility_url")}
                    placeholder="https://"
                    hasError={!!errors.credibility_url}
                  />
                </Field>

                <Field
                  label="Relevant publication"
                  hint="Link to a paper, article, or piece of work you contributed to that you think is valuable for the AI safety community."
                  error={errors.sample_work_url}
                  fieldId="sample_work_url"
                >
                  <TextInput
                    type="url"
                    value={form.sample_work_url}
                    onChange={(v) => set("sample_work_url", v)}
                    onBlur={() => handleBlur("sample_work_url")}
                    placeholder="https://"
                    hasError={!!errors.sample_work_url}
                  />
                </Field>
              </FormSection>
            )}

            {/* ── Role-specific: Organisation ───────────────────────────── */}
            {role === "organisation" && (
              <FormSection legend="Your organisation">
                <Field
                  label="Organisation name"
                  error={errors.org_name}
                  required
                  fieldId="org_name"
                >
                  <TextInput
                    type="text"
                    value={form.org_name}
                    onChange={(v) => set("org_name", v)}
                    placeholder="e.g. Centre for AI Safety"
                    hasError={!!errors.org_name}
                  />
                </Field>

                <Field label="Organisation size">
                  <SelectInput
                    value={form.org_size}
                    onChange={(v) => set("org_size", v)}
                    hasError={false}
                  >
                    <option value="">Select…</option>
                    <option value="small">Small (1–10 people)</option>
                    <option value="medium">Medium (11–50 people)</option>
                    <option value="large">Large (50+ people)</option>
                  </SelectInput>
                </Field>
              </FormSection>
            )}

            {/* ── Universal bottom section ──────────────────────────────── */}
            {role !== "" && (
              <FormSection legend="A few more things">
                <Field
                  label="How did you find us?"
                >
                  <SelectInput
                    value={form.referral_source}
                    onChange={(v) => set("referral_source", v)}
                    hasError={false}
                  >
                    <option value="">Select…</option>
                    <option value="search_engine">Search engine</option>
                    <option value="social_media">Social media</option>
                    <option value="word_of_mouth">Word of mouth / colleague</option>
                    <option value="newsletter_podcast">Newsletter or podcast</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="other">Other</option>
                  </SelectInput>
                </Field>

                {form.referral_source === "other" && (
                  <Field label="Please specify">
                    <TextInput
                      type="text"
                      value={form.referral_source_other}
                      onChange={(v) => set("referral_source_other", v)}
                      placeholder="e.g. Conference, podcast episode, a friend…"
                      hasError={false}
                    />
                  </Field>
                )}

                <Field
                  label="Anything else you'd like to share?"
                  hint="Any other context that would help us understand your application."
                >
                  <TextareaInput
                    value={form.additional_info}
                    onChange={(v) => set("additional_info", v)}
                    placeholder="Add anything that doesn't fit elsewhere…"
                    rows={3}
                    hasError={false}
                  />
                </Field>
              </FormSection>
            )}

            {/* ── Submit ───────────────────────────────────────────────────── */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 border border-edge bg-card p-5" role="alert" aria-live="polite">
                <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-soft mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-live shrink-0" aria-hidden />
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
                          className="font-serif text-sm text-live hover:underline text-left"
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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-edge pt-8">
              <button
                type="submit"
                disabled={submitting}
                className="font-display uppercase tracking-widest text-sm bg-live text-white px-8 py-4 hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit application"}
              </button>
              <p className="font-mono text-[10px] text-soft leading-relaxed max-w-xs">
                We'll review your application and get back to you by email
                within a few days.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form primitives
// ---------------------------------------------------------------------------

function inputClass(hasError: boolean) {
  return [
    "w-full border bg-card px-4 py-3 font-serif text-sm text-text",
    "focus:outline-none focus:ring-2 focus:ring-live/30 focus:border-live/50",
    "transition-colors placeholder:text-soft/50",
    hasError ? "border-red-400" : "border-edge",
  ].join(" ");
}

function TextInput({
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  hasError,
  autoComplete,
  min,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hasError: boolean;
  autoComplete?: string;
  min?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      autoComplete={autoComplete}
      min={min}
      className={inputClass(hasError)}
    />
  );
}

function TextareaInput({
  value,
  onChange,
  placeholder,
  rows,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows: number;
  hasError: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputClass(hasError)} resize-y`}
    />
  );
}

function SelectInput({
  value,
  onChange,
  hasError,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass(hasError)} cursor-pointer`}
    >
      {children}
    </select>
  );
}

function FormSection({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mb-10">
      <legend className="font-mono text-[9px] tracking-[0.22em] uppercase text-soft border-b border-edge pb-2 mb-6 w-full">
        {legend}
      </legend>
      <div className="flex flex-col gap-5">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  fieldId,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  fieldId?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={fieldId}
      className="flex flex-col gap-1.5"
      data-field-error={error ? true : undefined}
    >
      <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft">
        {label}
        {required && (
          <span className="text-live ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      {hint && (
        <p className="font-serif text-xs text-soft/80 leading-relaxed -mt-0.5 mb-0.5">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="font-mono text-[10px] text-red-600 mt-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
