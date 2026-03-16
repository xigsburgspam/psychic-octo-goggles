import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const REASONS = [
  { value: 'inappropriate_content', label: '🔞 Inappropriate content' },
  { value: 'harassment', label: '😠 Harassment / bullying' },
  { value: 'spam', label: '📢 Spam' },
  { value: 'nudity', label: '🚫 Nudity' },
  { value: 'hate_speech', label: '🗯️ Hate speech' },
  { value: 'other', label: '⚠️ Other' },
];

export default function ReportModal({ isOpen, onClose, socket }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }
    setSubmitting(true);
    try {
      socket?.emit('user:report', { reason, description });
      toast.success('Report submitted. Thank you for keeping Addagle safe.');
      onClose();
      setReason('');
      setDescription('');
    } catch (e) {
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm glass-strong rounded-2xl p-6"
            style={{ border: '1px solid var(--border-strong)' }}
          >
            <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              🚩 Report User
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Help keep Addagle safe. All reports are reviewed by moderators.
            </p>

            <div className="flex flex-col gap-2 mb-4">
              {REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className="text-left px-3 py-2 rounded-xl text-sm transition-all"
                  style={{
                    background: reason === r.value ? 'rgba(98,114,241,0.2)' : 'var(--surface-overlay)',
                    border: `1px solid ${reason === r.value ? 'var(--brand)' : 'var(--border)'}`,
                    color: reason === r.value ? 'white' : 'var(--text-muted)',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Additional details (optional)..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none mb-4"
              style={{
                background: 'var(--surface-overlay)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: 'var(--font-body)',
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
                style={{
                  background: 'rgba(248,113,113,0.15)',
                  border: '1px solid rgba(248,113,113,0.4)',
                  color: '#f87171',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
