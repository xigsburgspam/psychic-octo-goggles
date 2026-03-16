import Link from 'next/link';
import Head from 'next/head';

export default function ServerError() {
  return (
    <>
      <Head><title>500 — Addagle</title></Head>
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ zIndex: 1, position: 'relative' }}>
        <div className="text-6xl mb-6">⚡</div>
        <h1 className="text-4xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          Something broke
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          Our server hit an unexpected error. Please try again.
        </p>
        <Link href="/">
          <span className="inline-block px-6 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))', fontFamily: 'var(--font-display)' }}>
            ← Go Home
          </span>
        </Link>
      </div>
    </>
  );
}
