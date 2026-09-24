// ---------------------------------------------------------------------------
// Lorem ipsum generator — a running cursor over the classic passage so every
// call returns fresh (non-repeating) filler text instead of the same stock
// sentence over and over.
// ---------------------------------------------------------------------------

const LOREM_WORDS =
  `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi consequatur quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur vel illum qui dolorem eum fugiat quo voluptas nulla pariatur at vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident similique sunt in culpa qui officia deserunt mollitia animi id est laborum et dolorum fuga et harum quidem rerum facilis est et expedita distinctio nam libero tempore cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus omnis voluptas assumenda est omnis dolor repellendus`.split(
    ' ',
  )

let loremCursor = 0
export function lorem(wordCount: number): string {
  const out: string[] = []
  for (let i = 0; i < wordCount; i++) {
    out.push(LOREM_WORDS[loremCursor % LOREM_WORDS.length])
    loremCursor++
  }
  const text = out.join(' ')
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/[,.]$/, '') + '.'
}

export function keytermParagraph(term: string, definition: string, words: number): string {
  const before = lorem(Math.round(words * 0.45))
  const after = lorem(Math.round(words * 0.55))
  return `${before} {{${term}|${definition}}} ${after.charAt(0).toLowerCase()}${after.slice(1)}`
}
