import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompare,
  Trash2,
  Scale,
  Gauge,
  Layers,
  Heart,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { PageContainer } from '../components/PageContainer';
import { PartCard } from '../components/PartCard';
import { StatBar } from '../components/StatBar';
import { Modal } from '../components/Modal';
import type { PartType, AssemblyPlan } from '../types';
import { PART_TYPE_NAMES } from '../data/defaultConfig';

export function ComparePage() {
  const { assemblyPlans, config, removeAssemblyPlan } = useGameStore();
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const togglePlanSelection = (planId: string) => {
    setSelectedPlanIds((prev) => {
      if (prev.includes(planId)) {
        return prev.filter((id) => id !== planId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), planId];
      }
      return [...prev, planId];
    });
  };

  const getPlanDetails = (plan: AssemblyPlan) => {
    const planParts = plan.parts;
    let totalWeight = 0;
    let totalEnergy = 0;
    let totalSkillSlots = 0;
    let maxDurability = 0;
    const activeSetBonuses: string[] = [];

    const partTypes: PartType[] = ['head', 'body', 'arm', 'leg', 'core', 'tool'];

    partTypes.forEach((type) => {
      const part = planParts[type];
      if (part) {
        totalWeight += part.weight;
        totalEnergy += part.energy;
        totalSkillSlots += part.skillSlots;
        maxDurability += part.maxDurability;
      }
    });

    const setCounts: Record<string, number> = {};
    partTypes.forEach((type) => {
      const part = planParts[type];
      if (part?.setBonus) {
        setCounts[part.setBonus] = (setCounts[part.setBonus] || 0) + 1;
        if (setCounts[part.setBonus] >= 3) {
          if (!activeSetBonuses.includes(part.setBonus)) {
            activeSetBonuses.push(part.setBonus);
          }
        }
      }
    });

    const isOverloaded = totalEnergy > config.overloadRules.threshold;
    const compatibilityIssues: string[] = [];

    partTypes.forEach((type) => {
      const part = planParts[type];
      if (!part) return;

      partTypes.forEach((otherType) => {
        if (type === otherType) return;
        const otherPart = planParts[otherType];
        if (!otherPart) return;

        if (!part.compatibility.includes(otherType)) {
          compatibilityIssues.push(`${part.name} 与 ${otherPart.name} 不兼容`);
        }
      });
    });

    const installedCount = Object.values(planParts).filter(Boolean).length;

    return {
      parts: planParts,
      totalWeight,
      totalEnergy,
      totalSkillSlots,
      maxDurability,
      isOverloaded,
      compatibilityIssues,
      activeSetBonuses,
      installedCount,
    };
  };

  const selectedPlans = useMemo(
    () => assemblyPlans.filter((p) => selectedPlanIds.includes(p.id)),
    [assemblyPlans, selectedPlanIds]
  );

  const selectedPlansDetails = useMemo(
    () => selectedPlans.map((plan) => ({ plan, details: getPlanDetails(plan) })),
    [selectedPlans]
  );

  const getBestValue = (
    key: 'totalWeight' | 'totalEnergy' | 'totalSkillSlots' | 'maxDurability'
  ) => {
    if (selectedPlansDetails.length === 0) return null;
    return Math.max(...selectedPlansDetails.map((d) => d.details[key]));
  };

  return (
    <PageContainer
      title="方案对比"
      subtitle="对比不同组装方案的属性，选择最优配置"
      actions={
        <div className="text-sm text-white/50">
          已选择 {selectedPlanIds.length}/3 个方案
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-neon-purple" />
            已保存方案
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {assemblyPlans.length === 0 ? (
              <div className="card p-8 text-center">
                <GitCompare className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">暂无保存的方案</p>
                <p className="text-xs text-white/30 mt-1">
                  去组装车间保存方案后再来对比
                </p>
              </div>
            ) : (
              assemblyPlans.map((plan) => {
                const details = getPlanDetails(plan);
                const isSelected = selectedPlanIds.includes(plan.id);

                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`card p-4 cursor-pointer transition-all relative ${
                      isSelected
                        ? 'ring-2 ring-neon-purple shadow-neon-purple'
                        : 'hover:border-neon-purple/50'
                    }`}
                    onClick={() => togglePlanSelection(plan.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-display font-bold text-white">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-white/40">
                          {details.installedCount}/6 零件 |{' '}
                          {new Date(plan.savedAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanToDelete(plan.id);
                        }}
                        className="p-1.5 rounded-lg bg-neon-red/10 text-neon-red hover:bg-neon-red/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-3">
                      <div className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-neon-blue" />
                        <span className="text-white/70">{details.totalWeight}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge
                          className={`w-3 h-3 ${
                            details.isOverloaded ? 'text-neon-red' : 'text-neon-orange'
                          }`}
                        />
                        <span
                          className={
                            details.isOverloaded ? 'text-neon-red' : 'text-white/70'
                          }
                        >
                          {details.totalEnergy}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-neon-purple" />
                        <span className="text-white/70">{details.totalSkillSlots}</span>
                      </div>
                    </div>

                    {details.activeSetBonuses.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {details.activeSetBonuses.map((setId) => {
                          const setConfig = config.setBonuses[setId];
                          if (!setConfig) return null;
                          return (
                            <span
                              key={setId}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple"
                            >
                              <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
                              {setConfig.name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-2 right-12 w-6 h-6 rounded-full bg-neon-purple flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {selectedPlanIds.indexOf(plan.id) + 1}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-neon-purple" />
            对比结果
          </h2>

          <AnimatePresence mode="wait">
            {selectedPlansDetails.length > 0 ? (
              <motion.div
                key="comparison"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="overflow-x-auto"
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-3 px-4 text-white/50 text-sm font-medium">
                        属性
                      </th>
                      {selectedPlansDetails.map(({ plan }) => (
                        <th
                          key={plan.id}
                          className="text-center py-3 px-4 text-white font-display font-bold"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>{plan.name}</span>
                            <button
                              onClick={() => togglePlanSelection(plan.id)}
                              className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50">
                    <tr>
                      <td className="py-4 px-4 text-white/70 text-sm">已装配零件</td>
                      {selectedPlansDetails.map(({ plan, details }) => (
                        <td key={plan.id} className="py-4 px-4 text-center">
                          <span className="text-white font-mono">
                            {details.installedCount}/6
                          </span>
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Scale className="w-4 h-4 text-neon-blue" />
                          总重量
                        </div>
                      </td>
                      {selectedPlansDetails.map(({ plan, details }) => {
                        const best = getBestValue('totalWeight');
                        return (
                          <td key={plan.id} className="py-4 px-4 text-center">
                            <span
                              className={`font-mono font-bold ${
                                details.totalWeight === best
                                  ? 'text-neon-green'
                                  : 'text-white'
                              }`}
                            >
                              {details.totalWeight}
                              {details.totalWeight === best && ' ★'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Gauge className="w-4 h-4 text-neon-orange" />
                          总能耗
                        </div>
                      </td>
                      {selectedPlansDetails.map(({ plan, details }) => {
                        const best = getBestValue('totalEnergy');
                        return (
                          <td key={plan.id} className="py-4 px-4 text-center">
                            <span
                              className={`font-mono font-bold ${
                                details.isOverloaded
                                  ? 'text-neon-red'
                                  : details.totalEnergy === best
                                  ? 'text-neon-green'
                                  : 'text-white'
                              }`}
                            >
                              {details.totalEnergy}
                              {details.isOverloaded && (
                                <span className="ml-1">(过载)</span>
                              )}
                              {details.totalEnergy === best &&
                                !details.isOverloaded &&
                                ' ★'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Layers className="w-4 h-4 text-neon-purple" />
                          技能槽
                        </div>
                      </td>
                      {selectedPlansDetails.map(({ plan, details }) => {
                        const best = getBestValue('totalSkillSlots');
                        return (
                          <td key={plan.id} className="py-4 px-4 text-center">
                            <span
                              className={`font-mono font-bold ${
                                details.totalSkillSlots === best
                                  ? 'text-neon-green'
                                  : 'text-white'
                              }`}
                            >
                              {details.totalSkillSlots}
                              {details.totalSkillSlots === best && ' ★'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Heart className="w-4 h-4 text-neon-green" />
                          最大耐久
                        </div>
                      </td>
                      {selectedPlansDetails.map(({ plan, details }) => {
                        const best = getBestValue('maxDurability');
                        return (
                          <td key={plan.id} className="py-4 px-4 text-center">
                            <span
                              className={`font-mono font-bold ${
                                details.maxDurability === best
                                  ? 'text-neon-green'
                                  : 'text-white'
                              }`}
                            >
                              {details.maxDurability}
                              {details.maxDurability === best && ' ★'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="py-4 px-4 text-white/70 text-sm">耐久度</td>
                      {selectedPlansDetails.map(({ plan, details }) => (
                        <td key={plan.id} className="py-4 px-4">
                          <StatBar
                            value={details.maxDurability}
                            max={600}
                            color="green"
                            size="sm"
                            showLabel={false}
                          />
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="py-4 px-4 text-white/70 text-sm">兼容性问题</td>
                      {selectedPlansDetails.map(({ plan, details }) => (
                        <td key={plan.id} className="py-4 px-4 text-center">
                          {details.compatibilityIssues.length > 0 ? (
                            <div className="flex items-center justify-center gap-1 text-neon-orange">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-sm">
                                {details.compatibilityIssues.length} 个问题
                              </span>
                            </div>
                          ) : (
                            <span className="text-neon-green text-sm">无</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="py-4 px-4 text-white/70 text-sm">激活套装</td>
                      {selectedPlansDetails.map(({ plan, details }) => (
                        <td key={plan.id} className="py-4 px-4">
                          {details.activeSetBonuses.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {details.activeSetBonuses.map((setId) => {
                                const setConfig = config.setBonuses[setId];
                                if (!setConfig) return null;
                                return (
                                  <span
                                    key={setId}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple"
                                  >
                                    <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
                                    {setConfig.name}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-white/30 text-sm">无</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>

                <div className="mt-6 pt-6 border-t border-border-subtle">
                  <h3 className="text-md font-display font-bold text-white mb-4">
                    零件详情
                  </h3>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {(['head', 'body', 'arm', 'leg', 'core', 'tool'] as PartType[]).map(
                      (type) => (
                        <div
                          key={type}
                          className="text-center text-xs text-white/50 py-2"
                        >
                          {PART_TYPE_NAMES[type]}
                        </div>
                      )
                    )}
                  </div>
                  {selectedPlansDetails.map(({ plan, details }) => (
                    <div key={plan.id} className="mb-6">
                      <p className="text-sm text-white/70 mb-2 font-medium">
                        {plan.name}
                      </p>
                      <div className="grid grid-cols-6 gap-2">
                        {(['head', 'body', 'arm', 'leg', 'core', 'tool'] as PartType[]).map(
                          (type) => {
                            const part = details.parts[type];
                            if (!part) {
                              return (
                                <div
                                  key={type}
                                  className="aspect-square bg-background-tertiary/30 rounded-lg flex items-center justify-center"
                                >
                                  <span className="text-white/20 text-xs">空</span>
                                </div>
                              );
                            }
                            return (
                              <div key={type} className="aspect-square">
                                <PartCard
                                  part={part}
                                  size="xs"
                                  showStats={false}
                                  showName={false}
                                />
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card p-12 text-center"
              >
                <GitCompare className="w-16 h-16 text-white/10 mx-auto mb-4" />
                <p className="text-white/50">选择方案进行对比</p>
                <p className="text-xs text-white/30 mt-2">
                  点击左侧方案卡片，最多选择3个方案
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Modal
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        title="删除方案"
      >
        <p className="text-white/70 mb-6">确定要删除这个组装方案吗？此操作无法撤销。</p>
        <div className="flex gap-3">
          <button
            onClick={() => setPlanToDelete(null)}
            className="flex-1 btn-secondary py-3"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (planToDelete) {
                removeAssemblyPlan(planToDelete);
                setSelectedPlanIds((prev) =>
                  prev.filter((id) => id !== planToDelete)
                );
                setPlanToDelete(null);
              }
            }}
            className="flex-1 btn-danger py-3"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            删除
          </button>
        </div>
      </Modal>
    </PageContainer>
  );
}
