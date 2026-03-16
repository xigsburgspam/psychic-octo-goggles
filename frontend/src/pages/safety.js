import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';

const RULES = [
  { icon: '🔞', title: 'No explicit content', desc: 'Nudity, sexual content, or anything inappropriate is strictly prohibited and will result in an immediate ban.' },
  { icon: '🚫', title: 'No harassment', desc: 'Bullying, threats, or targeted harassment of any kind is not tolerated.' },
  { icon: '🛡️', title: 'Protect minors', desc: 'Addagle is for users 18+. Any inappropriate behavior targeting minors will be reported to authorities.' },
  { icon: '🔒', title: 'Guard your privacy', desc: "Don't share your real name, address, phone number, or any identifying information." },
  { icon: '🤝', title: 'Be respectful', desc: 'Treat others as you would want to be treated. Hate speech and discrimination have no place here.' },
  { icon: '📢', title: 'Report violations', desc: 'Use the 🚩 report button to flag inappropriate behavior. Your reports help keep everyone safe.' },
];

export default function SafetyPage() {
  return (
    <>
      <Head><title>Safety Guidelines — Addagle</title></Head>
      <div className="min-h-screen relative" style={{ zIndex: 1 }}>
        <nav className="flex items-center justify-between px-6 py-4 glass border-b" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)' }}>A</div>
            <span className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Addagle</span>
          </Link>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-3 text-center" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              🛡️ Community Guidelines
            </h1>
            <p className="text-center mb-10" style={{ color: 'var(--text-muted)' }}>
              Addagle is built on trust. These rules keep everyone safe.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {RULES.map((rule, i) => (
                <motion.div
                  key={rule.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-xl p-5"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <div className="text-2xl mb-2">{rule.icon}</div>
                  <h3 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{rule.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{rule.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="glass rounded-2xl p-6 text-center" style={{ border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)' }}>
              <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#f87171' }}>
                🚨 Emergency
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                If you are in immediate danger, please contact your local emergency services.
                If you encounter child exploitation material, report it to{' '}
                <a href="https://www.cybertipline.org" target="_blank" rel="noopener noreferrer"
                  className="underline text-blue-400">CyberTipline.org</a>.
              </p>
            </div>

            <div className="text-center mt-8">
              <Link href="/"
                className="px-6 py-3 rounded-xl text-sm font-medium inline-block"
                style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))', color: 'white', fontFamily: 'var(--font-display)' }}>
                ← Back to Addagle
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}
