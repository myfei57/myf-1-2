import { motion } from 'framer-motion';

interface StatBarProps {
  label?: string;
  value: number;
  max: number;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan';
  showValue?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  blue: 'bg-neon-blue',
  green: 'bg-neon-green',
  orange: 'bg-neon-orange',
  red: 'bg-neon-red',
  purple: 'bg-neon-purple',
  cyan: 'bg-neon-cyan',
};

export function StatBar({
  label = '',
  value,
  max,
  color = 'blue',
  showValue = true,
  showLabel = true,
  size = 'md',
}: StatBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const isOverloaded = value > max;

  return (
    <div className={`${size === 'sm' ? 'space-y-1' : size === 'lg' ? 'space-y-3' : 'space-y-2'}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`text-white/70 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
            {label}
          </span>
          {showValue && (
            <span
              className={`font-mono font-bold ${
                isOverloaded ? 'text-neon-red animate-pulse' : 'text-white'
              } ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}
            >
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className="stat-bar">
        <motion.div
          className={`stat-bar-fill ${
            isOverloaded ? 'bg-neon-red' : colorClasses[color]
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
