import { Weapon, WeaponType, LootItem, PlayMode, ArenaType, EnvironmentalTile, ArenaConfig, AICustomTheme, AIEnvironmentEvent } from './types';

export const MAP_SIZE = 2500; // Taille de la carte 2500x2500

export const BOT_NAMES = [
  'NoobSlayer', 'Rambo_du_92', 'Sniper_Elite', 'Aura_Max', 'Sigma_Gamer',
  'Le_CampingCar', 'Chou_Fleur', 'Baguette_Vengeuse', 'Ronaldo_Bot', 'Le_Penseur',
  'Jean_Clode', 'Apex_Predator', 'Bush_Wookie', 'Matrix_101', 'Loot_Goblin',
  'Storm_Runner', 'Revive_Pls', 'Toxic_Viper', 'Kevlar_99', 'Cortex_Destroyer',
  'Squeezie_Fan', 'Kamikaze_Bot', 'Mister_V', 'Bot_Gentil', 'Ninjutsu',
  'Le_Boulanger', 'Jean_Eudes', 'Macaron_Fringant', 'Shadow_Stalker', 'Cyber_Ghost',
  'Golden_Crown', 'Tornado_Zone', 'Terreur_2D', 'Singe_Tactique', 'Croissant_Laser',
  'Aura_Slayers_R', 'Speedy_Gonza', 'Le_Tacticien', 'Lama_Loot', 'Gladiateur'
];

export interface WeaponDef {
  nom: string;
  type: WeaponType;
  damage: number;
  fireRate: number; // millisecondes calculées (1000 / cadence_de_tir)
  clipSize: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  spread: number;
  bulletSpeed: number;
  range: number;
}

export const CUSTOM_WEAPONS: WeaponDef[] = [
  {
    nom: 'Pistolet de Base',
    type: 'pistol',
    damage: 15,
    fireRate: 222, // 1000 / 4.5
    clipSize: 12,
    rarity: 'common',
    spread: 0.05,
    bulletSpeed: 11,
    range: 400
  },
  {
    nom: 'Pistolet Automatique',
    type: 'pistol',
    damage: 12,
    fireRate: 111, // 1000 / 9.0
    clipSize: 20,
    rarity: 'rare',
    spread: 0.07,
    bulletSpeed: 11,
    range: 380
  },
  {
    nom: 'Mitraillette Légère',
    type: 'rifle',
    damage: 14,
    fireRate: 83, // 1000 / 12.0
    clipSize: 30,
    rarity: 'rare',
    spread: 0.10,
    bulletSpeed: 13,
    range: 450
  },
  {
    nom: 'SMG Compact',
    type: 'rifle',
    damage: 16,
    fireRate: 91, // 1000 / 11.0
    clipSize: 35,
    rarity: 'rare',
    spread: 0.09,
    bulletSpeed: 13,
    range: 480
  },
  {
    nom: 'Fusil d\'Assaut Standard',
    type: 'rifle',
    damage: 24,
    fireRate: 154, // 1000 / 6.5
    clipSize: 30,
    rarity: 'rare',
    spread: 0.08,
    bulletSpeed: 14,
    range: 550
  },
  {
    nom: 'Fusil d\'Assaut Tactique',
    type: 'rifle',
    damage: 28,
    fireRate: 143, // 1000 / 7.0
    clipSize: 30,
    rarity: 'epic',
    spread: 0.06,
    bulletSpeed: 15,
    range: 580
  },
  {
    nom: 'Fusil à Pompe de Chasse',
    type: 'shotgun',
    damage: 85,
    fireRate: 1250, // 1000 / 0.8
    clipSize: 5,
    rarity: 'common',
    spread: 0.22,
    bulletSpeed: 9,
    range: 220
  },
  {
    nom: 'Fusil à Pompe Automatique',
    type: 'shotgun',
    damage: 65,
    fireRate: 500, // 1000 / 2.0
    clipSize: 8,
    rarity: 'rare',
    spread: 0.25,
    bulletSpeed: 9.5,
    range: 240
  },
  {
    nom: 'Fusil de Sniper à Verrou',
    type: 'sniper',
    damage: 110,
    fireRate: 2000, // 1000 / 0.5
    clipSize: 1,
    rarity: 'epic',
    spread: 0.002,
    bulletSpeed: 24,
    range: 1000
  },
  {
    nom: 'Sniper Semi-Automatique',
    type: 'sniper',
    damage: 55,
    fireRate: 455, // 1000 / 2.2
    clipSize: 10,
    rarity: 'rare',
    spread: 0.01,
    bulletSpeed: 21,
    range: 850
  },
  {
    nom: 'Mitrailleuse Lourde',
    type: 'rifle',
    damage: 22,
    fireRate: 118, // 1000 / 8.5
    clipSize: 100,
    rarity: 'epic',
    spread: 0.12,
    bulletSpeed: 13.5,
    range: 520
  },
  {
    nom: 'Fusil Laser Cybernétique',
    type: 'rifle',
    damage: 35,
    fireRate: 200, // 1000 / 5.0
    clipSize: 25,
    rarity: 'epic',
    spread: 0.03,
    bulletSpeed: 18,
    range: 650
  },
  {
    nom: 'Lance-Grenades',
    type: 'rocket',
    damage: 75,
    fireRate: 833, // 1000 / 1.2
    clipSize: 6,
    rarity: 'epic',
    spread: 0.05,
    bulletSpeed: 7.5,
    range: 500
  },
  {
    nom: 'Canon Électromagnétique (Railgun)',
    type: 'sniper',
    damage: 150,
    fireRate: 3333, // 1000 / 0.3
    clipSize: 3,
    rarity: 'legendary',
    spread: 0.001,
    bulletSpeed: 28,
    range: 1100
  },
  {
    nom: 'Le Désintégrateur',
    type: 'rocket',
    damage: 220,
    fireRate: 2500, // 1000 / 0.4
    clipSize: 5,
    rarity: 'legendary',
    spread: 0.04,
    bulletSpeed: 8,
    range: 600
  },
  {
    nom: 'Katana de Plasma',
    type: 'shotgun',
    damage: 120,
    fireRate: 800,
    clipSize: 3,
    rarity: 'legendary',
    spread: 0.4,
    bulletSpeed: 15,
    range: 120
  }
];

export const WEAPON_TYPES_CONFIG: Record<WeaponType, { name: string; fireRate: number; clipSize: number; damage: number; bulletSpeed: number; range: number; spread: number; bulletType: 'bullet' | 'rocket' }> = {
  pistol: {
    name: 'Pistolet S9',
    fireRate: 350,
    clipSize: 12,
    damage: 15,
    bulletSpeed: 11,
    range: 400,
    spread: 0.05,
    bulletType: 'bullet',
  },
  shotgun: {
    name: 'Fusil à Pompe Cal.12',
    fireRate: 850,
    clipSize: 5,
    damage: 12,
    bulletSpeed: 9,
    range: 220,
    spread: 0.22,
    bulletType: 'bullet',
  },
  rifle: {
    name: 'Fusil d\'Assaut AR-15',
    fireRate: 140,
    clipSize: 30,
    damage: 22,
    bulletSpeed: 14,
    range: 550,
    spread: 0.08,
    bulletType: 'bullet',
  },
  sniper: {
    name: 'Fusil Sniper L96',
    fireRate: 1600,
    clipSize: 5,
    damage: 75,
    bulletSpeed: 22,
    range: 950,
    spread: 0.005,
    bulletType: 'bullet',
  },
  rocket: {
    name: 'Lance-Roquettes RPG',
    fireRate: 1500,
    clipSize: 1,
    damage: 85,
    bulletSpeed: 7,
    range: 500,
    spread: 0.02,
    bulletType: 'rocket',
  },
};

export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * # test: Vérifie si deux cercles se chevauchent
 */
export function checkCircleCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
  return getDistance(x1, y1, x2, y2) < r1 + r2;
}

/**
 * # test: Vérifie si un point est à l'intérieur d'un rectangle AABB
 */
export function checkPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
  const halfW = rw / 2;
  const halfH = rh / 2;
  return px > rx - halfW && px < rx + halfW && py > ry - halfH && py < ry + halfH;
}

export function generateWeapon(type: WeaponType, rarity: Weapon['rarity'] = 'common'): Weapon {
  // Sélectionner parmi les 15 armes de l'arsenal celle du bon type
  let candidates = CUSTOM_WEAPONS.filter(w => w.type === type);
  if (candidates.length === 0) {
    candidates = CUSTOM_WEAPONS;
  }

  // Filtrer par rareté si possible, sinon prendre la plus proche ou aléatoire
  let selected = candidates.find(w => w.rarity === rarity);
  if (!selected) {
    // Si aucun de la rareté exacte n'est configuré pour ce type d'arme, prendre de manière aléatoire
    selected = candidates[Math.floor(Math.random() * candidates.length)];
  }

  // Appliquer des multiplicateurs basés sur la rareté recherchée
  let dmgMult = 1.0;
  let spreadMult = 1.0;

  if (rarity === 'rare') {
    dmgMult = 1.15;
    spreadMult = 0.9;
  } else if (rarity === 'epic') {
    dmgMult = 1.30;
    spreadMult = 0.75;
  } else if (rarity === 'legendary') {
    dmgMult = 1.50;
    spreadMult = 0.6;
  }

  const namePrefix = rarity === 'legendary' ? '🔥 ' : rarity === 'epic' ? '💎 ' : rarity === 'rare' ? '⭐ ' : '';

  return {
    type,
    name: namePrefix + selected.nom + ` (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    damage: Math.round(selected.damage * dmgMult),
    fireRate: selected.fireRate,
    maxAmmo: selected.clipSize * 4,
    clipSize: selected.clipSize,
    currentClip: selected.clipSize,
    reserveAmmo: selected.clipSize * 2,
    spread: selected.spread * spreadMult,
    bulletSpeed: selected.bulletSpeed,
    range: selected.range,
    rarity,
  };
}

export function generateRandomLoot(x: number, y: number, id: string): LootItem {
  const rand = Math.random();
  const randsRarity = Math.random();
  let rarity: LootItem['rarity'] = 'common';
  
  if (randsRarity > 0.95) rarity = 'legendary';
  else if (randsRarity > 0.8) rarity = 'epic';
  else if (randsRarity > 0.5) rarity = 'rare';

  if (rand < 0.45) {
    // Arme
    const weaponTypes: WeaponType[] = ['pistol', 'shotgun', 'rifle', 'sniper', 'rocket'];
    // Ajuster selon l'aléatoire
    let weaponTypeSelected: WeaponType = 'pistol';
    const randW = Math.random();
    if (randW < 0.3) weaponTypeSelected = 'pistol';
    else if (randW < 0.55) weaponTypeSelected = 'shotgun';
    else if (randW < 0.8) weaponTypeSelected = 'rifle';
    else if (randW < 0.92) weaponTypeSelected = 'sniper';
    else weaponTypeSelected = 'rocket';

    const weapon = generateWeapon(weaponTypeSelected, rarity);
    
    return {
      id,
      type: 'weapon',
      name: weapon.name,
      x,
      y,
      weaponData: weapon,
      rarity,
      radius: 18,
    };
  } else {
    // Consommable ou munition
    const items: LootItem['itemType'][] = [
      'shield', 'medkit', 'dash_recharge', 
      'ammo_pistol', 'ammo_shotgun', 'ammo_rifle', 'ammo_sniper', 'ammo_rocket'
    ];
    
    const randI = Math.random();
    let itemType: LootItem['itemType'] = 'medkit';
    let name = 'Kit de Soin';
    let amount = 1;

    if (randI < 0.18) {
      itemType = 'medkit';
      name = 'Kit de Soin (+50 PV)';
      amount = 1;
    } else if (randI < 0.36) {
      itemType = 'shield';
      name = 'Potion de Bouclier (+50 PB)';
      amount = 1;
    } else if (randI < 0.45) {
      itemType = 'dash_recharge';
      name = 'Recharge de Dash';
      amount = 1;
    } else if (randI < 0.60) {
      itemType = 'ammo_rifle';
      name = 'Munitions AR (x30)';
      amount = 30;
    } else if (randI < 0.75) {
      itemType = 'ammo_pistol';
      name = 'Munitions Pistolet (x24)';
      amount = 24;
    } else if (randI < 0.88) {
      itemType = 'ammo_shotgun';
      name = 'Munitions Pompe (x8)';
      amount = 8;
    } else if (randI < 0.95) {
      itemType = 'ammo_sniper';
      name = 'Munitions Sniper (x5)';
      amount = 5;
    } else {
      itemType = 'ammo_rocket';
      name = 'Roquettes (x2)';
      amount = 2;
    }

    // Moins de butin rare sur des petits objets, mais pourquoi pas des bonus
    let rarityColor: LootItem['rarity'] = 'common';
    if (rarity === 'legendary' && (itemType === 'medkit' || itemType === 'shield')) {
      rarityColor = 'epic';
      amount *= 2; // Double potion/kit
      name = `Pack Double - ${name}`;
    }

    return {
      id,
      type: 'item',
      name,
      x,
      y,
      itemType,
      amount,
      rarity: rarityColor,
      radius: 14,
    };
  }
}

// Génère des bâtiments de décor sur la map pour couvrir ou bloquer
export interface Building {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  type: 'structure' | 'crate' | 'tree' | 'bush';
  subType?: string; // Information additionnelle pour le rendu spécifique
}

export const ARENA_THEMES: Record<ArenaType, ArenaConfig> = {
  military_forest: {
    type: 'military_forest',
    name: 'Convoi Forestier : Zone de Conflit',
    desc: 'Un dôme forestier avec des casernes militaires abandonnées, des buissons de camouflage denses et des rivières boueuses ralentissantes.',
    groundColor: '#0f2916', // Vert sapin sombre
    gridColor: '#14532d', // Vert sapin moyen
    borderColor: '#22c55e',
    accentColor: '#10b981',
    musicMood: 'militant'
  },
  industrial: {
    type: 'industrial',
    name: 'Friches Sidérurgiques : Secteur Delta',
    desc: 'Un immense complexe logistique de friches industrielles, de conteneurs empilés et de mares de liquides toxiques d\'acide vert corrosifs.',
    groundColor: '#111827', // Charbon
    gridColor: '#1f2937', // Acier sombre
    borderColor: '#94a3b8',
    accentColor: '#38bdf8',
    musicMood: 'industrial_techno'
  },
  lava_ruins: {
    type: 'lava_ruins',
    name: 'Ruines d\'Obsidienne & Magma Actif',
    desc: 'Un sanctuaire dévasté au-dessus d\'un volcan parsemé de coulées de lave rouge-feu, de monolithes de basalte noir et de roches incandescentes.',
    groundColor: '#141414', // Pierre morte
    gridColor: '#262626', // Pierre anthracite
    borderColor: '#ea580c',
    accentColor: '#f97316',
    musicMood: 'epic_dark'
  },
  cyber_neon: {
    type: 'cyber_neon',
    name: 'Synthwave Matrix : Arène 99',
    desc: 'Une grille cybernétique virtuelle retro-futuriste recouverte de pistes de vitesse lumineuses cyan et de barrières holographiques magentas.',
    groundColor: '#020205', // Vide cosmique
    gridColor: '#0c0a25', // Indigo profond
    borderColor: '#d946ef', // Fuchsia néon
    accentColor: '#06b6d4', // Cyan néon
    musicMood: 'synthwave'
  },
  skeletal_desert: {
    type: 'skeletal_desert',
    name: 'Désert Squelettique & Oasis Sacrée',
    desc: 'Une immense mer de dunes de sable parsemée d\'une Grande Pyramide walk-in, de sables mouvants ralentissants et d\'oasis de soin divins.',
    groundColor: '#451a03', // Ocre désertique chaud
    gridColor: '#7c2d12', // Sable cuit
    borderColor: '#ea580c',
    accentColor: '#f59e0b',
    musicMood: 'desert_winds'
  },
  ai_custom: {
    type: 'ai_custom',
    name: 'Arène Synthétisée par l\'IA',
    desc: 'Un monde virtuel dynamique réinventé en temps réel par l\'intelligence artificielle Gemini selon vos propres spécifications.',
    groundColor: '#090d16',
    gridColor: '#111a2e',
    borderColor: '#3b82f6',
    accentColor: '#60a5fa',
    musicMood: 'synthwave'
  }
};

export function generateProceduralArena(type: ArenaType, aiCustomTheme?: AICustomTheme): {
  buildings: Building[];
  tiles: EnvironmentalTile[];
  config: ArenaConfig;
} {
  const buildings: Building[] = [];
  const tiles: EnvironmentalTile[] = [];
  let config: ArenaConfig;

  if (type === 'ai_custom' && aiCustomTheme) {
    config = {
      type: 'ai_custom',
      name: aiCustomTheme.name,
      desc: aiCustomTheme.desc,
      groundColor: aiCustomTheme.groundColor,
      gridColor: aiCustomTheme.gridColor,
      borderColor: aiCustomTheme.borderColor,
      accentColor: aiCustomTheme.accentColor,
      musicMood: 'synthwave'
    };
  } else {
    config = ARENA_THEMES[type as Exclude<ArenaType, 'ai_custom'>] || ARENA_THEMES['military_forest'];
  }

  const addBuildingSafely = (b: Building) => {
    // Éviter de placer trop près du point d'apparition central théorique (1250, 1250)
    // Sauf pour la pyramide géante ou le dôme conçu pour cela
    const centerDist = getDistance(b.x, b.y, MAP_SIZE / 2, MAP_SIZE / 2);
    if (centerDist < 90 && b.type === 'structure' && type !== 'skeletal_desert' && type !== 'lava_ruins') {
      return;
    }
    // S'assurer de rester dans les limites
    const pad = Math.max(b.w, b.h) / 2 + 50;
    if (b.x > pad && b.x < MAP_SIZE - pad && b.y > pad && b.y < MAP_SIZE - pad) {
      buildings.push(b);
    }
  };

  // --- ARÈNE IA PERSONNALISÉE ---
  if (type === 'ai_custom' && aiCustomTheme) {
    aiCustomTheme.structuresList.forEach(s => {
      addBuildingSafely({
        x: s.x,
        y: s.y,
        w: s.w,
        h: s.h,
        color: s.type === 'crate' ? aiCustomTheme.customCrateColor : aiCustomTheme.customStructureColor,
        type: s.type,
        subType: s.subType
      });
    });

    const tileTypes: ('lava' | 'mud' | 'speed_boost' | 'healer')[] = ['lava', 'mud', 'speed_boost', 'healer'];
    tileTypes.forEach((tType, tIdx) => {
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 2) + tIdx * 0.45;
        const dist = 450 + tIdx * 180 + i * 90;
        const tx = 1250 + Math.cos(angle) * dist;
        const ty = 1250 + Math.sin(angle) * dist;
        const pad = tType === 'mud' ? 90 : 70;
        if (tx > pad && tx < MAP_SIZE - pad && ty > pad && ty < MAP_SIZE - pad) {
          tiles.push({
            id: `ai-${tType}-${i}`,
            type: tType,
            x: Math.round(tx),
            y: Math.round(ty),
            radius: tType === 'mud' ? 95 : tType === 'lava' ? 75 : tType === 'speed_boost' ? 55 : 50
          });
        }
      }
    });
  }

  // ==========================================
  // 1. MILITARY FOREST PROCEDURAL LAYOUT
  // ==========================================
  if (type === 'military_forest') {
    // 4 Bunkers Fortifiés aux quadrants principaux
    const quadrants = [
      { cx: 600, cy: 600 },
      { cx: 1900, cy: 600 },
      { cx: 600, cy: 1900 },
      { cx: 1900, cy: 1900 }
    ];

    quadrants.forEach((quad, qIndex) => {
      // Caserne centrale
      addBuildingSafely({
        x: quad.cx,
        y: quad.cy,
        w: 160,
        h: 110,
        color: '#2d3748', // Caserne gris-bleue
        type: 'structure',
        subType: 'barracks_main'
      });

      // Murs de sacs de sable protecteurs (barrières structurantes)
      addBuildingSafely({ x: quad.cx - 110, y: quad.cy - 30, w: 20, h: 90, color: '#78716c', type: 'structure', subType: 'sandbag' });
      addBuildingSafely({ x: quad.cx + 110, y: quad.cy + 30, w: 20, h: 90, color: '#78716c', type: 'structure', subType: 'sandbag' });
      addBuildingSafely({ x: quad.cx, y: quad.cy - 85, w: 120, h: 20, color: '#44403c', type: 'structure', subType: 'sandbag' });

      // Caisses de matériel militaire
      for (let c = 0; c < 4; c++) {
        addBuildingSafely({
          x: quad.cx + (c % 2 === 0 ? -60 : 60) + (Math.random() - 0.5) * 20,
          y: quad.cy + (c < 2 ? -40 : 40) + (Math.random() - 0.5) * 20,
          w: 30,
          h: 30,
          color: '#854d0e', // Caisses munitions
          type: 'crate',
          subType: 'ammo_crate'
        });
      }
    });

    // Rivière de boue sinueuse traversant la carte
    for (let i = 0; i < 35; i++) {
      const rx = i * 75 + 50;
      const ry = rx + Math.sin(i * 0.4) * 250 - 100;
      tiles.push({
        id: `mud-river-${i}`,
        type: 'mud',
        x: rx,
        y: ry,
        radius: 95
      });
    }

    // Ruines forestières éparses
    for (let i = 0; i < 15; i++) {
      const rx = 200 + Math.random() * (MAP_SIZE - 400);
      const ry = 200 + Math.random() * (MAP_SIZE - 400);
      if (getDistance(rx, ry, MAP_SIZE/2, MAP_SIZE/2) > 150) {
        addBuildingSafely({
          x: rx,
          y: ry,
          w: 40 + Math.random() * 40,
          h: 120 + Math.random() * 60,
          color: '#475569', // Mégalithes de pierre
          type: 'structure',
          subType: 'ruin_pillar'
        });
      }
    }

    // Spawn massif d'arbres et buissons de camouflage
    for (let i = 0; i < 160; i++) {
      const tx = Math.random() * MAP_SIZE;
      const ty = Math.random() * MAP_SIZE;
      const nearStructure = buildings.some(b => getDistance(b.x, b.y, tx, ty) < 95);
      const inRiver = tiles.some(t => getDistance(t.x, t.y, tx, ty) < t.radius);

      if (!nearStructure) {
        const rnd = Math.random();
        if (rnd < 0.6) {
          addBuildingSafely({
            x: tx,
            y: ty,
            w: inRiver ? 35 : 55, // Arbres plus petits dans la rivière
            h: inRiver ? 35 : 55,
            color: inRiver ? '#065f46' : '#14532d', // Sapins marécageux ou normaux
            type: 'tree'
          });
        } else {
          addBuildingSafely({
            x: tx,
            y: ty,
            w: 44,
            h: 44,
            color: '#22c55e',
            type: 'bush'
          });
        }
      }
    }
  }

  // ==========================================
  // 2. INDUSTRIAL SECTOR PROCEDURAL LAYOUT
  // ==========================================
  else if (type === 'industrial') {
    // 6 Grands hangars industriels organisés en grille procedurale
    const hangarPositions = [
      { x: 700, y: 700, w: 220, h: 110 },
      { x: 1800, y: 700, w: 220, h: 110 },
      { x: 1250, y: 1250, w: 140, h: 140 }, // Centre de commandement
      { x: 700, y: 1800, w: 220, h: 110 },
      { x: 1800, y: 1800, w: 220, h: 110 },
      { x: 1250, y: 500, w: 240, h: 90 }
    ];

    hangarPositions.forEach((hang, hIndex) => {
      // Bâtiment
      addBuildingSafely({
        x: hang.x,
        y: hang.y,
        w: hang.w,
        h: hang.h,
        color: '#374151', // Métal blindé
        type: 'structure',
        subType: 'hangar_block'
      });

      // Cloisons intérieures ajourées ou pièces extérieures
      addBuildingSafely({ x: hang.x - hang.w/2, y: hang.y, w: 15, h: 40, color: '#1f2937', type: 'structure' });
      addBuildingSafely({ x: hang.x + hang.w/2, y: hang.y, w: 15, h: 40, color: '#1f2937', type: 'structure' });
    });

    // Alignements de conteneurs de fret empilés (routes de labyrinthe industrielles)
    const containerColors = ['#991b1b', '#1e3a8a', '#d97706', '#111827', '#15803d'];
    const shipyardCenters = [
      { x: 1100, y: 850 },
      { x: 1400, y: 1650 },
      { x: 500, y: 1250 },
      { x: 2000, y: 1250 }
    ];

    shipyardCenters.forEach((center) => {
      // Placer 4 à 6 conteneurs géants par quai
      for (let k = 0; k < 5; k++) {
        const isVert = Math.random() > 0.5;
        const color = containerColors[Math.floor(Math.random() * containerColors.length)];
        addBuildingSafely({
          x: center.x + (isVert ? k * 55 - 110 : (Math.random() - 0.5) * 60),
          y: center.y + (!isVert ? k * 55 - 110 : (Math.random() - 0.5) * 60),
          w: isVert ? 46 : 95,
          h: isVert ? 95 : 46,
          color,
          type: 'structure',
          subType: 'cargo_container'
        });
      }
    });

    // Mares d'acide chimique vert corrosif (type 'mud' toxiques)
    for (let i = 0; i < 22; i++) {
      tiles.push({
        id: `acid-pool-${i}`,
        type: 'mud', // Rendu vert acide
        x: 100 + Math.random() * (MAP_SIZE - 200),
        y: 100 + Math.random() * (MAP_SIZE - 200),
        radius: 60 + Math.random() * 30
      });
    }

    // Centaines de fûts toxiques et caisses en fer éparpillées
    for (let i = 0; i < 110; i++) {
      const cx = Math.random() * MAP_SIZE;
      const cy = Math.random() * MAP_SIZE;
      const nearStructure = buildings.some(b => getDistance(b.x, b.y, cx, cy) < 65);

      if (!nearStructure) {
        const rnd = Math.random();
        if (rnd < 0.45) {
          addBuildingSafely({
            x: cx,
            y: cy,
            w: 32,
            h: 32,
            color: '#b91c1c', // Caisses métalliques explosives
            type: 'crate',
            subType: 'metal_crate'
          });
        } else if (rnd < 0.8) {
          addBuildingSafely({
            x: cx,
            y: cy,
            w: 35,
            h: 35,
            color: '#1e293b', // Fûts métalliques
            type: 'tree', // Bloque les tirs
            subType: 'barrel'
          });
        } else {
          addBuildingSafely({
            x: cx,
            y: cy,
            w: 35,
            h: 35,
            color: '#065f46', // Tuyaux toxiques (marchables, cachent légèrement)
            type: 'bush',
            subType: 'vent_smoke'
          });
        }
      }
    }
  }

  // ==========================================
  // 3. LAVA RUINS PROCEDURAL LAYOUT (Epic!)
  // ==========================================
  else if (type === 'lava_ruins') {
    // 🌋 LE VOLCAN CENTRAL (Lave et Pont obsidian)
    // Grand lac de magma circulaire au centre
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2;
      tiles.push({
        id: `lava-center-${r}`,
        type: 'lava',
        x: MAP_SIZE / 2 + Math.cos(angle) * 110,
        y: MAP_SIZE / 2 + Math.sin(angle) * 110,
        radius: 120
      });
    }
    // S'assurer qu'un gros dôme de lave scelle le centre absolu
    tiles.push({ id: 'lava-center-core', type: 'lava', x: MAP_SIZE/2, y: MAP_SIZE/2, radius: 100 });

    // GRAND PONT D'OBSIDIENNE STRUCTURAL (Permet de marcher au travers du lac central avec courage !)
    // Nord-Sud
    addBuildingSafely({
      x: MAP_SIZE / 2,
      y: MAP_SIZE / 2,
      w: 60,
      h: 460,
      color: '#262626', // Basalte sombre sécurisé
      type: 'structure',
      subType: 'obsidian_bridge'
    });
    
    // Altar de récompense au centre géométrique du dôme
    addBuildingSafely({
      x: MAP_SIZE / 2,
      y: MAP_SIZE / 2,
      w: 80,
      h: 80,
      color: '#171717',
      type: 'structure',
      subType: 'lava_altar'
    });

    // Murs concentriques de sanctuaire basaltique ruiné
    const wallCenters = [
      { x: MAP_SIZE/2 - 450, y: MAP_SIZE/2 - 450, w: 250, h: 30 },
      { x: MAP_SIZE/2 + 450, y: MAP_SIZE/2 - 450, w: 250, h: 30 },
      { x: MAP_SIZE/2 - 450, y: MAP_SIZE/2 + 450, w: 250, h: 30 },
      { x: MAP_SIZE/2 + 450, y: MAP_SIZE/2 + 450, w: 250, h: 30 },
      // Flancs
      { x: 500, y: 1250, w: 40, h: 300 },
      { x: 2000, y: 1250, w: 40, h: 300 }
    ];

    wallCenters.forEach((wc) => {
      addBuildingSafely({
        x: wc.x,
        y: wc.y,
        w: wc.w,
        h: wc.h,
        color: '#0a0a0a', // Obsidienne pure
        type: 'structure',
        subType: 'basalt_wall'
      });

      // Petites colonnes d'obsidienne protectrices à côté
      addBuildingSafely({ x: wc.x - wc.w/2 - 20, y: wc.y, w: 40, h: 40, color: '#f97316', type: 'structure', subType: 'magma_pillar' });
      addBuildingSafely({ x: wc.x + wc.w/2 + 20, y: wc.y, w: 40, h: 40, color: '#f97316', type: 'structure', subType: 'magma_pillar' });
    });

    // Coulées de lave sinueuses éparpillées (24 rivières de feu)
    for (let i = 0; i < 24; i++) {
      tiles.push({
        id: `lava-pool-${i}`,
        type: 'lava',
        x: 200 + Math.random() * (MAP_SIZE - 400),
        y: 200 + Math.random() * (MAP_SIZE - 400),
        radius: 50 + Math.random() * 40
      });
    }

    // Monolithes de quartz volcaniques et arbres fossilisés carbonisés
    for (let i = 0; i < 90; i++) {
      const tx = Math.random() * MAP_SIZE;
      const ty = Math.random() * MAP_SIZE;
      const nearStructure = buildings.some(b => getDistance(b.x, b.y, tx, ty) < 70);
      const onLava = tiles.some(t => getDistance(t.x, t.y, tx, ty) < t.radius);

      if (!nearStructure) {
        if (Math.random() < 0.6) {
          addBuildingSafely({
            x: tx,
            y: ty,
            w: 48,
            h: 48,
            color: onLava ? '#f97316' : '#292524', // Roches basaltiques
            type: 'tree',
            subType: 'charred_pillar'
          });
        } else {
          addBuildingSafely({
            x: tx,
            y: ty,
            w: 40,
            h: 40,
            color: '#ef4444', // Volcans miniatures d'herbes mortes/braises
            type: 'bush',
            subType: 'ember_bush'
          });
        }
      }
    }
  }

  // ==========================================
  // 4. RETRO CYBER NEON PROCEDURAL LAYOUT (Turbo speed_boost tracks)
  // ==========================================
  else if (type === 'cyber_neon') {
    // PISTES D'ACCÉLÉRATION EN LIGNE DROITE (Spawning cross alignments of SPEED BOOST zones)
    // 2 Axes Verticaux à x=800 et x=1700
    // 2 Axes Horizontaux à y=800 et y=1700
    const neonTracks = [800, 1700];
    neonTracks.forEach(coord => {
      // Pistes le long des méridiens horizontaux
      for (let step = 0; step < 16; step++) {
        tiles.push({
          id: `boost-h-${coord}-${step}`,
          type: 'speed_boost',
          x: step * 160 + 50,
          y: coord,
          radius: 46
        });

        // Pistes le long des méridiens verticaux
        tiles.push({
          id: `boost-v-${coord}-${step}`,
          type: 'speed_boost',
          x: coord,
          y: step * 160 + 50,
          radius: 46
        });
      }
    });

    // Labyrinthe géométrique de verre holographique fuchsia et cyan
    const barrierCoords = [
      { x: 500, y: 500, w: 220, h: 20, col: '#f43f5e' },
      { x: 500, y: 500, w: 20, h: 220, col: '#06b6d4' },
      { x: 2000, y: 500, w: 220, h: 20, col: '#f43f5e' },
      { x: 2000, y: 500, w: 20, h: 220, col: '#06b6d4' },
      { x: 500, y: 2000, w: 220, h: 20, col: '#06b6d4' },
      { x: 500, y: 2000, w: 20, h: 220, col: '#f43f5e' },
      { x: 2000, y: 2000, w: 220, h: 20, col: '#06b6d4' },
      { x: 2000, y: 2000, w: 20, h: 220, col: '#f43f5e' },
      // Noyau central
      { x: 1250, y: 1100, w: 180, h: 20, col: '#06b6d4' },
      { x: 1250, y: 1400, w: 180, h: 20, col: '#06b6d4' }
    ];

    barrierCoords.forEach(bc => {
      addBuildingSafely({
        x: bc.x,
        y: bc.y,
        w: bc.w,
        h: bc.h,
        color: bc.col,
        type: 'structure',
        subType: 'cyber_barrier'
      });
    });

    // Serveurs de données cosmiques faisant office d'obstacles rectangulaires (structures physiques)
    for (let c = 0; c < 12; c++) {
      addBuildingSafely({
        x: 400 + (c % 3) * 600 + Math.random()*50,
        y: 400 + Math.floor(c / 3) * 500 + Math.random()*50,
        w: 100,
        h: 100,
        color: '#111827', // Boîtier serveur
        type: 'structure',
        subType: 'mainframe_block'
      });
    }

    // Puces néon d'énergie et herbes virtuelles holographiques
    for (let i = 0; i < 110; i++) {
      const cx = Math.random() * MAP_SIZE;
      const cy = Math.random() * MAP_SIZE;
      const nearStructure = buildings.some(b => getDistance(b.x, b.y, cx, cy) < 65);
      const isBooster = tiles.some(t => getDistance(t.x, t.y, cx, cy) < t.radius);

      if (!nearStructure && !isBooster) {
        if (Math.random() < 0.45) {
          addBuildingSafely({
            x: cx,
            y: cy,
            w: 30,
            h: 30,
            color: '#a21caf', // Cyber caisse fuchsia
            type: 'crate',
            subType: 'cyber_node'
          });
        } else if (Math.random() < 0.8) {
          addBuildingSafely({
            x: cx,
            y: cy,
            w: 40,
            h: 40,
            color: '#06b6d4', // Arbre hologramme cyan
            type: 'tree',
            subType: 'holo_emitter'
          });
        } else {
          addBuildingSafely({
            x: cx,
            y: cy,
            w: 36,
            h: 36,
            color: 'rgba(217, 70, 239, 0.4)', // Buisson synthwave furtif
            type: 'bush',
            subType: 'pixel_grid'
          });
        }
      }
    }
  }

  // ==========================================
  // 5. SKELETAL DESERT PROCEDURAL LAYOUT (Pyramid and Oasis!)
  // ==========================================
  else if (type === 'skeletal_desert') {
    // 🏛️ LA GRANDE PYRAMIDE WALK-IN (Située au centre de la carte, 400x400)
    // Mur extérieur carré avec d'immenses ouvertures latérales
    const offsetPyramid = 200;
    const px = MAP_SIZE / 2;
    const py = MAP_SIZE / 2;

    // 4 Murs extérieurs de la base de la pyramide (laissant de grosses entrées de 80px)
    addBuildingSafely({ x: px - offsetPyramid, y: py - 100, w: 30, h: 220, color: '#7c2d12', type: 'structure', subType: 'sandstone_wall' });
    addBuildingSafely({ x: px - offsetPyramid, y: py + 100, w: 30, h: 220, color: '#7c2d12', type: 'structure', subType: 'sandstone_wall' });
    
    addBuildingSafely({ x: px + offsetPyramid, y: py - 100, w: 30, h: 220, color: '#7c2d12', type: 'structure', subType: 'sandstone_wall' });
    addBuildingSafely({ x: px + offsetPyramid, y: py + 100, w: 30, h: 220, color: '#7c2d12', type: 'structure', subType: 'sandstone_wall' });

    addBuildingSafely({ x: px - 100, y: py - offsetPyramid, w: 220, h: 30, color: '#7c2d12', type: 'structure', subType: 'sandstone_wall' });
    addBuildingSafely({ x: px + 100, y: py - offsetPyramid, w: 220, h: 30, color: '#7c2d12', type: 'structure', subType: 'sandstone_wall' });

    addBuildingSafely({ x: px - 100, y: py + offsetPyramid, w: 220, h: 30, color: '#7c2d12', type: 'structure', subType: 'sandstone_wall' });
    addBuildingSafely({ x: px + 100, y: py + offsetPyramid, w: 220, h: 30, color: '#7c2d12', type: 'structure', subType: 'sandstone_wall' });

    // Cœur Interne : Le Tombeau Doré du Pharaon
    addBuildingSafely({
      x: px,
      y: py,
      w: 85,
      h: 85,
      color: '#eab308', // Or divin
      type: 'structure',
      subType: 'pharaoh_coffin'
    });

    // 4 Oasis sacrés régénérants éparpillés aux points cardinaux (type 'healer')
    const oasisPoints = [
      { x: px - 700, y: py - 700 },
      { x: px + 700, y: py - 700 },
      { x: px - 700, y: py + 700 },
      { x: px + 700, y: py + 700 }
    ];

    oasisPoints.forEach((o, oIdx) => {
      tiles.push({
        id: `oasis-pool-${oIdx}`,
        type: 'healer', // Régénère hp et shield !
        x: o.x,
        y: o.y,
        radius: 110
      });

      // Végétation luxuriante de palmiers protecteurs autour de l'oasis
      for (let p = 0; p < 4; p++) {
        const angle = (p / 4) * Math.PI * 2;
        addBuildingSafely({
          x: o.x + Math.cos(angle) * 120,
          y: o.y + Math.sin(angle) * 120,
          w: 45,
          h: 45,
          color: '#15803d', // Vert oasis
          type: 'tree',
          subType: 'oasis_palm'
        });
      }
    });

    // 16 Grandes zones de sables mouvants ralentissants (type 'mud' ocre)
    for (let i = 0; i < 16; i++) {
      tiles.push({
        id: `quicksand-${i}`,
        type: 'mud', // Visuel ocre jaune
        x: 200 + Math.random() * (MAP_SIZE - 400),
        y: 200 + Math.random() * (MAP_SIZE - 400),
        radius: 80 + Math.random() * 40
      });
    }

    // Côtes ou squelettes fossilisés colossaux formant des remparts
    const fossilSpots = [
      { x: px - 400, y: py, ang: Math.PI/2 },
      { x: px + 400, y: py, ang: -Math.PI/2 },
      { x: px, y: py - 400, ang: 0 }
    ];

    fossilSpots.forEach((spot, sIdx) => {
      // Suite de colonnes courbées d'os blancs
      for (let oStep = -3; oStep <= 3; oStep++) {
        const offsetAng = spot.ang + oStep * 0.2;
        addBuildingSafely({
          x: spot.x + Math.cos(offsetAng) * (oStep * 30),
          y: spot.y + Math.sin(offsetAng) * (oStep * 30),
          w: 24,
          h: 48,
          color: '#f5f5f4', // Blanc os d'animaux préhistoriques
          type: 'structure',
          subType: 'fossil_bone'
        });
      }
    });

    // Cacti piquants truffés d'épines à travers toute la pampa sablonneuse
    for (let i = 0; i < 90; i++) {
      const tx = Math.random() * MAP_SIZE;
      const ty = Math.random() * MAP_SIZE;
      const nearStructure = buildings.some(b => getDistance(b.x, b.y, tx, ty) < 70);
      const onSpecial = tiles.some(t => getDistance(t.x, t.y, tx, ty) < t.radius);

      if (!nearStructure && !onSpecial) {
        if (Math.random() < 0.6) {
          addBuildingSafely({
            x: tx,
            y: ty,
            w: 44,
            h: 44,
            color: '#16a34a', // Vert cactus clair
            type: 'tree',
            subType: 'cactus'
          });
        } else {
          addBuildingSafely({
            x: tx,
            y: ty,
            w: 36,
            h: 36,
            color: '#7c2d12', // Dunes herbe sèche de pampa
            type: 'bush',
            subType: 'tumbleweed'
          });
        }
      }
    }
  }

  return { buildings, tiles, config };
}

export function generateMapStructures(): Building[] {
  // Option par défaut : choisit une carte aléatoire si appelée sans argument
  const themes: ArenaType[] = ['military_forest', 'industrial', 'lava_ruins', 'cyber_neon', 'skeletal_desert'];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  return generateProceduralArena(randomTheme).buildings;
}

