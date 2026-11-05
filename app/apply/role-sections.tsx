"use client";

import Field, { Select, Textarea, TextInput } from "@/components/ui/Field";
import FormSection from "@/components/ui/FormSection";
import type { Errors, FormValues } from "./validation";

// ---------------------------------------------------------------------------
// Role-specific field sections. Required fields are unmarked; optional ones
// say "(Optional)" (design-system.md 3.2). `id` is the form key, so the error
// summary can scroll to and focus the control.
// ---------------------------------------------------------------------------

interface SectionProps {
  form: FormValues;
  errors: Errors;
  set: (field: keyof FormValues, value: string) => void;
  handleBlur: (field: keyof FormValues) => void;
}

type Bind = (field: keyof FormValues) => {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>) => void;
};

function binder(form: FormValues, set: SectionProps["set"]): Bind {
  return (field) => ({
    value: form[field] as string,
    onChange: (e) => set(field, e.target.value),
  });
}

export function CreatorFields({ form, errors, set, handleBlur }: SectionProps) {
  const bind = binder(form, set);
  return (
    <FormSection legend="Your content">
      <Field
        id="primary_platform"
        label="Primary platform"
        hint="Where is most of your content published?"
        error={errors.primary_platform}
      >
        {(p) => (
          <Select {...p} {...bind("primary_platform")}>
            <option value="">Select a platform…</option>
            <option value="youtube">YouTube</option>
            <option value="podcast">Podcast</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="newsletter">Newsletter</option>
            <option value="other">Other</option>
          </Select>
        )}
      </Field>

      {form.primary_platform === "other" && (
        <Field id="primary_platform_other" label="Please specify your platform" error={errors.primary_platform_other}>
          {(p) => <TextInput {...p} {...bind("primary_platform_other")} placeholder="e.g. Substack, Twitch, blog…" />}
        </Field>
      )}

      <Field id="platform_url" label="Channel / profile URL" error={errors.platform_url}>
        {(p) => (
          <TextInput
            {...p}
            {...bind("platform_url")}
            type="url"
            onBlur={() => handleBlur("platform_url")}
            placeholder="https://"
          />
        )}
      </Field>

      <Field
        label="Audience size"
        optional
        hint="Approximate total subscribers or followers across your main platform."
      >
        {(p) => <TextInput {...p} {...bind("audience_size")} type="number" min="0" placeholder="e.g. 50000" />}
      </Field>

      <Field label="Content language" optional hint="The primary language your content is in.">
        {(p) => <TextInput {...p} {...bind("content_language")} placeholder="e.g. English, Spanish" />}
      </Field>

      <Field
        id="sample_work_url"
        label="Work sample"
        optional
        hint="Link to a piece of your content relevant to AI safety, or one you're proud of and think would resonate with an audience interested in it."
        error={errors.sample_work_url}
      >
        {(p) => (
          <TextInput
            {...p}
            {...bind("sample_work_url")}
            type="url"
            onBlur={() => handleBlur("sample_work_url")}
            placeholder="https://"
          />
        )}
      </Field>
    </FormSection>
  );
}

export function JournalistFields({ form, errors, set, handleBlur }: SectionProps) {
  const bind = binder(form, set);
  return (
    <FormSection legend="Your journalism">
      <Field id="publication_name" label="Publication name" error={errors.publication_name}>
        {(p) => <TextInput {...p} {...bind("publication_name")} placeholder="e.g. MIT Technology Review" />}
      </Field>

      <Field id="publication_url" label="Publication URL" optional error={errors.publication_url}>
        {(p) => (
          <TextInput
            {...p}
            {...bind("publication_url")}
            type="url"
            onBlur={() => handleBlur("publication_url")}
            placeholder="https://"
          />
        )}
      </Field>

      <Field label="Reporting beat" optional hint="What topics do you primarily cover?">
        {(p) => <TextInput {...p} {...bind("reporting_beat")} placeholder="e.g. AI and emerging technology" />}
      </Field>

      <Field label="Language you write in" optional hint="The primary language of your journalism.">
        {(p) => <TextInput {...p} {...bind("content_language")} placeholder="e.g. English, Italian" />}
      </Field>

      <Field
        id="sample_work_url"
        label="Article sample"
        optional
        hint="Link to a published article relevant to AI safety, or one that showcases the kind of work you'd like to do on this platform."
        error={errors.sample_work_url}
      >
        {(p) => (
          <TextInput
            {...p}
            {...bind("sample_work_url")}
            type="url"
            onBlur={() => handleBlur("sample_work_url")}
            placeholder="https://"
          />
        )}
      </Field>
    </FormSection>
  );
}

export function ExpertFields({ form, errors, set, handleBlur }: SectionProps) {
  const bind = binder(form, set);
  return (
    <FormSection legend="Your expertise">
      <Field
        id="affiliation"
        label="Affiliation"
        hint="Your institution, university, or organisation."
        error={errors.affiliation}
      >
        {(p) => <TextInput {...p} {...bind("affiliation")} placeholder="e.g. Oxford Future of Humanity Institute" />}
      </Field>

      <Field id="job_title" label="Job title" error={errors.job_title}>
        {(p) => <TextInput {...p} {...bind("job_title")} placeholder="e.g. Research Scientist" />}
      </Field>

      <Field
        id="credibility_url"
        label="Credibility link"
        optional
        hint="A Google Scholar page, institutional profile, personal website, or similar."
        error={errors.credibility_url}
      >
        {(p) => (
          <TextInput
            {...p}
            {...bind("credibility_url")}
            type="url"
            onBlur={() => handleBlur("credibility_url")}
            placeholder="https://"
          />
        )}
      </Field>

      <Field
        id="sample_work_url"
        label="Relevant publication"
        optional
        hint="Link to a paper, article, or piece of work you contributed to that you think is valuable for the AI safety community."
        error={errors.sample_work_url}
      >
        {(p) => (
          <TextInput
            {...p}
            {...bind("sample_work_url")}
            type="url"
            onBlur={() => handleBlur("sample_work_url")}
            placeholder="https://"
          />
        )}
      </Field>
    </FormSection>
  );
}

export function CommsSpecialistFields({ form, errors, set, handleBlur }: SectionProps) {
  const bind = binder(form, set);
  return (
    <FormSection legend="Your communications work">
      <Field
        id="affiliation"
        label="Affiliation"
        optional
        hint="Where you currently do (or have done) communications work, e.g. an agency, org, or 'Independent'."
        error={errors.affiliation}
      >
        {(p) => (
          <TextInput {...p} {...bind("affiliation")} placeholder="e.g. Independent, or an org/agency name" />
        )}
      </Field>

      <Field id="job_title" label="Job title" optional error={errors.job_title}>
        {(p) => <TextInput {...p} {...bind("job_title")} placeholder="e.g. Communications Lead" />}
      </Field>

      <Field
        id="sample_work_url"
        label="Work sample"
        optional
        hint="Link to a piece of comms work you're proud of, e.g. a campaign, a piece of messaging, coverage you helped land."
        error={errors.sample_work_url}
      >
        {(p) => (
          <TextInput
            {...p}
            {...bind("sample_work_url")}
            type="url"
            onBlur={() => handleBlur("sample_work_url")}
            placeholder="https://"
          />
        )}
      </Field>
    </FormSection>
  );
}

export function OrganisationFields({ form, errors, set }: Omit<SectionProps, "handleBlur">) {
  const bind = binder(form, set);
  return (
    <FormSection legend="Your organisation">
      <Field id="org_name" label="Organisation name" error={errors.org_name}>
        {(p) => <TextInput {...p} {...bind("org_name")} placeholder="e.g. Centre for AI Safety" />}
      </Field>

      <Field label="Organisation size" optional>
        {(p) => (
          <Select {...p} {...bind("org_size")}>
            <option value="">Select…</option>
            <option value="small">Small (1–10 people)</option>
            <option value="medium">Medium (11–50 people)</option>
            <option value="large">Large (50+ people)</option>
          </Select>
        )}
      </Field>
    </FormSection>
  );
}

export function ExtrasFields({ form, set }: Pick<SectionProps, "form" | "set">) {
  const bind = binder(form, set);
  return (
    <FormSection legend="A few more things">
      <Field label="How did you find us?" optional>
        {(p) => (
          <Select {...p} {...bind("referral_source")}>
            <option value="">Select…</option>
            <option value="search_engine">Search engine</option>
            <option value="social_media">Social media</option>
            <option value="word_of_mouth">Word of mouth / colleague</option>
            <option value="newsletter_podcast">Newsletter or podcast</option>
            <option value="linkedin">LinkedIn</option>
            <option value="other">Other</option>
          </Select>
        )}
      </Field>

      {form.referral_source === "other" && (
        <Field label="Please specify" optional>
          {(p) => (
            <TextInput
              {...p}
              {...bind("referral_source_other")}
              placeholder="e.g. Conference, podcast episode, a friend…"
            />
          )}
        </Field>
      )}

      <Field
        label="Anything else you'd like to share?"
        optional
        hint="Any other context that would help us understand your application."
      >
        {(p) => (
          <Textarea
            {...p}
            {...bind("additional_info")}
            rows={3}
            placeholder="Add anything that doesn't fit elsewhere…"
          />
        )}
      </Field>
    </FormSection>
  );
}
