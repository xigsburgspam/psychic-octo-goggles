import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAppStore } from '../lib/store';

const POPULAR_INTERESTS = [
  'Music', 'Gaming', 'Movies', 'Travel', 'Food',
  'Tech', 'Art', 'Sports', 'Coding', 'Books',
  'Anime', 'Fitness', 'Photography', 'Science', 'Fashion',
];

const LANGUAGES = [
  { code: 'en', label: '🇺🇸 English' },
  { code: 'es', label: '🇪🇸 Spanish' },
  { code: 'fr', label: '🇫🇷 French' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'ja', label: '🇯🇵 Japanese' },
  { code: 'zh', label: '🇨🇳 Chinese' },
  { code: 'pt', label: '🇧🇷 Portuguese' },
  { code: 'ar', label: '🇸🇦 Arabic' },
  { code: 'hi', label: '🇮🇳 Hindi' },
  { code: 'ru', label: '🇷🇺 Russian' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { nickname, interests, chatMode, language, theme, setNickname, setInterests, setChatMode, setLanguage, setTheme } = useAppStore();

  const [localNickname, setLocalNickname] = useState(nickname);
  const [localInterests, setLocalInterests] = useState(interests);

  const toggleInterest = (interest) => {
    const lower = interest.toLowerCase();
    setLocalInterests(prev =>
      prev.includes(lower) ? prev.filter(i => i !== lower) : [...prev, lower]
    );
  };

  const handleSave = () => {
    if (!localNickname.trim()) {
      toast.error('Nickname cannot be empty');
      return;
    }
    setNickname(localNickname.trim());
    setInterests(localInterests);
    toast.success('Profile saved!');
  };

  return (
    <>
      <Head><title>Profile — Addagle</title></Head>
      <div className="min-h-screen relative" style={{ zIndex: 1 }}>

        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 glass border-b" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)' }}>A</div>
            <span className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Addagle</span>
          </Link>
          <Link href="/chat" className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))', color: 'white' }}>
            Start Chat →
          </Link>
        </nav>

        <main className="max-w-2xl mx-auto px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Your Profile
            </h1>

            {/* Avatar */}
            <div className="glass rounded-2xl p-6 mb-4" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)' }}>
                  {(localNickname || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                    {localNickname || 'Anonymous'}
                  </div>
                  <div className="text-xs px-2 py-0.5 rounded-full inline-block mt-1"
                    style={{ background: 'rgba(98,114,241,0.1)', border: '1px solid rgba(98,114,241,0.3)', color: 'var(--brand-light)' }}>
                    Anonymous mode
                  </div>
                </div>
              </div>

              {/* Nickname */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Nickname</label>
                <input
                  type="text"
                  value={localNickname}
                  onChange={e => setLocalNickname(e.target.value)}
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--surface-overlay)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-body)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--brand)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              {/* Interests */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Interests</label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_INTERESTS.map(i => (
                    <button
                      key={i}
                      onClick={() => toggleInterest(i)}
                      className={`interest-tag ${localInterests.includes(i.toLowerCase()) ? 'active' : ''}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--surface-overlay)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Default mode */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Default chat mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {['text', 'video'].map(m => (
                    <button
                      key={m}
                      onClick={() => setChatMode(m)}
                      className="py-3 rounded-xl text-sm font-medium transition-all capitalize"
                      style={{
                        background: chatMode === m ? 'rgba(98,114,241,0.2)' : 'var(--surface-overlay)',
                        border: `1px solid ${chatMode === m ? 'var(--brand)' : 'var(--border)'}`,
                        color: chatMode === m ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {m === 'text' ? '💬' : '📹'} {m} chat
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  {['dark', 'light'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className="py-3 rounded-xl text-sm font-medium transition-all capitalize"
                      style={{
                        background: theme === t ? 'rgba(98,114,241,0.2)' : 'var(--surface-overlay)',
                        border: `1px solid ${theme === t ? 'var(--brand)' : 'var(--border)'}`,
                        color: theme === t ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {t === 'dark' ? '🌙' : '☀️'} {t}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 8px 24px var(--brand-glow)',
                }}
              >
                Save Changes
              </motion.button>
            </div>

          </motion.div>
        </main>
      </div>
    </>
  );
}
