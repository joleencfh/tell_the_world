'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $createHeadingNode, $isHeadingNode, HeadingNode, type HeadingTagType } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import {
  $createParagraphNode,
  $findMatchingParent,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  mergeRegister,
  type EditorState,
} from 'lexical'
import Button from '@/components/ui/Button'
import Field, { FieldError, TextInput } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { $createImageNode, ImageNode } from './image-node'

// Minimal Lexical editor, originally built for Explainer subsections
// (docs/design/brief-feature/brief-page-part2-plan.md §2, Part 0b) and
// reused as-is for FAQ answer authoring (Part 6, both the primary answer's
// admin-set override and expert-submitted "More answers"): bold + links +
// paragraphs, matching the fixed shape lib/richtext/types.ts and
// lib/richtext/render.tsx know how to store/render. Deliberately avoids
// HTML entirely (see migration 033's comment for why) — onChange hands the
// caller editorState.toJSON() directly, never an HTML string.
//
// Headings and images (2026-09-02) are opt-in via allowHeadings/allowImages
// rather than always-on: this same editor also authors FAQ answers, which
// haven't been asked to carry either, so the toolbar only grows for callers
// that pass the prop (currently just the Explainer subsection editor,
// section-editor.tsx). Images additionally need onUploadImage since the
// editor itself has no network access — the caller supplies how a picked
// File becomes a hosted URL (uploadExplainerImage, lib/admin/brief-actions.ts).

// A relative path (/briefs/some-slug) is treated as internal by the renderer;
// anything else must be a well-formed http(s) URL. Rejects garbage input at
// the point of creation rather than only at render time.
function isValidLinkUrl(url: string): boolean {
  if (url.startsWith('/')) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Image glyph: components/ui/icons.tsx has no image icon and this file adds no
// dependency, so it is drawn here in the same 1.5px style.
function ImageGlyph() {
  return (
    <svg width={20} height={20} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="2.5" y="3" width="11" height="10" rx="1" />
      <circle cx="6" cy="6.5" r="1" />
      <path d="M3 12l3.5-3.5 2.5 2.5 1.5-1.5L13 12" />
    </svg>
  )
}

// Icon button for the toolbar. The mouse-down guard keeps the editor
// selection while the button is clicked; title and aria-label share one string.
function ToolbarButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      variant={pressed ? 'primary' : 'secondary'}
      icon
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function FormButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Button small variant="secondary" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {children}
    </Button>
  )
}

function ToolbarPlugin({
  allowHeadings,
  allowImages,
  onUploadImage,
}: {
  allowHeadings: boolean
  allowImages: boolean
  onUploadImage?: (file: File) => Promise<string | null>
}) {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [activeHeading, setActiveHeading] = useState<HeadingTagType | null>(null)
  const [activeLinkUrl, setActiveLinkUrl] = useState<string | null>(null)
  const [linkInputOpen, setLinkInputOpen] = useState(false)
  const [linkInputValue, setLinkInputValue] = useState('')
  const [imageInputOpen, setImageInputOpen] = useState(false)
  const [imageAltValue, setImageAltValue] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    setIsBold(selection.hasFormat('bold'))
    const linkParent = $findMatchingParent(selection.anchor.getNode(), $isLinkNode)
    setActiveLinkUrl(linkParent ? linkParent.getURL() : null)
    const headingParent = $findMatchingParent(selection.anchor.getNode(), $isHeadingNode)
    setActiveHeading(headingParent && $isHeadingNode(headingParent) ? headingParent.getTag() : null)
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateToolbar())
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateToolbar])

  function openLinkInput() {
    setLinkInputValue(activeLinkUrl ?? '')
    setLinkInputOpen(true)
  }

  function applyLink() {
    const url = linkInputValue.trim()
    if (url && isValidLinkUrl(url)) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
    }
    setLinkInputOpen(false)
  }

  function removeLink() {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    setLinkInputOpen(false)
  }

  function toggleHeading(tag: HeadingTagType) {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      if (activeHeading === tag) {
        $setBlocksType(selection, () => $createParagraphNode())
      } else {
        $setBlocksType(selection, () => $createHeadingNode(tag))
      }
    })
  }

  function openImageInput() {
    setImageError(null)
    setImageFile(null)
    setImageAltValue('')
    setImageInputOpen(true)
    fileInputRef.current?.click()
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    e.target.value = ''
  }

  async function insertImage() {
    if (!imageFile || !onUploadImage) return
    setImageUploading(true)
    setImageError(null)
    const url = await onUploadImage(imageFile)
    setImageUploading(false)
    if (!url) {
      setImageError('Upload failed. Try a different image.')
      return
    }
    editor.update(() => {
      $insertNodes([$createImageNode(url, imageAltValue.trim())])
    })
    setImageInputOpen(false)
    setImageFile(null)
    setImageAltValue('')
  }

  return (
    <div className="border-b border-window-line bg-bone px-3 py-2">
      <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-1.5">
        <ToolbarButton label="Bold" pressed={isBold} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}>
          <span aria-hidden="true" className="font-ui text-ui font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton label="Link" pressed={activeLinkUrl !== null} onClick={openLinkInput}>
          <Icon name="link" size={20} />
        </ToolbarButton>
        {allowHeadings && (
          <>
            <ToolbarButton label="Section header" pressed={activeHeading === 'h2'} onClick={() => toggleHeading('h2')}>
              <span aria-hidden="true" className="font-ui text-ui font-semibold">H2</span>
            </ToolbarButton>
            <ToolbarButton label="Subsection header" pressed={activeHeading === 'h3'} onClick={() => toggleHeading('h3')}>
              <span aria-hidden="true" className="font-ui text-ui font-semibold">H3</span>
            </ToolbarButton>
          </>
        )}
        {allowImages && onUploadImage && (
          <>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelected} className="hidden" />
            <ToolbarButton label="Insert image" onClick={openImageInput}>
              <ImageGlyph />
            </ToolbarButton>
          </>
        )}
      </div>

      {linkInputOpen && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <Field label="Link address" className="min-w-0 flex-1">
            {(p) => (
              <TextInput
                {...p}
                value={linkInputValue}
                onChange={(e) => setLinkInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); applyLink() }
                  if (e.key === 'Escape') { e.preventDefault(); setLinkInputOpen(false) }
                }}
                placeholder="/briefs/some-brief-slug or https://example.com"
                autoFocus
              />
            )}
          </Field>
          <FormButton onClick={applyLink}>Apply</FormButton>
          {activeLinkUrl !== null && <FormButton onClick={removeLink}>Remove</FormButton>}
          <FormButton onClick={() => setLinkInputOpen(false)}>Cancel</FormButton>
        </div>
      )}

      {imageInputOpen && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <span className="self-center font-ui text-caption text-umber-soft">
            {imageFile ? imageFile.name : 'No file chosen'}
          </span>
          <FormButton onClick={() => fileInputRef.current?.click()}>Choose file</FormButton>
          <Field label="Alt text" optional className="min-w-0 flex-1">
            {(p) => (
              <TextInput
                {...p}
                value={imageAltValue}
                onChange={(e) => setImageAltValue(e.target.value)}
                placeholder="Alt text (optional)"
              />
            )}
          </Field>
          <FormButton onClick={insertImage} disabled={!imageFile || imageUploading}>
            {imageUploading ? 'Uploading…' : 'Insert'}
          </FormButton>
          <FormButton onClick={() => setImageInputOpen(false)}>Cancel</FormButton>
          {imageError && <FieldError>{imageError}</FieldError>}
        </div>
      )}
    </div>
  )
}

export default function RichTextEditor({
  initialValue,
  onChange,
  placeholder = 'Start writing…',
  allowHeadings = false,
  allowImages = false,
  onUploadImage,
}: {
  // Seeded once on mount (Lexical's own constraint — see InitialConfigType's
  // editorState doc) — the component must be remounted (e.g. via a `key`
  // prop) to apply a different initial value later.
  initialValue: unknown
  onChange: (json: unknown, plainText: string) => void
  placeholder?: string
  allowHeadings?: boolean
  allowImages?: boolean
  onUploadImage?: (file: File) => Promise<string | null>
}) {
  // Lazy initializer — runs exactly once on mount, matching Lexical's own
  // "read once" contract for initialConfig.editorState (see InitialConfigType's
  // doc comment). A plain useMemo([]) would trigger exhaustive-deps for
  // reading `initialValue` outside its deps array, which is the point: later
  // prop changes must not reset the editor mid-edit.
  const [initialConfig] = useState(() => ({
    namespace: 'ExplainerRichTextEditor',
    nodes: [LinkNode, HeadingNode, ImageNode],
    onError(error: Error) {
      console.error('Lexical editor error:', error)
    },
    editorState: initialValue ? JSON.stringify(initialValue) : undefined,
    theme: {
      text: { bold: 'font-semibold text-umber' },
      link: 'text-cobalt underline underline-offset-2',
      heading: {
        h2: 'font-serif text-section text-umber mt-1',
        h3: 'font-serif text-card-title text-umber mt-1',
      },
    },
  }))

  function handleChange(editorState: EditorState) {
    const json = editorState.toJSON()
    const plainText = editorState.read(() => $getRoot().getTextContent())
    onChange(json, plainText)
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div data-testid="richtext-editor" className="rounded-control border border-field-line bg-vellum focus-within:border-umber focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-umber">
        <ToolbarPlugin allowHeadings={allowHeadings} allowImages={allowImages} onUploadImage={onUploadImage} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-placeholder={placeholder}
                placeholder={
                  <div className="pointer-events-none absolute top-0 left-0 px-3 py-3 font-serif text-reading text-umber-soft">
                    {placeholder}
                  </div>
                }
                className="min-h-[10rem] max-w-reading px-3 py-3 font-serif text-reading text-umber focus:outline-none"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <LinkPlugin validateUrl={isValidLinkUrl} />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      </div>
    </LexicalComposer>
  )
}
