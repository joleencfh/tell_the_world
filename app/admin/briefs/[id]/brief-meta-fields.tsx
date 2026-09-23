import type { Brief, MediaPickerOption } from '@/lib/admin/brief-actions'
import { TagInput } from './tag-input'

// ---------------------------------------------------------------------------
// Brief-level metadata fields — title/subtitle/TL;DR teaser, topic tags +
// pinned media (drive the auto Quotes/Media sections), visibility, dashboard
// featured flag, and the Explainer title shown once above its subsections.
// ---------------------------------------------------------------------------

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
      <div className="space-y-1.5">
        <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          className="w-full border border-line bg-paper-raised px-4 py-3 font-body text-lg text-ink focus:outline-none focus:border-ink"
          placeholder="Brief title"
        />
      </div>

      {/* Subtitle */}
      <div className="space-y-1.5">
        <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
          Subtitle
        </label>
        <input
          type="text"
          value={subtitle}
          onChange={e => onSubtitleChange(e.target.value)}
          className="w-full border border-line bg-paper-raised px-4 py-3 font-body text-sm text-ink focus:outline-none focus:border-ink"
          placeholder="One sentence, allowed a point of view"
        />
      </div>

      {/* TL;DR teaser — the one-liner shown under the TL;DR section
          header on the public page, in place of the generic default
          (Part 3 step 1). */}
      <div className="space-y-1.5">
        <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
          TL;DR teaser
        </label>
        <input
          type="text"
          value={tldrTeaser}
          onChange={e => onTldrTeaserChange(e.target.value)}
          className="w-full border border-line bg-paper-raised px-4 py-3 font-body text-sm text-ink focus:outline-none focus:border-ink"
          placeholder="e.g. Three races, conflated constantly — the skim version"
        />
        <p className="font-body text-xs text-ink-soft/70">
          Shown under the TL;DR heading on the public page. Leave blank to fall back to a generic default.
        </p>
      </div>

      {/* Topic tag + pinned media (drive the auto Quotes/Media sections) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
            Topic tags
          </label>
          <TagInput tags={topicTags} onChange={onTopicTagsChange} />
          <p className="font-body text-xs text-ink-soft/70">
            Drives the auto Quotes and Media sections — must match the tags used on content_posts. Enter or comma to add a tag.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
            Pinned media (&quot;Start here&quot;)
          </label>
          <select
            value={pinnedMediaPostId}
            onChange={e => onPinnedMediaPostIdChange(e.target.value)}
            className="w-full border border-line bg-paper-raised px-4 py-3 font-body text-sm text-ink focus:outline-none focus:border-ink"
          >
            <option value="">None</option>
            {mediaOptions.map(option => (
              <option key={option.id} value={option.id}>
                [{option.post_type}] {option.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visibility */}
      <div className="space-y-1.5">
        <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
          Visibility
        </span>
        <div className="flex gap-0">
          <button
            type="button"
            onClick={() => onVisibilityChange('members_only')}
            className={[
              'px-5 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase border transition-colors',
              visibility === 'members_only'
                ? 'border-ink bg-ink text-paper'
                : 'border-line text-ink-soft hover:border-ink hover:text-ink',
            ].join(' ')}
          >
            Members only
          </button>
          <button
            type="button"
            onClick={() => onVisibilityChange('public')}
            className={[
              'px-5 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase border border-l-0 transition-colors',
              visibility === 'public'
                ? 'border-ink bg-ink text-paper'
                : 'border-line text-ink-soft hover:border-ink hover:text-ink',
            ].join(' ')}
          >
            Public
          </button>
        </div>
      </div>

      {/* Dashboard featured — the home dashboard's Highlighted section
          (home-dashboard-part1). At most one brief can be featured at a
          time (partial unique index, migration 057); saveBrief clears
          any other featured brief when this one is turned on. */}
      <div className="space-y-1.5">
        <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
          Dashboard
        </span>
        <div className="flex gap-0">
          <button
            type="button"
            onClick={() => onDashboardFeaturedChange(false)}
            className={[
              'px-5 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase border transition-colors',
              !dashboardFeatured
                ? 'border-ink bg-ink text-paper'
                : 'border-line text-ink-soft hover:border-ink hover:text-ink',
            ].join(' ')}
          >
            Not featured
          </button>
          <button
            type="button"
            onClick={() => onDashboardFeaturedChange(true)}
            className={[
              'px-5 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase border border-l-0 transition-colors',
              dashboardFeatured
                ? 'border-ink bg-ink text-paper'
                : 'border-line text-ink-soft hover:border-ink hover:text-ink',
            ].join(' ')}
          >
            Featured on dashboard
          </button>
        </div>
        <p className="font-body text-xs text-ink-soft/70">
          Shown in the home dashboard&apos;s Highlighted section. Turning this on for this brief turns it off for any other featured brief.
        </p>
      </div>

      {/* Explainer title — shown once above the Explainer's subsections
          on the public page, distinct from the section band's own
          "Explainer" label and from each subsection's title below. */}
      <div className="space-y-1.5">
        <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
          Explainer title
        </label>
        <input
          type="text"
          value={explainerTitle}
          onChange={e => onExplainerTitleChange(e.target.value)}
          className="w-full border border-line bg-paper-raised px-4 py-3 font-body text-base text-ink focus:outline-none focus:border-ink"
          placeholder="e.g. Why the compute race keeps escalating"
        />
        <p className="font-body text-xs text-ink-soft/70">
          Shown once above the Explainer subsections below. Leave blank to show nothing there.
        </p>
      </div>
    </>
  )
}
