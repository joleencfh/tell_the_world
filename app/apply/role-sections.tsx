"use client";

import { Field, FormSection, SelectInput, TextareaInput, TextInput } from "./form-fields";
import type { Errors, FormValues } from "./validation";

// ---------------------------------------------------------------------------
// Role-specific field sections
// ---------------------------------------------------------------------------

interface SectionProps {
  form: FormValues;
  errors: Errors;
  set: (field: keyof FormValues, value: string) => void;
  handleBlur: (field: keyof FormValues) => void;
}

export function CreatorFields({ form, errors, set, handleBlur }: SectionProps) {
  return (
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
  );
}

export function JournalistFields({ form, errors, set, handleBlur }: SectionProps) {
  return (
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
  );
}

export function ExpertFields({ form, errors, set, handleBlur }: SectionProps) {
  return (
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
  );
}

export function CommsSpecialistFields({ form, errors, set, handleBlur }: SectionProps) {
  return (
    <FormSection legend="Your communications work">
      <Field
        label="Affiliation"
        hint="Where you currently do (or have done) communications work, e.g. an agency, org, or 'Independent'."
        error={errors.affiliation}
        fieldId="affiliation"
      >
        <TextInput
          type="text"
          value={form.affiliation}
          onChange={(v) => set("affiliation", v)}
          placeholder="e.g. Independent, or an org/agency name"
          hasError={!!errors.affiliation}
        />
      </Field>

      <Field label="Job title" error={errors.job_title} fieldId="job_title">
        <TextInput
          type="text"
          value={form.job_title}
          onChange={(v) => set("job_title", v)}
          placeholder="e.g. Communications Lead"
          hasError={!!errors.job_title}
        />
      </Field>

      <Field
        label="Work sample"
        hint="Link to a piece of comms work you're proud of, e.g. a campaign, a piece of messaging, coverage you helped land."
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
  );
}

export function OrganisationFields({ form, errors, set }: Omit<SectionProps, "handleBlur">) {
  return (
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
  );
}

export function ExtrasFields({ form, set }: Pick<SectionProps, "form" | "set">) {
  return (
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
  );
}
