import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

export default function ChatPanel({
  socket,
  status,
  messages,
  isPartnerTyping,
  partnerNickname,
  icebreakers,
  isVideoMode,
  isFullscreen,
}) {
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  // Handle typing indicator
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!isTyping && socket && status === 'connected') {
      setIsTyping(true);
      socket.emit('chat:typing', { isTyping: true });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('chat:typing', { isTyping: false });
    }, 1500);
  };

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text || !socket || status !== 'connected') return;

    socket.emit('chat:message', { text });
    setInputText('');
    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
    socket.emit('chat:typing', { isTyping: false });
    setShowEmoji(false);
  }, [inputText, socket, status]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEmojiClick = (emojiData) => {
    setInputText(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const sendIcebreaker = (text) => {
    if (!socket || status !== 'connected') return;
    socket.emit('chat:message', { text });
  };

  // Download chat history
  const downloadChat = () => {
    const chatText = messages
      .filter(m => m.type !== 'system')
      .map(m => `[${format(m.timestamp, 'HH:mm:ss')}] ${m.isSelf ? 'You' : (partnerNickname || 'Stranger')}: ${m.text}`)
      .join('\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `addagle-chat-${Date.now()}.txt`;
    a.click();
  };

  // Hide panel when fullscreen video mode
  if (isVideoMode && isFullscreen) return null;

  return (
    <div
      className="flex flex-col"
      style={{
        width: isVideoMode ? '340px' : '100%',
        minWidth: isVideoMode ? '300px' : undefined,
        borderLeft: isVideoMode ? '1px solid var(--border)' : undefined,
        background: 'var(--surface)',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2" style={{ minHeight: 0 }}>

        {messages.length === 0 && status !== 'searching' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-4xl">👋</div>
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              Say hello to your new chat partner!
            </p>

            {/* Icebreakers */}
            {icebreakers.length > 0 && status === 'connected' && (
              <div className="w-full mt-2">
                <p className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                  💡 Conversation starters:
                </p>
                <div className="flex flex-col gap-2">
                  {icebreakers.map((ice, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => sendIcebreaker(ice)}
                      className="text-left text-xs px-3 py-2 rounded-lg transition-all hover:scale-[1.01]"
                      style={{
                        background: 'var(--surface-overlay)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      "{ice}"
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`msg-bubble px-3 py-2 ${
                msg.type === 'system' ? 'system self-center' : msg.isSelf ? 'sent' : 'received'
              }`}
            >
              {msg.type !== 'system' && (
                <div
                  className="text-xs mb-1 opacity-60"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}
                >
                  {format(msg.timestamp, 'HH:mm')}
                </div>
              )}
              <span className="text-sm leading-relaxed">{msg.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isPartnerTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-bl-sm self-start"
              style={{ background: 'var(--surface-overlay)' }}
            >
              <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)' }} />
              <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)' }} />
              <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)' }} />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ────────────────────────────────────────────────── */}
      <div className="shrink-0 p-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-raised)' }}>

        {/* Emoji picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 right-4 z-50"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                lazyLoadEmojis
                searchDisabled
                skinTonesDisabled
                height={320}
                width={280}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowEmoji(s => !s)}
            className="p-2 rounded-lg text-lg transition-colors hover:scale-110 active:scale-95 shrink-0"
            style={{ color: showEmoji ? 'var(--brand)' : 'var(--text-muted)' }}
            title="Emoji"
          >
            😊
          </button>

          <textarea
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={status === 'connected' ? 'Type a message...' : 'Waiting for connection...'}
            disabled={status !== 'connected'}
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none transition-all"
            style={{
              background: 'var(--surface-overlay)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
              maxHeight: '120px',
              lineHeight: '1.5',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--brand)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />

          <div className="flex gap-1 shrink-0">
            {/* Download button */}
            {messages.filter(m => m.type !== 'system').length > 0 && (
              <button
                onClick={downloadChat}
                className="p-2 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--text-muted)', background: 'var(--surface-overlay)', border: '1px solid var(--border)' }}
                title="Download chat"
              >
                ⬇
              </button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!inputText.trim() || status !== 'connected'}
              className="p-2 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-30"
              style={{
                background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
                minWidth: '40px',
              }}
            >
              ➤
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
