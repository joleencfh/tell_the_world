// ---------------------------------------------------------------------------
// Quotes (25) and media posts (14) — content_posts rows. Title is a credible
// short headline (shown prominently on profile cards); body is lorem ipsum.
// ---------------------------------------------------------------------------

export interface QuoteSeed { title: string; author: string; tag: string }

export const QUOTES: QuoteSeed[] = [
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

export interface MediaSeed { title: string; author: string; post_type: 'video' | 'article' | 'paper' | 'resource'; tag: string }

export const MEDIA: MediaSeed[] = [
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
