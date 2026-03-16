import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../lib/store';
import toast from 'react-hot-toast';

const POPULAR_INTERESTS = [
  'Music', 'Gaming', 'Movies', 'Travel', 'Food',
  'Tech', 'Art', 'Sports', 'Coding', 'Books',
  'Anime', 'Fitness', 'Photography', 'Science', 'Fashion',
];

const STATS = [
  { label: 'Online Now', value: '12,400+', icon: '🟢' },
  { label: 'Chats Today', value: '84,200+', icon: '💬' },
  { label: 'Countries', value: '190+', icon: '🌍' },
];

export default function LandingPage() {
  const router = useRouter();
  const { nickname, interests, chatMode, setNickname, setInterests, setChatMode, ensureNickname } = useAppStore();
  const [selectedInterests, setSelectedInterests] = useState(interests || []);
  const [customInterest, setCustomInterest] = useState('');
  const [localNickname, setLocalNickname] = useState('');

  useEffect(() => {
    ensureNickname();
    setLocalNickname(nickname || '');
  }, [nickname]);

  const toggleInterest = (interest) => {
    const lower = interest.toLowerCase();
    setSelectedInterests(prev =>
      prev.includes(lower)
        ? prev.filter(i => i !== lower)
        : prev.length < 10 ? [...prev, lower] : prev
    );
  };

  const addCustomInterest = (e) => {
    e.preventDefault();
    const trimmed = customInterest.trim().toLowerCase();
    if (trimmed && !selectedInterests.includes(trimmed) && selectedInterests.length < 10) {
      setSelectedInterests(prev => [...prev, trimmed]);
      setCustomInterest('');
    }
  };

  const handleStart = (mode) => {
    const name = localNickname.trim() || nickname;
    if (!name) {
      toast.error('Please enter a nickname');
      return;
    }
    setNickname(name);
    setInterests(selectedInterests);
    setChatMode(mode);
    router.push(`/chat?mode=${mode}`);
  };

  return (
    <>
      <Head>
        <title>Addagle — Talk to Strangers. Make Connections.</title>
      </Head>

      <div className="relative min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-body)', zIndex: 1 }}>

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between px-6 py-4 glass border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)' }}>
              A
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Addagle
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/safety" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
              Safety
            </Link>
            <Link href="/profile" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
              Profile
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(34, 211, 165, 0.1)', border: '1px solid rgba(34, 211, 165, 0.3)', color: '#22d3a5' }}>
              <span className="online-dot" />
              12,400 online
            </div>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
              style={{ background: 'rgba(98, 114, 241, 0.1)', border: '1px solid rgba(98, 114, 241, 0.3)', color: 'var(--brand-light)' }}>
              ✨ Anonymous. Instant. Genuine connections.
            </div>

            <h1 className="mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
              Talk to{' '}
              <span style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                strangers
              </span>
              <br />
              make friends
            </h1>
            <p className="text-lg max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
              Connect with random people worldwide through text or video chat.
              No account needed. Just click and talk.
            </p>
          </motion.div>

          {/* ── Main card ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="glass rounded-2xl p-8 w-full max-w-lg"
            style={{ border: '1px solid var(--border)' }}
          >
            {/* Nickname */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Your nickname
              </label>
              <input
                type="text"
                value={localNickname}
                onChange={(e) => setLocalNickname(e.target.value)}
                placeholder="Enter a nickname..."
                maxLength={30}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-overlay)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--brand)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Interests */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                Interests <span className="text-xs">(optional — for better matches)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {POPULAR_INTERESTS.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`interest-tag ${selectedInterests.includes(interest.toLowerCase()) ? 'active' : ''}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              {/* Custom interest input */}
              <form onSubmit={addCustomInterest} className="flex gap-2">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  placeholder="Add custom interest..."
                  maxLength={20}
                  className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                  style={{
                    background: 'var(--surface-overlay)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-body)',
                  }}
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  + Add
                </button>
              </form>

              {/* Selected custom interests */}
              {selectedInterests.filter(i => !POPULAR_INTERESTS.map(p => p.toLowerCase()).includes(i)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedInterests
                    .filter(i => !POPULAR_INTERESTS.map(p => p.toLowerCase()).includes(i))
                    .map(i => (
                      <span key={i} className="interest-tag active">
                        {i}
                        <button onClick={() => toggleInterest(i)} className="ml-1 opacity-60 hover:opacity-100">×</button>
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Start buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStart('text')}
                className="relative py-4 rounded-xl font-semibold text-sm transition-all overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 8px 32px var(--brand-glow)',
                }}
              >
                💬 Text Chat
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStart('video')}
                className="py-4 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: 'var(--surface-overlay)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                📹 Video Chat
              </motion.button>
            </div>

            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              By chatting you agree to our{' '}
              <Link href="/safety" className="underline hover:text-white transition-colors">
                Community Guidelines
              </Link>
            </p>
          </motion.div>

          {/* ── Stats bar ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-8 mt-10"
          >
            {STATS.map(({ label, value, icon }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  {icon} {value}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </main>

        {/* ── Features strip ────────────────────────────────────────────────── */}
        <section className="px-6 py-12 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔒', title: 'Anonymous by default', desc: 'No sign-up required. Your identity stays private.' },
              { icon: '🎯', title: 'Interest matching', desc: 'Find people who share your passions for better conversations.' },
              { icon: '🛡️', title: 'AI-powered safety', desc: 'Smart moderation keeps the community respectful.' },
            ].map(({ icon, title, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass rounded-xl p-6"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="py-6 px-6 border-t flex items-center justify-between text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <span>© 2025 Addagle. Made with ❤️</span>
          <div className="flex gap-4">
            <Link href="/safety" className="hover:text-white transition-colors">Safety</Link>
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
          </div>
        </footer>

      </div>
    </>
  );
}
