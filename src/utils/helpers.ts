import { v4 as uuidv4 } from 'uuid';
import type {
  Part,
  PartType,
  Rarity,
  Robot,
  Mission,
  GameConfig,
} from '../types';
import { PART_TEMPLATES } from '../data/defaultConfig';

const PART_TYPES: PartType[] = ['head', 'body', 'arm', 'leg', 'core', 'tool'];
const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const SET_BONUS_OPTIONS = [null, 'industrial', 'stealth', 'combat', 'medical'];

export function generateId(): string {
  return uuidv4();
}

export function getRandomRarity(config: GameConfig, minRarity?: Rarity): Rarity {
  const rarities = Object.entries(config.rarities) as [Rarity, typeof config.rarities[Rarity]][];
  
  let filteredRarities = rarities;
  if (minRarity) {
    const minIndex = RARITY_ORDER.indexOf(minRarity);
    filteredRarities = rarities.filter(([r]) => RARITY_ORDER.indexOf(r) >= minIndex);
  }

  const totalProb = filteredRarities.reduce((sum, [, cfg]) => sum + cfg.probability, 0);
  let random = Math.random() * totalProb;

  for (const [rarity, cfg] of filteredRarities) {
    random -= cfg.probability;
    if (random <= 0) return rarity;
  }

  return filteredRarities[filteredRarities.length - 1][0];
}

export function getRarityMultiplier(rarity: Rarity): number {
  const multipliers: Record<Rarity, number> = {
    common: 1,
    uncommon: 1.5,
    rare: 2,
    epic: 3,
    legendary: 5,
  };
  return multipliers[rarity];
}

export function generateRandomPart(config: GameConfig, minRarity?: Rarity): Part {
  const type = PART_TYPES[Math.floor(Math.random() * PART_TYPES.length)];
  const rarity = getRandomRarity(config, minRarity);
  const multiplier = getRarityMultiplier(rarity);
  
  const templates = PART_TEMPLATES[type];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const setBonus = rarity !== 'common' && Math.random() < 0.3
    ? SET_BONUS_OPTIONS[Math.floor(Math.random() * SET_BONUS_OPTIONS.length)]
    : null;

  const baseWeight = Math.floor(Math.random() * 15) + 5;
  const baseEnergy = Math.floor(Math.random() * 15) + 5;
  const baseSkill = Math.floor(Math.random() * 3);
  const baseDurability = Math.floor(Math.random() * 30) + 40;

  const compatibility: PartType[] = PART_TYPES.filter(
    () => Math.random() < 0.7
  );

  return {
    id: generateId(),
    name: template.name,
    type,
    rarity,
    weight: Math.floor(baseWeight * multiplier),
    energy: Math.floor(baseEnergy * multiplier),
    skillSlots: Math.floor(baseSkill * multiplier) + (rarity === 'legendary' ? 2 : 0),
    compatibility,
    setBonus,
    durability: Math.floor(baseDurability * multiplier),
    maxDurability: Math.floor(baseDurability * multiplier),
    description: template.description,
    icon: type,
  };
}

export function calculateRobotStats(
  parts: Record<PartType, Part | null>,
  config: GameConfig
): {
  totalWeight: number;
  totalEnergy: number;
  totalSkillSlots: number;
  maxDurability: number;
  isOverloaded: boolean;
  compatibilityIssues: string[];
  activeSetBonuses: string[];
} {
  const installedParts = Object.values(parts).filter(Boolean) as Part[];
  
  let totalWeight = 0;
  let totalEnergy = 0;
  let totalSkillSlots = 0;
  let maxDurability = 100;
  const compatibilityIssues: string[] = [];

  const setBonusCounts: Record<string, number> = {};

  for (const part of installedParts) {
    totalWeight += part.weight;
    totalEnergy += part.energy;
    totalSkillSlots += part.skillSlots;
    
    if (part.durability < maxDurability) {
      maxDurability = part.durability;
    }

    if (part.setBonus) {
      setBonusCounts[part.setBonus] = (setBonusCounts[part.setBonus] || 0) + 1;
    }
  }

  for (const part of installedParts) {
    for (const otherPart of installedParts) {
      if (part.id !== otherPart.id && !part.compatibility.includes(otherPart.type)) {
        const issue = `${part.name} 与 ${otherPart.name} 不兼容`;
        if (!compatibilityIssues.includes(issue)) {
          compatibilityIssues.push(issue);
        }
      }
    }
  }

  const activeSetBonuses: string[] = [];
  for (const [setId, count] of Object.entries(setBonusCounts)) {
    const setConfig = config.setBonuses[setId];
    if (setConfig && count >= setConfig.requiredParts) {
      activeSetBonuses.push(setId);
      
      if (setConfig.effects.weightBonus) {
        totalWeight = Math.floor(totalWeight * (1 + setConfig.effects.weightBonus / 100));
      }
      if (setConfig.effects.energyBonus) {
        totalEnergy = Math.max(1, Math.floor(totalEnergy * (1 + setConfig.effects.energyBonus / 100)));
      }
      if (setConfig.effects.skillBonus) {
        totalSkillSlots += setConfig.effects.skillBonus;
      }
      if (setConfig.effects.durabilityBonus) {
        maxDurability = Math.floor(maxDurability * (1 + setConfig.effects.durabilityBonus / 100));
      }
    }
  }

  const isOverloaded = totalEnergy > config.overloadRules.threshold;

  return {
    totalWeight,
    totalEnergy,
    totalSkillSlots,
    maxDurability,
    isOverloaded,
    compatibilityIssues,
    activeSetBonuses,
  };
}

export function calculateAdaptability(
  robot: Robot,
  mission: Mission,
  config: GameConfig
): number {
  const weights = config.missionWeights[mission.type];
  let score = 0;
  let maxScore = 0;

  const { requirements } = mission;
  const penalty = robot.isOverloaded ? config.overloadRules.performancePenalty / 100 : 0;

  if (requirements.weight !== undefined) {
    const weightScore = Math.min(1, robot.totalWeight / requirements.weight);
    score += weightScore * weights.weight;
    maxScore += weights.weight;
  }

  if (requirements.energy !== undefined) {
    const energyScore = Math.min(1, robot.totalEnergy / requirements.energy);
    score += energyScore * weights.energy;
    maxScore += weights.energy;
  }

  if (requirements.skillSlots !== undefined) {
    const skillScore = Math.min(1, robot.totalSkillSlots / requirements.skillSlots);
    score += skillScore * weights.skillSlots;
    maxScore += weights.skillSlots;
  }

  if (requirements.partTypes) {
    for (const partType of requirements.partTypes) {
      if (robot.parts[partType]) {
        score += 0.1;
      }
      maxScore += 0.1;
    }
  }

  const durabilityScore = robot.durability / robot.maxDurability;
  score += durabilityScore * weights.durability;
  maxScore += weights.durability;

  const baseScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const finalScore = Math.max(0, baseScore * (1 - penalty));

  return Math.round(finalScore);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRarityColorClass(rarity: Rarity): string {
  const classes: Record<Rarity, string> = {
    common: 'text-rarity-common',
    uncommon: 'text-rarity-uncommon',
    rare: 'text-rarity-rare',
    epic: 'text-rarity-epic',
    legendary: 'text-rarity-legendary',
  };
  return classes[rarity];
}

export function getRarityBorderClass(rarity: Rarity): string {
  const classes: Record<Rarity, string> = {
    common: 'rarity-border-common',
    uncommon: 'rarity-border-uncommon',
    rare: 'rarity-border-rare',
    epic: 'rarity-border-epic',
    legendary: 'rarity-border-legendary',
  };
  return classes[rarity];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
