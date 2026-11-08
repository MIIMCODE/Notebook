import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'

function AudioClipView({ node, deleteNode }: NodeViewProps) {
  const src = node.attrs.src as string | null
  return (
    <NodeViewWrapper className="my-2">
      <div
        contentEditable={false}
        className="glass flex items-center gap-3 rounded-2xl px-4 py-3"
        data-drag-handle
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-rose-accent text-white">
          ♪
        </span>
        {src ? (
          <audio controls src={src} className="h-10 flex-1 min-w-0" />
        ) : (
          <span className="text-sm text-white/50">فایل صوتی یافت نشد</span>
        )}
        <button
          type="button"
          onClick={deleteNode}
          aria-label="حذف صدا"
          className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-red-300"
        >
          ✕
        </button>
      </div>
    </NodeViewWrapper>
  )
}

export const AudioClip = Node.create({
  name: 'audioClip',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      duration: { default: 0 },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio-clip"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'audio-clip' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioClipView)
  },
})

export default AudioClip
