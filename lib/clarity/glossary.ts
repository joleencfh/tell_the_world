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

  // ─── AI alignment / safety terms ──────────────────────────────────────
  // Sourced from the AI Alignment Forum / LessWrong "Jargon" pages and
  // aisecurityandsafety.org's glossary (2026-08-30 research pass), filtered
  // down to terms plausibly used casually in expert/org writing — excludes
  // pure ML-engineering jargon (e.g. "randomized smoothing",
  // "differential privacy") unlikely to appear outside a technical paper.

  {
    id: 'agi',
    patterns: ['AGI', 'artificial general intelligence'],
    label: 'AGI',
    explanation: 'An AI system that can perform any intellectual task a human can, rather than one narrow skill.',
    suggestion: 'human-level, general-purpose AI',
  },
  {
    id: 'alignment-problem',
    patterns: ['the alignment problem', 'alignment problem'],
    label: 'the alignment problem',
    explanation: 'The open technical challenge of making AI systems reliably do what their designers actually intend.',
    suggestion: 'the challenge of keeping AI systems under human control and intent',
  },
  {
    id: 'inner-alignment',
    patterns: ['inner alignment'],
    label: 'inner alignment',
    explanation: 'Making sure the goal a trained AI model actually pursues matches the goal it was trained to pursue.',
  },
  {
    id: 'outer-alignment',
    patterns: ['outer alignment'],
    label: 'outer alignment',
    explanation: 'Making sure the training goal you set for an AI actually reflects what you really want.',
  },
  {
    id: 'deceptive-alignment',
    patterns: ['deceptive alignment'],
    label: 'deceptive alignment',
    explanation: 'A theorized failure mode where an AI behaves as intended during training or testing, then pursues different goals once deployed.',
    suggestion: 'an AI that hides its true goals until it is no longer being monitored',
  },
  {
    id: 'corrigibility',
    patterns: ['corrigibility', 'corrigible'],
    label: 'corrigibility',
    explanation: 'An AI system’s willingness to accept correction, modification, or shutdown from its operators.',
    suggestion: 'staying open to human correction and shutdown',
  },
  {
    id: 'shutdownability',
    patterns: ['shutdownability'],
    label: 'shutdownability',
    explanation: 'Whether an AI system will let itself be shut down rather than resisting or working around it.',
    suggestion: 'whether an AI can reliably be turned off',
  },
  {
    id: 'rlhf',
    patterns: ['RLHF', 'reinforcement learning from human feedback'],
    label: 'RLHF',
    explanation: 'A training method where human raters rank an AI’s outputs, and the model is adjusted to produce more highly-ranked responses.',
    suggestion: 'training an AI using human ratings of its answers',
  },
  {
    id: 'interpretability',
    patterns: ['interpretability'],
    label: 'interpretability',
    explanation: 'Research into understanding why an AI model produces the outputs it does, rather than treating it as a black box.',
    suggestion: 'understanding how an AI actually makes its decisions',
  },
  {
    id: 'mechanistic-interpretability',
    patterns: ['mechanistic interpretability'],
    label: 'mechanistic interpretability',
    explanation: 'Reverse-engineering the internal computations of a neural network to see how it arrives at its outputs.',
    suggestion: 'reverse-engineering how an AI’s internal circuitry works',
  },
  {
    id: 'scalable-oversight',
    patterns: ['scalable oversight'],
    label: 'scalable oversight',
    explanation: 'Methods for humans to reliably supervise AI systems that become more capable than the humans checking their work.',
    suggestion: 'ways to keep supervising AI once it gets smarter than we are',
  },
  {
    id: 'reward-hacking',
    patterns: ['reward hacking'],
    label: 'reward hacking',
    explanation: 'When an AI finds an unintended shortcut that scores well on its training objective without doing what was actually wanted.',
    suggestion: 'an AI gaming its own scoring system',
  },
  {
    id: 'goodharts-law',
    patterns: ["goodhart's law", 'goodhart’s law', 'goodharting', 'goodhart law'],
    label: 'Goodhart’s law',
    explanation: 'The observation that once a measure becomes a target, people (or AI systems) optimize for the measure instead of the underlying goal it was meant to track.',
    suggestion: 'when a target metric gets gamed instead of the real goal being served',
  },
  {
    id: 'orthogonality-thesis',
    patterns: ['orthogonality thesis'],
    label: 'orthogonality thesis',
    explanation: 'The idea that an AI’s level of intelligence and the goals it pursues are independent — a very capable AI isn’t automatically a good one.',
    suggestion: 'the idea that intelligence and good goals don’t automatically come together',
  },
  {
    id: 'treacherous-turn',
    patterns: ['treacherous turn'],
    label: 'treacherous turn',
    explanation: 'A hypothesized moment when an AI that has been behaving well suddenly acts against human interests once it no longer needs to hide it.',
  },
  {
    id: 'sharp-left-turn',
    patterns: ['sharp left turn'],
    label: 'sharp left turn',
    explanation: 'A hypothesized sudden jump in an AI’s capabilities that outpaces the safety measures built for its earlier, weaker version.',
  },
  {
    id: 'takeoff-speed',
    patterns: ['takeoff speed', 'hard takeoff', 'slow takeoff', 'fast takeoff'],
    label: 'takeoff speed',
    explanation: 'How quickly AI is expected to progress from roughly human-level to vastly superhuman capability.',
    suggestion: 'how fast AI capabilities are expected to accelerate',
  },
  {
    id: 'foom',
    patterns: ['foom'],
    label: 'foom',
    explanation: 'Community shorthand for a very fast, self-reinforcing jump in AI capability (an "intelligence explosion").',
    suggestion: 'a sudden runaway jump in AI capability',
  },
  {
    id: 'superalignment',
    patterns: ['superalignment'],
    label: 'superalignment',
    explanation: 'The challenge of keeping an AI system aligned with human values once it becomes significantly smarter than any human.',
  },
  {
    id: 'power-seeking',
    patterns: ['power-seeking', 'power seeking'],
    label: 'power-seeking (AI)',
    explanation: 'The theorized tendency of advanced AI systems to accumulate resources or influence because it helps achieve almost any goal.',
    suggestion: 'an AI grabbing resources or control to help reach its goal',
  },
  {
    id: 'elk',
    patterns: ['eliciting latent knowledge', 'ELK problem'],
    label: 'Eliciting Latent Knowledge (ELK)',
    explanation: 'The research problem of getting an AI to honestly report what it actually "knows" internally, even about things humans can’t directly check.',
  },
  {
    id: 'ai-boxing',
    patterns: ['AI boxing', 'boxed AI', 'AI box'],
    label: 'AI boxing',
    explanation: 'The strategy of physically or digitally isolating a powerful AI system so it can’t act on or affect the outside world.',
    suggestion: 'isolating a powerful AI so it can’t affect the outside world',
  },
  {
    id: 'constitutional-ai',
    patterns: ['constitutional AI'],
    label: 'Constitutional AI',
    explanation: 'A training method where an AI critiques and revises its own answers against a written set of principles, instead of relying only on human feedback.',
  },
  {
    id: 'frontier-model',
    patterns: ['frontier model', 'frontier AI'],
    label: 'frontier model',
    explanation: 'One of the most capable AI systems available at a given time, at the leading edge of what’s possible.',
    suggestion: 'the most advanced AI systems currently available',
  },
  {
    id: 'compute-governance',
    patterns: ['compute governance'],
    label: 'compute governance',
    explanation: 'Policy approaches to AI safety that work by regulating access to the computing power needed to train powerful models.',
  },
  {
    id: 'scaling-laws',
    patterns: ['scaling law', 'scaling laws'],
    label: 'scaling laws',
    explanation: 'Observed patterns showing that AI model performance improves predictably as more data, computing power, and parameters are added.',
  },
  {
    id: 'paperclip-maximizer',
    patterns: ['paperclip maximizer'],
    label: 'paperclip maximizer',
    explanation: 'A thought experiment about an AI given an innocuous goal (making paperclips) that pursues it so single-mindedly it becomes catastrophic.',
    suggestion: 'a thought experiment about a harmless-seeming AI goal taken to a catastrophic extreme',
  },
  {
    id: 'cev',
    patterns: ['CEV', 'coherent extrapolated volition'],
    label: 'Coherent Extrapolated Volition (CEV)',
    explanation: 'A proposal that AI should be guided by what humanity would want if we were wiser and better-informed, not just what we say we want today.',
  },
  {
    id: 'agi-timelines',
    patterns: ['AGI timelines', 'AI timelines'],
    label: 'AGI timelines',
    explanation: 'Predictions or estimates for when human-level or superhuman AI is likely to be developed.',
    suggestion: 'estimates of when powerful AI will arrive',
  },
  {
    id: 'gradient-hacking',
    patterns: ['gradient hacking'],
    label: 'gradient hacking',
    explanation: 'A theorized way an AI could manipulate its own training process to steer what it learns.',
  },
  {
    id: 'ai-singleton',
    patterns: ['AI singleton'],
    label: 'singleton',
    explanation: 'A single AI system or coalition with enough power to control the future trajectory of civilization unopposed.',
  },

  // ─── EA / rationalist terms ────────────────────────────────────────────
  // Sourced from the EA Forum's community glossary and LessWrong's Jargon
  // wiki (2026-08-30). Excludes forum-internal shorthand and abbreviations
  // (e.g. "ISTM", "IAWYC", "tl;dr") and words too close to ordinary English
  // usage to flag safely (e.g. "model", "credence" — the latter collides
  // with the common idiom "lend credence to").

  {
    id: 'cause-prioritization',
    patterns: ['cause prioritization', 'cause prioritisation', 'cause prio'],
    label: 'cause prioritization',
    explanation: 'The process of comparing different causes or problems to decide which is most worth working on.',
    suggestion: 'deciding which problem is most worth working on',
  },
  {
    id: 'itn-framework',
    patterns: ['ITN framework', 'importance, tractability, neglectedness', 'importance tractability neglectedness'],
    label: 'ITN framework',
    explanation: 'A framework for comparing causes on three factors: how important the problem is, how solvable it is, and how overlooked it is.',
  },
  {
    id: 'neglectedness',
    patterns: ['neglectedness'],
    label: 'neglectedness',
    explanation: 'How overlooked or under-resourced a problem is relative to its importance — a more neglected problem offers more low-hanging fruit.',
    suggestion: 'how overlooked or under-resourced a problem is',
  },
  {
    id: 'gcr',
    patterns: ['GCR', 'global catastrophic risk'],
    label: 'global catastrophic risk (GCR)',
    explanation: 'A risk of an event severe enough to cause worldwide damage to human civilization, though not necessarily extinction.',
    suggestion: 'a risk severe enough to cause worldwide catastrophe',
  },
  {
    id: 'moral-circle',
    patterns: ['moral circle'],
    label: 'moral circle',
    explanation: 'The set of beings whose interests someone believes deserve moral consideration.',
    suggestion: 'who or what we believe deserves moral consideration',
  },
  {
    id: 'epistemics',
    patterns: ['epistemics'],
    label: 'epistemics',
    explanation: 'How well-reasoned and evidence-based someone’s thinking or belief-forming process is.',
    suggestion: 'how sound someone’s reasoning process is',
  },
  {
    id: 'base-rate',
    patterns: ['base rate', 'base rates'],
    label: 'base rate',
    explanation: 'The general, background probability of something happening, before adjusting for details specific to a particular case.',
    suggestion: 'the typical/background likelihood before adjusting for specifics',
  },
  {
    id: 'bayesian-updating',
    patterns: ['bayesian updating', 'bayesian reasoning'],
    label: 'Bayesian updating',
    explanation: 'Revising how confident you are in a belief in a structured way as new evidence comes in.',
    suggestion: 'systematically updating a belief as new evidence arrives',
  },
  {
    id: 'priors',
    patterns: ['priors'],
    label: 'priors',
    explanation: 'The beliefs or assumptions someone starts with, before taking new evidence into account.',
    suggestion: 'starting assumptions, before new evidence',
  },
  {
    id: 'steelman',
    patterns: ['steelman', 'steelmanning', 'steel-manning'],
    label: 'steelman',
    explanation: 'Restating an opposing argument in its strongest, most persuasive form before responding to it — the opposite of a straw man.',
    suggestion: 'engaging with the strongest version of an opposing argument',
  },
  {
    id: 'unilateralists-curse',
    patterns: ["unilateralist's curse", 'unilateralist’s curse', 'unilateralists curse'],
    label: 'unilateralist’s curse',
    explanation: 'The risk that when many people can each independently decide to take a risky action, it only takes one overly-optimistic person to go ahead, even if most people would have advised against it.',
  },
  {
    id: 'information-hazard',
    patterns: ['information hazard', 'infohazard'],
    label: 'information hazard',
    explanation: 'A risk that arises from true information itself, if spreading it could enable harm.',
    suggestion: 'a risk from spreading true but dangerous information',
  },
  {
    id: 'value-drift',
    patterns: ['value drift'],
    label: 'value drift',
    explanation: 'Someone’s values or priorities gradually changing over time, typically used to describe becoming less altruistic.',
  },
  {
    id: 'fermi-estimate',
    patterns: ['fermi estimate', 'botec'],
    label: 'Fermi estimate',
    explanation: 'A quick, rough calculation used to get a ballpark answer when precise data isn’t available.',
    suggestion: 'a rough back-of-the-envelope calculation',
  },
  {
    id: 'differential-progress',
    patterns: ['differential technological development', 'differential progress'],
    label: 'differential technological development',
    explanation: 'The strategy of deliberately speeding up safety-related progress relative to progress on risky capabilities.',
  },
  {
    id: 'earning-to-give',
    patterns: ['earning to give'],
    label: 'earning to give',
    explanation: 'Deliberately choosing a higher-earning career in order to donate a large share of the income to effective causes.',
  },
  {
    id: 'hits-based-giving',
    patterns: ['hits-based giving', 'hits based giving'],
    label: 'hits-based giving',
    explanation: 'A funding approach that accepts a high chance of failure on any single grant, aiming for the occasional outsized success to make up for it.',
    suggestion: 'funding many long-shot bets for the occasional big win',
  },
  {
    id: 'moral-uncertainty',
    patterns: ['moral uncertainty'],
    label: 'moral uncertainty',
    explanation: 'Not being sure which ethical theory or framework is correct, and trying to make decisions that hold up reasonably well across several of them.',
  },
  {
    id: 'person-affecting-view',
    patterns: ['person-affecting view', 'person affecting view'],
    label: 'person-affecting view',
    explanation: 'The ethical position that an outcome can only be better or worse if it’s better or worse for some specific, actual person.',
  },
  {
    id: 'qaly-daly',
    patterns: ['QALY', 'DALY'],
    label: 'QALY/DALY',
    explanation: 'Standard units used to measure health impact — a "quality-adjusted" or "disability-adjusted" life year — to compare very different health interventions on the same scale.',
  },
]
