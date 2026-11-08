import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SplashScreen from './components/SplashScreen'
import Logo from './components/Logo'

export function App() {
  const [splashDone, setSplashDone] = useState(false)
  const onSplashDone = useCallback(() => setSplashDone(true), [])

  return (
    <>
      <AnimatePresence>{!splashDone && <SplashScreen onDone={onSplashDone} />}</AnimatePresence>

      <motion.div
        className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={splashDone ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Logo className="h-24 w-24" />
        <h1 className="text-4xl font-extrabold text-gradient">یادچه</h1>
        <p className="text-white/65">هر چیزی که باید بماند، اینجاست.</p>
        <p className="glass rounded-2xl px-5 py-3 text-sm text-white/50">
          در حال ساخت دفترچه‌ی حرفه‌ای تو… ✨
        </p>
      </motion.div>
    </>
  )
}

export default App
