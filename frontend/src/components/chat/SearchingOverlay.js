import { motion } from 'framer-motion';

export default function SearchingOverlay({ onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-20"
      style={{ background: 'rgba(11,11,24,0.95)', backdropFilter: 'blur(10px)' }}
    >
      {/* Radar animation */}
      <div className="relative w-32 h-32 mb-8">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: 'var(--brand)', opacity: 0.3 }}
            animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut',
            }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(98,114,241,0.2)', border: '2px solid var(--brand)' }}>
            <span className="text-2xl">👤</span>
          </div>
        </div>
      </div>

      <motion.h2
        className="text-xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        animate={{ opacity: [0.6, 1] }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      >
        Finding a stranger...
      </motion.h2>

      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        Matching you with someone to chat with
      </p>

      {/* Scanning bar */}
      <div className="w-48 h-1 rounded-full overflow-hidden mb-8"
        style={{ background: 'var(--surface-overlay)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--brand), #8b5cf6)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <button
        onClick={onCancel}
        className="px-5 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontFamily: 'var(--font-body)',
        }}
      >
        ✕ Cancel
      </button>
    </motion.div>
  );
}
