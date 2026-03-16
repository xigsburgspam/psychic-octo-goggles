/**
 * OnlineCounter — live online user badge
 */
import { useOnlineStats } from '../../hooks/useOnlineStats';

export default function OnlineCounter({ className = '' }) {
  const { online } = useOnlineStats();

  const display = online > 1000
    ? `${(online / 1000).toFixed(1)}k`
    : online.toLocaleString();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${className}`}
      style={{
        background: 'rgba(34, 211, 165, 0.08)',
        border: '1px solid rgba(34, 211, 165, 0.25)',
        color: '#22d3a5',
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: '7px',
          height: '7px',
          background: '#22d3a5',
          boxShadow: '0 0 0 0 rgba(34,211,165,0.4)',
          animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        }}
      />
      {display} online
    </div>
  );
}
