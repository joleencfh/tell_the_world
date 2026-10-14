'use client'

import { useState } from 'react'
import Alert, { type AlertTone } from '@/components/ui/Alert'
import Author from '@/components/ui/Author'
import Avatar, { type AvatarSize } from '@/components/ui/Avatar'
import Button, { type ButtonVariant } from '@/components/ui/Button'
import CategoryChip, { type PostCategory } from '@/components/ui/CategoryChip'
import Checkbox from '@/components/ui/Checkbox'
import ChoiceChips from '@/components/ui/ChoiceChips'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import Field, { SearchInput, Select, TextInput, Textarea } from '@/components/ui/Field'
import FormSection from '@/components/ui/FormSection'
import { Icon } from '@/components/ui/icons'
import LockedPanel from '@/components/ui/LockedPanel'
import Menu from '@/components/ui/Menu'
import Modal from '@/components/ui/Modal'
import RoleLabel from '@/components/ui/RoleLabel'
import Skeleton from '@/components/ui/Skeleton'
import StatusChip from '@/components/ui/StatusChip'
import Tag from '@/components/ui/Tag'
import { useToast } from '@/components/ui/Toast'
import type { UserRole } from '@/lib/types'

const ROLES: UserRole[] = ['creator', 'journalist', 'expert', 'organisation', 'admin', 'comms_specialist', 'other']
const SIZES: AvatarSize[] = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
const VARIANTS: ButtonVariant[] = ['primary', 'rose', 'cobalt', 'secondary', 'ghost', 'danger']
const CATEGORIES: PostCategory[] = ['video', 'article', 'paper', 'quote', 'resource']
const TONES: AlertTone[] = ['info', 'success', 'warning', 'danger']

const SWATCHES = [
  'parchment', 'vellum', 'bone', 'card-rose', 'card-cobalt', 'band-pale', 'band-soft', 'disabled',
  'umber', 'umber-soft', 'field-line', 'rule', 'rose', 'rose-deep', 'rose-wash', 'cobalt', 'cobalt-deep',
  'cobalt-wash', 'brick', 'brick-wash', 'moss', 'moss-wash', 'ochre', 'ochre-wash',
] as const

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-rule py-10">
      <h2 id={id} className="mb-6 font-serif text-section text-umber">
        {title}
      </h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-mono text-label uppercase text-umber-soft">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export default function Showcase() {
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [nestedConfirm, setNestedConfirm] = useState(false)
  const [chip, setChip] = useState<'creator' | 'expert' | 'other'>('creator')
  const [checked, setChecked] = useState(true)
  const [lastMenu, setLastMenu] = useState('none')

  return (
    <div className="min-h-screen bg-parchment font-ui text-umber">
      <main className="mx-auto max-w-content px-5 py-12 md:px-gutter">
        <p className="font-mono text-label uppercase text-umber-soft">Development only</p>
        <h1 className="mt-2 font-serif text-title text-umber">Design system primitives</h1>
        <p className="mt-3 max-w-reading font-serif text-lead text-umber-soft">
          Every shared component in every state. The rules are in docs/design/design-system/design-system.md.
        </p>

        <Section id="colour" title="Colour tokens">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {SWATCHES.map((name) => (
              <div key={name} className="rounded-control bg-vellum p-2 shadow-hairline">
                <div className="h-10 rounded-tag border border-window-line" style={{ background: `var(--color-${name})` }} />
                <p className="mt-1.5 font-mono text-label text-umber-soft">{name}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="type" title="Type">
          <p className="font-serif text-title">Title: who said it, and where they work</p>
          <p className="font-serif text-section">Section heading</p>
          <p className="font-serif text-card-title">Card title for a brief or a member</p>
          <p className="max-w-reading font-serif text-reading">
            Reading text is serif at 19px with a 1.65 line height. It carries long explanations in a brief, so it
            never goes below this size.
          </p>
          <p className="font-ui text-ui">Interface text at 15px: buttons, navigation, form text.</p>
          <p className="font-ui text-ui-sm">Secondary interface text at 14px.</p>
          <p className="font-ui text-caption text-umber-soft">Caption at 13px for meta lines and helper text.</p>
          <p className="font-mono text-label uppercase text-umber-soft">Label at 12px, always uppercase</p>
        </Section>

        <Section id="buttons" title="Button">
          <Row label="Variants">
            {VARIANTS.map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
            <Button variant="secondary" icon aria-label="Close">
              <Icon name="x" />
            </Button>
          </Row>
          <Row label="Small (36px from md up)">
            {VARIANTS.map((v) => (
              <Button key={v} variant={v} small>
                {v}
              </Button>
            ))}
          </Row>
          <Row label="Disabled">
            {VARIANTS.map((v) => (
              <Button key={v} variant={v} disabled>
                {v}
              </Button>
            ))}
          </Row>
          <Row label="Pending">
            <Button pending>Joining…</Button>
            <Button variant="rose" pending>
              Publishing…
            </Button>
          </Row>
        </Section>

        <Section id="fields" title="Form fields">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Full name" hint="As you want it shown.">
              {(p) => <TextInput {...p} placeholder="Jordan Reyes" />}
            </Field>
            <Field label="Email" error="Enter an email address like you@example.com.">
              {(p) => <TextInput {...p} type="email" defaultValue="not-an-email" />}
            </Field>
            <Field label="Affiliation" optional>
              {(p) => <TextInput {...p} />}
            </Field>
            <Field label="Disabled">
              {(p) => <TextInput {...p} disabled defaultValue="Locked while saving" />}
            </Field>
            <Field label="Search">
              {(p) => <SearchInput {...p} placeholder="Search members" />}
            </Field>
            <Field label="Role">
              {(p) => (
                <Select {...p} defaultValue="expert">
                  <option value="creator">Creator</option>
                  <option value="expert">Expert</option>
                  <option value="other">Other</option>
                </Select>
              )}
            </Field>
            <Field label="Anything else?" optional className="md:col-span-2">
              {(p) => <Textarea {...p} rows={3} />}
            </Field>
          </div>
          <Checkbox label="Yes, I’d like to be considered as an early tester." checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <ChoiceChips
            label="I am a"
            value={chip}
            onChange={setChip}
            className="grid-cols-3"
            options={[
              { value: 'creator', label: 'Creator', tone: 'rose' },
              { value: 'expert', label: 'Expert', tone: 'cobalt' },
              { value: 'other', label: 'Other', tone: 'neutral' },
            ]}
          />
          <FormSection legend="About you">
            <Field label="Display name">{(p) => <TextInput {...p} />}</Field>
            <Field label="Short bio" optional>
              {(p) => <Textarea {...p} rows={2} />}
            </Field>
          </FormSection>
        </Section>

        <Section id="identity" title="Identity">
          <Row label="Role labels">
            {ROLES.map((r) => (
              <RoleLabel key={r} role={r} />
            ))}
          </Row>
          <Row label="Avatar sizes (creator)">
            {SIZES.map((s) => (
              <Avatar key={s} name="Jordan Reyes" avatarUrl={null} role="creator" size={s} />
            ))}
          </Row>
          <Row label="Avatar fills by role">
            {ROLES.map((r) => (
              <Avatar key={r} name={r} avatarUrl={null} role={r} size="lg" />
            ))}
          </Row>
          <Row label="Author">
            <Author name="Jordan Reyes" role="creator" affiliation="YouTube, Jordan’s AI Corner" />
            <Author name="Dr Amara Okafor" role="expert" affiliation="Institute for Applied Safety" />
            <Author name="Open Horizon" role="organisation" affiliation="Policy research nonprofit" />
          </Row>
        </Section>

        <Section id="chips" title="Chips and tags">
          <Row label="Status, neutral">
            <StatusChip status="pending" />
            <StatusChip status="approved" />
            <StatusChip status="declined" />
          </Row>
          <Row label="Status, tone (moderation screens only)">
            <StatusChip status="pending" tone="warning" />
            <StatusChip status="approved" tone="success" />
            <StatusChip status="declined" tone="danger" />
          </Row>
          <Row label="Category">
            {CATEGORIES.map((c) => (
              <CategoryChip key={c} category={c} />
            ))}
          </Row>
          <Row label="Tag">
            <Tag>Evaluations</Tag>
            <Tag>Policy</Tag>
          </Row>
        </Section>

        <Section id="feedback" title="Feedback">
          {TONES.map((t) => (
            <Alert key={t} tone={t} lead={t === 'danger' ? 'Could not save.' : undefined}>
              {t === 'danger'
                ? 'Check your connection and try again. Your changes are still here.'
                : `This is the ${t} tone. The text stays umber; the icon carries the colour.`}
            </Alert>
          ))}
          <Row label="Toasts">
            <Button variant="secondary" onClick={() => toast({ tone: 'success', message: 'Quote published.' })}>
              Success toast
            </Button>
            <Button variant="secondary" onClick={() => toast({ tone: 'info', message: 'Draft saved.', action: { label: 'Undo', onClick: () => {} } })}>
              Toast with action
            </Button>
            <Button variant="secondary" onClick={() => toast({ tone: 'danger', message: 'Could not publish. Try again.' })}>
              Error toast
            </Button>
          </Row>
          <EmptyState title="No quotes yet" action={<Button variant="secondary">Add a quote</Button>}>
            Quotes from the people in this brief will show here once they are published.
          </EmptyState>
          <div aria-busy="true" className="flex max-w-sm flex-col gap-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <LockedPanel action={<Button variant="secondary">Join the waitlist</Button>}>
            This brief is for approved members. Join the waitlist and we will email you when there is something to
            see.
          </LockedPanel>
        </Section>

        <Section id="overlays" title="Overlays">
          <Row label="Menu">
            <Menu
              label="Account menu"
              trigger={
                <>
                  <Avatar name="Jordan Reyes" avatarUrl={null} role="creator" size="sm" />
                  <Icon name="chevron-down" />
                </>
              }
              items={[
                { label: 'Your profile', onSelect: () => setLastMenu('profile') },
                { label: 'Settings', onSelect: () => setLastMenu('settings') },
                { label: 'Sign out', destructive: true, onSelect: () => setLastMenu('sign out') },
              ]}
            />
            <span className="text-ui-sm text-umber-soft">
              Last choice: <span data-testid="menu-choice">{lastMenu}</span>
            </span>
          </Row>
          <Row label="Modal and confirm dialog">
            <Button
              onClick={() => {
                setStep(1)
                setModalOpen(true)
              }}
            >
              Open modal
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Delete brief
            </Button>
          </Row>
        </Section>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow={`Step ${step} of 2`}
        title={step === 1 ? 'Tell us who you are' : 'One more thing'}
        focusKey={step}
      >
        <p className="mb-4 text-ui text-umber-soft">
          This is the shared modal shell. Focus is trapped, the page behind is inert, and Escape closes it.
        </p>
        <Field label="Your name">{(p) => <TextInput {...p} />}</Field>
        <div className="mt-6 flex flex-col gap-2">
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>Next</Button>
          ) : (
            <Button onClick={() => setNestedConfirm(true)}>Finish</Button>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this brief?"
        confirmLabel="Delete brief"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          toast({ tone: 'success', message: 'Brief deleted.' })
        }}
      >
        The brief and its quotes are removed for everyone. This cannot be undone.
      </ConfirmDialog>

      <ConfirmDialog
        open={nestedConfirm}
        title="Finish and close?"
        tone="primary"
        confirmLabel="Finish"
        onCancel={() => setNestedConfirm(false)}
        onConfirm={() => {
          setNestedConfirm(false)
          setModalOpen(false)
        }}
      >
        This confirm sits on top of the modal beneath it, to show that Escape closes only the top dialog.
      </ConfirmDialog>
    </div>
  )
}
