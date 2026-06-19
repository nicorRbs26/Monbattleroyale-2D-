import { Quest, QuestType, WeaponType } from './types';

export interface Reward {
  level: number;
  type: 'hat' | 'pattern' | 'emote' | 'weapon_effect';
  id: string; // e.g. 'crown', 'camo', 'laser_blue', 'thumbs_up'
  name: string;
  emojiOrColor: string; // display emoji/color in progress view
  desc: string;
}

export const LEVEL_REWARDS: Reward[] = [
  { level: 2, type: 'emote', id: 'thumbs_up', name: 'Emote 👍 "Pouce en l\'air"', emojiOrColor: '👍', desc: 'Permet de saluer amicalement tes adversaires en combat !' },
  { level: 3, type: 'weapon_effect', id: 'laser_blue', name: 'Effet Laser Bleu', emojiOrColor: '🔵', desc: 'Transforme tes projectiles en lasers de couleur bleu cyan électrique !' },
  { level: 4, type: 'hat', id: 'ninja', name: 'Bandeau de Ninja', emojiOrColor: '🥷', desc: 'Équipe un bandeau d\'élite rouge de shinobi légendaire' },
  { level: 4, type: 'emote', id: 'laugh', name: 'Emote 😂 "Rire Tactique"', emojiOrColor: '😂', desc: 'Célèbre tes prouesses par un rire moqueur au sol !' },
  { level: 5, type: 'weapon_effect', id: 'void_purple', name: 'Effet Néant Cosmique', emojiOrColor: '🟣', desc: 'Tire des cartouches violettes chargées d\'énergie du vide néon !' },
  { level: 5, type: 'pattern', id: 'camo', name: 'Motif Camouflage', emojiOrColor: '🌿', desc: 'Modifie la texture de ton corps avec un tissu camouflage tactique !' },
  { level: 6, type: 'emote', id: 'flag_white', name: 'Emote 🏳️ "Drapeau Blanc"', emojiOrColor: '🏳️', desc: 'Fais mine de capituler pour surprendre ton assaillant !' },
  { level: 6, type: 'hat', id: 'headphones', name: 'Casque Audio RGB', emojiOrColor: '🎧', desc: 'Utilise un élégant casque audio rétroéclairé' },
  { level: 7, type: 'weapon_effect', id: 'golden_aura', name: 'Effet Aura Dorée', emojiOrColor: '🟡', desc: 'Tes balles rayonnent d\'un éclat doré brillant semblable aux champions !' },
  { level: 8, type: 'hat', id: 'crown', name: 'Couronne Royale', emojiOrColor: '👑', desc: 'Chapeau légendaire réservé aux grands vainqueurs d\'arène !' },
  { level: 9, type: 'weapon_effect', id: 'fire_tracer', name: 'Effet Incendiaire', emojiOrColor: '🔴', desc: 'Tes munitions s\'enflamment de rouge orangé aux particules de braise !' },
  { level: 10, type: 'emote', id: 'victory', name: 'Emote 🔥 "Victoire")', emojiOrColor: '🔥', desc: 'Libère de l\'énergie enflammée au-dessus de ton survivant !' },
  { level: 10, type: 'pattern', id: 'lightning', name: 'Motif Éclairs d\'Aura', emojiOrColor: '⚡', desc: 'Vibre d\'une aura électrique animée par saccades d\'éclairs !' },
];

export function getXpRequired(level: number): number {
  return level * 300 + 700; // Niv 1: 1000xp, Niv 2: 1300xp, Niv 3: 1600xp, etc.
}

export function calculateMatchXp(rank: number, kills: number, survivedSeconds: number): {
  survivalXp: number;
  killsXp: number;
  rankXp: number;
  gamesPlayedXp: number;
  totalEarnedXp: number;
} {
  const survivalXp = Math.round(survivedSeconds * 1.5); // 1.5 XP par seconde
  const killsXp = kills * 100; // 100 XP par kill
  
  let rankXp = 0;
  if (rank === 1) rankXp = 500; // Gagnant
  else if (rank <= 5) rankXp = 250;
  else if (rank <= 10) rankXp = 120;
  else if (rank <= 20) rankXp = 50;

  const gamesPlayedXp = 50; // Bonus forfaitaire de partie jouée

  return {
    survivalXp,
    killsXp,
    rankXp,
    gamesPlayedXp,
    totalEarnedXp: Math.round(survivalXp + killsXp + rankXp + gamesPlayedXp),
  };
}

export function isRewardUnlocked(reward: Reward, playerLevel: number): boolean {
  return playerLevel >= reward.level;
}

export function isHatLocked(hat: string, playerLevel: number): boolean {
  if (hat === 'ninja' && playerLevel < 4) return true;
  if (hat === 'headphones' && playerLevel < 6) return true;
  if (hat === 'crown' && playerLevel < 8) return true;
  return false;
}

export function isPatternLocked(pattern: string, playerLevel: number): boolean {
  if (pattern === 'camo' && playerLevel < 5) return true;
  if (pattern === 'lightning' && playerLevel < 10) return true;
  return false;
}

const DAILY_QUESTS_POOL: Partial<Quest>[] = [
  { title: 'Chasseur de Têtes', description: 'Éliminer 3 adversaires', type: 'kills', targetValue: 3, rewardXp: 400, category: 'daily' },
  { title: 'Marathonien', description: 'Parcourir 5000 mètres', type: 'distance', targetValue: 5000, rewardXp: 300, category: 'daily' },
  { title: 'Soin d\'Urgence', description: 'Utiliser 4 objets de soin', type: 'heal', targetValue: 4, rewardXp: 250, category: 'daily' },
  { title: 'Spécialiste-Pistolet', description: 'Faire 2 kills au pistolet', type: 'weapon_specific_kills', weaponType: 'pistol', targetValue: 2, rewardXp: 500, category: 'daily' },
  { title: 'Maître du Fusil d\'Assaut', description: 'Faire 3 kills au fusil d\'assaut', type: 'weapon_specific_kills', weaponType: 'rifle', targetValue: 3, rewardXp: 550, category: 'daily' },
  { title: 'Nettoyeur au Pompe', description: 'Faire 2 kills au fusil à pompe', type: 'weapon_specific_kills', weaponType: 'shotgun', targetValue: 2, rewardXp: 450, category: 'daily' },
];

const WEEKLY_QUESTS_POOL: Partial<Quest>[] = [
  { title: 'Légende de la Survie', description: 'Survivre un total de 1200 secondes', type: 'survival', targetValue: 1200, rewardXp: 2000, category: 'weekly', isWeekly: true },
  { title: 'Expert en Élimination', description: 'Éliminer 20 adversaires', type: 'kills', targetValue: 20, rewardXp: 2500, category: 'weekly', isWeekly: true },
  { title: 'Voyageur de l\'Arène', description: 'Parcourir 25000 mètres', type: 'distance', targetValue: 25000, rewardXp: 1800, category: 'weekly', isWeekly: true },
  { title: 'Sniper d\'Élite', description: 'Faire 5 kills au fusil de précision', type: 'weapon_specific_kills', weaponType: 'sniper', targetValue: 5, rewardXp: 3000, category: 'weekly', isWeekly: true },
];

export function generateDailyQuests(count: number = 3): Quest[] {
  const shuffled = [...DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((q, i) => ({
    ...q,
    id: `daily-${Date.now()}-${i}`,
    currentValue: 0,
    isCompleted: false,
    isWeekly: false,
  } as Quest));
}

export function generateWeeklyQuests(count: number = 2): Quest[] {
  const shuffled = [...WEEKLY_QUESTS_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((q, i) => ({
    ...q,
    id: `weekly-${Date.now()}-${i}`,
    currentValue: 0,
    isCompleted: false,
    isWeekly: true,
  } as Quest));
}

/**
 * Met à jour le progrès des quêtes actives et retourne l'XP totale gagnée par les quêtes complétées
 */
export function updateQuestsOnEvent(
  activeQuests: Quest[], 
  type: QuestType, 
  value: number, 
  weaponType?: WeaponType
): { updatedQuests: Quest[]; earnedXp: number; completedCount: number } {
  let earnedXp = 0;
  let completedCount = 0;
  
  const updatedQuests = activeQuests.map(q => {
    if (q.isCompleted) return q;
    if (q.type !== type) return q;
    
    // Pour les quêtes spécifiques à une arme
    if (type === 'weapon_specific_kills' && q.weaponType !== weaponType) {
      return q;
    }

    const newProg = q.currentValue + value;
    const isNowCompleted = newProg >= q.targetValue;
    
    if (isNowCompleted && !q.isCompleted) {
      earnedXp += q.rewardXp;
      completedCount++;
    }

    return {
      ...q,
      currentValue: Math.min(newProg, q.targetValue),
      isCompleted: isNowCompleted || q.isCompleted,
    };
  });

  return { updatedQuests, earnedXp, completedCount };
}

