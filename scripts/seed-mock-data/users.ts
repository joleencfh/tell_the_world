import { lorem } from './lorem'
import { avatarUrl, slugify } from './format'

// ---------------------------------------------------------------------------
// Users — 5 per public-facing role, credible names/orgs/publications,
// fictional throughout (no real people, labs, or outlets referenced).
// ---------------------------------------------------------------------------

export type Role = 'creator' | 'expert' | 'organisation' | 'journalist'

export interface MockUser {
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

export const CREATORS: MockUser[] = [
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

export const EXPERTS: MockUser[] = [
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

export const ORGS: MockUser[] = [
  makeUser('Meridian AI Policy Institute', 'organisation', 'open', { org_name: 'Meridian AI Policy Institute', org_size: 'medium', org_mission: lorem(24) }),
  makeUser('Foresight Commons', 'organisation', 'open', { org_name: 'Foresight Commons', org_size: 'small', org_mission: lorem(24) }),
  makeUser('Clarity Research Collective', 'organisation', 'open', { org_name: 'Clarity Research Collective', org_size: 'medium', org_mission: lorem(24) }),
  makeUser('Open Ledger Project', 'organisation', 'limited', { org_name: 'Open Ledger Project', org_size: 'small', org_mission: lorem(24) }),
  makeUser('Lyra Governance Lab', 'organisation', 'open', { org_name: 'Lyra Governance Lab', org_size: 'large', org_mission: lorem(24) }),
]

export const JOURNALISTS: MockUser[] = [
  makeUser('Sana Kader', 'journalist', 'open', { publication_name: 'The Signal Weekly', publication_url: 'https://signalweekly.example.com', reporting_beat: 'AI & society' }),
  makeUser('Marcus Webb', 'journalist', 'limited', { publication_name: 'Northline Tech Review', publication_url: 'https://northlinetech.example.com', reporting_beat: 'enterprise AI' }),
  makeUser('Elodie Fontaine', 'journalist', 'open', { publication_name: 'Continuum Magazine', publication_url: 'https://continuummag.example.com', reporting_beat: 'science policy' }),
  makeUser('Kwame Boateng', 'journalist', 'open', { publication_name: 'Ledger & Co', publication_url: 'https://ledgerandco.example.com', reporting_beat: 'tech regulation' }),
  makeUser('Isla MacRae', 'journalist', 'unavailable', { publication_name: 'Open Circuit', publication_url: 'https://opencircuit.example.com', reporting_beat: 'machine learning research' }),
]

export const ALL_USERS = [...CREATORS, ...EXPERTS, ...ORGS, ...JOURNALISTS]

// user_affiliations — links 4 of the experts to their matching org account,
// the only cheap way to exercise getEndorsementBarCounts' orgCount.
export const AFFILIATIONS: [expert: string, org: string][] = [
  ['Dr. Amara Osei', 'Meridian AI Policy Institute'],
  ['Dr. Lior Ben-David', 'Foresight Commons'],
  ['Dr. Ingrid Halvorsen', 'Clarity Research Collective'],
  ['Dr. Tunde Adeyemi', 'Lyra Governance Lab'],
]
