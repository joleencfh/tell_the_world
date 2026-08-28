// Starter glossary for the deterministic clarity check (lib/clarity/check.ts).
// Illustrative only — expected to be reviewed and expanded before this is
// considered a complete list. Each entry's `patterns` are matched
// case-insensitively with word-boundary-aware matching (see check.ts), so
// list every common surface form (including ones ending in punctuation,
// e.g. "p(doom)") rather than relying on stemming.

export interface GlossaryTerm {
  /** Stable slug, stored in content_posts.flagged_terms — never shown raw. */
  id: string
  /** Literal surface forms to match against submitted text. */
  patterns: string[]
  /** Canonical display form. */
  label: string
  /** One-sentence plain-language definition. */
  explanation: string
  /** Optional plain-language rewrite an author could use instead. */
  suggestion?: string
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    id: 'x-risk',
    patterns: ['x-risk', 'xrisk', 'existential risk'],
    label: 'x-risk',
    explanation:
      'A risk of an event that could permanently and drastically curtail humanity’s potential — e.g. extinction or unrecoverable collapse.',
    suggestion: 'catastrophic risk to humanity’s future',
  },
  {
    id: 'p-doom',
    patterns: ['p(doom)', 'p doom'],
    label: 'p(doom)',
    explanation:
      'Shorthand for someone’s estimated probability that AI causes human extinction or a similarly catastrophic outcome.',
    suggestion: 'estimated probability of AI catastrophe',
  },
  {
    id: 'ai-alignment',
    patterns: ['AI alignment', 'aligned AI'],
    label: 'AI alignment',
    explanation:
      'The work of making an AI system pursue the goals its designers actually intend, rather than something else.',
    suggestion: 'making AI systems do what we actually want',
  },
  {
    id: 'mesa-optimizer',
    patterns: ['mesa-optimizer', 'mesa optimizer', 'mesa-optimization'],
    label: 'mesa-optimizer',
    explanation:
      'A learned goal-seeking process that emerges inside a trained AI model, which may pursue a different objective than the one it was trained on.',
    suggestion: 'a hidden goal-seeking process that emerges inside a trained model',
  },
  {
    id: 'instrumental-convergence',
    patterns: ['instrumental convergence'],
    label: 'instrumental convergence',
    explanation:
      'The idea that sufficiently capable goal-pursuing systems tend to adopt similar sub-goals, like self-preservation or resource acquisition, regardless of their ultimate goal.',
    suggestion: 'the tendency of goal-driven systems to seek power and self-preservation as a means to almost any end',
  },
  {
    id: 'longtermism',
    patterns: ['longtermism', 'longtermist'],
    label: 'longtermism',
    explanation: 'The view that positively influencing the long-term future is a key moral priority.',
    suggestion: 'the view that future generations matter morally',
  },
  {
    id: 'counterfactual-impact',
    patterns: ['counterfactual impact'],
    label: 'counterfactual impact',
    explanation:
      'What would have happened anyway, absent your action — used to measure the real difference an intervention made.',
    suggestion: 'the extra difference made, beyond what would have happened anyway',
  },
  {
    id: 'transformative-ai',
    patterns: ['transformative AI', 'TAI'],
    label: 'transformative AI (TAI)',
    explanation: 'AI capable of triggering societal change as significant as the Industrial Revolution.',
    suggestion: 'AI powerful enough to reshape society',
  },
]
