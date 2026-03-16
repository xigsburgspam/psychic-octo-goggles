import { motion } from 'framer-motion';

export default function VideoPanel({
  localVideoRef,
  remoteVideoRef,
  isFullscreen,
  setIsFullscreen,
  connectionState,
  status,
  isCameraOff,
  isMuted,
  onToggleAudio,
  onToggleCamera,
}) {
  const isConnected = status === 'connected';

  return (
    <motion.div
      className="relative flex-1 flex overflow-hidden"
      style={{ background: '#000', minWidth: 0 }}
      layout
    >
      {/* Remote video (main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Remote video placeholder */}
      {(!isConnected || connectionState === 'connecting' || connectionState === 'new') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: '#0a0a14' }}>
          {status === 'connected' ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4"
                style={{ background: 'var(--surface-overlay)', border: '2px solid var(--border)' }}
              >
                👤
              </motion.div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {connectionState === 'connecting' ? 'Connecting video...' : 'Waiting for video...'}
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-3">📹</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Video will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Local video (PiP) */}
      <div className="absolute bottom-4 right-4 z-10 rounded-xl overflow-hidden shadow-2xl"
        style={{ width: '140px', height: '105px', border: '2px solid var(--border)' }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        {isCameraOff && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'var(--surface)' }}>
            <span className="text-2xl">📵</span>
          </div>
        )}
      </div>

      {/* Fullscreen toggle */}
      <button
        onClick={() => setIsFullscreen(f => !f)}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110"
        style={{ background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)' }}
      >
        {isFullscreen ? '⊡' : '⛶'}
      </button>

      {/* Connection state badge */}
      {connectionState && connectionState !== 'connected' && (
        <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-xs"
          style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--text-muted)', backdropFilter: 'blur(4px)' }}>
          {connectionState === 'failed' ? '❌ Failed' :
           connectionState === 'connecting' ? '⌛ Connecting...' :
           connectionState === 'disconnected' ? '🔌 Disconnected' : connectionState}
        </div>
      )}

      {connectionState === 'connected' && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
          style={{ background: 'rgba(0,0,0,0.6)', color: '#22d3a5', backdropFilter: 'blur(4px)' }}>
          <span className="online-dot" style={{ width: '6px', height: '6px' }} />
          Live
        </div>
      )}
    </motion.div>
  );
}
