import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Store,
  Part,
  PartType,
  Rarity,
  Robot,
  MissionRecord,
  RepairRecord,
  AssemblyPlan,
  GameConfig,
  MutationEnvironment,
  IncubationSlot,
  IncubationRecord,
} from '../types';
import {
  DEFAULT_CONFIG,
  MISSIONS,
  INITIAL_CREDITS,
  INITIAL_MATERIALS,
  BLIND_BOX_PRICES,
} from '../data/defaultConfig';
import {
  generateId,
  generateRandomPart,
  calculateRobotStats as calcStats,
  calculateAdaptability as calcAdapt,
  clamp,
  generateIncubationResult,
} from '../utils/helpers';

const EMPTY_SELECTED_PARTS: Record<PartType, Part | null> = {
  head: null,
  body: null,
  arm: null,
  leg: null,
  core: null,
  tool: null,
};

const createInitialSlots = (): IncubationSlot[] => {
  const environments: MutationEnvironment[] = ['heat', 'cold', 'magnetic', 'humid', 'dust'];
  return environments.map((env) => ({
    id: `slot-${env}`,
    environment: env,
    partId: null,
    partSnapshot: null,
    startTime: null,
    durationSeconds: 0,
    materialsConsumed: 0,
    isRunning: false,
    isCompleted: false,
  }));
};

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      parts: [],
      robots: [],
      credits: INITIAL_CREDITS,
      materials: INITIAL_MATERIALS,
      missionRecords: [],
      repairRecords: [],
      assemblyPlans: [],
      config: DEFAULT_CONFIG,
      selectedParts: { ...EMPTY_SELECTED_PARTS },
      incubationSlots: createInitialSlots(),
      incubationRecords: [],

      addPart: (part) => set((state) => ({ parts: [...state.parts, part] })),

      removePart: (partId) =>
        set((state) => ({
          parts: state.parts.filter((p) => p.id !== partId),
        })),

      updatePart: (partId, updates) =>
        set((state) => ({
          parts: state.parts.map((p) =>
            p.id === partId ? { ...p, ...updates } : p
          ),
        })),

      addRobot: (robot) => set((state) => ({ robots: [...state.robots, robot] })),

      removeRobot: (robotId) =>
        set((state) => ({
          robots: state.robots.filter((r) => r.id !== robotId),
        })),

      updateRobot: (robotId, updates) =>
        set((state) => ({
          robots: state.robots.map((r) =>
            r.id === robotId ? { ...r, ...updates } : r
          ),
        })),

      addCredits: (amount) =>
        set((state) => ({ credits: state.credits + amount })),

      spendCredits: (amount) => {
        const state = get();
        if (state.credits >= amount) {
          set({ credits: state.credits - amount });
          return true;
        }
        return false;
      },

      addMaterials: (amount) =>
        set((state) => ({ materials: state.materials + amount })),

      spendMaterials: (amount) => {
        const state = get();
        if (state.materials >= amount) {
          set({ materials: state.materials - amount });
          return true;
        }
        return false;
      },

      addMissionRecord: (record) =>
        set((state) => ({ missionRecords: [...state.missionRecords, record] })),

      addRepairRecord: (record) =>
        set((state) => ({ repairRecords: [...state.repairRecords, record] })),

      addAssemblyPlan: (plan) =>
        set((state) => ({ assemblyPlans: [...state.assemblyPlans, plan] })),

      removeAssemblyPlan: (planId) =>
        set((state) => ({
          assemblyPlans: state.assemblyPlans.filter((p) => p.id !== planId),
        })),

      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),

      resetConfig: () => set({ config: DEFAULT_CONFIG }),

      setSelectedPart: (slot, part) =>
        set((state) => ({
          selectedParts: {
            ...state.selectedParts,
            [slot]: part,
          },
        })),

      clearSelectedParts: () => set({ selectedParts: { ...EMPTY_SELECTED_PARTS } }),

      recyclePart: (partId) => {
        const state = get();
        const part = state.parts.find((p) => p.id === partId);
        if (!part) return;

        const recycleRate = state.config.recyclingRates[part.rarity];
        const materialsGained = Math.floor(part.maxDurability * recycleRate);

        set((s) => ({
          parts: s.parts.filter((p) => p.id !== partId),
          materials: s.materials + materialsGained,
        }));
      },

      repairRobot: (robotId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        if (!robot) return { success: false, cost: 0, restored: 0 };

        const { repairRules } = state.config;
        
        if (robot.repairCount >= repairRules.maxRepairs) {
          return { success: false, cost: 0, restored: 0 };
        }

        const durabilityNeeded = robot.maxDurability - robot.durability;
        const cost = durabilityNeeded * repairRules.materialCostPerPoint;

        if (!state.spendMaterials(cost)) {
          return { success: false, cost, restored: 0 };
        }

        const successRate = clamp(
          repairRules.baseSuccessRate - robot.repairCount * repairRules.degradeRate,
          0.1,
          repairRules.baseSuccessRate
        );
        const success = Math.random() < successRate;

        let restored = 0;
        if (success) {
          restored = durabilityNeeded;
          state.updateRobot(robotId, {
            durability: robot.maxDurability,
            repairCount: robot.repairCount + 1,
          });
        } else {
          state.updateRobot(robotId, {
            repairCount: robot.repairCount + 1,
          });
        }

        const record: RepairRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          materialCost: cost,
          success,
          durabilityRestored: restored,
          repairedAt: Date.now(),
        };
        state.addRepairRecord(record);

        return { success, cost, restored };
      },

      executeMission: (robotId, missionId) => {
        const state = get();
        const robot = state.robots.find((r) => r.id === robotId);
        const mission = MISSIONS.find((m) => m.id === missionId);

        if (!robot || !mission) {
          throw new Error('Robot or mission not found');
        }

        const adaptability = state.calculateAdaptability(robot, mission);
        const successChance = clamp(adaptability / 100, 0.1, 0.95);
        const success = Math.random() < successChance;

        let durabilityLoss = Math.floor(mission.difficulty * 5 * Math.random() + 5);
        if (robot.isOverloaded) {
          durabilityLoss += state.config.overloadRules.durabilityPenalty;
        }

        const newDurability = clamp(robot.durability - durabilityLoss, 0, robot.maxDurability);
        state.updateRobot(robotId, { durability: newDurability });

        let rewards = { credits: 0, materials: 0 };
        if (success) {
          rewards = {
            credits: mission.rewards.credits,
            materials: mission.rewards.materials,
          };
          state.addCredits(rewards.credits);
          state.addMaterials(rewards.materials);

          if (mission.rewards.blindBox) {
            const bonusParts = state.openBlindBox(mission.rewards.blindBox, true);
            bonusParts.forEach((p) => state.addPart(p));
          }
        }

        const record: MissionRecord = {
          id: generateId(),
          robotId: robot.id,
          robotName: robot.name,
          missionId: mission.id,
          missionName: mission.name,
          success,
          adaptability,
          rewards,
          durabilityLoss,
          completedAt: Date.now(),
        };
        state.addMissionRecord(record);

        return record;
      },

      calculateRobotStats: (parts) => {
        const state = get();
        return calcStats(parts, state.config);
      },

      calculateAdaptability: (robot, mission) => {
        const state = get();
        return calcAdapt(robot, mission, state.config);
      },

      generateRandomPart: (minRarity) => {
        const state = get();
        return generateRandomPart(state.config, minRarity);
      },

      openBlindBox: (type, free = false) => {
        const state = get();
        const price = BLIND_BOX_PRICES[type];

        if (!free && !state.spendCredits(price)) {
          return [];
        }

        const parts: Part[] = [];
        const count = type === 'legendary' ? 5 : type === 'epic' ? 4 : type === 'rare' ? 3 : 2;

        for (let i = 0; i < count; i++) {
          const part = generateRandomPart(state.config, type);
          parts.push(part);
        }

        return parts;
      },

      loadFromStorage: () => {},

      resetGame: () =>
        set({
          parts: [],
          robots: [],
          credits: INITIAL_CREDITS,
          materials: INITIAL_MATERIALS,
          missionRecords: [],
          repairRecords: [],
          assemblyPlans: [],
          selectedParts: { ...EMPTY_SELECTED_PARTS },
          incubationSlots: createInitialSlots(),
          incubationRecords: [],
        }),

      startIncubation: (slotId, partId, environment) => {
        const state = get();
        const part = state.parts.find((p) => p.id === partId);
        const slot = state.incubationSlots.find((s) => s.id === slotId);

        if (!part || !slot) return false;
        if (slot.isRunning || slot.isCompleted) return false;
        if (slot.environment !== environment) return false;

        const envConfig = state.config.incubation.environments[environment];
        const totalCost = Math.ceil(envConfig.materialCostPerSecond * envConfig.baseDurationSeconds);

        if (state.materials < totalCost) return false;

        const spent = state.spendMaterials(totalCost);
        if (!spent) return false;

        const runningCount = state.incubationSlots.filter((s) => s.isRunning).length;
        if (runningCount >= state.config.incubation.maxConcurrentIncubations) {
          state.addMaterials(totalCost);
          return false;
        }

        set((s) => ({
          parts: s.parts.filter((p) => p.id !== partId),
          incubationSlots: s.incubationSlots.map((s2) =>
            s2.id === slotId
              ? {
                  ...s2,
                  partId,
                  partSnapshot: {
                    ...part,
                    compatibility: [...part.compatibility],
                    mutations: [...part.mutations],
                  },
                  startTime: Date.now(),
                  durationSeconds: envConfig.baseDurationSeconds,
                  materialsConsumed: totalCost,
                  isRunning: true,
                  isCompleted: false,
                }
              : s2
          ),
        }));

        return true;
      },

      cancelIncubation: (slotId) => {
        const state = get();
        const slot = state.incubationSlots.find((s) => s.id === slotId);

        if (!slot || !slot.partId || !slot.startTime) {
          return { partReturned: false, materialsRefunded: 0 };
        }

        const elapsed = (Date.now() - slot.startTime) / 1000;
        const progress = Math.min(1, elapsed / slot.durationSeconds);
        const usedMaterials = Math.ceil(slot.materialsConsumed * progress);
        const refund = slot.materialsConsumed - usedMaterials;

        if (refund > 0) {
          state.addMaterials(refund);
        }

        if (slot.partSnapshot) {
          state.addPart({ ...slot.partSnapshot });
        }

        set((s) => ({
          incubationSlots: s.incubationSlots.map((s2) =>
            s2.id === slotId
              ? {
                  ...s2,
                  partId: null,
                  partSnapshot: null,
                  startTime: null,
                  durationSeconds: 0,
                  materialsConsumed: 0,
                  isRunning: false,
                  isCompleted: false,
                }
              : s2
          ),
        }));

        return { partReturned: !!slot.partSnapshot, materialsRefunded: refund };
      },

      collectIncubationResult: (slotId) => {
        const state = get();
        const slot = state.incubationSlots.find((s) => s.id === slotId);

        if (!slot || !slot.isCompleted || !slot.partSnapshot) {
          return { success: false, result: null, part: null };
        }

        const { result, mutatedPart } = generateIncubationResult(
          slot.partSnapshot,
          slot.environment,
          state.config
        );

        state.addPart(mutatedPart);

        const success =
          result.outcome.some((o) => o !== 'durability_lost' && o !== 'no_change') ||
          result.traitsGained.some((t) => t.isPositive);

        const record: IncubationRecord = {
          id: generateId(),
          partId: mutatedPart.id,
          partName: slot.partSnapshot.name,
          environment: slot.environment,
          startTime: slot.startTime!,
          endTime: Date.now(),
          durationSeconds: slot.durationSeconds,
          materialsUsed: slot.materialsConsumed,
          result,
          success,
        };
        state.addIncubationRecord(record);

        set((s) => ({
          incubationSlots: s.incubationSlots.map((s2) =>
            s2.id === slotId
              ? {
                  ...s2,
                  partId: null,
                  partSnapshot: null,
                  startTime: null,
                  durationSeconds: 0,
                  materialsConsumed: 0,
                  isRunning: false,
                  isCompleted: false,
                }
              : s2
          ),
        }));

        return { success: true, result, part: mutatedPart };
      },

      tickIncubations: () => {
        const state = get();
        const now = Date.now();
        let hasChanges = false;

        const updatedSlots = state.incubationSlots.map((slot) => {
          if (slot.isRunning && slot.startTime && !slot.isCompleted) {
            const elapsed = (now - slot.startTime) / 1000;
            if (elapsed >= slot.durationSeconds) {
              hasChanges = true;
              return { ...slot, isRunning: false, isCompleted: true };
            }
          }
          return slot;
        });

        if (hasChanges) {
          set({ incubationSlots: updatedSlots });
        }
      },

      addIncubationRecord: (record) =>
        set((state) => ({
          incubationRecords: [record, ...state.incubationRecords] })),

      clearIncubationRecords: () => set({ incubationRecords: [] }),
    }),
    {
      name: 'robot-workshop-storage',
      partialize: (state) => ({
        parts: state.parts,
        robots: state.robots,
        credits: state.credits,
        materials: state.materials,
        missionRecords: state.missionRecords,
        repairRecords: state.repairRecords,
        assemblyPlans: state.assemblyPlans,
        config: state.config,
        incubationSlots: state.incubationSlots,
        incubationRecords: state.incubationRecords,
      }),
    }
  )
);
