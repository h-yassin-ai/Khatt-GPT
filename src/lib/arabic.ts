/**
 * Normalizes common Arabic orthographic variants for search and consensus.
 */
export function normalizeArabicText(value: string): string {
  return value
    .normalize('NFKC')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[إأآٱٲٳٵ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
}
