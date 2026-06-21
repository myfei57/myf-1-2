import { v4 as uuidv4 } from 'uuid';
import type {
  Part,
  PartType,
  Rarity,
  Robot,
  Mission,
  GameConfig,
  MutationEnvironment,
  MutationTrait,
  MutationTraitConfig,
  IncubationResult,
  EnvironmentConfig,
} from '../types';
import { PART_TEMPLATES } from '../data/defaultConfig';

export const PART_TYPES: PartType[] = ['head', 'body', 'arm', 'leg', 'core', 'tool'];
export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const SET_BONUS_KEYS: string[] = ['industrial', 'stealth', 'combat', 'medical'];

const SET_BONUS_OPTIONS = [null, ...SET_BONUS_KEYS];

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
    mutations: [],
    mutationCount: 0,
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

export function normalizePart(p: any): Part {
  if (!p) return p;
  return {
    ...p,
    mutations: Array.isArray(p.mutations) ? p.mutations : [],
    mutationCount: typeof p.mutationCount === 'number' ? p.mutationCount : (Array.isArray(p.mutations) ? p.mutations.length : 0),
    compatibility: Array.isArray(p.compatibility) ? [...p.compatibility] : ['head', 'body', 'arm', 'leg', 'core', 'tool'],
    durability: typeof p.durability === 'number' ? p.durability : (typeof p.maxDurability === 'number' ? p.maxDurability : 50),
    maxDurability: typeof p.maxDurability === 'number' ? p.maxDurability : (typeof p.durability === 'number' ? p.durability : 50),
    weight: typeof p.weight === 'number' ? p.weight : 10,
    energy: typeof p.energy === 'number' ? p.energy : 10,
    skillSlots: typeof p.skillSlots === 'number' ? p.skillSlots : 0,
    setBonus: p.setBonus ?? null,
  };
}

export function getAvailableTraitsForEnvironment(
  config: GameConfig,
  environment: MutationEnvironment,
  partRarity: Rarity
): MutationTraitConfig[] {
  return config.incubation.mutationTraits.filter((trait) => {
    if (!trait.environments.includes(environment)) return false;
    if (trait.rarityRequired) {
      const requiredIdx = RARITY_ORDER.indexOf(trait.rarityRequired);
      const partIdx = RARITY_ORDER.indexOf(partRarity);
      if (partIdx < requiredIdx) return false;
    }
    return true;
  });
}

export function selectRandomTrait(
  traits: MutationTraitConfig[],
  positiveBias: number
): MutationTraitConfig | null {
  if (traits.length === 0) return null;

  const positive = traits.filter((t) => t.isPositive);
  const negative = traits.filter((t) => !t.isPositive);

  const usePositive = Math.random() < positiveBias;
  const pool = usePositive && positive.length > 0 ? positive : negative.length > 0 ? negative : traits;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function upgradeRarity(current: Rarity): Rarity | null {
  const idx = RARITY_ORDER.indexOf(current);
  if (idx >= RARITY_ORDER.length - 1) return null;
  return RARITY_ORDER[idx + 1];
}

export function applyTraitToPart(part: Part, trait: MutationTrait): Part {
  const normalized = normalizePart(part);
  const mutations = Array.isArray(normalized.mutations) ? [...normalized.mutations] : [];
  const compatibility = Array.isArray(normalized.compatibility) ? [...normalized.compatibility] : [];

  const newPart: Part = {
    ...normalized,
    mutations: [...mutations, trait],
    mutationCount: (normalized.mutationCount || 0) + 1,
    compatibility: [...compatibility],
  };

  switch (trait.effect) {
    case 'weight':
      newPart.weight = Math.max(1, (normalized.weight || 0) + trait.value);
      break;
    case 'energy':
      newPart.energy = Math.max(1, (normalized.energy || 0) + trait.value);
      break;
    case 'skillSlots':
      newPart.skillSlots = Math.max(0, (normalized.skillSlots || 0) + trait.value);
      break;
    case 'durability':
      newPart.durability = clamp((normalized.durability || 0) + trait.value, 0, newPart.maxDurability || 1);
      break;
    case 'maxDurability':
      newPart.maxDurability = Math.max(1, (normalized.maxDurability || 0) + trait.value);
      newPart.durability = clamp(normalized.durability || 0, 0, newPart.maxDurability);
      break;
    case 'compatibility':
      const newCompat = new Set<string>(newPart.compatibility);
      PART_TYPES.forEach((t) => {
        if (Math.random() < Math.abs(trait.value) / PART_TYPES.length) {
          if (trait.value > 0) {
            newCompat.add(t);
          } else {
            newCompat.delete(t);
          }
        }
      });
      newPart.compatibility = Array.from(newCompat) as PartType[];
      break;
  }

  return newPart;
}

export function generateIncubationResult(
  part: Part,
  environment: MutationEnvironment,
  config: GameConfig
): { result: IncubationResult; mutatedPart: Part } {
  const normalizedPart = normalizePart(part);
  const envConfig: EnvironmentConfig = config.incubation.environments[environment];
  const outcome: IncubationResult['outcome'] = [];
  const traitsGained: MutationTrait[] = [];
  const traitsLost: MutationTrait[] = [];
  const compatibilityAdded: PartType[] = [];
  const compatibilityRemoved: PartType[] = [];
  let durabilityLost = 0;
  let maxDurabilityChanged = 0;
  const setBonusChanged = { from: normalizedPart.setBonus, to: normalizedPart.setBonus as string | null };
  let rarityUpgraded = false;
  let newRarity: Rarity | null = null;

  let mutatedPart: Part = {
    ...normalizedPart,
    compatibility: [...normalizedPart.compatibility],
    mutations: [...normalizedPart.mutations],
  };

  if (Math.random() < envConfig.mutationChance) {
    const available = getAvailableTraitsForEnvironment(config, environment, normalizedPart.rarity);
    const numTraits = Math.random() < 0.3 ? 2 : 1;

    for (let i = 0; i < numTraits; i++) {
      const selected = selectRandomTrait(available, envConfig.positiveTraitBias);
      if (selected) {
        const trait: MutationTrait = {
          id: `${selected.id}_${generateId().slice(0, 8)}`,
          name: selected.name,
          description: selected.description,
          effect: selected.effect,
          value: selected.value,
          isPositive: selected.isPositive,
          icon: selected.icon,
        };
        traitsGained.push(trait);
        mutatedPart = applyTraitToPart(mutatedPart, trait);
        mutatedPart = normalizePart(mutatedPart);
      }
    }

    if (traitsGained.length > 0) {
      outcome.push('trait_gained');
    }
  }

  if (Math.random() < envConfig.durabilityLossChance) {
    const lossPercent = (Math.random() * envConfig.maxDurabilityLossPercent) / 100;
    durabilityLost = Math.floor((mutatedPart.maxDurability || 50) * lossPercent);
    if (durabilityLost > 0) {
      mutatedPart.durability = clamp((mutatedPart.durability || 0) - durabilityLost, 0, mutatedPart.maxDurability || 1);
      outcome.push('durability_lost');
    }
  }

  if (Math.random() < envConfig.compatibilityChangeChance) {
    const originalCompat = new Set<PartType>(normalizedPart.compatibility);
    const currentCompat = new Set<PartType>(mutatedPart.compatibility);
    const changeCount = Math.floor(Math.random() * 2) + 1;
    let hasChange = false;

    for (let i = 0; i < changeCount; i++) {
      const targetType = PART_TYPES[Math.floor(Math.random() * PART_TYPES.length)];
      const shouldAdd = Math.random() < 0.6;

      if (shouldAdd) {
        if (!currentCompat.has(targetType)) {
          currentCompat.add(targetType);
          if (!originalCompat.has(targetType)) {
            compatibilityAdded.push(targetType);
          }
          hasChange = true;
        }
      } else {
        if (currentCompat.has(targetType)) {
          currentCompat.delete(targetType);
          if (originalCompat.has(targetType)) {
            compatibilityRemoved.push(targetType);
          }
          hasChange = true;
        }
      }
    }

    if (hasChange || compatibilityAdded.length > 0 || compatibilityRemoved.length > 0) {
      mutatedPart.compatibility = Array.from(currentCompat);
      outcome.push('compatibility_changed');
    }
  }

  if (Math.random() < config.incubation.rarityUpgradeChance && normalizedPart.rarity !== 'legendary') {
    const upgraded = upgradeRarity(normalizedPart.rarity);
    if (upgraded) {
      newRarity = upgraded;
      mutatedPart.rarity = upgraded;
      rarityUpgraded = true;
      outcome.push('rarity_upgrade');
    }
  }

  if (Math.random() < config.incubation.setBonusChangeChance) {
    const originalSet = normalizedPart.setBonus;
    const currentSetIdx = originalSet ? SET_BONUS_KEYS.indexOf(originalSet) : -1;
    const availableSets = SET_BONUS_KEYS.filter((_, i) => i !== currentSetIdx);
    let changed = false;

    if (Math.random() < 0.5 && availableSets.length > 0) {
      const newSet = availableSets[Math.floor(Math.random() * availableSets.length)];
      setBonusChanged.to = newSet;
      mutatedPart.setBonus = newSet;
      changed = true;
    } else if (originalSet) {
      setBonusChanged.to = null;
      mutatedPart.setBonus = null;
      changed = true;
    }

    if (changed) {
      outcome.push('set_bonus_changed');
    }
  }

  if (outcome.length === 0) {
    outcome.push('no_change');
  }

  mutatedPart = normalizePart(mutatedPart);

  const result: IncubationResult = {
    outcome,
    traitsGained,
    traitsLost,
    compatibilityAdded,
    compatibilityRemoved,
    durabilityLost,
    maxDurabilityChanged,
    setBonusChanged: {
      from: setBonusChanged.from,
      to: setBonusChanged.to,
    },
    rarityUpgraded,
    newRarity,
  };

  return { result, mutatedPart };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}分${secs.toString().padStart(2, '0')}秒`;
  }
  return `${secs}秒`;
}

export function getRiskLevelLabel(level: number): { label: string; color: string } {
  if (level <= 1) return { label: '低风险', color: 'text-neon-green' };
  if (level <= 2) return { label: '较低风险', color: 'text-neon-blue' };
  if (level <= 3) return { label: '中等风险', color: 'text-neon-orange' };
  if (level <= 4) return { label: '高风险', color: 'text-neon-red' };
  return { label: '极高风险', color: 'text-rarity-legendary' };
}
