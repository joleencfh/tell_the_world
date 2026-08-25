import 'server-only'

// ---------------------------------------------------------------------------
// Shared chrome for every transactional email — the current site's actual
// tokens (app/globals.css: paper/ink/pink/blue, Segoe UI, mono uppercase
// labels), not the cream/Georgia look every template used before this file
// existed. Email clients can't be trusted with position:absolute or
// mix-blend-mode, so the two-circle mark is two plain dots in a table
// rather than the overlapping/multiply version the site itself uses.
// ---------------------------------------------------------------------------

export const FONT = "'Segoe UI', Helvetica, Arial, sans-serif"
export const MONO = "'Courier New', Consolas, monospace"

export const COLOR = {
  paper: '#FFFFFF',
  paperRaised: '#F7F7F8',
  paperSunken: '#FBEFF5',
  ink: '#0C0D0E',
  inkSoft: '#4A4E53',
  inkFaint: '#727679',
  line: '#E2E3E5',
  blue: '#1E4FEB',
  blueInk: '#0B2C99',
  pink: '#F0197E',
  pinkInk: '#99075A',
} as const

export function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function nl2br(str: string): string {
  return esc(str).replace(/\n/g, '<br>')
}

export function brandMark(): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="display:inline-table;vertical-align:middle;">
      <tr>
        <td width="10" height="10" style="width:10px;height:10px;background:${COLOR.pink};border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
        <td width="4" style="width:4px;font-size:0;line-height:0;">&nbsp;</td>
        <td width="10" height="10" style="width:10px;height:10px;background:${COLOR.blue};border-radius:50%;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    </table>`
}

// Mono uppercase micro-label — the eyebrow above every email's heading,
// same role as .eyebrow on the landing page.
export function eyebrow(text: string): string {
  return `<p style="margin:0 0 12px;font-family:${MONO};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${COLOR.inkFaint};">${esc(text)}</p>`
}

// A primary CTA button — same treatment as .cta on the landing page
// (border-2 border-blue-ink bg-blue-ink text-white uppercase tracked).
export function ctaButton(href: string, label: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
        <tr>
          <td align="center">
            <a href="${esc(href)}"
               style="display:inline-block;padding:14px 32px;border:2px solid ${COLOR.blueInk};background:${COLOR.blueInk};color:#ffffff;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;">
              ${esc(label)}
            </a>
          </td>
        </tr>
      </table>`
}

interface EmailShellOptions {
  bodyHtml: string
  footerHtml?: string
  maxWidth?: number
}

// The outer table, brand header, and footer every email shares. Body
// content is the only thing that differs between templates.
export function emailShell({ bodyHtml, footerHtml, maxWidth = 480 }: EmailShellOptions): string {
  const footer =
    footerHtml ??
    `${brandMark()}<span style="font-family:${FONT};font-size:11px;color:${COLOR.inkFaint};vertical-align:middle;padding-left:8px;">&copy; ${new Date().getFullYear()} Tell The World</span>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:${COLOR.paperRaised};font-family:${FONT};">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${COLOR.paperRaised};padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:${maxWidth}px;background:${COLOR.paper};border:1px solid ${COLOR.line};">

          <!-- Brand header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:2px solid ${COLOR.ink};">
              ${brandMark()}<span style="font-family:${FONT};font-size:16px;font-weight:700;color:${COLOR.ink};letter-spacing:-0.01em;vertical-align:middle;padding-left:8px;">Tell The World</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${COLOR.line};">
              ${footer}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
