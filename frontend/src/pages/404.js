import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <>
      <Head><title>404 — Addagle</title></Head>
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ zIndex: 1, position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-8xl mb-6 select-none" style={{ fontFamily: 'var(--font-display)' }}>
            🌐
          </div>
          <h1 className="text-5xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            404
          </h1>
          <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>
            This stranger doesn't exist.
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            The page you're looking for has disconnected.
          </p>
          <Link href="/">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block px-6 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 8px 24px var(--brand-glow)',
              }}
            >
              ← Back to Addagle
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </>
  );
}
