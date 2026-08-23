import { createClient } from '@supabase/supabase-js'
// Bun natively reads .env.local — no dotenv needed.
//
// Populates the app with realistic-looking demo data: 20 users (5 per
// public-facing role), 25 quote posts, 14 media posts, and 4 fully-fleshed
// briefs (explainer, sources, FAQ, CTAs, coverage, community Q&A). Titles,
// names, and other label-type text are written to sound credible; all
// paragraph-level body copy is genuine lorem ipsum filler — this seeds
// layout/volume for demo purposes, not real editorial content. Safe to
// re-run: users are looked up by email before creating an auth account, and
// each brief's owned rows (sections, FAQ answers, CTAs, coverage, questions)
// are deleted and reinserted every run. Never touches the 3 real accounts
// or the two `test-*` Playwright-fixture briefs already in the database.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

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
function lorem(wordCount: number): string {
  const out: string[] = []
  for (let i = 0; i < wordCount; i++) {
    out.push(LOREM_WORDS[loremCursor % LOREM_WORDS.length])
    loremCursor++
  }
  const text = out.join(' ')
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/[,.]$/, '') + '.'
}

function keytermParagraph(term: string, definition: string, words: number): string {
  const before = lorem(Math.round(words * 0.45))
  const after = lorem(Math.round(words * 0.55))
  return `${before} {{${term}|${definition}}} ${after.charAt(0).toLowerCase()}${after.slice(1)}`
}

// ---------------------------------------------------------------------------
// Formatting helpers matching each section's authoring convention
// (app/briefs/[slug]/{section-content,sources,faq}.tsx)
// ---------------------------------------------------------------------------

function formatTLDR(items: { lead?: string; rest: string }[]): string {
  return items.map((i) => (i.lead ? `**${i.lead}** — ${i.rest}` : i.rest)).join('\n')
}

interface SourceSeed {
  title: string
  description: string
  publisher: string
  url: string
  summary: string
  takeaways: string[]
}

function formatSources(items: SourceSeed[]): string {
  return items
    .map((s) =>
      [
        `• "${s.title}" — ${s.description}`,
        `Publisher: ${s.publisher}`,
        s.url,
        `Summary: ${s.summary}`,
        'Key takeaways:',
        ...s.takeaways.map((t) => `- ${t}`),
      ].join('\n'),
    )
    .join('\n\n')
}

function formatFAQ(items: { q: string; a: string }[]): string {
  return items.map((i) => `Q: ${i.q}\nA: ${i.a}`).join('\n\n')
}

function avatarUrl(seed: string, kind: 'person' | 'org'): string {
  const style = kind === 'org' ? 'identicon' : 'avataaars'
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ---------------------------------------------------------------------------
// Users — 5 per public-facing role, credible names/orgs/publications,
// fictional throughout (no real people, labs, or outlets referenced).
// ---------------------------------------------------------------------------

type Role = 'creator' | 'expert' | 'organisation' | 'journalist'

interface MockUser {
  full_name: string
  email: string
  role: Role
  bio: string
  availability: 'open' | 'limited' | 'unavailable'
  avatar_url: string
  fields: Record<string, unknown>
}

function makeUser(full_name: string, role: Role, availability: MockUser['availability'], fields: Record<string, unknown>): MockUser {
  const slug = slugify(full_name)
  return {
    full_name,
    email: `${slug}@example.com`,
    role,
    bio: lorem(30),
    availability,
    avatar_url: avatarUrl(slug, role === 'organisation' ? 'org' : 'person'),
    fields,
  }
}

const CREATORS: MockUser[] = [
  makeUser('Maya Okonkwo', 'creator', 'open', {
    primary_platform: 'youtube', platform_url: 'https://youtube.com/@mayaokonkwo', audience_size: 184000, content_language: 'en',
  }),
  makeUser('Theo Bergstrom', 'creator', 'limited', {
    primary_platform: 'podcast', platform_url: 'https://signalandnoise.example.com', audience_size: 42000, content_language: 'en',
  }),
  makeUser('Priya Nandakumar', 'creator', 'open', {
    primary_platform: 'tiktok', platform_url: 'https://tiktok.com/@priyaexplains', audience_size: 610000, content_language: 'en',
  }),
  makeUser('Diego Salcedo', 'creator', 'open', {
    primary_platform: 'instagram', platform_url: 'https://instagram.com/diegoexplains', audience_size: 98000, content_language: 'es',
  }),
  makeUser('Freya Lindqvist', 'creator', 'unavailable', {
    primary_platform: 'other', platform_url: 'https://freyalindqvist.example.com', audience_size: 31000, content_language: 'en',
  }),
]

const EXPERTS: MockUser[] = [
  makeUser('Dr. Amara Osei', 'expert', 'open', {
    affiliation: 'Meridian AI Policy Institute', job_title: 'Senior Research Scientist',
    credibility_url: 'https://example.com/people/amara-osei', areas_of_focus: ['AI alignment', 'interpretability'],
  }),
  makeUser('Dr. Wen-Jie Zhao', 'expert', 'limited', {
    affiliation: 'Ashcombe University', job_title: 'Professor of Computer Science',
    credibility_url: 'https://example.com/people/wen-jie-zhao', areas_of_focus: ['machine learning', 'compute governance'],
  }),
  makeUser('Dr. Lior Ben-David', 'expert', 'open', {
    affiliation: 'Foresight Commons', job_title: 'Senior Fellow',
    credibility_url: 'https://example.com/people/lior-ben-david', areas_of_focus: ['AI policy', 'existential risk'],
  }),
  makeUser('Dr. Ingrid Halvorsen', 'expert', 'open', {
    affiliation: 'Clarity Research Collective', job_title: 'Research Lead',
    credibility_url: 'https://example.com/people/ingrid-halvorsen', areas_of_focus: ['algorithmic fairness', 'labor economics'],
  }),
  makeUser('Dr. Tunde Adeyemi', 'expert', 'unavailable', {
    affiliation: 'Okafor Institute of Technology', job_title: 'Associate Professor of Robotics',
    credibility_url: 'https://example.com/people/tunde-adeyemi', areas_of_focus: ['robotics', 'automation'],
  }),
]

const ORGS: MockUser[] = [
  makeUser('Meridian AI Policy Institute', 'organisation', 'open', { org_name: 'Meridian AI Policy Institute', org_size: 'medium', org_mission: lorem(24) }),
  makeUser('Foresight Commons', 'organisation', 'open', { org_name: 'Foresight Commons', org_size: 'small', org_mission: lorem(24) }),
  makeUser('Clarity Research Collective', 'organisation', 'open', { org_name: 'Clarity Research Collective', org_size: 'medium', org_mission: lorem(24) }),
  makeUser('Open Ledger Project', 'organisation', 'limited', { org_name: 'Open Ledger Project', org_size: 'small', org_mission: lorem(24) }),
  makeUser('Lyra Governance Lab', 'organisation', 'open', { org_name: 'Lyra Governance Lab', org_size: 'large', org_mission: lorem(24) }),
]

const JOURNALISTS: MockUser[] = [
  makeUser('Sana Kader', 'journalist', 'open', { publication_name: 'The Signal Weekly', publication_url: 'https://signalweekly.example.com', reporting_beat: 'AI & society' }),
  makeUser('Marcus Webb', 'journalist', 'limited', { publication_name: 'Northline Tech Review', publication_url: 'https://northlinetech.example.com', reporting_beat: 'enterprise AI' }),
  makeUser('Elodie Fontaine', 'journalist', 'open', { publication_name: 'Continuum Magazine', publication_url: 'https://continuummag.example.com', reporting_beat: 'science policy' }),
  makeUser('Kwame Boateng', 'journalist', 'open', { publication_name: 'Ledger & Co', publication_url: 'https://ledgerandco.example.com', reporting_beat: 'tech regulation' }),
  makeUser('Isla MacRae', 'journalist', 'unavailable', { publication_name: 'Open Circuit', publication_url: 'https://opencircuit.example.com', reporting_beat: 'machine learning research' }),
]

const ALL_USERS = [...CREATORS, ...EXPERTS, ...ORGS, ...JOURNALISTS]

// user_affiliations — links 4 of the experts to their matching org account,
// the only cheap way to exercise getEndorsementBarCounts' orgCount.
const AFFILIATIONS: [expert: string, org: string][] = [
  ['Dr. Amara Osei', 'Meridian AI Policy Institute'],
  ['Dr. Lior Ben-David', 'Foresight Commons'],
  ['Dr. Ingrid Halvorsen', 'Clarity Research Collective'],
  ['Dr. Tunde Adeyemi', 'Lyra Governance Lab'],
]

// ---------------------------------------------------------------------------
// Quotes (25) and media posts (14) — content_posts rows. Title is a credible
// short headline (shown prominently on profile cards); body is lorem ipsum.
// ---------------------------------------------------------------------------

interface QuoteSeed { title: string; author: string; tag: string }

const QUOTES: QuoteSeed[] = [
  // alignment (6)
  { title: 'On why reward hacking is easy to miss', author: 'Dr. Amara Osei', tag: 'alignment' },
  { title: 'On the gap between capability and oversight', author: 'Meridian AI Policy Institute', tag: 'alignment' },
  { title: "On what 'solved' would even look like", author: 'Dr. Lior Ben-David', tag: 'alignment' },
  { title: 'On why interpretability research is moving faster than people think', author: 'Foresight Commons', tag: 'alignment' },
  { title: 'On covering the alignment debate responsibly', author: 'Sana Kader', tag: 'alignment' },
  { title: 'On explaining alignment to a general audience', author: 'Maya Okonkwo', tag: 'alignment' },
  // compute (7)
  { title: 'On what scaling laws actually predict', author: 'Dr. Wen-Jie Zhao', tag: 'compute' },
  { title: 'On the real bottleneck behind frontier training runs', author: 'Open Ledger Project', tag: 'compute' },
  { title: 'On measuring compute capacity honestly', author: 'Dr. Amara Osei', tag: 'compute' },
  { title: 'On why export controls changed less than expected', author: 'Clarity Research Collective', tag: 'compute' },
  { title: 'On the cost curve nobody wants to publish', author: 'Marcus Webb', tag: 'compute' },
  { title: 'On making the compute race legible to non-experts', author: 'Theo Bergstrom', tag: 'compute' },
  { title: 'On the energy question behind the compute race', author: 'Lyra Governance Lab', tag: 'compute' },
  // deepfakes (6)
  { title: 'On why detection keeps losing ground', author: 'Dr. Ingrid Halvorsen', tag: 'deepfakes' },
  { title: "On the liar's dividend", author: 'Clarity Research Collective', tag: 'deepfakes' },
  { title: 'On covering a viral deepfake responsibly', author: 'Elodie Fontaine', tag: 'deepfakes' },
  { title: 'On building trust signals into her own work', author: 'Priya Nandakumar', tag: 'deepfakes' },
  { title: 'On why provenance standards move slower than the technology', author: 'Dr. Lior Ben-David', tag: 'deepfakes' },
  { title: "On the platforms that still haven't picked a standard", author: 'Foresight Commons', tag: 'deepfakes' },
  // labor (6)
  { title: 'On the difference between automation and augmentation', author: 'Dr. Tunde Adeyemi', tag: 'labor' },
  { title: 'On who actually captures productivity gains', author: 'Lyra Governance Lab', tag: 'labor' },
  { title: 'On reporting the jobs story without the panic', author: 'Kwame Boateng', tag: 'labor' },
  { title: 'On what reskilling programs get wrong', author: 'Dr. Ingrid Halvorsen', tag: 'labor' },
  { title: 'On the industries already past the tipping point', author: 'Diego Salcedo', tag: 'labor' },
  { title: "On the labor share numbers nobody's watching", author: 'Open Ledger Project', tag: 'labor' },
]

interface MediaSeed { title: string; author: string; post_type: 'video' | 'article' | 'paper' | 'resource'; tag: string }

const MEDIA: MediaSeed[] = [
  // alignment (3)
  { title: 'A good metaphor for outer vs. inner alignment', author: 'Maya Okonkwo', post_type: 'video', tag: 'alignment' },
  { title: 'Inside the interpretability lab racing to open the black box', author: 'Sana Kader', post_type: 'article', tag: 'alignment' },
  { title: 'Reward Hacking in RLHF: An Annotated Reading List', author: 'Dr. Amara Osei', post_type: 'paper', tag: 'alignment' },
  // compute (4)
  { title: 'How a single frontier training run actually gets funded', author: 'Theo Bergstrom', post_type: 'video', tag: 'compute' },
  { title: 'The chip export rule everyone misquotes', author: 'Marcus Webb', post_type: 'article', tag: 'compute' },
  { title: "Compute-Optimal Training: A Practitioner's Guide", author: 'Dr. Wen-Jie Zhao', post_type: 'paper', tag: 'compute' },
  { title: 'Compute Capacity Tracker: Interactive Dashboard', author: 'Open Ledger Project', post_type: 'resource', tag: 'compute' },
  // deepfakes (4)
  { title: 'We made a deepfake in an afternoon — here\'s what it took', author: 'Priya Nandakumar', post_type: 'video', tag: 'deepfakes' },
  { title: 'The newsroom that got fooled for six hours', author: 'Elodie Fontaine', post_type: 'article', tag: 'deepfakes' },
  { title: 'Provenance Standards Compared: C2PA and Beyond', author: 'Dr. Ingrid Halvorsen', post_type: 'paper', tag: 'deepfakes' },
  { title: 'Deepfake Incidents Database', author: 'Clarity Research Collective', post_type: 'resource', tag: 'deepfakes' },
  // labor (3)
  { title: 'A year inside a factory after automation', author: 'Kwame Boateng', post_type: 'video', tag: 'labor' },
  { title: "What reskilling programs get wrong, according to the people who ran them", author: 'Diego Salcedo', post_type: 'article', tag: 'labor' },
  { title: 'Task-Level Automation Exposure: Methodology Notes', author: 'Dr. Tunde Adeyemi', post_type: 'paper', tag: 'labor' },
]

// ---------------------------------------------------------------------------
// Briefs — title/subtitle/subsection-titles/FAQ questions/source titles/CTA
// titles/coverage titles/community questions are all credible; every
// paragraph-level body field is lorem ipsum.
// ---------------------------------------------------------------------------

interface BriefSeed {
  title: string
  slug: string
  subtitle: string
  topic_tag: string
  visibility: 'public' | 'members_only'
  tldr: { lead?: string; rest: string }[]
  explainer: {
    title: string
    term1: string; def1: string
    term2: string; def2: string
  }[]
  sources: SourceSeed[]
  faq: { q: string; a: string }[]
  extraAnswerQuestions: [question: string, authors: string[]][] // extra brief_faq_answers, keyed to an exact faq question
  ctas: { title: string; author: string | null }[]
  coverage: { outlet: string; title: string; score: number }[]
  questions: { text: string; asker: string; answerers: string[] }[]
}

const BRIEFS: BriefSeed[] = [
  {
    title: 'AI Alignment: The Core Problem',
    slug: 'ai-alignment-core-problem',
    subtitle:
      'Getting increasingly capable systems to reliably do what we actually mean — and why that keeps getting harder, not easier.',
    topic_tag: 'alignment',
    visibility: 'public',
    tldr: [
      { lead: 'The core problem', rest: lorem(18) },
      { rest: lorem(20) },
      { lead: 'Where the debate sits', rest: lorem(16) },
    ],
    explainer: [
      {
        title: 'Specification versus generalization',
        term1: 'reward hacking', def1: lorem(15),
        term2: 'outer alignment', def2: lorem(15),
      },
      {
        title: "Why capability and alignment don't scale together",
        term1: 'inner alignment', def1: lorem(15),
        term2: 'scalable oversight', def2: lorem(15),
      },
    ],
    sources: [
      { title: 'Frontier Model Evaluations: 2026 Methodology Report', description: lorem(18), publisher: 'MetaBench Labs', url: 'https://example.com/sources/frontier-evaluations-2026', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Reward Hacking in Reinforcement Learning: A Survey', description: lorem(18), publisher: 'Journal of Machine Learning Safety', url: 'https://example.com/sources/reward-hacking-survey', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Interpretability Benchmarks for Large Language Models', description: lorem(18), publisher: 'Cortex Research', url: 'https://example.com/sources/interpretability-benchmarks', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Scalable Oversight: Where the Research Stands', description: lorem(18), publisher: 'Vantage Policy Group', url: 'https://example.com/sources/scalable-oversight', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Alignment Faking and Deceptive Cooperation: Case Studies', description: lorem(18), publisher: 'Sentinel AI Watch', url: 'https://example.com/sources/alignment-faking-cases', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Compute Thresholds and Evaluation Triggers, Annotated', description: lorem(18), publisher: 'Beacon Institute', url: 'https://example.com/sources/compute-thresholds-annotated', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
    ],
    faq: [
      { q: 'Is AI alignment the same thing as AI safety?', a: lorem(48) },
      { q: "Why can't we just tell the model what we want?", a: lorem(48) },
      { q: 'Has any lab actually solved alignment for a deployed system?', a: lorem(48) },
      { q: 'What would count as evidence the problem is solved?', a: lorem(48) },
    ],
    extraAnswerQuestions: [
      ['Is AI alignment the same thing as AI safety?', ['Dr. Wen-Jie Zhao', 'Foresight Commons']],
      ['Has any lab actually solved alignment for a deployed system?', ['Dr. Lior Ben-David', 'Meridian AI Policy Institute']],
    ],
    ctas: [
      { title: 'Read the full evaluations methodology report', author: 'Meridian AI Policy Institute' },
      { title: 'Watch: what reward hacking looks like in practice', author: 'Dr. Amara Osei' },
      { title: 'Download our alignment terms glossary', author: null },
      { title: 'Subscribe to our AI policy briefing', author: 'Foresight Commons' },
      { title: 'Explore the interpretability benchmark dashboard', author: 'Dr. Amara Osei' },
    ],
    coverage: [
      { outlet: 'The Signal Weekly', title: "Inside the lab trying to make AI 'reward-hack-proof'", score: 8.1 },
      { outlet: 'Northline Tech Review', title: 'Why alignment researchers are worried about scale', score: 7.2 },
      { outlet: 'Continuum Magazine', title: 'The vocabulary of AI safety, explained', score: 6.4 },
      { outlet: 'Ledger & Co', title: 'Regulators are years behind the alignment debate', score: 5.9 },
      { outlet: 'Open Circuit', title: 'Three papers that changed how we think about oversight', score: 8.7 },
    ],
    questions: [
      { text: "If a model passes every eval we throw at it, why wouldn't we trust it?", asker: 'Maya Okonkwo', answerers: ['Dr. Amara Osei', 'Foresight Commons'] },
      { text: "Is 'interpretability' actually catching up to how these models work internally?", asker: 'Sana Kader', answerers: ['Dr. Wen-Jie Zhao'] },
      { text: 'How would we even know if a deployed system was misaligned?', asker: 'Theo Bergstrom', answerers: ['Dr. Lior Ben-David'] },
      { text: 'Do smaller open-source models have the same alignment problems as frontier ones?', asker: 'Diego Salcedo', answerers: ['Meridian AI Policy Institute'] },
    ],
  },
  {
    title: 'The Compute Race: Why AI Models Keep Getting Bigger',
    slug: 'compute-race-ai-scaling',
    subtitle:
      "Why the biggest AI models keep costing more to train than the last one — and who can actually afford to compete.",
    topic_tag: 'compute',
    visibility: 'public',
    tldr: [
      { lead: 'Scaling laws', rest: lorem(18) },
      { lead: "Who's actually racing", rest: lorem(17) },
      { rest: lorem(19) },
    ],
    explainer: [
      {
        title: "What 'scaling' actually buys you",
        term1: 'scaling laws', def1: lorem(15),
        term2: 'compute-optimal training', def2: lorem(15),
      },
      {
        title: 'Chips, export controls, and who gets left behind',
        term1: 'export controls', def1: lorem(15),
        term2: 'compute governance', def2: lorem(15),
      },
    ],
    sources: [
      { title: 'Compute Capacity Tracker, Q2 2026', description: lorem(18), publisher: 'Open Ledger Project', url: 'https://example.com/sources/compute-capacity-tracker-q2', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Scaling Laws for Neural Language Models, Revisited', description: lorem(18), publisher: 'Journal of Machine Learning Safety', url: 'https://example.com/sources/scaling-laws-revisited', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Export Control Rule 2026-14, Annotated', description: lorem(18), publisher: 'Lyra Governance Lab', url: 'https://example.com/sources/export-control-2026-14', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Global GPU Supply Chain: A Mapping Exercise', description: lorem(18), publisher: 'Basalt Daily', url: 'https://example.com/sources/gpu-supply-chain-map', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Training Run Cost Trends, 2019–2026', description: lorem(18), publisher: 'Clarity Research Collective', url: 'https://example.com/sources/training-cost-trends', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Data Center Energy Demand and the Compute Race', description: lorem(18), publisher: 'Northfield Review', url: 'https://example.com/sources/datacenter-energy-demand', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
    ],
    faq: [
      { q: 'Is compute the main bottleneck, or is it data?', a: lorem(48) },
      { q: 'Do export controls actually slow down frontier training runs?', a: lorem(48) },
      { q: 'Why do bigger models keep getting more expensive per point of improvement?', a: lorem(48) },
      { q: 'Could a smaller, cheaper model ever beat a frontier-scale one?', a: lorem(48) },
    ],
    extraAnswerQuestions: [
      ['Do export controls actually slow down frontier training runs?', ['Dr. Wen-Jie Zhao', 'Open Ledger Project']],
      ['Could a smaller, cheaper model ever beat a frontier-scale one?', ['Dr. Amara Osei', 'Clarity Research Collective']],
    ],
    ctas: [
      { title: 'Read the full compute capacity tracker', author: 'Open Ledger Project' },
      { title: 'Watch: how export controls actually work', author: 'Marcus Webb' },
      { title: 'Download the training-run cost dataset', author: null },
      { title: 'Subscribe to our compute governance briefing', author: 'Clarity Research Collective' },
      { title: 'Explore the GPU supply chain map', author: 'Dr. Wen-Jie Zhao' },
    ],
    coverage: [
      { outlet: 'Basalt Daily', title: 'Three charts on who actually has the most compute', score: 9.0 },
      { outlet: 'The Continental Wire', title: 'Inside the chip export loophole nobody closed', score: 8.4 },
      { outlet: 'Northfield Review', title: 'Are we really in an AI arms race?', score: 6.1 },
      { outlet: 'Meridian Standard', title: 'Opinion: the scaling story is more boring than it sounds', score: 5.5 },
      { outlet: 'The Signal Weekly', title: 'What a single frontier training run actually costs', score: 7.8 },
    ],
    questions: [
      { text: 'How much of the compute race is actually about national security?', asker: 'Priya Nandakumar', answerers: ['Dr. Lior Ben-David', 'Lyra Governance Lab'] },
      { text: 'Is there a ceiling to how much bigger these training runs can get?', asker: 'Marcus Webb', answerers: ['Dr. Wen-Jie Zhao'] },
      { text: 'Do export controls hurt researchers more than they hurt frontier labs?', asker: 'Freya Lindqvist', answerers: ['Open Ledger Project'] },
      { text: 'What happens to the compute race if a smaller architecture matches frontier performance?', asker: 'Isla MacRae', answerers: ['Dr. Amara Osei'] },
    ],
  },
  {
    title: 'Deepfakes and the Trust Collapse',
    slug: 'deepfakes-and-the-trust-collapse',
    subtitle: "Synthetic media is now good enough to fool most people, most of the time. Here's what that actually breaks.",
    topic_tag: 'deepfakes',
    visibility: 'public',
    tldr: [
      { lead: 'Detection is losing', rest: lorem(18) },
      { lead: "The liar's dividend", rest: lorem(17) },
      { rest: lorem(19) },
    ],
    explainer: [
      {
        title: 'Why detection is losing the arms race',
        term1: 'synthetic media', def1: lorem(15),
        term2: 'watermarking', def2: lorem(15),
      },
      {
        title: "The 'liar's dividend' problem",
        term1: "liar's dividend", def1: lorem(15),
        term2: 'provenance standards', def2: lorem(15),
      },
    ],
    sources: [
      { title: 'Synthetic Media Detection: State of the Art, 2026', description: lorem(18), publisher: 'Cortex Research', url: 'https://example.com/sources/synthetic-media-detection-2026', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Content Provenance Standards: A Comparison', description: lorem(18), publisher: 'Clarity Research Collective', url: 'https://example.com/sources/provenance-standards-comparison', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: "The Liar's Dividend: How Deepfakes Erode Trust in Real Footage", description: lorem(18), publisher: 'Continuum Magazine', url: 'https://example.com/sources/liars-dividend', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Watermarking Generative Media: Technical Limits', description: lorem(18), publisher: 'MetaBench Labs', url: 'https://example.com/sources/watermarking-technical-limits', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Deepfake Incidents Database, 2023–2026', description: lorem(18), publisher: 'Open Circuit', url: 'https://example.com/sources/deepfake-incidents-database', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Platform Policy Responses to Synthetic Media, Annotated', description: lorem(18), publisher: 'Vantage Policy Group', url: 'https://example.com/sources/platform-policy-responses', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
    ],
    faq: [
      { q: 'Can watermarking actually stop deepfakes from spreading?', a: lorem(48) },
      { q: "What is the 'liar's dividend' and why does it matter?", a: lorem(48) },
      { q: 'How good are humans at spotting deepfakes without help?', a: lorem(48) },
      { q: 'Are provenance standards actually being adopted anywhere yet?', a: lorem(48) },
    ],
    extraAnswerQuestions: [
      ["What is the 'liar's dividend' and why does it matter?", ['Dr. Ingrid Halvorsen', 'Clarity Research Collective']],
      ['Are provenance standards actually being adopted anywhere yet?', ['Dr. Lior Ben-David', 'Foresight Commons']],
    ],
    ctas: [
      { title: 'Read the full provenance standards comparison', author: 'Clarity Research Collective' },
      { title: 'Watch: how a synthetic video is made, step by step', author: 'Priya Nandakumar' },
      { title: 'Download our platform policy tracker', author: null },
      { title: 'Subscribe to our media literacy briefing', author: 'Clarity Research Collective' },
      { title: 'Try the detection tool researchers are testing', author: 'Dr. Ingrid Halvorsen' },
    ],
    coverage: [
      { outlet: 'Continuum Magazine', title: 'The video that fooled a newsroom for six hours', score: 8.9 },
      { outlet: 'Ledger & Co', title: "Why platforms can't agree on a watermarking standard", score: 6.7 },
      { outlet: 'Open Circuit', title: 'Inside the detection arms race', score: 7.5 },
      { outlet: 'Northline Tech Review', title: "What happens when nobody can tell what's real", score: 8.0 },
      { outlet: 'Basalt Daily', title: "Opinion: the liar's dividend is the bigger story", score: 6.2 },
    ],
    questions: [
      { text: 'If detection tools keep losing, is watermarking the only real fix?', asker: 'Elodie Fontaine', answerers: ['Dr. Ingrid Halvorsen', 'Clarity Research Collective'] },
      { text: "Do provenance standards actually work once a video leaves the original platform?", asker: 'Kwame Boateng', answerers: ['Dr. Lior Ben-David'] },
      { text: 'How much of this problem is technical versus just platform incentives?', asker: 'Isla MacRae', answerers: ['Foresight Commons'] },
      { text: 'Should deepfake detection be built into cameras and phones directly?', asker: 'Priya Nandakumar', answerers: ['Dr. Ingrid Halvorsen'] },
    ],
  },
  {
    title: 'AI and the Future of Work: Automation, Augmentation, or Both?',
    slug: 'ai-and-the-future-of-work',
    subtitle: 'The debate over automation, augmentation, and who actually captures the productivity gains.',
    topic_tag: 'labor',
    visibility: 'members_only',
    tldr: [
      { lead: 'Automation vs. augmentation', rest: lorem(18) },
      { lead: 'Who captures the gains', rest: lorem(17) },
      { rest: lorem(19) },
    ],
    explainer: [
      {
        title: 'Automation, augmentation, or both?',
        term1: 'task-level automation', def1: lorem(15),
        term2: 'skill premium', def2: lorem(15),
      },
      {
        title: 'Who captures the productivity gains',
        term1: 'labor share', def1: lorem(15),
        term2: 'reskilling', def2: lorem(15),
      },
    ],
    sources: [
      { title: 'Task-Level Automation Exposure, by Occupation', description: lorem(18), publisher: 'Lyra Governance Lab', url: 'https://example.com/sources/automation-exposure-by-occupation', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Productivity Gains and Wage Growth: A Widening Gap?', description: lorem(18), publisher: 'Meridian Standard', url: 'https://example.com/sources/productivity-wage-gap', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Reskilling Programs: What Actually Works', description: lorem(18), publisher: 'The Signal Weekly', url: 'https://example.com/sources/reskilling-programs-that-work', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'The Skill Premium in the Age of Generative AI', description: lorem(18), publisher: 'Journal of Machine Learning Safety', url: 'https://example.com/sources/skill-premium-generative-ai', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Labor Share of Income, 2015–2026', description: lorem(18), publisher: 'Northfield Review', url: 'https://example.com/sources/labor-share-of-income', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
      { title: 'Occupational Displacement Case Studies, 2024–2026', description: lorem(18), publisher: 'The Continental Wire', url: 'https://example.com/sources/occupational-displacement-cases', summary: lorem(38), takeaways: [lorem(8), lorem(8), lorem(8)] },
    ],
    faq: [
      { q: "Does the evidence support 'AI replaces jobs', or is it more complicated?", a: lorem(48) },
      { q: 'Which occupations are most exposed to task-level automation?', a: lorem(48) },
      { q: 'Do reskilling programs actually help displaced workers?', a: lorem(48) },
      { q: "Why hasn't productivity growth shown up in wages yet?", a: lorem(48) },
    ],
    extraAnswerQuestions: [
      ['Which occupations are most exposed to task-level automation?', ['Dr. Tunde Adeyemi', 'Lyra Governance Lab']],
      ["Why hasn't productivity growth shown up in wages yet?", ['Dr. Ingrid Halvorsen', 'Open Ledger Project']],
    ],
    ctas: [
      { title: 'Read the full occupational exposure dataset', author: 'Lyra Governance Lab' },
      { title: 'Watch: a factory floor a year after automation', author: 'Kwame Boateng' },
      { title: 'Download our reskilling program scorecard', author: null },
      { title: 'Subscribe to our labor economics briefing', author: 'Lyra Governance Lab' },
      { title: 'Explore the labor share interactive chart', author: 'Dr. Tunde Adeyemi' },
    ],
    coverage: [
      { outlet: 'Meridian Standard', title: 'The jobs report nobody wanted to write', score: 7.9 },
      { outlet: 'The Signal Weekly', title: 'Inside a reskilling program that actually worked', score: 8.3 },
      { outlet: 'Northfield Review', title: 'Where did the productivity gains go?', score: 6.8 },
      { outlet: 'The Continental Wire', title: 'Three industries already past the automation tipping point', score: 7.4 },
      { outlet: 'Continuum Magazine', title: 'Opinion: augmentation is a nicer word for the same problem', score: 5.7 },
    ],
    questions: [
      { text: "Is 'augmentation not automation' just a more comfortable framing of the same trend?", asker: 'Diego Salcedo', answerers: ['Dr. Tunde Adeyemi', 'Lyra Governance Lab'] },
      { text: 'How exposed are skilled white-collar jobs compared to manual ones?', asker: 'Sana Kader', answerers: ['Dr. Ingrid Halvorsen'] },
      { text: 'Do any reskilling programs have real long-term outcome data yet?', asker: 'Theo Bergstrom', answerers: ['Open Ledger Project'] },
      { text: 'Who actually captures productivity gains when a task gets automated?', asker: 'Marcus Webb', answerers: ['Dr. Tunde Adeyemi'] },
    ],
  },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function ensureUser(u: MockUser): Promise<string> {
  const { data: existing } = await supabase.from('users').select('id').eq('email', u.email).maybeSingle()
  let id: string
  if (existing) {
    id = existing.id
  } else {
    const { data: authData, error } = await supabase.auth.admin.createUser({ email: u.email, email_confirm: true })
    if (error || !authData.user) throw new Error(`createUser failed for ${u.email}: ${error?.message}`)
    id = authData.user.id
  }
  const { error: upsertError } = await supabase
    .from('users')
    .upsert(
      {
        id,
        email: u.email,
        full_name: u.full_name,
        display_name: u.full_name,
        bio: u.bio,
        avatar_url: u.avatar_url,
        role: u.role,
        availability: u.availability,
        preferred_language: 'en',
        ...u.fields,
      },
      { onConflict: 'id' },
    )
  if (upsertError) throw new Error(`users upsert failed for ${u.email}: ${upsertError.message}`)
  return id
}

async function main() {
  console.log(`Seeding ${ALL_USERS.length} mock users...`)
  const idByName = new Map<string, string>()
  for (const u of ALL_USERS) {
    const id = await ensureUser(u)
    idByName.set(u.full_name, id)
  }
  console.log('✓ Users seeded:', idByName.size)

  // user_affiliations
  await supabase.from('user_affiliations').delete().in(
    'user_id',
    AFFILIATIONS.map(([expert]) => idByName.get(expert)!),
  )
  const affiliationRows = AFFILIATIONS.map(([expert, org]) => ({
    user_id: idByName.get(expert)!,
    organisation_id: idByName.get(org)!,
    is_primary: true,
  }))
  const { error: affError } = await supabase.from('user_affiliations').insert(affiliationRows)
  if (affError) console.error('user_affiliations insert failed:', affError)
  else console.log('✓ Affiliations seeded:', affiliationRows.length)

  // Clear any previously-seeded quotes/media owned by these mock users (idempotent re-run)
  const mockUserIds = ALL_USERS.map((u) => idByName.get(u.full_name)!)
  await supabase.from('content_posts').delete().in('user_id', mockUserIds)

  console.log(`Seeding ${QUOTES.length} quotes...`)
  const quoteRows = QUOTES.map((q) => ({
    user_id: idByName.get(q.author)!,
    post_type: 'quote' as const,
    title: q.title,
    body: lorem(24 + (q.title.length % 12)),
    topic_tags: [q.tag],
  }))
  const { error: quoteError } = await supabase.from('content_posts').insert(quoteRows)
  if (quoteError) throw new Error(`quotes insert failed: ${quoteError.message}`)
  console.log('✓ Quotes seeded:', quoteRows.length)

  console.log(`Seeding ${MEDIA.length} media posts...`)
  const mediaRows = MEDIA.map((m) => ({
    user_id: idByName.get(m.author)!,
    post_type: m.post_type,
    title: m.title,
    body: lorem(40),
    url: `https://example.com/media/${slugify(m.title)}`,
    topic_tags: [m.tag],
  }))
  const { data: insertedMedia, error: mediaError } = await supabase.from('content_posts').insert(mediaRows).select('id, topic_tags')
  if (mediaError || !insertedMedia) throw new Error(`media insert failed: ${mediaError?.message}`)
  console.log('✓ Media seeded:', insertedMedia.length)

  // Pin the first media post per tag as each brief's pinned_media_post_id
  const pinnedByTag = new Map<string, string>()
  for (const m of insertedMedia) {
    const tag = m.topic_tags[0]
    if (tag && !pinnedByTag.has(tag)) pinnedByTag.set(tag, m.id)
  }

  for (const brief of BRIEFS) {
    console.log(`\nSeeding brief: ${brief.title}`)

    const { data: briefRow, error: briefError } = await supabase
      .from('briefs')
      .upsert(
        {
          title: brief.title,
          slug: brief.slug,
          subtitle: brief.subtitle,
          topic_tags: [brief.topic_tag],
          pinned_media_post_id: pinnedByTag.get(brief.topic_tag) ?? null,
          visibility: brief.visibility,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single()
    if (briefError || !briefRow) throw new Error(`brief upsert failed for ${brief.slug}: ${briefError?.message}`)
    const briefId = briefRow.id

    // brief_sections — delete then reinsert, mirroring seed-test-brief.ts
    await supabase.from('brief_sections').delete().eq('brief_id', briefId)

    const explainerParagraphs = brief.explainer.map(
      (s) =>
        keytermParagraph(s.term1, s.def1, 140) + '\n\n' + keytermParagraph(s.term2, s.def2, 140),
    )

    const sectionsToInsert = [
      { brief_id: briefId, section_type: 'tldr' as const, display_order: 1, content: formatTLDR(brief.tldr) },
      ...brief.explainer.map((s, i) => ({
        brief_id: briefId,
        section_type: 'explainer' as const,
        display_order: 2 + i,
        title: s.title,
        content: explainerParagraphs[i],
      })),
      {
        brief_id: briefId,
        section_type: 'going_deeper' as const,
        display_order: 2 + brief.explainer.length,
        content: formatSources(brief.sources),
      },
      {
        brief_id: briefId,
        section_type: 'faq' as const,
        display_order: 3 + brief.explainer.length,
        content: formatFAQ(brief.faq),
      },
    ]
    const { data: insertedSections, error: sectionsError } = await supabase
      .from('brief_sections')
      .insert(sectionsToInsert)
      .select('id, section_type, display_order')
    if (sectionsError || !insertedSections) throw new Error(`sections insert failed for ${brief.slug}: ${sectionsError?.message}`)
    console.log('  ✓ Sections:', insertedSections.length)

    const explainerSectionIds = insertedSections
      .filter((s) => s.section_type === 'explainer')
      .sort((a, b) => a.display_order - b.display_order)
      .map((s) => s.id)

    // brief_faq_answers
    await supabase.from('brief_faq_answers').delete().eq('brief_id', briefId)
    const faqAnswerRows = brief.extraAnswerQuestions.flatMap(([question, authors]) =>
      authors.map((author) => ({
        brief_id: briefId,
        question,
        author_user_id: idByName.get(author)!,
        body: lorem(35),
        status: 'published' as const,
      })),
    )
    if (faqAnswerRows.length > 0) {
      const { error } = await supabase.from('brief_faq_answers').insert(faqAnswerRows)
      if (error) console.error('  brief_faq_answers insert failed:', error)
      else console.log('  ✓ FAQ answers:', faqAnswerRows.length)
    }

    // brief_ctas
    await supabase.from('brief_ctas').delete().eq('brief_id', briefId)
    const ctaRows = brief.ctas.map((c) => ({
      brief_id: briefId,
      author_user_id: c.author ? idByName.get(c.author)! : null,
      title: c.title,
      description: lorem(20),
      link_url: `https://example.com/ctas/${slugify(c.title)}`,
      status: 'published' as const,
    }))
    const { error: ctaError } = await supabase.from('brief_ctas').insert(ctaRows)
    if (ctaError) console.error('  brief_ctas insert failed:', ctaError)
    else console.log('  ✓ CTAs:', ctaRows.length)

    // brief_coverage
    await supabase.from('brief_coverage').delete().eq('brief_id', briefId)
    const submitter = idByName.get(brief.questions[0].asker)!
    const coverageRows = brief.coverage.map((c, i) => ({
      brief_id: briefId,
      outlet_name: c.outlet,
      title: c.title,
      url: `https://example.com/coverage/${slugify(c.outlet)}/${slugify(c.title)}`,
      image_url: `https://picsum.photos/seed/${slugify(brief.slug + '-' + i)}/560/315`,
      published_date: new Date(Date.now() - (i + 1) * 4 * 86400000).toISOString().slice(0, 10),
      score: c.score,
      submitted_by: submitter,
      status: 'published' as const,
    }))
    const { error: coverageError } = await supabase.from('brief_coverage').insert(coverageRows)
    if (coverageError) console.error('  brief_coverage insert failed:', coverageError)
    else console.log('  ✓ Coverage:', coverageRows.length)

    // questions + question_answers (+ a light sprinkle of votes/endorsements)
    await supabase.from('questions').delete().eq('brief_id', briefId)
    for (const q of brief.questions) {
      const { data: questionRow, error: questionError } = await supabase
        .from('questions')
        .insert({ brief_id: briefId, user_id: idByName.get(q.asker)!, question_text: q.text, status: 'approved' as const })
        .select('id')
        .single()
      if (questionError || !questionRow) {
        console.error('  question insert failed:', questionError)
        continue
      }
      const answerRows = q.answerers.map((a) => ({
        question_id: questionRow.id,
        author_user_id: idByName.get(a)!,
        body: lorem(45),
      }))
      const { data: insertedAnswers, error: answerError } = await supabase.from('question_answers').insert(answerRows).select('id')
      if (answerError) console.error('  question_answers insert failed:', answerError)

      // Light vote/endorsement sprinkle on the first question only, from a
      // couple of the brief's own asker/answerer pool — just enough to show
      // the pink/blue vote-split UI isn't empty.
      if (q === brief.questions[0]) {
        const voters = [q.asker, ...q.answerers].map((n) => idByName.get(n)!)
        await supabase.from('question_votes').insert(voters.map((user_id) => ({ question_id: questionRow.id, user_id })))
        if (insertedAnswers && insertedAnswers[0]) {
          await supabase
            .from('question_answer_votes')
            .insert(voters.map((user_id) => ({ answer_id: insertedAnswers[0].id, user_id })))
          await supabase
            .from('question_answer_endorsements')
            .insert({ answer_id: insertedAnswers[0].id, user_id: idByName.get(q.asker)! })
        }
      }
    }
    console.log('  ✓ Questions:', brief.questions.length)

    // brief_contributions — brief-level + per-explainer-section endorsements
    // so the "Reviewed by N experts" bar and subsection badges aren't empty.
    await supabase.from('brief_contributions').delete().eq('brief_id', briefId).is('section_id', null)
    for (const id of explainerSectionIds) {
      await supabase.from('brief_contributions').delete().eq('brief_id', briefId).eq('section_id', id)
    }
    const reviewerPool = brief.questions.flatMap((q) => q.answerers).filter((n, i, arr) => arr.indexOf(n) === i)
    const briefLevelReviewers = reviewerPool.slice(0, 3)
    const { error: contribError } = await supabase.from('brief_contributions').insert(
      briefLevelReviewers.map((name) => ({
        brief_id: briefId,
        user_id: idByName.get(name)!,
        type: 'endorsement' as const,
        status: 'published' as const,
        section_id: null,
        section_version: 1,
      })),
    )
    if (contribError) console.error('  brief-level contributions insert failed:', contribError)

    if (explainerSectionIds[0]) {
      await supabase.from('brief_contributions').insert(
        reviewerPool.slice(0, 2).map((name) => ({
          brief_id: briefId,
          user_id: idByName.get(name)!,
          type: 'endorsement' as const,
          status: 'published' as const,
          section_id: explainerSectionIds[0],
          section_version: 1,
        })),
      )
    }
    if (explainerSectionIds[1] && reviewerPool[2]) {
      await supabase.from('brief_contributions').insert({
        brief_id: briefId,
        user_id: idByName.get(reviewerPool[2])!,
        type: 'review' as const,
        status: 'published' as const,
        section_id: explainerSectionIds[1],
        section_version: 1,
      })
    }
    console.log('  ✓ Contributions seeded')

    console.log(`Navigate to: http://localhost:3000/briefs/${brief.slug}`)
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
