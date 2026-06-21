import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Package,
  Truck,
  Sparkles,
  Droplets,
  Users,
  Heart,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Star,
  ChevronRight,
  Trophy,
  AlertTriangle,
  RotateCcw,
  History,
} from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { RobotCard } from '../components/RobotCard';
import { StatBar } from '../components/StatBar';
import { Modal } from '../components/Modal';
import { useGameStore } from '../store/useGameStore';
import { MISSIONS } from '../data/defaultConfig';
import { formatDate } from '../utils/helpers';
import type { MissionType, Robot, Mission, MissionRecord } from '../types';

const missionIcons: Record<MissionType, typeof Package> = {
  transport: Truck,
  cleaning: Sparkles,
  rescue: Heart,
  combat: Swords,
};

const missionColors: Record<MissionType, string> = {
  transport: 'neon-blue',
  cleaning: 'neon-cyan',
  rescue: 'neon-green',
  combat: 'neon-red',
};

const missionBgClasses: Record<MissionType, string> = {
  transport: 'bg-neon-blue/20',
  cleaning: 'bg-neon-cyan/20',
  rescue: 'bg-neon-green/20',
  combat: 'bg-neon-red/20',
};

const missionTextClasses: Record<MissionType, string> = {
  transport: 'text-neon-blue',
  cleaning: 'text-neon-cyan',
  rescue: 'text-neon-green',
  combat: 'text-neon-red',
};

const missionRingClasses: Record<MissionType, string> = {
  transport: 'ring-2 ring-neon-blue shadow-neon-blue',
  cleaning: 'ring-2 ring-neon-cyan shadow-neon-cyan',
  rescue: 'ring-2 ring-neon-green shadow-neon-green',
  combat: 'ring-2 ring-neon-red shadow-neon-red',
};

export function MissionsPage() {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [missionResult, setMissionResult] = useState<MissionRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const robots = useGameStore((s) => s.robots);
  const missionRecords = useGameStore((s) => s.missionRecords);
  const calculateAdaptability = useGameStore((s) => s.calculateAdaptability);
  const executeMission = useGameStore((s) => s.executeMission);
  const config = useGameStore((s) => s.config);

  const availableRobots = useMemo(() => {
    return robots.filter((r) => r.durability > 0);
  }, [robots]);

  const adaptability = useMemo(() => {
    if (!selectedRobot || !selectedMission) return 0;
    return calculateAdaptability(selectedRobot, selectedMission);
  }, [selectedRobot, selectedMission, calculateAdaptability]);

  const handleExecuteMission = () => {
    if (!selectedRobot || !selectedMission) return;

    setIsExecuting(true);
    setMissionResult(null);

    setTimeout(() => {
      const result = executeMission(selectedRobot.id, selectedMission.id);
      setMissionResult(result);
      setIsExecuting(false);
      setSelectedRobot(null);
    }, 2000);
  };

  const successRate = Math.min(95, Math.max(10, adaptability));

  return (
    <PageContainer
      title="任务派遣"
      subtitle={`可用机器人: ${availableRobots.length} | 已完成任务: ${missionRecords.filter((r) => r.success).length}`}
      actions={
        <button onClick={() => setShowHistory(true)} className="btn btn-secondary">
          <History className="w-4 h-4 mr-2" />
          任务记录
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <h3 className="font-display font-bold text-neon-blue mb-4 flex items-center gap-2">
            <Swords className="w-5 h-5" />
            可用任务
          </h3>
          <div className="space-y-4">
            {MISSIONS.map((mission, index) => {
              const Icon = missionIcons[mission.type];
              const isSelected = selectedMission?.id === mission.id;

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedMission(mission);
                    setMissionResult(null);
                  }}
                  className={`card p-4 cursor-pointer transition-all ${
                    isSelected ? missionRingClasses[mission.type] : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${missionBgClasses[mission.type]}`}>
                      <Icon className={`w-6 h-6 ${missionTextClasses[mission.type]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-display font-bold text-white">{mission.name}</h4>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < mission.difficulty ? 'text-neon-orange fill-neon-orange' : 'text-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-white/50 mb-2">{mission.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {mission.requirements.weight && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-neon-blue/20 text-neon-blue">
                            重量 ≥ {mission.requirements.weight}
                          </span>
                        )}
                        {mission.requirements.energy && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-neon-orange/20 text-neon-orange">
                            能耗 ≥ {mission.requirements.energy}
                          </span>
                        )}
                        {mission.requirements.skillSlots && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple">
                            技能 ≥ {mission.requirements.skillSlots}
                          </span>
                        )}
                        {mission.requirements.durability && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-neon-green/20 text-neon-green">
                            耐久 ≥ {mission.requirements.durability}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border-subtle">
                        <span className="text-xs text-neon-green">
                          +{mission.rewards.credits} 信用点
                        </span>
                        <span className="text-xs text-neon-orange">
                          +{mission.rewards.materials} 材料
                        </span>
                        {mission.rewards.blindBox && (
                          <span className="text-xs text-neon-purple">
                            +{config.rarities[mission.rewards.blindBox].name}盲盒
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7">
          {selectedMission ? (
            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="font-display font-bold text-neon-green mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  选择机器人
                </h3>
                {availableRobots.length === 0 ? (
                  <div className="text-center py-8 text-white/30">
                    <RotateCcw className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>没有可用的机器人</p>
                    <p className="text-xs mt-1">先去组装车间组装一个吧！</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableRobots.map((robot) => (
                      <RobotCard
                        key={robot.id}
                        robot={robot}
                        onClick={() => setSelectedRobot(robot)}
                        selected={selectedRobot?.id === robot.id}
                      />
                    ))}
                  </div>
                )}
              </div>

              {selectedRobot && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-6"
                >
                  <h3 className="font-display font-bold text-xl text-white mb-4 text-center">
                    任务预览
                  </h3>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-white/50 mb-1">任务</p>
                      <p className="font-display font-bold text-neon-blue">
                        {selectedMission.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-white/50 mb-1">执行者</p>
                      <p className="font-display font-bold text-neon-green">
                        {selectedRobot.name}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70">任务适配度</span>
                      <span
                        className={`font-mono font-bold text-xl ${
                          adaptability >= 70
                            ? 'text-neon-green'
                            : adaptability >= 40
                            ? 'text-neon-orange'
                            : 'text-neon-red'
                        }`}
                      >
                        {adaptability}%
                      </span>
                    </div>
                    <StatBar
                      label=""
                      value={adaptability}
                      max={100}
                      color={
                        adaptability >= 70
                          ? 'green'
                          : adaptability >= 40
                          ? 'orange'
                          : 'red'
                      }
                      showValue={false}
                    />
                    <p className="text-xs text-white/40 mt-2 text-center">
                      预计成功率: {successRate}%
                    </p>
                  </div>

                  {selectedRobot.isOverloaded && (
                    <div className="flex items-center gap-2 p-3 bg-neon-red/10 rounded-lg border border-neon-red/30 mb-4">
                      <AlertTriangle className="w-4 h-4 text-neon-red" />
                      <span className="text-xs text-neon-red">
                        机器人处于过载状态，成功率下降 {config.overloadRules.performancePenalty}%
                      </span>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      onClick={handleExecuteMission}
                      disabled={isExecuting}
                      className="btn btn-primary px-8"
                    >
                      {isExecuting ? (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                          执行中...
                        </>
                      ) : (
                        <>
                          <Swords className="w-4 h-4 mr-2" />
                          开始任务
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {missionResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`card p-6 text-center ${
                      missionResult.success
                        ? 'border-neon-green/50'
                        : 'border-neon-red/50'
                    }`}
                  >
                    {missionResult.success ? (
                      <>
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-neon-orange" />
                        <h3 className="font-display text-2xl font-bold text-neon-green mb-2 glow-text-green">
                          任务成功！
                        </h3>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-16 h-16 mx-auto mb-4 text-neon-red" />
                        <h3 className="font-display text-2xl font-bold text-neon-red mb-2 glow-text-red">
                          任务失败
                        </h3>
                      </>
                    )}

                    <p className="text-white/50 mb-4">
                      适配度: {missionResult.adaptability}% | 耐久损耗: -{missionResult.durabilityLoss}
                    </p>

                    {missionResult.success && (
                      <div className="flex items-center justify-center gap-6 mb-4">
                        <div className="text-center">
                          <p className="text-sm text-white/50">信用点</p>
                          <p className="font-mono font-bold text-xl text-neon-orange">
                            +{missionResult.rewards.credits}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-white/50">材料</p>
                          <p className="font-mono font-bold text-xl text-neon-green">
                            +{missionResult.rewards.materials}
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setMissionResult(null)}
                      className="btn btn-secondary"
                    >
                      继续
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Swords className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <h3 className="font-display text-xl text-white/50 mb-2">选择一个任务</h3>
              <p className="text-white/30">从左侧列表中选择要执行的任务</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="任务记录"
        size="xl"
      >
        {missionRecords.length === 0 ? (
          <div className="text-center py-8 text-white/30">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无任务记录</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {[...missionRecords].reverse().map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 p-3 bg-background-tertiary rounded-lg"
              >
                {record.success ? (
                  <CheckCircle className="w-6 h-6 text-neon-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-neon-red flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">
                      {record.missionName}
                    </span>
                    <span className="text-white/40">→</span>
                    <span className="text-neon-blue truncate">{record.robotName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span>适配度: {record.adaptability}%</span>
                    <span>耐久损耗: -{record.durabilityLoss}</span>
                    <span className="text-neon-orange">
                      +{record.rewards.credits} 信用点
                    </span>
                    <span className="text-neon-green">
                      +{record.rewards.materials} 材料
                    </span>
                  </div>
                </div>
                <span className="text-xs text-white/30 flex-shrink-0">
                  {formatDate(record.completedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
