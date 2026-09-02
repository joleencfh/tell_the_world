import type { ReactNode } from 'react'
import { DecoratorNode, type LexicalNode, type NodeKey, type SerializedLexicalNode, type Spread } from 'lexical'

// Custom Lexical node for images inserted via the editor's Image toolbar
// button (lib/richtext/editor.tsx) — Lexical has no built-in image node,
// unlike HeadingNode (@lexical/rich-text). exportJSON's shape matches
// lib/richtext/types.ts's RichTextImageNode exactly ({type, url, alt} plus
// Lexical's own version bookkeeping, which parseRichContent's isImageNode
// validator ignores) so the read-only public renderer (render.tsx) — which
// never imports Lexical — can walk it without knowing this class exists.

export type SerializedImageNode = Spread<{ type: 'image'; url: string; alt: string; version: 1 }, SerializedLexicalNode>

export class ImageNode extends DecoratorNode<ReactNode> {
  __url: string
  __alt: string

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__url, node.__alt, node.__key)
  }

  constructor(url: string, alt: string, key?: NodeKey) {
    super(key)
    this.__url = url
    this.__alt = alt
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(serializedNode.url, serializedNode.alt)
  }

  exportJSON(): SerializedImageNode {
    return { type: 'image', url: this.__url, alt: this.__alt, version: 1 }
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'my-2'
    return div
  }

  updateDOM(): false {
    return false
  }

  isInline(): false {
    return false
  }

  decorate(): ReactNode {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={this.__url} alt={this.__alt} className="max-h-64 w-auto border border-line" />
  }
}

export function $createImageNode(url: string, alt: string): ImageNode {
  return new ImageNode(url, alt)
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
