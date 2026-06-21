import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Sparkles, Coins } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { PartCard } from '../components/PartCard';
import { Modal } from '../components/Modal';
import { useGameStore } from '../store/useGameStore';
import { BLIND_BOX_PRICES } from '../data/defaultConfig';
import type { Rarity, Part } from '../types';
import { getRarityBorderClass } from '../utils/helpers';

const boxTypes: { type: Rarity; name: string; description: string; particles: number }[] = [
  { type: 'common', name: '基础盲盒', description: '包含2个随机零件', particles: 2 },
  { type: 'uncommon', name: '进阶盲盒', description: '包含2个随机零件，稀有度更高', particles: 3 },
  { type: 'rare', name: '稀有盲盒', description: '包含3个随机零件', particles: 4 },
  { type: 'epic', name: '史诗盲盒', description: '包含4个随机零件', particles: 5 },
  { type: 'legendary', name: '传说盲盒', description: '包含5个随机零件，必出传说', particles: 8 },
];

export function BlindBoxPage() {
  const [openingBox, setOpeningBox] = useState<Rarity | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedParts, setRevealedParts] = useState<Part[]>([]);
  const [showResult, setShowResult] = useState(false);

  const config = useGameStore((s) => s.config);
  const credits = useGameStore((s) => s.credits);
  const openBlindBox = useGameStore((s) => s.openBlindBox);
  const addPart = useGameStore((s) => s.addPart);

  const handleOpenBox = (type: Rarity) => {
    const price = BLIND_BOX_PRICES[type];
    if (credits < price) return;

    setOpeningBox(type);
    setIsAnimating(true);
    setRevealedParts([]);
    setShowResult(false);

    setTimeout(() => {
      const parts = openBlindBox(type);
      if (parts.length === 0) {
        setIsAnimating(false);
        setOpeningBox(null);
        return;
      }
      setRevealedParts(parts);
      setIsAnimating(false);
      setShowResult(true);
    }, 2000);
  };

  const handleConfirmParts = () => {
    revealedParts.forEach((p) => addPart(p));
    setShowResult(false);
    setOpeningBox(null);
    setRevealedParts([]);
  };

  return (
    <PageContainer
      title="盲盒开盒"
      subtitle="选择盲盒类型，开启你的机器人零件之旅"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {boxTypes.map((box, index) => {
          const rarityConfig = config.rarities[box.type];
          const price = BLIND_BOX_PRICES[box.type];
          const canAfford = credits >= price;
          const rarityBorder = getRarityBorderClass(box.type);

          return (
            <motion.div
              key={box.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: canAfford ? 1.02 : 1 }}
              className={`card border-2 ${rarityBorder} p-6 relative overflow-hidden ${
                !canAfford ? 'opacity-50' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${rarityConfig.bgColor}, rgba(30, 41, 59, 0.9))`,
              }}
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(box.particles)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: rarityConfig.color,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0.2, 0.8, 0.2],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                <div
                  className="w-24 h-24 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: rarityConfig.bgColor }}
                >
                  <Box
                    className="w-12 h-12"
                    style={{ color: rarityConfig.color }}
                  />
                </div>

                <h3
                  className="font-display text-xl font-bold text-center mb-2"
                  style={{ color: rarityConfig.color }}
                >
                  {box.name}
                </h3>

                <p className="text-sm text-white/60 text-center mb-4">
                  {box.description}
                </p>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <Coins className="w-4 h-4 text-neon-orange" />
                  <span className="font-mono font-bold text-neon-orange">
                    {price}
                  </span>
                </div>

                <div className="text-xs text-white/40 text-center mb-4">
                  概率:
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {Object.entries(config.rarities).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: value.bgColor,
                          color: value.color,
                        }}
                      >
                        {value.name} {Math.round(value.probability * 100)}%
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBox(box.type)}
                  disabled={!canAfford || isAnimating}
                  className={`w-full btn ${
                    canAfford ? 'btn-primary' : 'btn-ghost opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {canAfford ? '开启盲盒' : '信用点不足'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal
        isOpen={openingBox !== null}
        onClose={() => {
          if (!isAnimating) {
            setOpeningBox(null);
            setRevealedParts([]);
          }
        }}
        title={openingBox ? `${config.rarities[openingBox].name}盲盒` : ''}
        size="xl"
      >
        <div className="min-h-[300px] flex flex-col items-center justify-center">
          {isAnimating && (
            <motion.div
              className="relative"
              animate={{ rotateY: 360 }}
              transition={{ duration: 1.5, repeat: 1, ease: 'easeInOut' }}
            >
              <Box
                className="w-32 h-32"
                style={{
                  color: openingBox ? config.rarities[openingBox].color : '#3B82F6',
                }}
              />
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: openingBox
                      ? config.rarities[openingBox].color
                      : '#3B82F6',
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: Math.cos((i / 12) * Math.PI * 2) * 80,
                    y: Math.sin((i / 12) * Math.PI * 2) * 80,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          )}

          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <h3 className="font-display text-xl font-bold text-center text-neon-green mb-6 glow-text-green">
                恭喜获得以下零件！
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {revealedParts.map((part, index) => (
                    <motion.div
                      key={part.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <PartCard part={part} size="md" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="flex justify-center gap-4">
                <button onClick={handleConfirmParts} className="btn btn-success px-8">
                  <Sparkles className="w-4 h-4 mr-2" />
                  收入仓库
                </button>
              </div>
            </motion.div>
          )}

          {isAnimating && (
            <p className="mt-6 font-mono text-white/60 animate-pulse">
              正在扫描零件...
            </p>
          )}
        </div>
      </Modal>
    </PageContainer>
  );
}
