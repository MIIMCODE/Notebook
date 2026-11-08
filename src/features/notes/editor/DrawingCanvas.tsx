import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '../../../i18n'
import { useUi } from '../../../stores/ui'
import Icon from '../../../components/ui/Icon'

interface Props {
  initialImage?: string | null
  onChange: (dataUrl: string | null) => void
}

const COLORS = ['#FFFFFF', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#0EA5E9', '#111827']

/** بوم نقاشی با انگشت/ماوس، Undo و رنگ‌ها */
export function DrawingCanvas({ initialImage, onChange }: Props) {
  const { t } = useI18n()
  const toast = useUi((s) => s.toast)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState(COLORS[0])
  const [width, setWidth] = useState(4)
  const drawing = useRef(false)
  const strokes = useRef<{ color: string; width: number; points: number[][] }[]>([])
  const [historyKey, setHistoryKey] = useState(0)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokes.current) {
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.width
      ctx.beginPath()
      s.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
      ctx.stroke()
    }
  }, [])

  // سایز بوم = اندازه‌ی واقعی (با DPI)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const data = strokes.current.length ? canvas.toDataURL() : null
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      if (data && strokes.current.length === 0 && initialImage) {
        const img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
        img.src = initialImage
      } else {
        redraw()
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [redraw, initialImage, historyKey])

  // تصویر اولیه (باز کردن نقاشی قبلی)
  const loadedInit = useRef(false)
  useEffect(() => {
    if (loadedInit.current || !initialImage || strokes.current.length) return
    loadedInit.current = true
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, rect.width, rect.height)
    }
    img.src = initialImage
  }, [initialImage])

  const pos = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    strokes.current.push({ color, width, points: [pos(e)] })
    redraw()
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    strokes.current[strokes.current.length - 1].points.push(pos(e))
    redraw()
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    onChange(canvasRef.current?.toDataURL('image/png') ?? null)
  }

  const undo = () => {
    strokes.current.pop()
    setHistoryKey((k) => k + 1)
    onChange(strokes.current.length ? (canvasRef.current?.toDataURL('image/png') ?? null) : null)
  }

  const clear = () => {
    strokes.current = []
    loadedInit.current = true
    setHistoryKey((k) => k + 1)
    onChange(null)
    toast(t('editor.clearDrawing'), 'default')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2.5">
        {COLORS.map((c) => (
          <motion.button
            key={c}
            whileTap={{ scale: 0.8 }}
            aria-label={c}
            onClick={() => setColor(c)}
            className={`h-7 w-7 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-white/20'}`}
            style={{ background: c }}
          />
        ))}
        <span className="mx-1 h-5 w-px bg-white/10" />
        {[2, 4, 8].map((w) => (
          <button
            key={w}
            onClick={() => setWidth(w)}
            aria-label={`ضخامت ${w}`}
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${width === w ? 'bg-white/15' : 'hover:bg-white/8'}`}
          >
            <span className="rounded-full bg-white" style={{ width: w + 2, height: w + 2 }} />
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={undo}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/65 hover:bg-white/10 hover:text-white"
          aria-label="بازگردانی"
        >
          <Icon name="undo" size={16} />
        </button>
        <button
          onClick={clear}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/65 hover:bg-white/10 hover:text-red-300"
          aria-label={t('editor.clearDrawing')}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#14141f]">
        <canvas
          ref={canvasRef}
          className="block h-[55dvh] w-full touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>
      <p className="text-center text-xs text-white/40">{t('editor.drawingCanvas')}</p>
    </div>
  )
}

export default DrawingCanvas
