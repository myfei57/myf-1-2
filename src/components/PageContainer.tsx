import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function PageContainer({ title, subtitle, children, actions }: PageContainerProps) {
  return (
    <div className="min-h-screen pt-24 pb-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-3xl font-bold text-white mb-1">
                <span className="text-neon-blue">{title.charAt(0)}</span>
                {title.slice(1)}
              </h1>
              {subtitle && (
                <p className="text-white/50 font-mono text-sm">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          <div className="h-px bg-gradient-to-r from-neon-blue/50 via-neon-blue/20 to-transparent mt-4" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
