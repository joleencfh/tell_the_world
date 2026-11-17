import type { Brief, MediaPickerOption } from '@/lib/admin/brief-actions'
import Button from '@/components/ui/Button'
import Field, { Select, TextInput } from '@/components/ui/Field'
import { TagInput } from './tag-input'

// ---------------------------------------------------------------------------
// Brief-level metadata fields — title/subtitle/TL;DR teaser, topic tags +
// pinned media (drive the auto Quotes/Media sections), visibility, dashboard
// featured flag, and the Explainer title shown once above its subsections.
// ---------------------------------------------------------------------------

// Label for a group of controls that is not one labelable input (tags, toggles).
const GROUP_LABEL = 'mb-1.5 block font-ui text-caption font-medium text-umber'

export function BriefMetaFields({
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  tldrTeaser,
  onTldrTeaserChange,
  topicTags,
  onTopicTagsChange,
  pinnedMediaPostId,
  onPinnedMediaPostIdChange,
  mediaOptions,
  visibility,
  onVisibilityChange,
  dashboardFeatured,
  onDashboardFeaturedChange,
  explainerTitle,
  onExplainerTitleChange,
}: {
  title: string
  onTitleChange: (value: string) => void
  subtitle: string
  onSubtitleChange: (value: string) => void
  tldrTeaser: string
  onTldrTeaserChange: (value: string) => void
  topicTags: string[]
  onTopicTagsChange: (tags: string[]) => void
  pinnedMediaPostId: string
  onPinnedMediaPostIdChange: (value: string) => void
  mediaOptions: MediaPickerOption[]
  visibility: Brief['visibility']
  onVisibilityChange: (value: Brief['visibility']) => void
  dashboardFeatured: boolean
  onDashboardFeaturedChange: (value: boolean) => void
  explainerTitle: string
  onExplainerTitleChange: (value: string) => void
}) {
  return (
    <>
      {/* Title */}
      <Field label="Title">
        {(p) => (
          <TextInput
            {...p}
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="Brief title"
          />
        )}
      </Field>

      {/* Subtitle */}
      <Field label="Subtitle">
        {(p) => (
          <TextInput
            {...p}
            value={subtitle}
            onChange={e => onSubtitleChange(e.target.value)}
            placeholder="One sentence, allowed a point of view"
          />
        )}
      </Field>

      {/* TL;DR teaser — the one-liner shown under the TL;DR section
          header on the public page, in place of the generic default
          (Part 3 step 1). */}
      <Field
        label="TL;DR teaser"
        hint="Shown under the TL;DR heading on the public page. Leave blank to fall back to a generic default."
      >
        {(p) => (
          <TextInput
            {...p}
            value={tldrTeaser}
            onChange={e => onTldrTeaserChange(e.target.value)}
            placeholder="e.g. Three races, conflated constantly — the skim version"
          />
        )}
      </Field>

      {/* Topic tag + pinned media (drive the auto Quotes/Media sections) */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <span className={GROUP_LABEL}>Topic tags</span>
          <TagInput tags={topicTags} onChange={onTopicTagsChange} />
          <p className="mt-1 font-ui text-caption text-umber-soft">
            Drives the auto Quotes and Media sections — must match the tags used on content_posts. Enter or comma to add a tag.
          </p>
        </div>
        <Field label={'Pinned media ("Start here")'}>
          {(p) => (
            <Select
              {...p}
              value={pinnedMediaPostId}
              onChange={e => onPinnedMediaPostIdChange(e.target.value)}
            >
              <option value="">None</option>
              {mediaOptions.map(option => (
                <option key={option.id} value={option.id}>
                  [{option.post_type}] {option.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      {/* Visibility: two-state control kept as two buttons (not radios) so the
          accessible names and roles stay as they were; aria-pressed adds state. */}
      <div role="group" aria-labelledby="brief-visibility-label">
        <span id="brief-visibility-label" className={GROUP_LABEL}>
          Visibility
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={visibility === 'members_only' ? 'primary' : 'secondary'}
            aria-pressed={visibility === 'members_only'}
            onClick={() => onVisibilityChange('members_only')}
          >
            Members only
          </Button>
          <Button
            variant={visibility === 'public' ? 'primary' : 'secondary'}
            aria-pressed={visibility === 'public'}
            onClick={() => onVisibilityChange('public')}
          >
            Public
          </Button>
        </div>
      </div>

      {/* Dashboard featured — the home dashboard's Highlighted section
          (home-dashboard-part1). At most one brief can be featured at a
          time (partial unique index, migration 057); saveBrief clears
          any other featured brief when this one is turned on. */}
      <div role="group" aria-labelledby="brief-dashboard-label">
        <span id="brief-dashboard-label" className={GROUP_LABEL}>
          Dashboard
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!dashboardFeatured ? 'primary' : 'secondary'}
            aria-pressed={!dashboardFeatured}
            onClick={() => onDashboardFeaturedChange(false)}
          >
            Not featured
          </Button>
          <Button
            variant={dashboardFeatured ? 'primary' : 'secondary'}
            aria-pressed={dashboardFeatured}
            onClick={() => onDashboardFeaturedChange(true)}
          >
            Featured on dashboard
          </Button>
        </div>
        <p className="mt-1 font-ui text-caption text-umber-soft">
          Shown in the home dashboard&apos;s Highlighted section. Turning this on for this brief turns it off for any other featured brief.
        </p>
      </div>

      {/* Explainer title — shown once above the Explainer's subsections
          on the public page, distinct from the section band's own
          "Explainer" label and from each subsection's title below. */}
      <Field
        label="Explainer title"
        hint="Shown once above the Explainer subsections below. Leave blank to show nothing there."
      >
        {(p) => (
          <TextInput
            {...p}
            value={explainerTitle}
            onChange={e => onExplainerTitleChange(e.target.value)}
            placeholder="e.g. Why the compute race keeps escalating"
          />
        )}
      </Field>
    </>
  )
}
