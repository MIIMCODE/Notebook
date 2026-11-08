import type { JSONContent } from '@tiptap/core'

/** قالب‌های یادداشت — خروجی: { plain, tiptap } */

function doc(...content: JSONContent[]): JSONContent {
  return { type: 'doc', content }
}

function heading(text: string, level = 1): JSONContent {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] }
}

function para(text: string): JSONContent {
  return { type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }
}

function bullet(items: string[]): JSONContent {
  return {
    type: 'bulletList',
    content: items.map((i) => ({ type: 'listItem', content: [para(i)] })),
  }
}

function todo(items: string[]): JSONContent {
  return {
    type: 'taskList',
    content: items.map((i) => ({
      type: 'taskItem',
      attrs: { checked: false },
      content: [para(i)],
    })),
  }
}

function code(text: string, lang = ''): JSONContent {
  return {
    type: 'codeBlock',
    attrs: { language: lang },
    content: text ? [{ type: 'text', text }] : [],
  }
}

export interface Template {
  id: string
  titleKey: string
  emoji: string
  make: () => { plain: string; tiptap: JSONContent }
}

export const TEMPLATES: Template[] = [
  {
    id: 'daily',
    titleKey: 'templates.daily',
    emoji: '☀️',
    make: () => {
      const t = doc(
        heading('برنامه‌ی امروز'),
        para(''),
        heading('اولویت اول', 2),
        todo(['']),
        heading('کارهای مهم', 2),
        todo(['', '', '']),
        heading('یادداشت', 2),
        para(''),
      )
      return { plain: 'برنامه‌ی امروز\n\nاولویت اول\nکارهای مهم\nیادداشت', tiptap: t }
    },
  },
  {
    id: 'shopping',
    titleKey: 'templates.shopping',
    emoji: '🛒',
    make: () => {
      const t = doc(heading('لیست خرید'), todo(['نان و شیر', 'میوه و سبزیجات', '']))
      return { plain: 'لیست خرید', tiptap: t }
    },
  },
  {
    id: 'meeting',
    titleKey: 'templates.meeting',
    emoji: '📝',
    make: () => {
      const t = doc(
        heading('یادداشت جلسه'),
        para('تاریخ: '),
        para('شرکت‌کنندگان: '),
        heading('دستور جلسه', 2),
        bullet(['']),
        heading('تصمیم‌ها', 2),
        bullet(['']),
        heading('اقدامات', 2),
        todo(['']),
      )
      return { plain: 'یادداشت جلسه', tiptap: t }
    },
  },
  {
    id: 'code',
    titleKey: 'templates.code',
    emoji: '💻',
    make: () => {
      const t = doc(
        heading('اسکریپت'),
        code('// ...\nfunction main() {\n  console.log("hello")\n}\nmain()', 'javascript'),
      )
      return { plain: 'اسکریپت', tiptap: t }
    },
  },
  {
    id: 'travel',
    titleKey: 'templates.travel',
    emoji: '✈️',
    make: () => {
      const t = doc(
        heading('برنامه‌ی سفر'),
        para('مقصد: '),
        para('تاریخ: '),
        heading('اقامت', 2),
        bullet(['هتل: ', 'پرواز/قطار: ']),
        heading('جاذبه‌ها', 2),
        bullet(['']),
        heading('چمدان', 2),
        todo(['لوازم ضروری', 'شارژر و کابل', '']),
      )
      return { plain: 'برنامه‌ی سفر', tiptap: t }
    },
  },
  {
    id: 'blank',
    titleKey: 'templates.blank',
    emoji: '📄',
    make: () => ({ plain: '', tiptap: doc(para('')) }),
  },
]
