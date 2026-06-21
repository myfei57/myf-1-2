import { motion } from 'framer-motion';
import { Coins, Package } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export function ResourceBar() {
  const credits = useGameStore((s) => s.credits);
  const materials = useGameStore((s) => s.materials);

  return (
    <div className="flex items-center gap-4">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 px-4 py-2 bg-background-secondary rounded-lg border border-neon-orange/30"
      >
        <Coins className="w-5 h-5 text-neon-orange" />
        <span className="font-mono font-bold text-neon-orange">{credits}</span>
        <span className="text-xs text-white/50">信用点</span>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 px-4 py-2 bg-background-secondary rounded-lg border border-neon-green/30"
      >
        <Package className="w-5 h-5 text-neon-green" />
        <span className="font-mono font-bold text-neon-green">{materials}</span>
        <span className="text-xs text-white/50">材料</span>
      </motion.div>
    </div>
  );
}
