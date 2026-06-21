export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type PartType = 'head' | 'body' | 'arm' | 'leg' | 'core' | 'tool';

export type MissionType = 'transport' | 'cleaning' | 'rescue' | 'combat';

export type MutationEnvironment = 'heat' | 'cold' | 'magnetic' | 'humid' | 'dust';

export type MutationEffectType = 'weight' | 'energy' | 'skillSlots' | 'durability' | 'maxDurability' | 'compatibility' | 'setBonus';

export type MutationOutcomeType = 'trait_gained' | 'compatibility_changed' | 'durability_lost' | 'set_bonus_changed' | 'rarity_upgrade' | 'no_change';

export interface MutationTrait {
  id: string;
  name: string;
  description: string;
  effect: MutationEffectType;
  value: number;
  isPositive: boolean;
  icon: string;
}

export interface Part {
  id: string;
  name: string;
  type: PartType;
  rarity: Rarity;
  weight: number;
  energy: number;
  skillSlots: number;
  compatibility: PartType[];
  setBonus: string | null;
  durability: number;
  maxDurability: number;
  description: string;
  icon: string;
  mutations: MutationTrait[];
  mutationCount: number;
}

export interface MutationTraitConfig {
  id: string;
  name: string;
  description: string;
  effect: MutationEffectType;
  value: number;
  isPositive: boolean;
  icon: string;
  environments: MutationEnvironment[];
  rarityRequired?: Rarity;
}

export interface EnvironmentConfig {
  id: MutationEnvironment;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  glowColor: string;
  materialCostPerSecond: number;
  baseDurationSeconds: number;
  mutationChance: number;
  riskLevel: number;
  durabilityLossChance: number;
  maxDurabilityLossPercent: number;
  compatibilityChangeChance: number;
  positiveTraitBias: number;
}

export interface IncubationConfig {
  environments: Record<MutationEnvironment, EnvironmentConfig>;
  mutationTraits: MutationTraitConfig[];
  maxConcurrentIncubations: number;
  rarityUpgradeChance: number;
  setBonusChangeChance: number;
}

export interface IncubationSlot {
  id: string;
  environment: MutationEnvironment;
  partId: string | null;
  partSnapshot: Part | null;
  startTime: number | null;
  durationSeconds: number;
  materialsConsumed: number;
  isRunning: boolean;
  isCompleted: boolean;
}

export interface IncubationResult {
  outcome: MutationOutcomeType[];
  traitsGained: MutationTrait[];
  traitsLost: MutationTrait[];
  compatibilityAdded: PartType[];
  compatibilityRemoved: PartType[];
  durabilityLost: number;
  maxDurabilityChanged: number;
  setBonusChanged: { from: string | null; to: string | null };
  rarityUpgraded: boolean;
  newRarity: Rarity | null;
}

export interface IncubationRecord {
  id: string;
  partId: string;
  partName: string;
  environment: MutationEnvironment;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  materialsUsed: number;
  result: IncubationResult;
  success: boolean;
}

export interface Robot {
  id: string;
  name: string;
  parts: Record<PartType, Part | null>;
  totalWeight: number;
  totalEnergy: number;
  totalSkillSlots: number;
  durability: number;
  maxDurability: number;
  repairCount: number;
  isOverloaded: boolean;
  compatibilityIssues: string[];
  activeSetBonuses: string[];
  createdAt: number;
}

export interface Mission {
  id: string;
  name: string;
  type: MissionType;
  difficulty: number;
  requirements: {
    weight?: number;
    energy?: number;
    skillSlots?: number;
    durability?: number;
    partTypes?: PartType[];
  };
  rewards: {
    credits: number;
    materials: number;
    blindBox?: Rarity;
  };
  description: string;
  icon: string;
}

export interface MissionRecord {
  id: string;
  robotId: string;
  robotName: string;
  missionId: string;
  missionName: string;
  success: boolean;
  adaptability: number;
  rewards: { credits: number; materials: number };
  durabilityLoss: number;
  completedAt: number;
}

export interface RepairRecord {
  id: string;
  robotId: string;
  robotName: string;
  materialCost: number;
  success: boolean;
  durabilityRestored: number;
  repairedAt: number;
}

export interface AssemblyPlan {
  id: string;
  name: string;
  parts: Record<PartType, Part | null>;
  savedAt: number;
}

export interface RarityConfig {
  name: string;
  probability: number;
  color: string;
  bgColor: string;
  glowColor: string;
}

export interface SetBonusConfig {
  name: string;
  description: string;
  requiredParts: number;
  effects: {
    weightBonus?: number;
    energyBonus?: number;
    skillBonus?: number;
    durabilityBonus?: number;
  };
}

export interface OverloadRules {
  threshold: number;
  durabilityPenalty: number;
  performancePenalty: number;
}

export interface RepairRules {
  baseSuccessRate: number;
  degradeRate: number;
  maxRepairs: number;
  materialCostPerPoint: number;
}

export interface MissionWeights {
  weight: number;
  energy: number;
  skillSlots: number;
  durability: number;
}

export interface GameConfig {
  rarities: Record<Rarity, RarityConfig>;
  setBonuses: Record<string, SetBonusConfig>;
  overloadRules: OverloadRules;
  repairRules: RepairRules;
  missionWeights: Record<MissionType, MissionWeights>;
  recyclingRates: Record<Rarity, number>;
  incubation: IncubationConfig;
}

export interface GameState {
  parts: Part[];
  robots: Robot[];
  credits: number;
  materials: number;
  missionRecords: MissionRecord[];
  repairRecords: RepairRecord[];
  assemblyPlans: AssemblyPlan[];
  config: GameConfig;
  selectedParts: Record<PartType, Part | null>;
  incubationSlots: IncubationSlot[];
  incubationRecords: IncubationRecord[];
}

export interface GameActions {
  addPart: (part: Part) => void;
  removePart: (partId: string) => void;
  updatePart: (partId: string, updates: Partial<Part>) => void;
  addRobot: (robot: Robot) => void;
  removeRobot: (robotId: string) => void;
  updateRobot: (robotId: string, updates: Partial<Robot>) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  addMaterials: (amount: number) => void;
  spendMaterials: (amount: number) => boolean;
  addMissionRecord: (record: MissionRecord) => void;
  addRepairRecord: (record: RepairRecord) => void;
  addAssemblyPlan: (plan: AssemblyPlan) => void;
  removeAssemblyPlan: (planId: string) => void;
  updateConfig: (config: Partial<GameConfig>) => void;
  resetConfig: () => void;
  setSelectedPart: (slot: PartType, part: Part | null) => void;
  clearSelectedParts: () => void;
  recyclePart: (partId: string) => void;
  repairRobot: (robotId: string) => { success: boolean; cost: number; restored: number };
  executeMission: (robotId: string, missionId: string) => MissionRecord;
  calculateRobotStats: (parts: Record<PartType, Part | null>) => {
    totalWeight: number;
    totalEnergy: number;
    totalSkillSlots: number;
    maxDurability: number;
    isOverloaded: boolean;
    compatibilityIssues: string[];
    activeSetBonuses: string[];
  };
  calculateAdaptability: (robot: Robot, mission: Mission) => number;
  generateRandomPart: (minRarity?: Rarity) => Part;
  openBlindBox: (type: Rarity, free?: boolean) => Part[];
  loadFromStorage: () => void;
  resetGame: () => void;
  startIncubation: (slotId: string, partId: string, environment: MutationEnvironment) => boolean;
  cancelIncubation: (slotId: string) => { partReturned: boolean; materialsRefunded: number };
  collectIncubationResult: (slotId: string) => { success: boolean; result: IncubationResult | null; part: Part | null };
  tickIncubations: () => void;
  addIncubationRecord: (record: IncubationRecord) => void;
  clearIncubationRecords: () => void;
}

export type Store = GameState & GameActions;
