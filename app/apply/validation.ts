import type { ApplicationInput } from "@/lib/applications/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Mirrors the server action's input shape exactly, so the two never drift —
// see lib/applications/actions.ts for the full field list and the note that
// the server re-validates everything (this form's validation is UX only).
export type FormValues = ApplicationInput;

export type Role = "creator" | "expert" | "organisation" | "journalist" | "comms_specialist" | "other";

export type Errors = Partial<Record<keyof FormValues, string>>;

export const EMPTY: FormValues = {
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

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUrl(value: string): boolean {
  if (!value.trim()) return true; // Empty is fine — required check handles that separately
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const URL_ERROR = "Please enter a valid URL (e.g. https://example.com)";
export const EMAIL_ERROR = "Please enter a valid email address";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validate(f: FormValues): Errors {
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
export const ERROR_LABELS: Partial<Record<keyof FormValues, string>> = {
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
