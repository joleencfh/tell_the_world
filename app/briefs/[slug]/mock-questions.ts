import type { Question } from './page'

// ---------------------------------------------------------------------------
// Mock Q&A data — for screenshot / preview purposes
// ---------------------------------------------------------------------------

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'mock-1',
    question_text: "If an AI is trained to be helpful, why isn't that enough to make it aligned? What's actually missing?",
    answer_text: "Being helpful toward a user's immediate request and being aligned with human values long-term are very different things. A model optimised purely for helpfulness will tell people what they want to hear, assist with requests that cause broader harm, and maximise engagement rather than truth. Alignment requires the system to internalise something much harder to specify: not just 'do what's asked' but 'act in ways that reflect genuine human flourishing across time and context.' We don't yet know how to reliably instil that.",
    created_at: '2025-11-14T10:22:00Z',
    users: {
      id: 'mock-user-1',
      display_name: 'Priya Sharma',
      email: 'priya@example.com',
      avatar_url: null,
      role: 'creator',
      creator_platforms: ['YouTube', 'Podcast'],
    },
    answered_by: {
      id: 'mock-expert-1',
      display_name: 'Dr. Sarah Chen',
      email: 'sarah@example.com',
      avatar_url: null,
      role: 'expert',
      expert_category: 'Technical AI Safety',
    },
  },
  {
    id: 'mock-2',
    question_text: "Is RLHF actually solving alignment, or just making models appear more aligned to evaluators?",
    answer_text: "Mostly the latter, and this distinction matters enormously. RLHF (Reinforcement Learning from Human Feedback) trains models to produce outputs that human raters score highly — but raters have limited time, limited expertise, and are susceptible to confident-sounding wrong answers. The model learns to satisfy the rater, not to be correct or safe. This is sometimes called 'alignment to the evaluator' rather than alignment to underlying values. It's a meaningful improvement over nothing, but it's not a solution to alignment — it's a patch that may obscure how unsolved the problem still is.",
    created_at: '2025-11-18T15:05:00Z',
    users: {
      id: 'mock-user-2',
      display_name: 'Marcus Webb',
      email: 'marcus@example.com',
      avatar_url: null,
      role: 'journalist',
    },
    answered_by: {
      id: 'mock-expert-2',
      display_name: 'Amara Osei',
      email: 'amara@example.com',
      avatar_url: null,
      role: 'expert',
      expert_category: 'AI Governance',
    },
  },
  {
    id: 'mock-3',
    question_text: "I cover economics and I want to start covering AI safety — but my audience didn't sign up for a tech channel. How do I bring them along without losing them?",
    answer_text: "You actually have an advantage: economic intuitions are great entry points into alignment. Incentive structures, principal-agent problems, Goodhart's law — these map directly onto things researchers genuinely worry about. Lead with the dynamics your audience already understands, then show how AI makes those dynamics sharper and harder to correct. You don't need to explain the technical machinery. You need to explain why the stakes are high and who's accountable — which is exactly what good economics journalism does anyway.",
    created_at: '2025-12-01T09:40:00Z',
    users: {
      id: 'mock-user-3',
      display_name: 'Jordan Lee',
      email: 'jordan@example.com',
      avatar_url: null,
      role: 'creator',
      creator_platforms: ['TikTok'],
    },
    answered_by: {
      id: 'mock-expert-3',
      display_name: 'Dr. Felix Müller',
      email: 'felix@example.com',
      avatar_url: null,
      role: 'expert',
      expert_category: 'Technical AI Governance',
    },
  },
  {
    id: 'mock-4',
    question_text: "What should our organisation be advocating for when it comes to alignment — is this something policy can even address?",
    answer_text: "Policy can't solve alignment technically, but it can shape the conditions under which alignment research happens. The most tractable asks right now: mandate transparency about training objectives and evaluation methods, require that frontier model developers publish safety cases before deployment (similar to how pharmaceutical companies must demonstrate efficacy and safety), and fund independent alignment research so the field isn't entirely dependent on the labs whose incentives may conflict with thoroughness. The goal isn't to regulate the science — it's to ensure deployment doesn't outpace the safety work.",
    created_at: '2025-12-08T13:20:00Z',
    users: {
      id: 'mock-user-4',
      display_name: 'Global AI Watch',
      email: 'contact@globalaiwatch.org',
      avatar_url: null,
      role: 'organisation',
    },
    answered_by: {
      id: 'mock-expert-2',
      display_name: 'Amara Osei',
      email: 'amara@example.com',
      avatar_url: null,
      role: 'expert',
      expert_category: 'AI Governance',
    },
  },
]
