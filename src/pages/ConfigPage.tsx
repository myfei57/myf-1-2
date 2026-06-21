import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Gem,
  Sparkles,
  Zap,
  Wrench,
  Target,
  Recycle,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { PageContainer } from '../components/PageContainer';
import { Modal } from '../components/Modal';
import { StatBar } from '../components/StatBar';
import type { Rarity, MissionType, GameConfig } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultConfig';

type TabType = 'rarities' | 'sets' | 'overload' | 'repair' | 'missions' | 'recycling';

const TAB_CONFIG = [
  { id: 'rarities' as TabType, label: '稀有度', icon: Gem, color: 'text-neon-orange' },
  { id: 'sets' as TabType, label: '套装词条', icon: Sparkles, color: 'text-neon-purple' },
  { id: 'overload' as TabType, label: '过载规则', icon: Zap, color: 'text-neon-red' },
  { id: 'repair' as TabType, label: '返修规则', icon: Wrench, color: 'text-neon-green' },
  { id: 'missions' as TabType, label: '任务适配', icon: Target, color: 'text-neon-blue' },
  { id: 'recycling' as TabType, label: '材料回收', icon: Recycle, color: 'text-neon-green' },
];

const MISSION_TYPE_NAMES: Record<MissionType, string> = {
  transport: '搬运',
  cleaning: '清洁',
  rescue: '救援',
  combat: '格斗',
};

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function ConfigPage() {
  const { config, updateConfig, resetConfig } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('rarities');
  const [editedConfig, setEditedConfig] = useState<GameConfig>(config);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleConfigChange = <K extends keyof GameConfig>(
    key: K,
    value: GameConfig[K]
  ) => {
    setEditedConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateConfig(editedConfig);
    setHasChanges(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    setEditedConfig(DEFAULT_CONFIG);
    resetConfig();
    setHasChanges(false);
    setShowResetConfirm(false);
  };

  const InputField = ({
    label,
    value,
    onChange,
    type = 'text',
    min,
    max,
    step,
    hint,
  }: {
    label: string;
    value: string | number;
    onChange: (value: string | number) => void;
    type?: 'text' | 'number' | 'color';
    min?: number;
    max?: number;
    step?: number;
    hint?: string;
  }) => (
    <div className="mb-4">
      <label className="block text-sm text-white/70 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)
        }
        min={min}
        max={max}
        step={step}
        className="w-full px-4 py-2.5 bg-background-tertiary border border-border-subtle rounded-lg text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all font-mono"
      />
      {hint && <p className="text-xs text-white/40 mt-1">{hint}</p>}
    </div>
  );

  const renderRaritiesTab = () => (
    <div className="space-y-6">
      <p className="text-white/60 text-sm mb-4">
        调整各稀有度的概率和视觉效果。概率总和应为100%。
      </p>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">概率总和</span>
          <span
            className={`font-mono font-bold ${
              Math.abs(
                Object.values(editedConfig.rarities).reduce((sum, r) => sum + r.probability, 0) -
                  1
              ) < 0.01
                ? 'text-neon-green'
                : 'text-neon-red'
            }`}
          >
            {(
              Object.values(editedConfig.rarities).reduce((sum, r) => sum + r.probability, 0) * 100
            ).toFixed(1)}
            %
          </span>
        </div>
        <StatBar
          value={Object.values(editedConfig.rarities).reduce(
            (sum, r) => sum + r.probability,
            0
          ) * 100}
          max={100}
          color={
            Math.abs(
              Object.values(editedConfig.rarities).reduce((sum, r) => sum + r.probability, 0) -
                1
            ) < 0.01
              ? 'green'
              : 'red'
          }
          showLabel={false}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {RARITY_ORDER.map((rarity) => {
          const rConfig = editedConfig.rarities[rarity];
          return (
            <motion.div
              key={rarity}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4"
              style={{ borderColor: rConfig.color + '40' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: rConfig.bgColor }}
                >
                  <Gem className="w-5 h-5" style={{ color: rConfig.color }} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">{rConfig.name}</h3>
                  <p className="text-xs text-white/40 uppercase">{rarity}</p>
                </div>
              </div>

              <InputField
                label="名称"
                value={rConfig.name}
                onChange={(v) =>
                  handleConfigChange('rarities', {
                    ...editedConfig.rarities,
                    [rarity]: { ...rConfig, name: v as string },
                  })
                }
              />

              <InputField
                label="概率 (0-1)"
                value={rConfig.probability}
                onChange={(v) =>
                  handleConfigChange('rarities', {
                    ...editedConfig.rarities,
                    [rarity]: { ...rConfig, probability: v as number },
                  })
                }
                type="number"
                min={0}
                max={1}
                step={0.01}
              />

              <div className="mb-4">
                <label className="block text-sm text-white/70 mb-1.5">主题颜色</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={rConfig.color}
                    onChange={(e) =>
                      handleConfigChange('rarities', {
                        ...editedConfig.rarities,
                        [rarity]: { ...rConfig, color: e.target.value },
                      })
                    }
                    className="w-12 h-10 bg-background-tertiary border border-border-subtle rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={rConfig.color}
                    onChange={(e) =>
                      handleConfigChange('rarities', {
                        ...editedConfig.rarities,
                        [rarity]: { ...rConfig, color: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 bg-background-tertiary border border-border-subtle rounded-lg text-white font-mono text-sm focus:outline-none focus:border-neon-blue"
                  />
                </div>
              </div>

              <div
                className="h-20 rounded-lg flex items-center justify-center text-white/50 text-sm"
                style={{
                  background: `linear-gradient(135deg, ${rConfig.color}20, ${rConfig.color}05)`,
                  boxShadow: `0 0 20px ${rConfig.color}30`,
                }}
              >
                预览效果
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderSetsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/60 text-sm">
          管理套装词条，当装配足够数量的同套装零件时激活效果。
        </p>
        <button
          onClick={() => {
            const newId = `set-${Date.now()}`;
            handleConfigChange('setBonuses', {
              ...editedConfig.setBonuses,
              [newId]: {
                name: '新套装',
                description: '套装描述',
                requiredParts: 3,
                effects: {},
              },
            });
          }}
          className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加套装
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(editedConfig.setBonuses).map(([setId, setConfig]) => (
          <motion.div
            key={setId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 relative"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-neon-purple" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">{setConfig.name}</h3>
                  <p className="text-xs text-white/40">{setId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newSets = { ...editedConfig.setBonuses };
                  delete newSets[setId];
                  handleConfigChange('setBonuses', newSets);
                }}
                className="p-1.5 rounded-lg bg-neon-red/10 text-neon-red hover:bg-neon-red/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <InputField
              label="套装名称"
              value={setConfig.name}
              onChange={(v) =>
                handleConfigChange('setBonuses', {
                  ...editedConfig.setBonuses,
                  [setId]: { ...setConfig, name: v as string },
                })
              }
            />

            <div className="mb-4">
              <label className="block text-sm text-white/70 mb-1.5">描述</label>
              <textarea
                value={setConfig.description}
                onChange={(e) =>
                  handleConfigChange('setBonuses', {
                    ...editedConfig.setBonuses,
                    [setId]: { ...setConfig, description: e.target.value },
                  })
                }
                rows={2}
                className="w-full px-4 py-2.5 bg-background-tertiary border border-border-subtle rounded-lg text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all resize-none"
              />
            </div>

            <InputField
              label="所需零件数"
              value={setConfig.requiredParts}
              onChange={(v) =>
                handleConfigChange('setBonuses', {
                  ...editedConfig.setBonuses,
                  [setId]: { ...setConfig, requiredParts: v as number },
                })
              }
              type="number"
              min={2}
              max={6}
            />

            <div className="border-t border-border-subtle pt-4 mt-4">
              <h4 className="text-sm font-bold text-white/70 mb-3">效果加成</h4>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="重量加成"
                  value={setConfig.effects.weightBonus || 0}
                  onChange={(v) =>
                    handleConfigChange('setBonuses', {
                      ...editedConfig.setBonuses,
                      [setId]: {
                        ...setConfig,
                        effects: { ...setConfig.effects, weightBonus: v as number },
                      },
                    })
                  }
                  type="number"
                  hint="负数为减少"
                />
                <InputField
                  label="能耗加成"
                  value={setConfig.effects.energyBonus || 0}
                  onChange={(v) =>
                    handleConfigChange('setBonuses', {
                      ...editedConfig.setBonuses,
                      [setId]: {
                        ...setConfig,
                        effects: { ...setConfig.effects, energyBonus: v as number },
                      },
                    })
                  }
                  type="number"
                  hint="负数为减少"
                />
                <InputField
                  label="技能槽加成"
                  value={setConfig.effects.skillBonus || 0}
                  onChange={(v) =>
                    handleConfigChange('setBonuses', {
                      ...editedConfig.setBonuses,
                      [setId]: {
                        ...setConfig,
                        effects: { ...setConfig.effects, skillBonus: v as number },
                      },
                    })
                  }
                  type="number"
                />
                <InputField
                  label="耐久加成"
                  value={setConfig.effects.durabilityBonus || 0}
                  onChange={(v) =>
                    handleConfigChange('setBonuses', {
                      ...editedConfig.setBonuses,
                      [setId]: {
                        ...setConfig,
                        effects: { ...setConfig.effects, durabilityBonus: v as number },
                      },
                    })
                  }
                  type="number"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderOverloadTab = () => (
    <div className="max-w-2xl">
      <p className="text-white/60 text-sm mb-6">
        配置过载机制，当能耗超过阈值时触发过载惩罚。
      </p>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-neon-red/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-neon-red" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-lg">过载规则</h3>
            <p className="text-sm text-white/40">能耗超过阈值时触发</p>
          </div>
        </div>

        <InputField
          label="能耗阈值"
          value={editedConfig.overloadRules.threshold}
          onChange={(v) =>
            handleConfigChange('overloadRules', {
              ...editedConfig.overloadRules,
              threshold: v as number,
            })
          }
          type="number"
          min={1}
          hint="超过此值的机器人将进入过载状态"
        />

        <InputField
          label="耐久度惩罚"
          value={editedConfig.overloadRules.durabilityPenalty}
          onChange={(v) =>
            handleConfigChange('overloadRules', {
              ...editedConfig.overloadRules,
              durabilityPenalty: v as number,
            })
          }
          type="number"
          min={0}
          hint="任务失败时额外损失的耐久度"
        />

        <InputField
          label="成功率惩罚 (%)"
          value={editedConfig.overloadRules.performancePenalty}
          onChange={(v) =>
            handleConfigChange('overloadRules', {
              ...editedConfig.overloadRules,
              performancePenalty: v as number,
            })
          }
          type="number"
          min={0}
          max={100}
          hint="过载状态下任务成功率降低的百分比"
        />

        <div className="bg-neon-red/10 border border-neon-red/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-neon-red flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-neon-red font-medium">过载效果示例</p>
              <p className="text-xs text-white/50 mt-1">
                当机器人能耗超过 {editedConfig.overloadRules.threshold} 时，
                任务成功率降低 {editedConfig.overloadRules.performancePenalty}%，
                失败时额外损失 {editedConfig.overloadRules.durabilityPenalty} 点耐久度。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRepairTab = () => (
    <div className="max-w-2xl">
      <p className="text-white/60 text-sm mb-6">
        配置维修机制，包括成功率、衰减率和材料消耗。
      </p>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-neon-green" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-lg">返修规则</h3>
            <p className="text-sm text-white/40">机器人维修相关参数</p>
          </div>
        </div>

        <InputField
          label="基础成功率"
          value={editedConfig.repairRules.baseSuccessRate}
          onChange={(v) =>
            handleConfigChange('repairRules', {
              ...editedConfig.repairRules,
              baseSuccessRate: v as number,
            })
          }
          type="number"
          min={0.1}
          max={1}
          step={0.05}
          hint="首次维修的成功率 (0-1)"
        />

        <InputField
          label="成功率衰减"
          value={editedConfig.repairRules.degradeRate}
          onChange={(v) =>
            handleConfigChange('repairRules', {
              ...editedConfig.repairRules,
              degradeRate: v as number,
            })
          }
          type="number"
          min={0}
          max={0.5}
          step={0.01}
          hint="每次返修后成功率降低的值"
        />

        <InputField
          label="最大返修次数"
          value={editedConfig.repairRules.maxRepairs}
          onChange={(v) =>
            handleConfigChange('repairRules', {
              ...editedConfig.repairRules,
              maxRepairs: v as number,
            })
          }
          type="number"
          min={1}
          hint="机器人最多可维修的次数"
        />

        <InputField
          label="每点耐久材料消耗"
          value={editedConfig.repairRules.materialCostPerPoint}
          onChange={(v) =>
            handleConfigChange('repairRules', {
              ...editedConfig.repairRules,
              materialCostPerPoint: v as number,
            })
          }
          type="number"
          min={1}
          hint="修复1点耐久度需要的材料数"
        />

        <div className="bg-background-tertiary rounded-xl p-4">
          <p className="text-sm text-white/70 mb-3">维修成功率预览</p>
          <div className="space-y-2">
            {Array.from({ length: editedConfig.repairRules.maxRepairs }).map((_, i) => {
              const rate = Math.max(
                0.1,
                editedConfig.repairRules.baseSuccessRate -
                  i * editedConfig.repairRules.degradeRate
              );
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-20">第 {i + 1} 次</span>
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${rate * 100}%`,
                        backgroundColor:
                          rate >= 0.7 ? '#10b981' : rate >= 0.4 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-mono w-12 text-right ${
                      rate >= 0.7
                        ? 'text-neon-green'
                        : rate >= 0.4
                        ? 'text-neon-orange'
                        : 'text-neon-red'
                    }`}
                  >
                    {Math.round(rate * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMissionsTab = () => (
    <div className="max-w-3xl">
      <p className="text-white/60 text-sm mb-6">
        配置各任务类型对机器人属性的权重分配，用于计算任务适配度。
      </p>

      <div className="space-y-4">
        {(['transport', 'cleaning', 'rescue', 'combat'] as MissionType[]).map(
          (missionType) => {
            const weights = editedConfig.missionWeights[missionType];
            const total =
              weights.weight + weights.energy + weights.skillSlots + weights.durability;

            return (
              <motion.div
                key={missionType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-white text-lg">
                    {MISSION_TYPE_NAMES[missionType]}任务
                  </h3>
                  <span
                    className={`text-sm font-mono font-bold ${
                      Math.abs(total - 1) < 0.01 ? 'text-neon-green' : 'text-neon-red'
                    }`}
                  >
                    总计: {(total * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="重量权重"
                    value={weights.weight}
                    onChange={(v) =>
                      handleConfigChange('missionWeights', {
                        ...editedConfig.missionWeights,
                        [missionType]: { ...weights, weight: v as number },
                      })
                    }
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                  />
                  <InputField
                    label="能耗权重"
                    value={weights.energy}
                    onChange={(v) =>
                      handleConfigChange('missionWeights', {
                        ...editedConfig.missionWeights,
                        [missionType]: { ...weights, energy: v as number },
                      })
                    }
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                  />
                  <InputField
                    label="技能槽权重"
                    value={weights.skillSlots}
                    onChange={(v) =>
                      handleConfigChange('missionWeights', {
                        ...editedConfig.missionWeights,
                        [missionType]: { ...weights, skillSlots: v as number },
                      })
                    }
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                  />
                  <InputField
                    label="耐久度权重"
                    value={weights.durability}
                    onChange={(v) =>
                      handleConfigChange('missionWeights', {
                        ...editedConfig.missionWeights,
                        [missionType]: { ...weights, durability: v as number },
                      })
                    }
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>

                <div className="mt-4 flex gap-1 h-2">
                  <div
                    className="h-full rounded-l-full bg-neon-blue"
                    style={{ width: `${weights.weight * 100}%` }}
                  />
                  <div
                    className="h-full bg-neon-orange"
                    style={{ width: `${weights.energy * 100}%` }}
                  />
                  <div
                    className="h-full bg-neon-purple"
                    style={{ width: `${weights.skillSlots * 100}%` }}
                  />
                  <div
                    className="h-full rounded-r-full bg-neon-green"
                    style={{ width: `${weights.durability * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/40 mt-1">
                  <span>重量</span>
                  <span>能耗</span>
                  <span>技能槽</span>
                  <span>耐久度</span>
                </div>
              </motion.div>
            );
          }
        )}
      </div>
    </div>
  );

  const renderRecyclingTab = () => (
    <div className="max-w-2xl">
      <p className="text-white/60 text-sm mb-6">
        配置各稀有度零件拆解时的材料回收比例。
      </p>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center">
            <Recycle className="w-6 h-6 text-neon-green" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-lg">材料回收比例</h3>
            <p className="text-sm text-white/40">拆解零件时返还材料的比例</p>
          </div>
        </div>

        <div className="space-y-4">
          {RARITY_ORDER.map((rarity) => {
            const rate = editedConfig.recyclingRates[rarity];
            const rConfig = editedConfig.rarities[rarity];

            return (
              <div key={rarity} className="bg-background-tertiary rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: rConfig.color }}
                    />
                    <span className="font-medium text-white">{rConfig.name}</span>
                  </div>
                  <span className="font-mono font-bold text-neon-green">
                    {Math.round(rate * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={rate}
                    onChange={(e) =>
                      handleConfigChange('recyclingRates', {
                        ...editedConfig.recyclingRates,
                        [rarity]: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1 h-2 bg-background rounded-lg appearance-none cursor-pointer accent-neon-green"
                  />
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={rate}
                    onChange={(e) =>
                      handleConfigChange('recyclingRates', {
                        ...editedConfig.recyclingRates,
                        [rarity]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-20 px-3 py-1.5 bg-background border border-border-subtle rounded-lg text-white text-sm font-mono text-center focus:outline-none focus:border-neon-green"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-background-tertiary rounded-xl p-4">
          <p className="text-sm text-white/70 mb-2">回收示例</p>
          <p className="text-xs text-white/50">
            假设一个零件最大耐久为100，当前耐久为50，拆解回收材料 = 50 × 回收比例 × 2
          </p>
          <div className="grid grid-cols-5 gap-2 mt-3">
            {RARITY_ORDER.map((rarity) => (
              <div key={rarity} className="text-center">
                <p className="text-xs text-white/40">{editedConfig.rarities[rarity].name}</p>
                <p className="font-mono text-sm text-white">
                  {Math.round(50 * editedConfig.recyclingRates[rarity] * 2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'rarities':
        return renderRaritiesTab();
      case 'sets':
        return renderSetsTab();
      case 'overload':
        return renderOverloadTab();
      case 'repair':
        return renderRepairTab();
      case 'missions':
        return renderMissionsTab();
      case 'recycling':
        return renderRecyclingTab();
    }
  };

  return (
    <PageContainer
      title="配置管理"
      subtitle="自定义游戏参数，调整稀有度、套装、过载等规则"
      actions={
        <div className="flex items-center gap-3">
          {showSaveSuccess && (
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-neon-green text-sm"
            >
              ✓ 已保存
            </motion.span>
          )}
          {hasChanges && (
            <span className="text-neon-orange text-sm">有未保存的更改</span>
          )}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
          >
            <RotateCcw className="w-4 h-4" />
            重置默认
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 text-sm py-2 px-6 rounded-xl font-bold transition-all ${
              hasChanges
                ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:shadow-lg hover:shadow-neon-blue/20'
                : 'bg-background-tertiary text-white/30 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
        </div>
      }
    >
      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <div className="space-y-1 sticky top-24">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-background-tertiary border border-neon-blue/50'
                      : 'hover:bg-background-tertiary/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? tab.color : 'text-white/50'}`} />
                  <span
                    className={`font-medium ${isActive ? 'text-white' : 'text-white/70'}`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0">{renderTabContent()}</div>
      </div>

      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="重置配置"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-neon-orange/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-neon-orange" />
          </div>
          <div>
            <p className="text-white font-medium mb-1">确定要重置所有配置吗？</p>
            <p className="text-white/60 text-sm">
              此操作将把所有配置恢复为默认值，当前的自定义设置将丢失。
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowResetConfirm(false)}
            className="flex-1 btn-secondary py-3"
          >
            取消
          </button>
          <button onClick={handleReset} className="flex-1 btn-danger py-3">
            <RotateCcw className="w-4 h-4 inline mr-2" />
            确认重置
          </button>
        </div>
      </Modal>
    </PageContainer>
  );
}
