import { cn } from './cn'
import { Icon, type IconName } from './icons'

// Category chip (design-system.md 3.5): post types are told apart by an icon
// and a word, never by hue. The five stock hues the app used retire.

export type PostCategory = 'video' | 'article' | 'paper' | 'quote' | 'resource'

const CATEGORIES: Record<PostCategory, { label: string; icon: IconName }> = {
  video: { label: 'Video', icon: 'video' },
  article: { label: 'Article', icon: 'article' },
  paper: { label: 'Paper', icon: 'paper' },
  quote: { label: 'Quote', icon: 'quote' },
  resource: { label: 'Resource', icon: 'link' },
}

export default function CategoryChip({ category, className }: { category: PostCategory; className?: string }) {
  const c = CATEGORIES[category]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-tag bg-bone px-2 py-0.5 font-mono text-label uppercase text-umber-soft',
        className,
      )}
    >
      <Icon name={c.icon} />
      {c.label}
    </span>
  )
}
