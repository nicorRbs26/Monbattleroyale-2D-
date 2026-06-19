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

