import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Scale,
  Gauge,
  Layers,
  Heart,
  AlertTriangle,
  CheckCircle,
  Zap,
  Save,
  RotateCcw,
  Package,
  Bot,
  Sparkles,
  X,
} from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { PartSlot } from '../components/PartSlot';
import { DraggablePart } from '../components/DraggablePart';
import { PartCard } from '../components/PartCard';
import { StatBar } from '../components/StatBar';
import { Modal } from '../components/Modal';
import { useGameStore } from '../store/useGameStore';
import { PART_TYPE_NAMES } from '../data/defaultConfig';
import { generateId } from '../utils/helpers';
import type { Part, PartType, Robot } from '../types';

const SLOT_ORDER: PartType[] = ['head', 'body', 'arm', 'leg', 'core', 'tool'];

export function AssemblyPage() {
  const [activePart, setActivePart] = useState<Part | null>(null);
  const [filterType, setFilterType] = useState<PartType | 'all'>('all');
  const [showSavePlan, setShowSavePlan] = useState(false);
  const [planName, setPlanName] = useState('');
  const [showAssembleConfirm, setShowAssembleConfirm] = useState(false);
  const [robotName, setRobotName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const parts = useGameStore((s) => s.parts);
  const robots = useGameStore((s) => s.robots);
  const config = useGameStore((s) => s.config);
  const selectedParts = useGameStore((s) => s.selectedParts);
  const setSelectedPart = useGameStore((s) => s.setSelectedPart);
  const clearSelectedParts = useGameStore((s) => s.clearSelectedParts);
  const calculateRobotStats = useGameStore((s) => s.calculateRobotStats);
  const addRobot = useGameStore((s) => s.addRobot);
  const addAssemblyPlan = useGameStore((s) => s.addAssemblyPlan);
  const removePart = useGameStore((s) => s.removePart);

  const availableParts = useMemo(() => {
    const usedPartIds = Object.values(selectedParts)
      .filter(Boolean)
      .map((p) => p!.id);

    let result = parts.filter((p) => !usedPartIds.includes(p.id));

    if (filterType !== 'all') {
      result = result.filter((p) => p.type === filterType);
    }

    return result;
  }, [parts, selectedParts, filterType]);

  const stats = useMemo(() => {
    return calculateRobotStats(selectedParts);
  }, [selectedParts, calculateRobotStats]);

  const canAssemble = useMemo(() => {
    const hasParts = Object.values(selectedParts).some(Boolean);
    const hasNoIssues = stats.compatibilityIssues.length === 0;
    const hasCore = selectedParts.core !== null;
    return hasParts && hasNoIssues && hasCore && !stats.isOverloaded;
  }, [selectedParts, stats]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActivePart(active.data.current?.part || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePart(null);

    if (!over) return;

    const part = active.data.current?.part as Part;
    const overId = over.id as string;

    if (overId.startsWith('slot-')) {
      const slotType = overId.replace('slot-', '') as PartType;

      if (part.type === slotType) {
        if (selectedParts[slotType]) {
          setSelectedPart(slotType, part);
        } else {
          setSelectedPart(slotType, part);
        }
      }
    }
  };

  const handleRemovePart = (slotType: PartType) => {
    setSelectedPart(slotType, null);
  };

  const handleSavePlan = () => {
    if (!planName.trim()) return;

    addAssemblyPlan({
      id: generateId(),
      name: planName.trim(),
      parts: { ...selectedParts },
      savedAt: Date.now(),
    });

    setPlanName('');
    setShowSavePlan(false);
  };

  const handleAssemble = () => {
    if (!canAssemble || !robotName.trim()) return;

    const usedPartIds = Object.values(selectedParts)
      .filter(Boolean)
      .map((p) => p!.id);

    usedPartIds.forEach((id) => removePart(id));

    const newRobot: Robot = {
      id: generateId(),
      name: robotName.trim(),
      parts: { ...selectedParts },
      ...stats,
      durability: stats.maxDurability,
      repairCount: 0,
      createdAt: Date.now(),
    };

    addRobot(newRobot);
    clearSelectedParts();
    setRobotName('');
    setShowAssembleConfirm(false);
  };

  return (
    <PageContainer
      title="组装车间"
      subtitle={`已组装机器人: ${robots.length} | 可用零件: ${parts.length}`}
      actions={
        <>
          <button onClick={clearSelectedParts} className="btn btn-ghost">
            <RotateCcw className="w-4 h-4 mr-2" />
            清空
          </button>
          <button
            onClick={() => setShowSavePlan(true)}
            className="btn btn-secondary"
            disabled={!Object.values(selectedParts).some(Boolean)}
          >
            <Save className="w-4 h-4 mr-2" />
            保存方案
          </button>
          <button
            onClick={() => setShowAssembleConfirm(true)}
            className="btn btn-primary"
            disabled={!canAssemble}
          >
            <Bot className="w-4 h-4 mr-2" />
            组装机器人
          </button>
        </>
      }
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <div className="card p-4 sticky top-24">
              <h3 className="font-display font-bold text-neon-blue mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                可用零件
              </h3>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    filterType === 'all'
                      ? 'bg-neon-blue text-white'
                      : 'bg-background-tertiary text-white/60 hover:bg-background-tertiary/80'
                  }`}
                >
                  全部
                </button>
                {Object.entries(PART_TYPE_NAMES).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFilterType(key as PartType)}
                    className={`px-3 py-1 rounded-lg text-xs transition-all ${
                      filterType === key
                        ? 'bg-neon-blue text-white'
                        : 'bg-background-tertiary text-white/60 hover:bg-background-tertiary/80'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {availableParts.length === 0 ? (
                  <div className="text-center py-8 text-white/30">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>没有可用零件</p>
                  </div>
                ) : (
                  availableParts.map((part) => (
                    <DraggablePart key={part.id} part={part} />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="card p-6">
              <h3 className="font-display font-bold text-neon-blue mb-6 text-center text-xl">
                <Wrench className="w-6 h-6 inline mr-2" />
                装配区域
              </h3>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                {SLOT_ORDER.map((slotType) => (
                  <div key={slotType} className="group">
                    <PartSlot
                      slotType={slotType}
                      part={selectedParts[slotType]}
                      onRemove={() => handleRemovePart(slotType)}
                    />
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-white/40 mt-6">
                拖拽左侧零件到对应槽位 | 需要核心零件才能组装
              </p>
            </div>

            <div className="card p-4 mt-6">
              <h4 className="font-display font-bold text-white mb-3">套装效果</h4>
              {stats.activeSetBonuses.length === 0 ? (
                <p className="text-white/40 text-sm">暂无激活的套装效果</p>
              ) : (
                <div className="space-y-2">
                  {stats.activeSetBonuses.map((setId) => {
                    const setConfig = config.setBonuses[setId];
                    if (!setConfig) return null;
                    return (
                      <motion.div
                        key={setId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 bg-neon-purple/10 rounded-lg border border-neon-purple/30"
                      >
                        <p className="font-bold text-neon-purple">
                          <Sparkles className="w-4 h-4 inline mr-1" />
                          {setConfig.name}
                        </p>
                        <p className="text-xs text-white/60">{setConfig.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="card p-4 sticky top-24">
              <h3 className="font-display font-bold text-neon-green mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                实时属性
              </h3>

              <div className="space-y-4">
                <StatBar
                  label="总重量"
                  value={stats.totalWeight}
                  max={200}
                  color="blue"
                />
                <div>
                  <StatBar
                    label="总能耗"
                    value={stats.totalEnergy}
                    max={config.overloadRules.threshold}
                    color="orange"
                  />
                  {stats.isOverloaded && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-2 p-2 bg-neon-red/10 rounded-lg border border-neon-red/30"
                    >
                      <Zap className="w-4 h-4 text-neon-red animate-pulse" />
                      <span className="text-xs text-neon-red">
                        能量过载！性能下降 {config.overloadRules.performancePenalty}%
                      </span>
                    </motion.div>
                  )}
                </div>
                <StatBar
                  label="技能槽"
                  value={stats.totalSkillSlots}
                  max={20}
                  color="purple"
                />
                <StatBar
                  label="耐久度"
                  value={stats.maxDurability}
                  max={200}
                  color="green"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle">
                <h4 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-neon-orange" />
                  兼容性检测
                </h4>
                {stats.compatibilityIssues.length === 0 ? (
                  <div className="flex items-center gap-2 text-neon-green text-sm">
                    <CheckCircle className="w-4 h-4" />
                    所有零件兼容
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.compatibilityIssues.map((issue, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2 p-2 bg-neon-red/10 rounded-lg"
                      >
                        <AlertTriangle className="w-4 h-4 text-neon-red flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-neon-red">{issue}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">组装状态:</span>
                  {canAssemble ? (
                    <span className="text-neon-green font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      可以组装
                    </span>
                  ) : (
                    <span className="text-neon-red flex items-center gap-1">
                      <X className="w-4 h-4" />
                      无法组装
                    </span>
                  )}
                </div>
                {!canAssemble && (
                  <p className="text-xs text-white/40 mt-2">
                    {!selectedParts.core && '需要核心零件 | '}
                    {stats.compatibilityIssues.length > 0 && '存在兼容性问题 | '}
                    {stats.isOverloaded && '能量过载'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activePart && (
            <div className="opacity-80 scale-105">
              <PartCard part={activePart} size="md" />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Modal
        isOpen={showSavePlan}
        onClose={() => setShowSavePlan(false)}
        title="保存组装方案"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">方案名称</label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="输入方案名称..."
              className="input"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowSavePlan(false)} className="btn btn-ghost">
              取消
            </button>
            <button
              onClick={handleSavePlan}
              className="btn btn-primary"
              disabled={!planName.trim()}
            >
              保存
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAssembleConfirm}
        onClose={() => setShowAssembleConfirm(false)}
        title="确认组装"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            组装后，使用的零件将从仓库中移除并用于构建机器人。确定要继续吗？
          </p>
          <div>
            <label className="block text-sm text-white/70 mb-1">机器人名称</label>
            <input
              type="text"
              value={robotName}
              onChange={(e) => setRobotName(e.target.value)}
              placeholder="为你的机器人命名..."
              className="input"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-background-tertiary rounded-lg">
              <p className="text-white/50">总重量</p>
              <p className="font-mono font-bold text-neon-blue">{stats.totalWeight}</p>
            </div>
            <div className="p-3 bg-background-tertiary rounded-lg">
              <p className="text-white/50">总能耗</p>
              <p className="font-mono font-bold text-neon-orange">{stats.totalEnergy}</p>
            </div>
            <div className="p-3 bg-background-tertiary rounded-lg">
              <p className="text-white/50">技能槽</p>
              <p className="font-mono font-bold text-neon-purple">{stats.totalSkillSlots}</p>
            </div>
            <div className="p-3 bg-background-tertiary rounded-lg">
              <p className="text-white/50">耐久度</p>
              <p className="font-mono font-bold text-neon-green">{stats.maxDurability}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAssembleConfirm(false)} className="btn btn-ghost">
              取消
            </button>
            <button
              onClick={handleAssemble}
              className="btn btn-primary"
              disabled={!robotName.trim()}
            >
              <Bot className="w-4 h-4 mr-2" />
              确认组装
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
