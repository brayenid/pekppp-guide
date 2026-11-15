/**
 * Helper formatter untuk Catatan & Rekomendasi Evaluator MenPAN-RB
 * Mengubah format legacy (plain text dengan pemisah pipe '|' dan '[#nomor]')
 * menjadi HTML semantik (strong, ul, li, p) yang terbaca rapi dan kompatibel
 * dengan editor TipTap di portal resmi MenPAN-RB.
 */

export function formatLegacyPipeNotesToHtml(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return ''
  // Biarkan teks lama tampil apa adanya tanpa auto-transform
  return raw
}

export function buildAiRecommendationHtml({
  indicatorNumber,
  indicatorCode,
  tips,
  weakness,
  audit,
  reason
}: {
  indicatorNumber: number
  indicatorCode?: string
  tips?: string | null
  weakness?: string | null
  audit?: string | null
  reason?: string | null
}): string {
  const listItems: string[] = []

  if (tips && tips.trim()) {
    listItems.push(`<li><strong>Rekomendasi Lapangan:</strong> ${tips.trim()}</li>`)
  }

  if (weakness && weakness.trim() && !weakness.toLowerCase().includes('tidak ada')) {
    listItems.push(`<li><strong>Catatan Perbaikan:</strong> ${weakness.trim()}</li>`)
  }

  if (audit && audit.trim()) {
    listItems.push(`<li><strong>Catatan Bukti F-01:</strong> ${audit.trim()}</li>`)
  }

  if (listItems.length === 0 && reason && reason.trim()) {
    listItems.push(`<li>${reason.trim()}</li>`)
  }

  if (listItems.length === 0) {
    return ''
  }

  const label = indicatorCode
    ? `[Indikator #${indicatorNumber} (${indicatorCode})]`
    : `[Indikator #${indicatorNumber}]`

  return `<p><strong>${label}</strong></p><ul>${listItems.join('')}</ul>`
}

export function appendHtmlNotes(existingHtml: string, newHtml: string): string {
  const isHtmlEmpty = (str: string) => {
    const stripped = str
      .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim()
    return stripped.length === 0
  }

  const cleanNew = (newHtml || '')
    .replace(/^(<p>\s*(<br\s*\/?>)?\s*<\/p>)+/gi, '')
    .trim()

  if (!cleanNew) return existingHtml || ''

  if (!existingHtml || isHtmlEmpty(existingHtml)) {
    return cleanNew
  }

  const cleanExisting = existingHtml
    .replace(/^(<p>\s*(<br\s*\/?>)?\s*<\/p>)+/gi, '')
    .replace(/(<p>\s*(<br\s*\/?>)?\s*<\/p>)+$/gi, '')
    .trim()

  if (!cleanExisting) return cleanNew

  return `${cleanExisting}${cleanNew}`
}
