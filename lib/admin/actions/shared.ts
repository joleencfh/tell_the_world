import { headers } from 'next/headers'

export async function getSiteUrl(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  return `${protocol}://${host}`
}

export const PLATFORM_ENUM = new Set(['youtube', 'podcast', 'instagram', 'tiktok', 'other'])
export const ORG_SIZE_ENUM = new Set(['small', 'medium', 'large'])
