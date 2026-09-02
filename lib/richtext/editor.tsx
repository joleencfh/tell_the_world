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

const TOOLBAR_BUTTON_BASE =
  'px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase border transition-colors'
const TOOLBAR_BUTTON_INACTIVE = 'border-line text-ink-soft hover:border-ink hover:text-ink'
const TOOLBAR_BUTTON_ACTIVE = 'border-ink bg-ink text-paper'

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
    <div className="border-b border-line bg-paper/60 px-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          aria-pressed={isBold}
          title="Bold"
          className={`${TOOLBAR_BUTTON_BASE} ${isBold ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON_INACTIVE}`}
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkInput}
          aria-pressed={activeLinkUrl !== null}
          title="Link"
          className={`${TOOLBAR_BUTTON_BASE} ${activeLinkUrl !== null ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON_INACTIVE}`}
        >
          Link
        </button>
        {allowHeadings && (
          <>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleHeading('h2')}
              aria-pressed={activeHeading === 'h2'}
              title="Section header"
              className={`${TOOLBAR_BUTTON_BASE} ${activeHeading === 'h2' ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON_INACTIVE}`}
            >
              Section
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleHeading('h3')}
              aria-pressed={activeHeading === 'h3'}
              title="Subsection header"
              className={`${TOOLBAR_BUTTON_BASE} ${activeHeading === 'h3' ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON_INACTIVE}`}
            >
              Subsection
            </button>
          </>
        )}
        {allowImages && onUploadImage && (
          <>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelected} className="hidden" />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={openImageInput}
              title="Insert image"
              className={`${TOOLBAR_BUTTON_BASE} ${TOOLBAR_BUTTON_INACTIVE}`}
            >
              Image
            </button>
          </>
        )}
      </div>

      {linkInputOpen && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={linkInputValue}
            onChange={(e) => setLinkInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink() }
              if (e.key === 'Escape') { e.preventDefault(); setLinkInputOpen(false) }
            }}
            placeholder="/briefs/some-brief-slug or https://example.com"
            autoFocus
            className="flex-1 border border-line bg-paper-raised px-2.5 py-1.5 font-mono text-xs text-ink focus:outline-none focus:border-ink"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={applyLink}
            className={`${TOOLBAR_BUTTON_BASE} ${TOOLBAR_BUTTON_INACTIVE}`}
          >
            Apply
          </button>
          {activeLinkUrl !== null && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={removeLink}
              className={`${TOOLBAR_BUTTON_BASE} border-line text-ink-soft hover:border-red-600 hover:text-red-600`}
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setLinkInputOpen(false)}
            className={`${TOOLBAR_BUTTON_BASE} ${TOOLBAR_BUTTON_INACTIVE}`}
          >
            Cancel
          </button>
        </div>
      )}

      {imageInputOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-ink-soft">
            {imageFile ? imageFile.name : 'No file chosen'}
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`${TOOLBAR_BUTTON_BASE} ${TOOLBAR_BUTTON_INACTIVE}`}
          >
            Choose file
          </button>
          <input
            type="text"
            value={imageAltValue}
            onChange={(e) => setImageAltValue(e.target.value)}
            placeholder="Alt text (optional)"
            className="min-w-0 flex-1 border border-line bg-paper-raised px-2.5 py-1.5 font-mono text-xs text-ink focus:outline-none focus:border-ink"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertImage}
            disabled={!imageFile || imageUploading}
            className={`${TOOLBAR_BUTTON_BASE} ${TOOLBAR_BUTTON_INACTIVE} disabled:opacity-40`}
          >
            {imageUploading ? 'Uploading…' : 'Insert'}
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setImageInputOpen(false)}
            className={`${TOOLBAR_BUTTON_BASE} ${TOOLBAR_BUTTON_INACTIVE}`}
          >
            Cancel
          </button>
          {imageError && <span className="font-mono text-[10px] text-red-600">{imageError}</span>}
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
      text: { bold: 'font-semibold text-ink' },
      link: 'text-blue-ink underline decoration-dotted underline-offset-2',
      heading: {
        h2: 'font-display text-[1.3rem] font-extrabold text-ink mt-1',
        h3: 'font-display text-[1.1rem] font-bold text-ink mt-1',
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
      <div className="border border-line bg-paper-raised">
        <ToolbarPlugin allowHeadings={allowHeadings} allowImages={allowImages} onUploadImage={onUploadImage} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-placeholder={placeholder}
                placeholder={
                  <div className="pointer-events-none absolute top-0 left-0 px-3 py-3 font-body text-sm text-ink-soft/60">
                    {placeholder}
                  </div>
                }
                className="min-h-[10rem] px-3 py-3 font-body text-sm text-ink leading-relaxed focus:outline-none"
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
