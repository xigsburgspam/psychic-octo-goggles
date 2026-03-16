/**
 * Button — shared UI component
 * Variants: primary | secondary | danger | ghost
 */
import { motion } from 'framer-motion';

const VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
    color: 'white',
    border: 'none',
    boxShadow: '0 6px 20px var(--brand-glow)',
  },
  secondary: {
    background: 'var(--surface-overlay)',
    color: 'var(--text)',
    border: '1px solid var(--border-strong)',
    boxShadow: 'none',
  },
  danger: {
    background: 'rgba(248, 113, 113, 0.12)',
    color: '#f87171',
    border: '1px solid rgba(248, 113, 113, 0.35)',
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    boxShadow: 'none',
  },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
  icon,
}) {
  const style = VARIANTS[variant] || VARIANTS.primary;
  const padding = size === 'sm' ? '6px 14px' : size === 'lg' ? '14px 28px' : '10px 20px';
  const fontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={className}
      style={{
        ...style,
        padding,
        fontSize,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: fullWidth ? '100%' : undefined,
        transition: 'opacity 0.15s ease',
        letterSpacing: '0.01em',
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </motion.button>
  );
}
