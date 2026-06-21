import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import {
  Cpu,
  Shield,
  Hand,
  Footprints,
  Zap,
  Wrench,
  Plus,
  X,
} from 'lucide-react';
import type { Part, PartType } from '../types';
import { PART_TYPE_NAMES } from '../data/defaultConfig';
import { getRarityBorderClass } from '../utils/helpers';

const SlotIcon: Record<PartType, typeof Cpu> = {
  head: Cpu,
  body: Shield,
  arm: Hand,
  leg: Footprints,
  core: Zap,
  tool: Wrench,
};

interface PartSlotProps {
  slotType: PartType;
  part: Part | null;
  onRemove?: () => void;
}

export function PartSlot({ slotType, part, onRemove }: PartSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slotType}`,
    data: { slotType },
  });

  const Icon = SlotIcon[slotType];
  const rarityBorder = part ? getRarityBorderClass(part.rarity) : '';

  return (
    <motion.div
      ref={setNodeRef}
      className={`relative hex-slot aspect-square flex items-center justify-center border-2 border-dashed transition-all duration-200 ${
        isOver
          ? 'border-neon-green bg-neon-green/20 scale-105'
          : part
          ? `${rarityBorder} border-solid bg-background-tertiary`
          : 'border-white/20 bg-background-secondary/50 hover:border-neon-blue/50'
      }`}
      whileHover={part ? { scale: 1.02 } : {}}
    >
      {part ? (
        <div className="flex flex-col items-center p-2 text-center w-full h-full">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-1"
            style={{
              backgroundColor: `var(--color-${part.rarity === 'legendary' ? 'neon-orange' : part.rarity === 'epic' ? 'neon-purple' : part.rarity === 'rare' ? 'neon-blue' : part.rarity === 'uncommon' ? 'neon-green' : 'rarity-common'})`,
            }}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs font-bold truncate w-full">{part.name}</p>
          <p className="text-[10px] text-white/50">{PART_TYPE_NAMES[slotType]}</p>
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-1 right-1 p-0.5 rounded-full bg-neon-red/80 hover:bg-neon-red text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center text-white/30">
          <Plus className="w-8 h-8 mb-1" />
          <p className="text-xs">{PART_TYPE_NAMES[slotType]}</p>
        </div>
      )}

      {isOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 border-2 border-neon-green rounded-lg pointer-events-none"
        />
      )}
    </motion.div>
  );
}
