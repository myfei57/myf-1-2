import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Snowflake,
  Zap,
  Droplets,
  Wind,
  Play,
  X,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  History,
  Sparkles,
  Trash2,
  Plus,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  Link as LinkIcon,
  Layers,
  Gauge,
  Scale,
  Heart,
  Shield,
  ShieldCheck,
  Brain,
  Link2,
  ZapOff,
  ArrowUpRight,
} from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { PartCard } from '../components/PartCard';
import { Modal } from '../components/Modal';
import { useGameStore } from '../store/useGameStore';
import { PART_TYPE_NAMES } from '../data/defaultConfig';
import type {
  Part,
  MutationEnvironment,
  PartType,
  Rarity,
  IncubationResult,
} from '../types';
import {
  getRiskLevelLabel,
  formatDuration,
  getRarityColorClass,
  getRarityBorderClass,
} from '../utils/helpers';

const ENV_ICONS: Record<MutationEnvironment, typeof Flame> = {
  heat: Flame,
  cold: Snowflake,
  magnetic: Zap,
  humid: Droplets,
  dust: Wind,
};

const ENV_ORDER: MutationEnvironment[] = ['heat', 'cold', 'magnetic', 'humid', 'dust'];

const OUTCOME_LABELS: Record<string, { label: string; icon: typeof Plus; color: string }> = {
  trait_gained: { label: '获得变异词条', icon: Sparkles, color: 'text-neon-purple' },
  compatibility_changed: { label: '兼容性变化', icon: LinkIcon, color: 'text-neon-cyan' },
  durability_lost: { label: '耐久损失', icon: Heart, color: 'text-neon-red' },
  set_bonus_changed: { label: '套装变化', icon: Layers, color: 'text-neon-orange' },
  rarity_upgrade: { label: '稀有度提升!', icon: ArrowUpRight, color: 'text-rarity-legendary' },
  no_change: { label: '无变化', icon: Minus, color: 'text-white/40' },
};

export function IncubationPage() {
  const [, forceTick] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<MutationEnvironment | null>(null);
  const [showSelectPart, setShowSelectPart] = useState(false);
  const [showResult, setShowResult] = useState<{ result: IncubationResult; part: Part } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<PartType | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [cancelSlot, setCancelSlot] = useState<MutationEnvironment | null>(null);

  const parts = useGameStore((s) => s.parts);
  const config = useGameStore((s) => s.config);
  const materials = useGameStore((s) => s.materials);
  const incubationSlots = useGameStore((s) => s.incubationSlots);
  const incubationRecords = useGameStore((s) => s.incubationRecords);
  const startIncubation = useGameStore((s) => s.startIncubation);
  const cancelIncubation = useGameStore((s) => s.cancelIncubation);
  const collectIncubationResult = useGameStore((s) => s.collectIncubationResult);
  const tickIncubations = useGameStore((s) => s.tickIncubations);
  const clearIncubationRecords = useGameStore((s) => s.clearIncubationRecords);

  useEffect(() => {
    const interval = setInterval(() => {
      tickIncubations();
      forceTick((t) => t + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [tickIncubations]);

  const runningCount = incubationSlots.filter((s) => s.isRunning).length;
  const completedCount = incubationSlots.filter((s) => s.isCompleted).length;
  const totalMaterialsUsed = incubationRecords.reduce((sum, r) => sum + r.materialsUsed, 0);
  const successRate =
    incubationRecords.length > 0
      ? Math.round((incubationRecords.filter((r) => r.success).length / incubationRecords.length) * 100)
      : 0;

  const getSlotProgress = (slot: (typeof incubationSlots)[0]) => {
    if (!slot.startTime || !slot.isRunning) return 0;
    const elapsed = (Date.now() - slot.startTime) / 1000;
    return Math.min(100, (elapsed / slot.durationSeconds) * 100);
  };

  const getRemainingTime = (slot: (typeof incubationSlots)[0]) => {
    if (!slot.startTime || !slot.isRunning) return 0;
    const elapsed = (Date.now() - slot.startTime) / 1000;
    return Math.max(0, slot.durationSeconds - elapsed);
  };

  const availableParts = useMemo(() => {
    let result = [...parts];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      );
    }
    if (filterType !== 'all') {
      result = result.filter((p) => p.type === filterType);
    }
    if (filterRarity !== 'all') {
      result = result.filter((p) => p.rarity === filterRarity);
    }
    return result;
  }, [parts, searchTerm, filterType, filterRarity]);

  const handleSelectSlot = (env: MutationEnvironment) => {
    const slot = incubationSlots.find((s) => s.environment === env);
    if (!slot) return;

    if (slot.isCompleted) {
      const result = collectIncubationResult(slot.id);
      if (result.success && result.result && result.part) {
        setShowResult({ result: result.result, part: result.part });
      }
      return;
    }

    if (slot.isRunning) {
      setCancelSlot(env);
      return;
    }

    setSelectedSlot(env);
    setShowSelectPart(true);
  };

  const handleStartIncubation = (partId: string) => {
    if (!selectedSlot) return;
    const slot = incubationSlots.find((s) => s.environment === selectedSlot);
    if (!slot) return;

    const success = startIncubation(slot.id, partId, selectedSlot);
    if (success) {
      setShowSelectPart(false);
      setSelectedSlot(null);
    } else {
      alert('材料不足或并发数已满，无法开始孵化！');
    }
  };

  const handleCancelConfirm = () => {
    if (!cancelSlot) return;
    const slot = incubationSlots.find((s) => s.environment === cancelSlot);
    if (!slot) return;
    const result = cancelIncubation(slot.id);
    if (result.partReturned) {
      alert(`已取消孵化！退还材料：${result.materialsRefunded}`);
    }
    setCancelSlot(null);
  };

  const handleClearHistory = () => {
    if (confirm('确定要清空所有孵化记录吗？')) {
      clearIncubationRecords();
    }
  };

  return (
    <PageContainer
      title="变异孵化舱"
      subtitle={`进行中: ${runningCount} | 待领取: ${completedCount} | 材料: ${materials}`}
      actions={
        <button onClick={() => setShowHistory(true)} className="btn btn-secondary">
          <History className="w-4 h-4 mr-2" />
          孵化记录 ({incubationRecords.length})
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-blue/20 rounded-lg">
              <Package className="w-5 h-5 text-neon-blue" />
            </div>
            <div>
              <p className="text-xs text-white/50">总材料消耗</p>
              <p className="font-mono font-bold text-xl text-white">{totalMaterialsUsed}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-green/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <p className="text-xs text-white/50">成功率</p>
              <p className="font-mono font-bold text-xl text-neon-green">{successRate}%</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-purple/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-neon-purple" />
            </div>
            <div>
              <p className="text-xs text-white/50">总孵化次数</p>
              <p className="font-mono font-bold text-xl text-white">{incubationRecords.length}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-orange/20 rounded-lg">
              <Clock className="w-5 h-5 text-neon-orange" />
            </div>
            <div>
              <p className="text-xs text-white/50">并发槽位</p>
              <p className="font-mono font-bold text-xl text-neon-orange">
                {runningCount}/{config.incubation.maxConcurrentIncubations}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <AnimatePresence>
          {ENV_ORDER.map((env, idx) => {
            const slot = incubationSlots.find((s) => s.environment === env)!;
            const envConfig = config.incubation.environments[env];
            const Icon = ENV_ICONS[env];
            const progress = getSlotProgress(slot);
            const remaining = getRemainingTime(slot);
            const risk = getRiskLevelLabel(envConfig.riskLevel);
            const totalCost = Math.ceil(
              envConfig.materialCostPerSecond * envConfig.baseDurationSeconds
            );
            const canAfford = materials >= totalCost;
            const rarityBorder = getRarityBorderClass;

            return (
              <motion.div
                key={env}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.08 }}
              >
                <div
                  className={`card overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
                    slot.isCompleted
                      ? 'border-neon-green shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse'
                      : slot.isRunning
                      ? 'border-opacity-80'
                      : 'border-border-subtle hover:border-opacity-60'
                  }`}
                  style={{
                    borderColor: slot.isCompleted
                      ? undefined
                      : slot.isRunning
                      ? envConfig.color
                      : undefined,
                    boxShadow: slot.isRunning ? `0 0 15px ${envConfig.glowColor}` : undefined,
                  }}
                  onClick={() => handleSelectSlot(env)}
                >
                  <div
                    className="p-4 relative"
                    style={{
                      background: `linear-gradient(135deg, ${envConfig.bgColor}, rgba(30, 41, 59, 0.95))`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: envConfig.bgColor }}
                      >
                        <Icon className="w-8 h-8" style={{ color: envConfig.color }} />
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${risk.color}`}
                          style={{ backgroundColor: envConfig.bgColor }}
                        >
                          {risk.label}
                        </span>
                      </div>
                    </div>

                    <h3
                      className="font-display font-bold text-lg mb-1"
                      style={{ color: envConfig.color }}
                    >
                      {envConfig.name}
                    </h3>
                    <p className="text-xs text-white/50 mb-4 line-clamp-2">
                      {envConfig.description}
                    </p>

                    {slot.isCompleted && slot.partSnapshot ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-background-tertiary/50 rounded-lg border border-neon-green/30">
                          <div className="flex items-center gap-2 text-neon-green mb-1">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-bold text-sm">孵化完成!</span>
                          </div>
                          <p
                            className={`text-xs font-mono ${getRarityColorClass(
                              slot.partSnapshot.rarity
                            )}`}
                          >
                            {slot.partSnapshot.name}
                          </p>
                        </div>
                        <button
                          className="btn btn-success w-full text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSlot(env);
                          }}
                        >
                          <ChevronRight className="w-4 h-4 mr-1" />
                          领取结果
                        </button>
                      </div>
                    ) : slot.isRunning && slot.partSnapshot ? (
                      <div className="space-y-3">
                        <div className="p-2 bg-background-tertiary/50 rounded-lg">
                          <p
                            className={`text-xs font-mono truncate ${getRarityColorClass(
                              slot.partSnapshot.rarity
                            )}`}
                          >
                            {slot.partSnapshot.name}
                          </p>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span>进度</span>
                            <span className="font-mono">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: envConfig.color,
                                width: `${progress}%`,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-white/50">
                          <Clock className="w-3 h-3" />
                          <span>剩余 {formatDuration(remaining)}</span>
                        </div>
                        <div className="text-xs text-white/40">
                          已消耗材料: {slot.materialsConsumed}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-background-tertiary/50 rounded-lg">
                            <span className="text-white/50 block">耗时</span>
                            <span className="font-mono text-white">
                              {formatDuration(envConfig.baseDurationSeconds)}
                            </span>
                          </div>
                          <div className="p-2 bg-background-tertiary/50 rounded-lg">
                            <span className="text-white/50 block">材料</span>
                            <span
                              className={`font-mono ${
                                canAfford ? 'text-neon-green' : 'text-neon-red'
                              }`}
                            >
                              {totalCost}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">变异概率</span>
                          <span className="font-mono text-neon-purple">
                            {Math.round(envConfig.mutationChance * 100)}%
                          </span>
                        </div>
                        <button
                          className={`btn w-full text-sm ${
                            canAfford &&
                            runningCount < config.incubation.maxConcurrentIncubations
                              ? 'btn-primary'
                              : 'btn-ghost opacity-50'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSlot(env);
                          }}
                          disabled={
                            !canAfford ||
                            runningCount >= config.incubation.maxConcurrentIncubations
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          放入零件
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="card p-4">
        <h3 className="font-display font-bold text-neon-blue mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          变异风险与概率说明
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {ENV_ORDER.map((env) => {
            const envConfig = config.incubation.environments[env];
            const Icon = ENV_ICONS[env];
            return (
              <div
                key={env}
                className="p-3 rounded-lg"
                style={{ backgroundColor: envConfig.bgColor, borderLeft: `3px solid ${envConfig.color}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: envConfig.color }} />
                  <span className="font-bold text-sm" style={{ color: envConfig.color }}>
                    {envConfig.name}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">变异概率</span>
                    <span className="font-mono text-neon-purple">
                      {Math.round(envConfig.mutationChance * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">耐久损失率</span>
                    <span className="font-mono text-neon-red">
                      {Math.round(envConfig.durabilityLossChance * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">兼容变化</span>
                    <span className="font-mono text-neon-cyan">
                      {Math.round(envConfig.compatibilityChangeChance * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">正面倾向</span>
                    <span className="font-mono text-neon-green">
                      {Math.round(envConfig.positiveTraitBias * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={showSelectPart}
        onClose={() => {
          setShowSelectPart(false);
          setSelectedSlot(null);
        }}
        title={selectedSlot ? `选择零件 - ${config.incubation.environments[selectedSlot].name}` : '选择零件'}
        size="xl"
      >
        <div className="space-y-4">
          {selectedSlot && (
            <div
              className="p-3 rounded-lg flex items-center gap-3"
              style={{
                backgroundColor: config.incubation.environments[selectedSlot].bgColor,
                borderLeft: `3px solid ${config.incubation.environments[selectedSlot].color}`,
              }}
            >
              {(() => {
                const env = selectedSlot;
                const Icon = ENV_ICONS[env];
                const envConfig = config.incubation.environments[env];
                const totalCost = Math.ceil(
                  envConfig.materialCostPerSecond * envConfig.baseDurationSeconds
                );
                return (
                  <>
                    <Icon className="w-6 h-6 flex-shrink-0" style={{ color: envConfig.color }} />
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: envConfig.color }}>
                        {envConfig.name}
                      </p>
                      <p className="text-xs text-white/60">{envConfig.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50">材料消耗</p>
                      <p
                        className={`font-mono font-bold ${
                          materials >= totalCost ? 'text-neon-green' : 'text-neon-red'
                        }`}
                      >
                        {totalCost}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="搜索零件..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/50" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as PartType | 'all')}
                className="input max-w-[130px]"
              >
                <option value="all">全部类型</option>
                {Object.entries(PART_TYPE_NAMES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value as Rarity | 'all')}
                className="input max-w-[130px]"
              >
                <option value="all">全部稀有度</option>
                {Object.entries(config.rarities).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {availableParts.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <Package className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>没有可用的零件</p>
                <p className="text-xs mt-1">请先去盲盒页面获取零件</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableParts.map((part) => (
                  <div
                    key={part.id}
                    onClick={() => handleStartIncubation(part.id)}
                    className="cursor-pointer transition-transform hover:scale-[1.02]"
                  >
                    <PartCard part={part} size="sm" selectable />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-border-subtle">
            <button
              onClick={() => {
                setShowSelectPart(false);
                setSelectedSlot(null);
              }}
              className="btn btn-ghost"
            >
              取消
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showResult !== null}
        onClose={() => setShowResult(null)}
        title="孵化结果"
        size="lg"
      >
        {showResult && (
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="w-48">
                <PartCard part={showResult.part} size="lg" />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-display font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neon-purple" />
                变异结果
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {showResult.result.outcome.map((o, idx) => {
                  const info = OUTCOME_LABELS[o];
                  const OutcomeIcon = info.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-3 rounded-lg border bg-background-tertiary/50 flex items-center gap-2 ${info.color}`}
                    >
                      <OutcomeIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-bold">{info.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {showResult.result.traitsGained.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-display font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-neon-purple" />
                  获得词条 ({showResult.result.traitsGained.length})
                </h4>
                <div className="space-y-2">
                  {showResult.result.traitsGained.map((trait, idx) => (
                    <motion.div
                      key={trait.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className={`p-3 rounded-lg border-2 ${
                        trait.isPositive
                          ? 'border-neon-green/50 bg-neon-green/10'
                          : 'border-neon-red/50 bg-neon-red/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            trait.isPositive ? 'bg-neon-green/20' : 'bg-neon-red/20'
                          }`}
                        >
                          {trait.isPositive ? (
                            <ArrowUp className="w-4 h-4 text-neon-green" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-neon-red" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-bold ${
                              trait.isPositive ? 'text-neon-green' : 'text-neon-red'
                            }`}
                          >
                            {trait.name}
                          </p>
                          <p className="text-xs text-white/60 mt-0.5">{trait.description}</p>
                          <p className="text-xs font-mono mt-1 text-white/50">
                            效果: {trait.effect}
                            {trait.value > 0 ? ' +' : ' '}
                            {trait.value}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {(showResult.result.compatibilityAdded.length > 0 ||
              showResult.result.compatibilityRemoved.length > 0) && (
              <div className="space-y-2">
                <h4 className="font-display font-bold text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-neon-cyan" />
                  兼容性变化
                </h4>
                <div className="flex flex-wrap gap-2">
                  {showResult.result.compatibilityAdded.map((t, i) => (
                    <span
                      key={`add-${i}`}
                      className="px-3 py-1 rounded-full bg-neon-green/20 text-neon-green text-xs border border-neon-green/30"
                    >
                      +{PART_TYPE_NAMES[t]}
                    </span>
                  ))}
                  {showResult.result.compatibilityRemoved.map((t, i) => (
                    <span
                      key={`rm-${i}`}
                      className="px-3 py-1 rounded-full bg-neon-red/20 text-neon-red text-xs border border-neon-red/30"
                    >
                      -{PART_TYPE_NAMES[t]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {showResult.result.durabilityLost > 0 && (
              <div className="space-y-2">
                <h4 className="font-display font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-neon-red" />
                  耐久损耗
                </h4>
                <div className="p-3 rounded-lg bg-neon-red/10 border border-neon-red/30">
                  <p className="text-neon-red font-mono font-bold">
                    -{showResult.result.durabilityLost} 耐久度
                  </p>
                </div>
              </div>
            )}

            {showResult.result.rarityUpgraded && showResult.result.newRarity && (
              <div className="space-y-2">
                <h4 className="font-display font-bold text-white flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-rarity-legendary" />
                  稀有度提升!
                </h4>
                <div className="p-3 rounded-lg bg-rarity-legendary/10 border border-rarity-legendary/30">
                  <p className="text-rarity-legendary font-bold text-lg glow-text-orange">
                    {config.rarities[showResult.result.newRarity].name}
                  </p>
                </div>
              </div>
            )}

            {showResult.result.setBonusChanged.from !== showResult.result.setBonusChanged.to && (
              <div className="space-y-2">
                <h4 className="font-display font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-neon-orange" />
                  套装词条变化
                </h4>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-neon-orange/10 border border-neon-orange/30">
                  <span className="px-2 py-1 rounded bg-background-tertiary text-sm">
                    {showResult.result.setBonusChanged.from
                      ? config.setBonuses[showResult.result.setBonusChanged.from]?.name
                      : '无'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-neon-orange" />
                  <span className="px-2 py-1 rounded bg-neon-orange/20 text-neon-orange font-bold text-sm">
                    {showResult.result.setBonusChanged.to
                      ? config.setBonuses[showResult.result.setBonusChanged.to]?.name
                      : '无'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <button onClick={() => setShowResult(null)} className="btn btn-primary">
                确认
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={cancelSlot !== null}
        onClose={() => setCancelSlot(null)}
        title="确认取消孵化"
        size="sm"
      >
        {cancelSlot && (
          <div className="space-y-4">
            {(() => {
              const slot = incubationSlots.find((s) => s.environment === cancelSlot);
              if (!slot || !slot.startTime || !slot.partSnapshot) return null;
              const elapsed = (Date.now() - slot.startTime) / 1000;
              const progress = Math.min(1, elapsed / slot.durationSeconds);
              const used = Math.ceil(slot.materialsConsumed * progress);
              const refund = slot.materialsConsumed - used;

              return (
                <>
                  <div className="space-y-3">
                    <p className="text-white/70">
                      确定要取消
                      <span
                        className={`mx-1 font-bold ${getRarityColorClass(
                          slot.partSnapshot.rarity
                        )}`}
                      >
                        {slot.partSnapshot.name}
                      </span>
                      的孵化吗？
                    </p>
                    <div className="p-3 bg-background-tertiary rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/50">已消耗材料</span>
                        <span className="font-mono text-neon-red">-{used}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">退还材料</span>
                        <span className="font-mono text-neon-green">+{refund}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border-subtle">
                        <span className="text-white/50">孵化进度</span>
                        <span className="font-mono">{Math.round(progress * 100)}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/40">
                      零件将被原样退还到仓库
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setCancelSlot(null)} className="btn btn-ghost">
                      继续孵化
                    </button>
                    <button onClick={handleCancelConfirm} className="btn btn-danger">
                      <X className="w-4 h-4 mr-1" />
                      确认取消
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="孵化记录"
        size="xl"
        actions={
          incubationRecords.length > 0 ? (
            <button onClick={handleClearHistory} className="btn btn-ghost text-xs">
              <Trash2 className="w-4 h-4 mr-1" />
              清空记录
            </button>
          ) : undefined
        }
      >
        {incubationRecords.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <History className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p>还没有孵化记录</p>
            <p className="text-xs mt-1">开始你的第一次孵化吧！</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {incubationRecords.map((record, idx) => {
              const envConfig = config.incubation.environments[record.environment];
              const Icon = ENV_ICONS[record.environment];
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`p-4 rounded-xl border-2 ${
                    record.success
                      ? 'border-neon-green/30 bg-neon-green/5'
                      : 'border-neon-red/30 bg-neon-red/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: envConfig.bgColor }}
                    >
                      <Icon className="w-5 h-5" style={{ color: envConfig.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-display font-bold text-white truncate">
                          {record.partName}
                        </h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            record.success
                              ? 'bg-neon-green/20 text-neon-green'
                              : 'bg-neon-red/20 text-neon-red'
                          }`}
                        >
                          {record.success ? '成功' : '失败'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs mb-2">
                        <span
                          className="px-2 py-0.5 rounded"
                          style={{ backgroundColor: envConfig.bgColor, color: envConfig.color }}
                        >
                          {envConfig.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-background-tertiary text-white/60">
                          材料: {record.materialsUsed}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-background-tertiary text-white/60">
                          耗时: {formatDuration(record.durationSeconds)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {record.result.outcome.map((o, i) => {
                          const info = OUTCOME_LABELS[o];
                          const OIcon = info.icon;
                          return (
                            <span
                              key={i}
                              className={`text-xs px-2 py-0.5 rounded bg-background-tertiary/50 flex items-center gap-1 ${info.color}`}
                            >
                              <OIcon className="w-3 h-3" />
                              {info.label}
                            </span>
                          );
                        })}
                      </div>
                      {record.result.traitsGained.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border-subtle">
                          <div className="flex flex-wrap gap-1">
                            {record.result.traitsGained.map((t, i) => (
                              <span
                                key={i}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  t.isPositive
                                    ? 'bg-neon-green/10 text-neon-green'
                                    : 'bg-neon-red/10 text-neon-red'
                                }`}
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
