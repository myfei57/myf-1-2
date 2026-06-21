import { motion } from 'framer-motion';
import { Bot, Heart, Scale, Gauge, Layers, AlertTriangle, Sparkles } from 'lucide-react';
import type { Robot } from '../types';
import { useGameStore } from '../store/useGameStore';
import { StatBar } from './StatBar';
import { PART_TYPE_NAMES } from '../data/defaultConfig';

interface RobotCardProps {
  robot: Robot;
  onClick?: () => void;
  selected?: boolean;
  showDetails?: boolean;
}

export function RobotCard({ robot, onClick, selected = false, showDetails = false }: RobotCardProps) {
  const config = useGameStore((s) => s.config);

  const durabilityPercent = (robot.durability / robot.maxDurability) * 100;
  const durabilityColor =
    durabilityPercent > 60 ? 'green' : durabilityPercent > 30 ? 'orange' : 'red';

  const installedPartsCount = Object.values(robot.parts).filter(Boolean).length;

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`card p-4 ${onClick ? 'cursor-pointer' : ''} transition-all ${
        selected ? 'ring-2 ring-neon-blue shadow-neon-blue' : ''
      } ${robot.isOverloaded ? 'border-neon-red/50' : ''}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
            robot.isOverloaded ? 'bg-neon-red/20' : 'bg-neon-blue/20'
          }`}
        >
          <Bot className={`w-8 h-8 ${robot.isOverloaded ? 'text-neon-red' : 'text-neon-blue'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-display font-bold text-white truncate">{robot.name}</h3>
            {robot.isOverloaded && (
              <span className="flex items-center gap-1 text-xs text-neon-red">
                <AlertTriangle className="w-3 h-3" />
                过载
              </span>
            )}
          </div>

          <p className="text-xs text-white/50 mb-2">
            {installedPartsCount}/6 零件 | 返修 {robot.repairCount} 次
          </p>

          {robot.activeSetBonuses.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {robot.activeSetBonuses.map((setId) => {
                const setConfig = config.setBonuses[setId];
                if (!setConfig) return null;
                return (
                  <span
                    key={setId}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple"
                  >
                    <Sparkles className="w-3 h-3 inline mr-0.5" />
                    {setConfig.name}
                  </span>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-3">
            <div className="flex items-center gap-1">
              <Scale className="w-3 h-3 text-neon-blue" />
              <span className="text-white">{robot.totalWeight}</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-neon-orange" />
              <span className={robot.isOverloaded ? 'text-neon-red' : 'text-white'}>
                {robot.totalEnergy}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-neon-purple" />
              <span className="text-white">{robot.totalSkillSlots}</span>
            </div>
          </div>

          <StatBar
            label="耐久度"
            value={robot.durability}
            max={robot.maxDurability}
            color={durabilityColor}
            size="sm"
          />
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <h4 className="text-sm font-bold text-white/70 mb-2">已装配零件</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(robot.parts).map(([type, part]) => (
              <div
                key={type}
                className={`p-2 rounded-lg text-center text-xs ${
                  part ? 'bg-background-tertiary' : 'bg-background-tertiary/30'
                }`}
              >
                <p className="text-white/40">{PART_TYPE_NAMES[type as keyof typeof PART_TYPE_NAMES]}</p>
                <p className={part ? 'text-white truncate' : 'text-white/20'}>
                  {part ? part.name : '空'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
