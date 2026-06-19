export type PlayMode = 'solo' | 'duo' | 'squad';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type ArenaType = 'military_forest' | 'industrial' | 'lava_ruins' | 'cyber_neon' | 'skeletal_desert' | 'ai_custom';

export interface AIEnvironmentEvent {
  name: string;
  desc: string;
  type: 'tempest' | 'radioactive_fallout' | 'neon_surcharge' | 'healing_rain' | 'gravity_warp';
  overlayColor: string;
  particleColor: string;
  particleType: 'spark' | 'smoke' | 'bubble' | 'digital_rune' | 'rain_drop';
  gameplayEffectDesc: string;
}

export interface AICustomTheme {
  name: string;
  desc: string;
  groundColor: string;
  gridColor: string;
  borderColor: string;
  accentColor: string;
  textureStyle: 'stars' | 'cracks' | 'digital' | 'organic_cells' | 'sand_drift' | 'energy_grids' | 'waves' | 'crystals';
  textureDetailColor: string;
  textureSecondaryColor: string;
  textureDensity: number;
  mudLabel: string;
  lavaLabel: string;
  speedBoostLabel: string;
  healerLabel: string;
  mudColor: string;
  lavaColor: string;
  speedBoostColor: string;
  healerColor: string;
  customObstacleName: string;
  customCrateName: string;
  customStructureColor: string;
  customCrateColor: string;
  events: AIEnvironmentEvent[];
  structuresList: {
    x: number;
    y: number;
    w: number;
    h: number;
    type: 'structure' | 'crate';
    subType: string;
  }[];
}

export interface EnvironmentalTile {
  id: string;
  type: 'lava' | 'mud' | 'speed_boost' | 'healer';
  x: number;
  y: number;
  radius: number;
}

export interface ArenaConfig {
  type: ArenaType;
  name: string;
  desc: string;
  groundColor: string;
  gridColor: string;
  borderColor: string;
  accentColor: string;
  musicMood: string;
}

export type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'sniper' | 'rocket';

export interface Weapon {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // millisecondes entre chaque tir
  maxAmmo: number;
  clipSize: number;
  currentClip: number;
  reserveAmmo: number;
  spread: number; // en radians
  bulletSpeed: number;
  range: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export type LootType = 'weapon' | 'item';

export interface LootItem {
  id: string;
  type: LootType;
  name: string;
  x: number;
  y: number;
  weaponData?: Weapon;
  itemType?: 'shield' | 'medkit' | 'dash_recharge' | 'ammo_pistol' | 'ammo_shotgun' | 'ammo_rifle' | 'ammo_sniper' | 'ammo_rocket';
  amount?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  radius: number;
}

export interface Character {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  isBot: boolean;
  isPlayer: boolean;
  teamId: string;
  alive: boolean;
  knocked: boolean; // Pour duo / squad
  health: number; // max 100
  shield: number; // max 100
  weapons: (Weapon | null)[]; // 2 slots d'armes mobiles
  activeWeaponIndex: number;
  ammo: Record<WeaponType, number>;
  medkits: number;
  shieldPotions: number;
  dashCharges: number;
  dashCooldown: number; // ms restants
  
  // Stats match
  kills: number;
  rank: number;
  deathCause?: string;
  eliminatedBy?: string;

  // Visuals
  skinColor: string;
  hatStyle: 'none' | 'cap' | 'crown' | 'helmet' | 'headphones' | 'bandana' | 'ninja' | 'wizard';
  patternStyle: 'plain' | 'stripes' | 'dots' | 'camo' | 'lightning';
  
  // Realtime expressions
  activeEmote?: string;
  emoteExpiresAt?: number;

  // AI State Variables
  aiState: 'search_loot' | 'combat' | 'run_zone' | 'heal' | 'revive_ally' | 'idle';
  targetCharacterId?: string;
  targetLootId?: string;
  targetX?: number;
  targetY?: number;
  lastShootTime: number;
  lastDecisionTime: number;
  lastHealTime?: number;
  reviveTimer: number; // ms remaining to revive targeted ally or be revived
  revivedBy?: string;
  tempSpeedMultiplier?: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  rangeRemaining: number;
  bulletSpeed: number;
  color: string;
  type: 'bullet' | 'rocket';
  radius: number;
  teamId: string;
}

export interface GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 0 à 1
  decay: number;
  type: 'spark' | 'smoke' | 'blood' | 'exhaust' | 'shield_spark' | 'explosion' | 'hazard_indicator' | 'digital_rune' | 'acid_splash' | 'fire';
}

export interface StormZone {
  x: number; // Centre actuel
  y: number;
  radius: number; // Rayon actuel
  targetX: number; // Centre visé
  targetY: number;
  targetRadius: number; // Rayon visé
  damage: number; // dégâts par seconde dans la tempête
  phase: number; // Phase actuelle de rétrécissement (1 à 5)
  timer: number; // Temps restant dans la phase actuelle (secondes)
  maxTimer: number; // Temps total de la phase
  isShrinking: boolean;
}

export interface MatchHistory {
  playedAt: string;
  mode: PlayMode;
  rank: number;
  kills: number;
  survivedTime: number; // secondes
  weaponOfChoice: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  kills: number;
  top10: number;
  history: MatchHistory[];
  level?: number;
  xp?: number;
  equippedWeaponEffect?: string;
  equippedEmote?: string;
}

export interface SupplyDrop {
  id: string;
  x: number;
  y: number;
  altitude: number; // Altitude de chute (0 = au sol)
  isLanded: boolean;
  isOpened: boolean;
  radius: number;
  lootSpawned: boolean;
}

export interface PoisonZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  timer: number;       // Temps restant actuel
  maxTimer: number;    // Temps total (warning ou actif)
  isWarning: boolean;  // Phase d'alerte jaune clignotante avant impact
  active: boolean;     // Zone active et toxique infligeant des dégâts
}
