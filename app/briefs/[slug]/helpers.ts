export function getDisplayName(user: { display_name: string | null; email: string }) {
  return user.display_name?.trim() || user.email.split('@')[0]
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
