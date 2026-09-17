import { lorem } from './lorem'
import type { SourceSeed } from './format'

// ---------------------------------------------------------------------------
// Briefs — title/subtitle/subsection-titles/FAQ questions/source titles/CTA
// titles/coverage titles/community questions are all credible; every
// paragraph-level body field is lorem ipsum.
// ---------------------------------------------------------------------------

export interface BriefSeed {
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

export const BRIEFS: BriefSeed[] = [
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
