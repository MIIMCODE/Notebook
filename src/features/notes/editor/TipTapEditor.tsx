import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import { motion } from 'framer-motion'
import type { JSONContent } from '@tiptap/core'
import { AudioClip } from './audio-clip'
import Icon, { type IconName } from '../../../components/ui/Icon'
import { fileToCompressedDataUrl } from '../../../lib/image'
import { useI18n } from '../../../i18n'
import { useUi } from '../../../stores/ui'

interface Props {
  initialContent: JSONContent | null
  onChange: (json: JSONContent, plainText: string) => void
  placeholder?: string
}

function ToolbarButton({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: IconName
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
        active
          ? 'bg-gradient-to-br from-brand-500 to-rose-accent text-white shadow-[0_4px_14px_-4px_rgba(236,72,153,0.7)]'
          : 'text-white/65 hover:bg-white/10 hover:text-white'
      } disabled:opacity-30`}
    >
      <Icon name={icon} size={17} />
    </motion.button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-white/10" aria-hidden />
}

async function insertImage(editor: Editor, onWarn: (m: string) => void, i18nWarn: string) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run()
    } catch {
      onWarn(i18nWarn)
    }
  }
  input.click()
}

async function startRecording(
  editor: Editor,
  onDone: (rec: MediaRecorder) => void,
  onWarn: (m: string) => void,
): Promise<MediaRecorder | null> {
  if (!navigator.mediaDevices?.getUserMedia) {
    onWarn('مرورگر از ضبط صدا پشتیبانی نمی‌کند')
    return null
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const rec = new MediaRecorder(stream)
    const chunks: BlobPart[] = []
    rec.ondataavailable = (e) => chunks.push(e.data)
    rec.onstop = () => {
      stream.getTracks().forEach((tr) => tr.stop())
      const blob = new Blob(chunks, { type: 'audio/webm' })
      const reader = new FileReader()
      reader.onload = () => {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'audioClip',
            attrs: { src: String(reader.result), duration: 0 },
          })
          .run()
      }
      reader.readAsDataURL(blob)
    }
    rec.start()
    onDone(rec)
    return rec
  } catch {
    onWarn('دسترسی به میکروفون داده نشد')
    return null
  }
}

export function TipTapEditor({ initialContent, onChange, placeholder }: Props) {
  const { t } = useI18n()
  const toast = useUi((s) => s.toast)
  const [recording, setRecording] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'yc-codeblock' } },
      }),
      Placeholder.configure({ placeholder: placeholder ?? t('editor.bodyPlaceholder') }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true, protocols: ['http', 'https'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ allowBase64: true, inline: false }),
      AudioClip,
    ],
    content: initialContent ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        dir: 'auto',
        class: 'yc-prose min-h-[45dvh] focus:outline-none',
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON(), e.getText())
    },
  })

  // ورودی صوتی: درج متنِ تشخیص‌داده‌شده از رویداد سراسری
  useEffect(() => {
    if (!editor) return
    const onVoice = (e: Event) => {
      const text = (e as CustomEvent<string>).detail
      if (text) editor.chain().focus().insertContent(text).run()
    }
    window.addEventListener('yc:voice', onVoice)
    return () => window.removeEventListener('yc:voice', onVoice)
  }, [editor])

  const warn = useCallback((msg: string) => toast(msg, 'error'), [toast])

  const addLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('آدرس لینک:', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const recRef = useRef<MediaRecorder | null>(null)

  const toggleRecording = useCallback(async () => {
    if (!editor) return
    if (recording && recRef.current && recRef.current.state !== 'inactive') {
      recRef.current.stop()
      recRef.current = null
      setRecording(false)
      return
    }
    const rec = await startRecording(
      editor,
      (r) => {
        recRef.current = r
        r.addEventListener('stop', () => {
          recRef.current = null
          setRecording(false)
        })
        setRecording(true)
      },
      warn,
    )
    if (!rec) setRecording(false)
  }, [editor, recording, warn])

  if (!editor) {
    return <div className="yc-prose min-h-[45dvh] animate-pulse rounded-xl bg-white/5" />
  }

  const inTable = editor.isActive('table')

  return (
    <div className="flex flex-col">
      {/* نوار ابزار */}
      <div
        dir="ltr"
        className="sticky top-0 z-20 -mx-4 mb-3 flex items-center gap-0.5 overflow-x-auto border-b border-white/8 bg-ink-950/80 px-3 py-2 backdrop-blur-xl no-scrollbar"
      >
        <ToolbarButton
          icon="bold"
          label={t('editor.bold')}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon="italic"
          label={t('editor.italic')}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon="underline"
          label={t('editor.underline')}
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          icon="highlight"
          label={t('editor.highlight')}
          active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        />
        <Divider />
        <ToolbarButton
          icon="heading1"
          label={t('editor.h1')}
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          icon="heading2"
          label={t('editor.h2')}
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon="quote"
          label={t('editor.quote')}
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <Divider />
        <ToolbarButton
          icon="list"
          label={t('editor.bullet')}
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon="listOrdered"
          label={t('editor.ordered')}
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          icon="checklist"
          label={t('editor.task')}
          active={editor.isActive('taskList')}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        />
        <Divider />
        <ToolbarButton
          icon="code"
          label={t('editor.code')}
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
        <ToolbarButton
          icon="table"
          label={t('editor.table')}
          active={inTable}
          onClick={() => {
            if (inTable) editor.chain().focus().deleteTable().run()
            else editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }}
        />
        {inTable && (
          <>
            <ToolbarButton
              icon="plus"
              label="ستون جدید"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            />
            <ToolbarButton
              icon="more"
              label="ردیف جدید"
              onClick={() => editor.chain().focus().addRowAfter().run()}
            />
            <ToolbarButton
              icon="trash"
              label="حذف جدول"
              onClick={() => editor.chain().focus().deleteTable().run()}
            />
          </>
        )}
        <Divider />
        <ToolbarButton
          icon="image"
          label={t('editor.image')}
          onClick={() => void insertImage(editor, warn, t('editor.imageTooBig'))}
        />
        <ToolbarButton
          icon="mic"
          label={recording ? t('editor.stopRecording') : t('editor.startRecording')}
          active={recording}
          onClick={() => void toggleRecording()}
        />
        <span data-stop-recording className="hidden" />
        <ToolbarButton
          icon="link"
          label={t('editor.link')}
          active={editor.isActive('link')}
          onClick={addLink}
        />
        <Divider />
        <ToolbarButton
          icon="undo"
          label="بازگردانی"
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon="redo"
          label="بازانجام"
          onClick={() => editor.chain().focus().redo().run()}
        />
        <ToolbarButton
          icon="x"
          label={t('editor.clear')}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        />
        {recording && (
          <span className="ml-2 flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-[11px] font-semibold text-red-300">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-red-400"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
            {t('editor.recording')}
          </span>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

export default TipTapEditor
