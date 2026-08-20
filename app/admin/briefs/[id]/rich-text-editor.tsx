'use client'

import { useCallback, useEffect, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import {
  $findMatchingParent,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  mergeRegister,
  type EditorState,
} from 'lexical'

// Minimal Lexical editor for Explainer subsections (docs/design/brief-feature/
// brief-page-part2-plan.md §2, Part 0b): bold + links + paragraphs only, no
// headings/lists/images — matches the fixed shape lib/richtext/types.ts and
// lib/richtext/render.tsx know how to store/render. Deliberately avoids HTML
// entirely (see the migration's comment for why) — onChange hands the caller
// editorState.toJSON() directly, never an HTML string.

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

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [activeLinkUrl, setActiveLinkUrl] = useState<string | null>(null)
  const [linkInputOpen, setLinkInputOpen] = useState(false)
  const [linkInputValue, setLinkInputValue] = useState('')

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    setIsBold(selection.hasFormat('bold'))
    const linkParent = $findMatchingParent(selection.anchor.getNode(), $isLinkNode)
    setActiveLinkUrl(linkParent ? linkParent.getURL() : null)
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

  return (
    <div className="border-b border-line bg-paper/60 px-3 py-2">
      <div className="flex items-center gap-1.5">
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
    </div>
  )
}

export default function RichTextEditor({
  initialValue,
  onChange,
  placeholder = 'Start writing…',
}: {
  // Seeded once on mount (Lexical's own constraint — see InitialConfigType's
  // editorState doc) — the component must be remounted (e.g. via a `key`
  // prop) to apply a different initial value later.
  initialValue: unknown
  onChange: (json: unknown, plainText: string) => void
  placeholder?: string
}) {
  // Lazy initializer — runs exactly once on mount, matching Lexical's own
  // "read once" contract for initialConfig.editorState (see InitialConfigType's
  // doc comment). A plain useMemo([]) would trigger exhaustive-deps for
  // reading `initialValue` outside its deps array, which is the point: later
  // prop changes must not reset the editor mid-edit.
  const [initialConfig] = useState(() => ({
    namespace: 'ExplainerRichTextEditor',
    nodes: [LinkNode],
    onError(error: Error) {
      console.error('Lexical editor error:', error)
    },
    editorState: initialValue ? JSON.stringify(initialValue) : undefined,
    theme: {
      text: { bold: 'font-semibold text-ink' },
      link: 'text-blue-ink underline decoration-dotted underline-offset-2',
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
        <ToolbarPlugin />
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
