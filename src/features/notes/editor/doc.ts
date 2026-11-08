import type { JSONContent } from '@tiptap/core'

/** استخراج متن ساده از JSON تیپ‌تاپ (برای جستجو و پیش‌نمایش) */
export function docToPlain(doc: JSONContent | null | undefined): string {
  if (!doc) return ''
  const out: string[] = []
  const walk = (n: JSONContent) => {
    if (n.text) out.push(n.text)
    if (n.type === 'hardBreak') out.push('\n')
    n.content?.forEach(walk)
    if (n.type === 'paragraph' || n.type === 'heading' || n.type === 'listItem') out.push('\n')
  }
  walk(doc)
  return out
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** سند خالی است؟ */
export function isEmptyDoc(doc: JSONContent | null | undefined): boolean {
  if (!doc) return true
  return docToPlain(doc).length === 0 && !hasMedia(doc)
}

function hasMedia(n: JSONContent): boolean {
  if (n.type === 'image' || n.type === 'audioClip') return true
  return n.content?.some(hasMedia) ?? false
}
