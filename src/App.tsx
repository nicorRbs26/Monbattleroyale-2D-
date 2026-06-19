import React, { useEffect, useState, useRef } from 'react';
import { PlayMode, Character, LootItem, Projectile, GameParticle, StormZone, PlayerStats, Weapon, ArenaType, EnvironmentalTile, AICustomTheme, AIEnvironmentEvent, SupplyDrop, PoisonZone, WeaponType, Difficulty } from './types';
import { MAP_SIZE, BOT_NAMES, getDistance, generateRandomLoot, generateMapStructures, generateWeapon, Building, generateProceduralArena, ARENA_THEMES } from './utils';
import { sounds } from './audio';
import MainMenu from './components/MainMenu';
import GameHUD from './components/GameHUD';
import SpectatorControls from './components/SpectatorControls';
import BattleReport from './components/BattleReport';
import { calculateMatchXp, getXpRequired } from './progression';

// Helper d'émote emoji
function getEmoteEmoji(emoteId: string | undefined): string {
  if (emoteId === 'thumbs_up') return '👍';
  if (emoteId === 'laugh') return '😂';
  if (emoteId === 'flag_white') return '🏳️';
  if (emoteId === 'victory') return '🔥';
  return '';
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  kills: 0,
  top10: 0,
  history: [],
  level: 1,
  xp: 0,
  equippedWeaponEffect: 'none',
  equippedEmote: 'none',
};

export default function App() {
  // Navigation State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'report'>('menu');
  const [playMode, setSelectedMode] = useState<PlayMode>('solo');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [selectedArena, setSelectedArena] = useState<ArenaType | 'random'>('random');
  const [currentArena, setCurrentArena] = useState<ArenaType>('military_forest');
  const [controlOption, setControlOption] = useState<'keyboard' | 'gamepad' | 'touch'>(() => {
    const cached = localStorage.getItem('br_control_option');
    if (cached) return cached as any;
    const isTouch = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    return isTouch ? 'touch' : 'keyboard';
  });

  // AI Customized Arenas States & Refs
  const [aiCustomTheme, setAiCustomTheme] = useState<AICustomTheme | null>(null);
  const aiCustomThemeRef = useRef<AICustomTheme | null>(null);
  const [activeAIEvent, setActiveAIEvent] = useState<AIEnvironmentEvent | null>(null);
  const activeAIEventRef = useRef<AIEnvironmentEvent | null>(null);

  // Timers and indices for AI Event Loop
  const aiEventTimerRef = useRef<number>(0);
  const aiEventNextTriggerRef = useRef<number>(8);
  const aiEventIndexRef = useRef<number>(0);

  // Random Map Events States & Refs
  const supplyDropsRef = useRef<SupplyDrop[]>([]);
  const poisonZonesRef = useRef<PoisonZone[]>([]);
  const supplyDropTimerRef = useRef<number>(20); // Premier largage à t=20s
  const poisonZoneTimerRef = useRef<number>(40); // Première alerte poison à t=40s
  const [centerNotification, setCenterNotification] = useState<{
    text: string;
    type: 'info' | 'danger' | 'supply';
    expiresAt: number;
  } | null>(null);

  // Sync refs with states to prevent async stale closures in canvas drawing
  useEffect(() => {
    aiCustomThemeRef.current = aiCustomTheme;
  }, [aiCustomTheme]);

  useEffect(() => {
    activeAIEventRef.current = activeAIEvent;
  }, [activeAIEvent]);

  // Player Skin & customization
  const [playerName, setPlayerName] = useState<string>('Survivant_Pro');
  const [skinColor, setSkinColor] = useState<string>('#ef4444');
  const [hatStyle, setHatStyle] = useState<Character['hatStyle']>('cap');
  const [patternStyle, setPatternStyle] = useState<Character['patternStyle']>('plain');

  // Stats persisting matching
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);

  // HUD Realtime Overlays
  const [survivorCount, setSurvivorCount] = useState<number>(40);
  const [kills, setKills] = useState<number>(0);
  const [stormPhase, setStormPhase] = useState<number>(1);
  const [stormTimer, setStormTimer] = useState<number>(60);
  const [stormIsShrinking, setStormIsShrinking] = useState<boolean>(false);
  const [killFeed, setKillFeed] = useState<string[]>([]);
  const [spectatorMode, setSpectatorMode] = useState<boolean>(false);
  const [spectatingName, setSpectatingName] = useState<string>('');

  // Mode Spectateur Avancé (Free Camera & Zoom)
  const [spectatorCamType, setSpectatorCamType] = useState<'follow' | 'free'>('follow');
  const [freeCamZoom, setFreeCamZoom] = useState<number>(1.0);
  const freeCamPosRef = useRef({ x: MAP_SIZE / 2, y: MAP_SIZE / 2 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Variations Climatologiques Météo (Acid Rain, Sandstorms, Magma Comets)
  const [weatherEvent, setWeatherEvent] = useState<'none' | 'acid_rain' | 'sandstorm' | 'magma_comets'>('none');
  const [weatherDuration, setWeatherDuration] = useState<number>(0);
  const weatherEventTimerRef = useRef<number>(20); // Premier évènement après 20s
  const cometsRef = useRef<{ id: string; x: number; y: number; timer: number; radius: number }[]>([]);

  // End game stats summary
  const [endGameRank, setEndGameRank] = useState<number>(40);
  const [endGameKills, setEndGameKills] = useState<number>(0);
  const [endGameTime, setEndGameTime] = useState<number>(0);
  const [weaponOfChoice, setWeaponOfChoice] = useState<string>('Pistolet S9');
  const [deathCause, setDeathCause] = useState<string>('Inconnue');

  // Refs for HTML5 Canvas Loop (avoid React DOM overhead at 60 fps)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameLoopRef = useRef<number | null>(null);

  // Core Game Entities kept in useRef to prevent infinite re-renders during 60 FPS simulations
  const charactersRef = useRef<Character[]>([]);
  const lootItemsRef = useRef<LootItem[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<GameParticle[]>([]);
  const structuresRef = useRef<Building[]>([]);
  const environmentalTilesRef = useRef<EnvironmentalTile[]>([]);
  const stormZoneRef = useRef<StormZone>({
    x: MAP_SIZE / 2,
    y: MAP_SIZE / 2,
    radius: MAP_SIZE * 0.7,
    targetX: MAP_SIZE / 2,
    targetY: MAP_SIZE / 2,
    targetRadius: MAP_SIZE * 0.7,
    damage: 1,
    phase: 1,
    timer: 60,
    maxTimer: 60,
    isShrinking: false,
  });

  const keysPressedRef = useRef<Record<string, boolean>>({});
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseWorldPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseDownRef = useRef<boolean>(false);

  // Mode de Contrôle étendu : Touchscreen & Gamepad Refs
  const touchMoveVectorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchAimVectorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isTouchShootingRef = useRef<boolean>(false);
  const prevGamepadButtonsRef = useRef<boolean[]>([]);
  
  // Suivi de l'identifiant des touches tactiles pour éviter les conflits multitouch
  const leftTouchIdRef = useRef<number | null>(null);
  const rightTouchIdRef = useRef<number | null>(null);

  // États réactifs d'affichage pour les visuels des joysticks sur mobile
  const [leftKnobPos, setLeftKnobPos] = useState({ x: 0, y: 0 });
  const [rightKnobPos, setRightKnobPos] = useState({ x: 0, y: 0 });

  // Disposition personnalisée des touches tactiles chargée depuis localStorage
  const [touchLayout, setTouchLayout] = useState<{
    leftJoystick: { x: number; y: number };
    rightJoystick: { x: number; y: number };
    dashButton: { x: number; y: number };
    mobileHUD: { x: number; y: number };
  }>(() => {
    const saved = localStorage.getItem('br_touch_hud_layout');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      leftJoystick: { x: 15, y: 80 },
      rightJoystick: { x: 80, y: 80 },
      dashButton: { x: 82, y: 55 },
      mobileHUD: { x: 50, y: 82 },
      reloadButton: { x: 70, y: 82 },
    };
  });

  useEffect(() => {
    const handleLayoutUpdate = () => {
      const saved = localStorage.getItem('br_touch_hud_layout');
      if (saved) {
        try {
          setTouchLayout(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('br_touch_layout_updated', handleLayoutUpdate);
    return () => {
      window.removeEventListener('br_touch_layout_updated', handleLayoutUpdate);
    };
  }, []);

  // Camera tracking
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Émettre l'émote du joueur sur le champ de bataille
  const handleTriggerEmote = () => {
    const p = playerRef.current;
    if (p && p.alive && !p.knocked && stats.equippedEmote && stats.equippedEmote !== 'none') {
      const emoji = getEmoteEmoji(stats.equippedEmote);
      p.activeEmote = emoji;
      p.emoteExpiresAt = Date.now() + 2500;
      spawnParticlesCircle(p.x, p.y, '#f59e0b', 8);
    }
  };

  // HUD mirroring refs to sync 60 FPS numbers with React state selectively
  const playerRef = useRef<Character | null>(null);
  const mateRef = useRef<Character | null>(null);
  const spectatorTargetIdxRef = useRef<number>(0);
  const matchStartTimeRef = useRef<number>(0);

  // Load stats on initiatisation
  useEffect(() => {
    const saved = localStorage.getItem('aura_royale_2d_stats');
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to load local stats", err);
      }
    }
  }, []);

  // Déclencher la recharge manuelle
  const triggerPlayerReload = () => {
    const p = playerRef.current;
    if (p && p.alive && !p.knocked) {
      const activeW = p.weapons[p.activeWeaponIndex];
      if (!activeW) return;
      
      // Ne recharger que si le chargeur n'est pas déjà plein et qu'on a des munitions
      if (activeW.currentClip < activeW.clipSize && p.ammo[activeW.type] > 0) {
        const now = Date.now();
        // Vérifier si on n'est pas déjà en train de tirer/recharger
        if (now - p.lastShootTime < activeW.fireRate) return;

        const reloadAmt = Math.min(activeW.clipSize - activeW.currentClip, p.ammo[activeW.type]);
        if (reloadAmt > 0) {
          activeW.currentClip += reloadAmt;
          p.ammo[activeW.type] -= reloadAmt;
          p.lastShootTime = now + 1200; // Temps de rechargement simulé
          sounds.playHeal(); // Son de recharge léger
          spawnParticlesCircle(p.x, p.y, '#38bdf8', 10); // Particules de recharge bleues
        }
      }
    }
  };

  // Sync keyboard triggers in App DOM
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressedRef.current[key] = true;
      keysPressedRef.current[e.code.toLowerCase()] = true;

      // Touches raccourcis de soins : 'a'/'q' pour medkit, 'f' pour bouclier
      if (gameState === 'playing' && playerRef.current && playerRef.current.alive && !playerRef.current.knocked) {
        if (key === 'a' || key === 'q') {
          // Utiliser kit soin
          consumeItem('medkit');
        } else if (key === 'f') {
          // Utiliser potion bouclier
          consumeItem('shield');
        } else if (key === 'r') {
          // Recharger
          triggerPlayerReload();
        } else if (key === '3' || key === 'digit3' || key === 'space' || key === 'shift') {
          triggerPlayerDash();
        } else if (key === '1' || key === 'digit1') {
          // Slot 1
          switchPlayerWeapon(0);
        } else if (key === '2' || key === 'digit2') {
          // Slot 2
          switchPlayerWeapon(1);
        } else if (key === 'e') {
          // Action / Switch interact (optionnel, ici switch slot)
          const nextSlot = playerRef.current.activeWeaponIndex === 0 ? 1 : 0;
          switchPlayerWeapon(nextSlot);
        } else if (key === 't') {
          // Exprimer émote équipée
          handleTriggerEmote();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
      keysPressedRef.current[e.code.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Déclencher le Dash du joueur principal
  const triggerPlayerDash = () => {
    const p = playerRef.current;
    if (p && p.alive && !p.knocked && p.dashCharges > 0 && p.dashCooldown <= 0) {
      // Calculer vecteur directionnel du dash basé sur les touches ZQSD
      let dx = 0;
      let dy = 0;
      if (keysPressedRef.current['z'] || keysPressedRef.current['arrowup']) dy -= 1;
      if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) dy += 1;
      if (keysPressedRef.current['q'] || keysPressedRef.current['arrowleft']) dx -= 1;
      if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) dx += 1;

      // Si aucune touche, dash dans le sens où il regarde
      if (dx === 0 && dy === 0) {
        dx = Math.cos(p.angle);
        dy = Math.sin(p.angle);
      }

      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
      }

      // Projeter sa position vers l'avant de 180px avec collision check
      const dashDist = 180;
      const targetX = Math.max(20, Math.min(MAP_SIZE - 20, p.x + dx * dashDist));
      const targetY = Math.max(20, Math.min(MAP_SIZE - 20, p.y + dy * dashDist));

      // Vérifier collision
      const hasWall = structuresRef.current.some(s => {
        if (s.type === 'bush') return false; // On traverse les buissons
        const halfW = s.w / 2;
        const halfH = s.h / 2;
        // Approximation boîte-cercle
        const closestX = Math.max(s.x - halfW, Math.min(targetX, s.x + halfW));
        const closestY = Math.max(s.y - halfH, Math.min(targetY, s.y + halfH));
        const dist = getDistance(targetX, targetY, closestX, closestY);
        return dist < p.radius;
      });

      if (!hasWall) {
        p.x = targetX;
        p.y = targetY;
      }

      p.dashCharges -= 1;
      p.dashCooldown = 3200; // 3.2s de cooldown

      // Jouer son
      sounds.playDash();

      // Particules de Dash
      for (let i = 0; i < 18; i++) {
        particlesRef.current.push({
          x: p.x - dx * (i * 5),
          y: p.y - dy * (i * 5),
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          color: '#f59e0b',
          size: 4 + Math.random() * 4,
          life: 1.0,
          decay: 0.05 + Math.random() * 0.05,
          type: 'exhaust',
        });
      }
    }
  };

  // Consommer un kit de soin ou une potion
  const consumeItem = (type: 'medkit' | 'shield') => {
    const p = playerRef.current;
    if (p && p.alive && !p.knocked) {
      if (type === 'medkit' && p.medkits > 0 && p.health < 100) {
        p.medkits -= 1;
        p.health = Math.min(100, p.health + 50);
        sounds.playHeal();
        // Particules de soin
        spawnParticlesCircle(p.x, p.y, '#10b981', 12);
      } else if (type === 'shield' && p.shieldPotions > 0 && p.shield < 100) {
        p.shieldPotions -= 1;
        p.shield = Math.min(100, p.shield + 50);
        sounds.playHeal();
        spawnParticlesCircle(p.x, p.y, '#3b82f6', 12);
      }
    }
  };

  const switchPlayerWeapon = (idx: number) => {
    const p = playerRef.current;
    if (p && p.alive && !p.knocked) {
      p.activeWeaponIndex = idx;
    }
  };

  // Lancement de partie
  const handleStartGame = () => {
    setGameState('playing');
    setSpectatorMode(false);
    setSpectatorCamType('follow');
    setFreeCamZoom(1.0);
    freeCamPosRef.current = { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
    setWeatherEvent('none');
    setWeatherDuration(0);
    weatherEventTimerRef.current = 20; // Premier climat après 20 sec de répit
    cometsRef.current = [];
    setKills(0);
    setKillFeed([]);

    // Déterminer le thème de l'arène à générer
    let activeTheme: ArenaType = 'military_forest';
    if (selectedArena === 'random') {
      const themes: ArenaType[] = ['military_forest', 'industrial', 'lava_ruins', 'cyber_neon', 'skeletal_desert'];
      activeTheme = themes[Math.floor(Math.random() * themes.length)];
    } else {
      activeTheme = selectedArena;
    }
    setCurrentArena(activeTheme);

    // Initialiser/Réinitialiser le système d'événements environnementaux de combat IA
    setActiveAIEvent(null);
    activeAIEventRef.current = null;
    aiEventTimerRef.current = 0;
    aiEventNextTriggerRef.current = 7; // Premier événement après 7s
    aiEventIndexRef.current = 0;

    // Réinitialiser les événements de carte aléatoires (largages et poisons)
    supplyDropsRef.current = [];
    poisonZonesRef.current = [];
    supplyDropTimerRef.current = 15; // Premier largage à t=15s
    poisonZoneTimerRef.current = 35; // Première zone toxique à t=35s
    setCenterNotification(null);

    // Générer structures de la map via le système de génération procédurale
    const arenaResult = generateProceduralArena(activeTheme, aiCustomTheme || undefined);
    structuresRef.current = arenaResult.buildings;
    environmentalTilesRef.current = arenaResult.tiles;

    // Générer loots aléatoires
    const lootList: LootItem[] = [];
    for (let i = 0; i < 160; i++) {
      const lx = 50 + Math.random() * (MAP_SIZE - 100);
      const ly = 50 + Math.random() * (MAP_SIZE - 100);
      const hasStructure = structuresRef.current.some(s => s.type !== 'bush' && getDistance(s.x, s.y, lx, ly) < s.w / 2 + 30);
      if (!hasStructure) {
        lootList.push(generateRandomLoot(lx, ly, `loot-${i}`));
      }
    }
    lootItemsRef.current = lootList;

    // Définir équipes et joueurs
    const characters: Character[] = [];
    
    // Le joueur principal
    const pId = 'player-main';
    const playerTeamId = 'team-player';

    // Créer ton arme de base
    const pWeapon0 = generateWeapon('pistol', 'common');
    // Paramètres basés sur la difficulté
    let playerMaxHealth = 100;
    let playerMaxShield = 50;
    let botSpeedBase = 4.0;
    let botShieldChance = 0.5;

    if (selectedDifficulty === 'easy') {
      playerMaxHealth = 150;
      playerMaxShield = 75;
      botSpeedBase = 3.6;
      botShieldChance = 0.2;
    } else if (selectedDifficulty === 'hard') {
      playerMaxHealth = 75;
      playerMaxShield = 0;
      botSpeedBase = 4.4;
      botShieldChance = 0.7;
    }

    const playerObj: Character = {
      id: pId,
      name: playerName || 'Survivant',
      x: 100 + Math.random() * (MAP_SIZE - 200),
      y: 100 + Math.random() * (MAP_SIZE - 200),
      radius: 17,
      speed: 4.8,
      angle: 0,
      isBot: false,
      isPlayer: true,
      teamId: playerTeamId,
      alive: true,
      knocked: false,
      health: playerMaxHealth,
      shield: playerMaxShield,
      weapons: [pWeapon0, null],
      activeWeaponIndex: 0,
      ammo: {
        pistol: 24,
        shotgun: 6,
        rifle: 45,
        sniper: 5,
        rocket: 2,
      },
      medkits: 1,
      shieldPotions: 1,
      dashCharges: 3,
      dashCooldown: 0,
      kills: 0,
      rank: 40,
      skinColor,
      hatStyle,
      patternStyle,
      aiState: 'idle',
      lastShootTime: 0,
      lastDecisionTime: 0,
      reviveTimer: 0,
    };
    characters.push(playerObj);
    playerRef.current = playerObj;

    // Si Duo ou Squad, on ajoute tes coéquipiers IA
    const mateIdxs = [0, 1, 2];
    const alliesCount = playMode === 'solo' ? 0 : playMode === 'duo' ? 1 : 3;
    
    for (let i = 0; i < alliesCount; i++) {
      const mateWeapon = generateWeapon(Math.random() > 0.5 ? 'pistol' : 'shotgun', 'common');
      const mateObj: Character = {
        id: `ally-bot-${i}`,
        name: `Allié_${BOT_NAMES[i % BOT_NAMES.length]}`,
        x: playerObj.x + (Math.random() - 0.5) * 120,
        y: playerObj.y + (Math.random() - 0.5) * 120,
        radius: 17,
        speed: 4.5,
        angle: 0,
        isBot: true,
        isPlayer: false,
        teamId: playerTeamId,
        alive: true,
        knocked: false,
        health: 100,
        shield: 50,
        weapons: [mateWeapon, null],
        activeWeaponIndex: 0,
        ammo: { pistol: 100, shotgun: 20, rifle: 90, sniper: 15, rocket: 5 },
        medkits: 1,
        shieldPotions: 1,
        dashCharges: 3,
        dashCooldown: 0,
        kills: 0,
        rank: 40,
        skinColor: '#3b82f6', // Bleu pour les alliés
        hatStyle: 'helmet',
        patternStyle: 'plain',
        aiState: 'search_loot',
        lastShootTime: 0,
        lastDecisionTime: 0,
        reviveTimer: 0,
      };
      characters.push(mateObj);
      if (i === 0) {
        mateRef.current = mateObj;
      }
    }

    // Ajouter le reste de bots (adverses) de manière à arriver à 40 joueurs
    const totalMaxPlayers = 40;
    const remainingCount = totalMaxPlayers - characters.length;
    
    // Déclarer équipes adverse
    let teamCounter = 1;
    let indexNameBot = alliesCount;

    for (let k = 0; k < remainingCount; k++) {
      const botId = `bot-enemy-${k}`;
      
      // Assigner la bonne structure de teams
      let botTeamId = `team-adv-${teamCounter}`;
      if (playMode === 'solo') {
        botTeamId = `team-adv-${botId}`; // Chaque bot a sa team en solo !
      } else if (playMode === 'duo') {
        if (k % 2 === 1) teamCounter++;
      } else {
        if (k % 4 === 3) teamCounter++;
      }

      const bx = 100 + Math.random() * (MAP_SIZE - 200);
      const by = 100 + Math.random() * (MAP_SIZE - 200);
      
      const botW = generateWeapon(
        Math.random() < 0.4 ? 'pistol' : Math.random() < 0.75 ? 'shotgun' : 'rifle',
        Math.random() > 0.85 ? 'rare' : 'common'
      );

      const botColor = `hsl(${Math.random() * 360}, 65%, 50%)`;
      const botHat: Character['hatStyle'] = Math.random() > 0.6 ? 'cap' : Math.random() > 0.8 ? 'helmet' : 'none';

      characters.push({
        id: botId,
        name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + `_${Math.floor(Math.random() * 90) + 10}`,
        x: bx,
        y: by,
        radius: 17,
        speed: botSpeedBase + Math.random() * 0.8,
        angle: Math.random() * Math.PI * 2,
        isBot: true,
        isPlayer: false,
        teamId: botTeamId,
        alive: true,
        knocked: false,
        health: 100,
        shield: Math.random() > botShieldChance ? 25 : 0,
        weapons: [botW, null],
        activeWeaponIndex: 0,
        ammo: { pistol: 120, shotgun: 25, rifle: 110, sniper: 15, rocket: 4 },
        medkits: Math.random() > 0.70 ? 1 : 0,
        shieldPotions: Math.random() > 0.75 ? 1 : 0,
        dashCharges: 3,
        dashCooldown: 0,
        kills: 0,
        rank: 40,
        skinColor: botColor,
        hatStyle: botHat,
        patternStyle: Math.random() > 0.6 ? 'stripes' : 'plain',
        aiState: 'search_loot',
        lastShootTime: 0,
        lastDecisionTime: 0,
        reviveTimer: 0,
      });
    }

    charactersRef.current = characters;
    projectilesRef.current = [];
    particlesRef.current = [];

    // Initialiser la Zone Tempête
    stormZoneRef.current = {
      x: MAP_SIZE / 2,
      y: MAP_SIZE / 2,
      radius: MAP_SIZE * 0.6,
      targetX: MAP_SIZE / 2,
      targetY: MAP_SIZE / 2,
      targetRadius: MAP_SIZE * 0.6,
      damage: 1.5,
      phase: 1,
      timer: 45,
      maxTimer: 45,
      isShrinking: false,
    };

    setSurvivorCount(40);
    setStormPhase(1);
    setStormTimer(45);
    setStormIsShrinking(false);
    matchStartTimeRef.current = Date.now();

    // Lancer le boucle d'animation canvas
    setTimeout(() => {
      if (canvasRef.current) {
        initCanvasListeners();
        // Lancement de frame
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = requestAnimationFrame(updateGameFrame);
      }
    }, 100);
  };

  const spawnParticlesCircle = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 3,
        life: 1.0,
        decay: 0.04 + Math.random() * 0.04,
        type: 'spark',
      });
    }
  };

  // Canvas listeners
  const initCanvasListeners = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      // Si spectateur + caméra libre + bouton enfoncé -> faire glisser l'arène !
      if (spectatorMode && spectatorCamType === 'free' && isMouseDownRef.current) {
        const dx = currentX - lastMousePosRef.current.x;
        const dy = currentY - lastMousePosRef.current.y;
        freeCamPosRef.current.x -= dx * (1 / freeCamZoom);
        freeCamPosRef.current.y -= dy * (1 / freeCamZoom);

        // Garder dans les limites de l'arène
        freeCamPosRef.current.x = Math.max(10, Math.min(MAP_SIZE - 10, freeCamPosRef.current.x));
        freeCamPosRef.current.y = Math.max(10, Math.min(MAP_SIZE - 10, freeCamPosRef.current.y));
      }

      mousePosRef.current.x = currentX;
      mousePosRef.current.y = currentY;
      lastMousePosRef.current.x = currentX;
      lastMousePosRef.current.y = currentY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = true;
        const rect = canvas.getBoundingClientRect();
        lastMousePosRef.current.x = e.clientX - rect.left;
        lastMousePosRef.current.y = e.clientY - rect.top;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (spectatorMode) {
        e.preventDefault();
        setFreeCamZoom(prev => {
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          return Math.max(0.4, Math.min(1.8, prev + delta));
        });
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
    canvas.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    canvas.addEventListener('wheel', handleWheel, { passive: false });
  };

  // Répétition principale frame
  const updateGameFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      gameLoopRef.current = requestAnimationFrame(updateGameFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gérer redimensionnement
    const parent = canvas.parentElement;
    if (parent && (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight)) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    // 1. DÉCIDER DE LA CIBLE DE CAMÉRA (Suivre joueur, ou cible spectatée si mort, ou caméra libre)
    let camTargetX = MAP_SIZE / 2;
    let camTargetY = MAP_SIZE / 2;

    const livingChars = charactersRef.current.filter(c => c.alive);
    let viewingChar = playerRef.current;

    if (spectatorMode) {
      if (spectatorCamType === 'free') {
        // Mode Caméra Libre spectateur
        camTargetX = freeCamPosRef.current.x;
        camTargetY = freeCamPosRef.current.y;
      } else {
        const listBots = charactersRef.current.filter(c => c.alive && !c.isPlayer);
        if (listBots.length > 0) {
          const target = listBots[spectatorTargetIdxRef.current % listBots.length];
          if (target) {
            viewingChar = target;
            setSpectatingName(target.name);
          }
        }
        if (viewingChar && viewingChar.alive) {
          camTargetX = viewingChar.x;
          camTargetY = viewingChar.y;
        }
      }
    } else {
      if (viewingChar && viewingChar.alive) {
        camTargetX = viewingChar.x;
        camTargetY = viewingChar.y;
      }
    }

    // Interpolation de la caméra pour un mouvement ultra fluide
    cameraRef.current.x += (camTargetX - cameraRef.current.x) * 0.1;
    cameraRef.current.y += (camTargetY - cameraRef.current.y) * 0.1;

    // Garder la caméra dans les limites map-visuelle + padding
    const width = canvas.width;
    const height = canvas.height;
    
    // Convertir souris locale en coordonnées mondiales pour le joueur
    if (playerRef.current && playerRef.current.alive && !playerRef.current.knocked) {
      if (controlOption === 'keyboard') {
        const worldMouseX = mousePosRef.current.x - width / 2 + cameraRef.current.x;
        const worldMouseY = mousePosRef.current.y - height / 2 + cameraRef.current.y;
        playerRef.current.angle = Math.atan2(worldMouseY - playerRef.current.y, worldMouseX - playerRef.current.x);
        mouseWorldPosRef.current = { x: worldMouseX, y: worldMouseY };
      }
    }

    // 2. SIMULATION DE L'ÉVOLUTION DU JEU
    simulateEntities();

    // 3. AFFICHAGE DES OBJETS À L'ÉCRAN
    drawGameScene(ctx, width, height);

    // Relancer la frame suivante
    gameLoopRef.current = requestAnimationFrame(updateGameFrame);
  };

  // simulation des bots, zone, loots, tirs
  const simulateEntities = () => {
    const characters = charactersRef.current;
    const structures = structuresRef.current;
    const projectiles = projectilesRef.current;
    const particles = particlesRef.current;
    const storm = stormZoneRef.current;

    // --- GESTION DU MOTEUR D'ÉVÉNEMENTS DYNAMIQUES IA ---
    if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
      const theme = aiCustomThemeRef.current;
      if (theme.events && theme.events.length > 0) {
        if (activeAIEventRef.current) {
          // Un événement est actuellement actif!
          aiEventTimerRef.current -= 1 / 60;
          const ev = activeAIEventRef.current;

          // Faire dériver les particules météorologiques autour du joueur principal
          const mainChar = playerRef.current;
          if (mainChar && mainChar.alive) {
            if (Math.random() < 0.28) {
              const rx = mainChar.x + (Math.random() - 0.5) * 1250;
              const ry = mainChar.y - 400; // Tombe d'en haut
              
              particles.push({
                x: rx,
                y: ry,
                vx: ev.type === 'tempest' ? -3.0 + Math.random() * 1.5 : -0.5 + Math.random() * 1.0,
                vy: 5.0 + Math.random() * 3.5,
                color: ev.particleColor,
                size: ev.particleType === 'digital_rune' ? 2 : 2.0 + Math.random() * 2.0,
                life: 1.0,
                decay: 0.008 + Math.random() * 0.01,
                type: ev.particleType === 'digital_rune' ? 'digital_rune' : 'spark'
              });
            }
          }

          if (aiEventTimerRef.current <= 0) {
            // Fin de l'événement!
            pushKillFeed(`✨ Fin de l'événement : ${ev.name}`);
            activeAIEventRef.current = null;
            setActiveAIEvent(null);
            // Programmer le prochain événement dans 17 à 25 secondes
            aiEventNextTriggerRef.current = 17 + Math.random() * 8;
          } else {
            // Appliquer les effets en temps réel sur les entités vivantes
            characters.forEach(char => {
              if (!char.alive) return;

              // Déterminer si l'entité est sous abri (proche d'un grand abri / bâtiment)
              const hasShelter = structures.some(s => s.type === 'structure' && getDistance(s.x, s.y, char.x, char.y) < Math.max(s.w, s.h) / 2 + 15);

              if (ev.type === 'radioactive_fallout') {
                if (!hasShelter) {
                  char.health -= 2.2 / 60; // 2.2 dégâts / seconde
                  if (char.health <= 0) {
                    char.health = 0;
                    char.alive = false;
                    char.deathCause = `Irradié par la faille ${ev.name}`;
                    triggerCharacterDeath(char);
                  }
                  // Petites bulles d'acide visuelles autour de l'entité
                  if (Math.random() < 0.12) {
                    particles.push({
                      x: char.x + (Math.random() - 0.5) * 20,
                      y: char.y + (Math.random() - 0.5) * 20,
                      vx: (Math.random() - 0.5) * 0.5,
                      vy: -0.5 - Math.random() * 1.0,
                      color: ev.particleColor,
                      size: 2,
                      life: 0.6,
                      decay: 0.04,
                      type: 'smoke'
                    });
                  }
                }
              }
              else if (ev.type === 'tempest') {
                if (!hasShelter) {
                  char.health -= 0.8 / 60; // Légère usure
                  if (char.health <= 0) {
                    char.health = 0;
                    char.alive = false;
                    char.deathCause = `Emporté par l'ouragan ${ev.name}`;
                    triggerCharacterDeath(char);
                  }
                  // Pousser légèrement toutes les entités exposées vers le bas-gauche par la force de la tempête!
                  char.x -= 0.22;
                  char.y += 0.18;
                }
              }
              else if (ev.type === 'healing_rain') {
                if (char.health < 100 && !char.knocked) {
                  char.health = Math.min(100, char.health + 1.8 / 60); // Soins de +1.8 HP/sec
                }
                // fines étincelles de guérison vertes
                if (Math.random() < 0.06) {
                  particles.push({
                    x: char.x + (Math.random() - 0.5) * 30,
                    y: char.y + (Math.random() - 0.5) * 30,
                    vx: 0,
                    vy: -1,
                    color: ev.particleColor,
                    size: 2.5,
                    life: 0.5,
                    decay: 0.03,
                    type: 'spark'
                  });
                }
              }
            });

            // Lancer des météores/éclairs aléatoires destructeurs lors des tempêtes !
            if (ev.type === 'tempest' && Math.random() < 0.032) {
              const targetChar = characters.filter(c => c.alive)[Math.floor(Math.random() * characters.length)];
              if (targetChar) {
                // Alerte ciblée autours d'une entité
                const sx = targetChar.x + (Math.random() - 0.5) * 160;
                const sy = targetChar.y + (Math.random() - 0.5) * 160;

                // Créer l'effet visuel de la menace
                particles.push({
                  x: sx,
                  y: sy,
                  vx: 0,
                  vy: 0,
                  color: ev.particleColor,
                  size: 40, // Grand indicateur de danger
                  life: 1.0,
                  decay: 0.022, // Dure environ 45 frames (~0.75 secondes de panique!)
                  type: 'hazard_indicator'
                });

                // Éclatement différé suite à un bref avertissement
                setTimeout(() => {
                  charactersRef.current.forEach(char => {
                    if (char.alive && getDistance(char.x, char.y, sx, sy) < 42) {
                      char.health -= 35; // Gros dégâts de foudre
                      if (char.health <= 0) {
                        char.health = 0;
                        char.alive = false;
                        char.deathCause = "Foudroyé en plein vol";
                        triggerCharacterDeath(char);
                      }
                    }
                  });

                  // Effet sonore et étincelles d'explosion
                  try { sounds.playExplosion(); } catch(e){}
                  for (let sIdx = 0; sIdx < 14; sIdx++) {
                    const ang = Math.random() * Math.PI * 2;
                    const velocity = 2.0 + Math.random() * 4.0;
                    particlesRef.current.push({
                      x: sx,
                      y: sy,
                      vx: Math.cos(ang) * velocity,
                      vy: Math.sin(ang) * velocity,
                      color: ev.particleColor,
                      size: 2.5 + Math.random() * 3.0,
                      life: 1.0,
                      decay: 0.04,
                      type: 'spark'
                    });
                  }
                }, 750);
              }
            }
          }
        } else {
          // Aucun événement actif, compter à rebours
          aiEventNextTriggerRef.current -= 1 / 60;
          if (aiEventNextTriggerRef.current <= 0) {
            // Déclencher un événement aléatoire de la liste
            const eventIndex = aiEventIndexRef.current % theme.events.length;
            aiEventIndexRef.current += 1;
            const chosenEvent = theme.events[eventIndex];

            activeAIEventRef.current = chosenEvent;
            setActiveAIEvent(chosenEvent);
            aiEventTimerRef.current = 18; // Dure 18 secondes

            pushKillFeed(`⚠️ PERTURBATION IA : ${chosenEvent.name} !`);
            pushKillFeed(`📢 Effet : ${chosenEvent.desc}`);
            try { sounds.playExplosion(); } catch(e){}
          }
        }
      }
    }

    // --- MISE À JOUR DE LA TEMPÊTE ---
    const nowSecs = (Date.now() - matchStartTimeRef.current) / 1000;
    
    if (storm.isShrinking) {
      // Zone décroit progressivement
      const rate = 0.5; // Vitesse de rétrécissement
      if (storm.radius > storm.targetRadius) {
        storm.radius -= rate;
        // Déplacer doucement le centre du cercle vers le centre cible !
        storm.x += (storm.targetX - storm.x) * 0.002;
        storm.y += (storm.targetY - storm.y) * 0.002;
      } else {
        storm.isShrinking = false;
        storm.phase += 1;
        storm.timer = Math.max(15, 45 - storm.phase * 5); // Prochain timer plus court
        storm.maxTimer = storm.timer;
        
        setStormPhase(storm.phase);
        setStormTimer(Math.round(storm.timer));
        setStormIsShrinking(false);
      }
    } else {
      // Décompte
      storm.timer -= 1/60;
      if (storm.timer <= 0) {
        // Enclencher rétrécissement de la zone
        storm.isShrinking = true;
        setStormIsShrinking(true);
        
        // Choisir un nouveau centre aléatoire mais qui reste encapsulé dans le cercle actuel !
        // Pour forcer des zones asymétriques rigolotes caractéristiques des battle royales !
        const maxOffset = (storm.radius - storm.radius * 0.6);
        const randAngle = Math.random() * Math.PI * 2;
        const offset = Math.random() * maxOffset;
        
        storm.targetX = Math.max(300, Math.min(MAP_SIZE - 300, storm.x + Math.cos(randAngle) * offset));
        storm.targetY = Math.max(300, Math.min(MAP_SIZE - 300, storm.y + Math.sin(randAngle) * offset));
        storm.targetRadius = Math.max(80, storm.radius * 0.6);
        storm.damage = 1.0 + storm.phase * 1.5; // Dégâts augmentent à chaque phase !
      } else {
        // Synchroniser le minuteur toutes les secondes
        if (Math.round(storm.timer) !== stormTimer) {
          setStormTimer(Math.max(0, Math.round(storm.timer)));
        }
      }
    }

    // --- GESTION DES EXPÉRIENCES DE CARTE ALÉATOIRES (LARGAGES ET POISONS) ---
    // 1. Décompte pour générer un Supply Drop
    supplyDropTimerRef.current -= 1/60;
    if (supplyDropTimerRef.current <= 0) {
      // Programmer le prochain après 40 à 55 secondes d'intervalle aléatoire
      supplyDropTimerRef.current = 40 + Math.random() * 15;
      
      // Sélectionner un point aléatoire dans le cercle de tempête actuel pour que ce soit utile et accessible
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (storm.radius * 0.7);
      const dropX = Math.max(100, Math.min(MAP_SIZE - 100, storm.x + Math.cos(angle) * dist));
      const dropY = Math.max(100, Math.min(MAP_SIZE - 100, storm.y + Math.sin(angle) * dist));
      
      const newDrop: SupplyDrop = {
        id: `supply-drop-${Date.now()}-${Math.random()}`,
        x: dropX,
        y: dropY,
        altitude: 400, // Commence très haut dans le ciel
        isLanded: false,
        isOpened: false,
        radius: 20,
        lootSpawned: false
      };
      
      supplyDropsRef.current.push(newDrop);
      
      // Notification
      setCenterNotification({
        text: "📦 COLIS STRATÉGIQUE EN APPROCHE ! Suivez l'indicateur sur la carte !",
        type: 'supply',
        expiresAt: Date.now() + 5000,
      });
      pushKillFeed("📦 [RAVITAILLEMENT] Un colis tactique a commencé son parachutage !");
      sounds.playHeal();
    }

    // 2. Décompte pour générer une Zone empoisonnée
    poisonZoneTimerRef.current -= 1/60;
    if (poisonZoneTimerRef.current <= 0) {
      // Prochain nuage après 50 à 70 secondes
      poisonZoneTimerRef.current = 50 + Math.random() * 20;

      // Point au hasard dans le cercle de tempête
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (storm.radius * 0.5);
      const poisonX = Math.max(200, Math.min(MAP_SIZE - 200, storm.x + Math.cos(angle) * dist));
      const poisonY = Math.max(200, Math.min(MAP_SIZE - 200, storm.y + Math.sin(angle) * dist));
      const poisonRadius = 150 + Math.random() * 80; // Rayon de 150 à 230 px

      const newZone: PoisonZone = {
        id: `poison-zone-${Date.now()}-${Math.random()}`,
        x: poisonX,
        y: poisonY,
        radius: poisonRadius,
        timer: 10, // 10 secondes d'alerte jaune
        maxTimer: 10,
        isWarning: true,
        active: true
      };

      poisonZonesRef.current.push(newZone);

      setCenterNotification({
        text: "☢️ ALERTE NUAGE TOXIQUE : Une zone va être contaminée ! Évacuez le secteur marqué !",
        type: 'danger',
        expiresAt: Date.now() + 6000,
      });
      pushKillFeed("☣️ [ALERTE TOXIQUE] Faille acide détectée ! Contamination imminente !");
      sounds.playExplosion();
    }

    // --- SYSTEME D'EVOLUTION CLIMATOLOGIQUE METEO EN CONTINU ---
    weatherEventTimerRef.current -= 1 / 60;
    if (weatherEventTimerRef.current <= 0) {
      if (weatherEvent === 'none') {
        // Selectionner un nouveau climat extreme aléatoire
        const weathers: ('acid_rain' | 'sandstorm' | 'magma_comets')[] = ['acid_rain', 'sandstorm', 'magma_comets'];
        const chosen = weathers[Math.floor(Math.random() * weathers.length)];
        const duration = 25 + Math.random() * 10; // 25 à 35 secondes

        setWeatherEvent(chosen);
        setWeatherDuration(Math.round(duration));
        weatherEventTimerRef.current = duration;

        let noteText = "";
        let noteType: 'danger' | 'warning' | 'info' = 'warning';
        if (chosen === 'acid_rain') {
          noteText = "🌧️ ACID RAIN DETECTION : L'eau corrosive ronge lentement le blindage hors des abris !";
          noteType = 'warning';
        } else if (chosen === 'sandstorm') {
          noteText = "🌪️ SANDSTORM WARNING : Vision de détection drastiquement réduite par d'épais vents de sable !";
          noteType = 'warning';
        } else {
          noteText = "☄️ COMPTE À REBOURS COMÈTES DE LAVA : Évitez les zones d'impact thermiques !";
          noteType = 'danger';
        }

        setCenterNotification({
          text: noteText,
          type: noteType,
          expiresAt: Date.now() + 6000,
        });
        pushKillFeed(`🚨 [METEO] Début d'un climat extrême : ${chosen.toUpperCase()} !`);
        sounds.playExplosion();
      } else {
        // Retour au calme météo
        setWeatherEvent('none');
        setWeatherDuration(0);
        weatherEventTimerRef.current = 30 + Math.random() * 15; // 30s de beau temps

        setCenterNotification({
          text: "☀️ RETOUR AU CALME : Le climat de l'arène s'est stabilisé.",
          type: 'info',
          expiresAt: Date.now() + 4000,
        });
        pushKillFeed("☀️ [CLIMAT] Le ciel de l'arène s'est apaisé.");
      }
    } else {
      if (weatherEvent !== 'none') {
        const remaining = Math.max(0, Math.round(weatherEventTimerRef.current));
        if (remaining !== weatherDuration) {
          setWeatherDuration(remaining);
        }
      }
    }

    // Simulation effective des impacts des climats actifs
    if (weatherEvent === 'acid_rain') {
      const buildings = structures.filter(s => s.type === 'structure');
      characters.forEach(char => {
        if (char.alive && !char.knocked) {
          // Vérifier si à l'abri dans une structure métallique
          const isSheltered = buildings.some(b => {
            const hW = b.w / 2;
            const hH = b.h / 2;
            return char.x >= b.x - hW && char.x <= b.x + hW && char.y >= b.y - hH && char.y <= b.y + hH;
          });

          if (!isSheltered) {
            // Dégât lent constant hors abris
            char.health = Math.max(1, char.health - (1.2 / 60));

            // Splash acide d'illustration
            if (Math.random() < 0.12) {
              particles.push({
                x: char.x + (Math.random() - 0.5) * char.radius * 2,
                y: char.y + (Math.random() - 0.5) * char.radius * 2,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                color: '#22c55e',
                size: 2 + Math.random() * 2,
                life: 0.6 + Math.random() * 0.4,
                decay: 0.05,
                type: 'acid_splash' as any,
              });
            }
          }
        }
      });
    } 
    
    else if (weatherEvent === 'magma_comets') {
      // Impact périodique d'une comète magma
      if (Math.random() < 0.018) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (storm.radius * 0.85);
        const targetX = Math.max(100, Math.min(MAP_SIZE - 100, storm.x + Math.cos(angle) * dist));
        const targetY = Math.max(100, Math.min(MAP_SIZE - 100, storm.y + Math.sin(angle) * dist));

        // Placer l'indicateur de danger rouge au sol
        particles.push({
          x: targetX,
          y: targetY,
          vx: 0,
          vy: 0,
          color: 'rgba(239, 68, 68, 0.8)',
          size: 70,
          life: 2.0,
          decay: 0.0083,
          type: 'hazard_indicator' as any,
        });

        cometsRef.current.push({
          id: `comet-${Date.now()}-${Math.random()}`,
          x: targetX,
          y: targetY,
          timer: 2.0,
          radius: 70,
        });
      }

      // Traiter la descente et l'impact de chaque comète
      const activeComets = cometsRef.current;
      for (let i = activeComets.length - 1; i >= 0; i--) {
        const comet = activeComets[i];
        comet.timer -= 1 / 60;
        if (comet.timer <= 0) {
          sounds.playExplosion();

          // Particules d'éclatement de flammes incendiaires
          for (let pIdx = 0; pIdx < 16; pIdx++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 2.0 + Math.random() * 3.5;
            particles.push({
              x: comet.x,
              y: comet.y,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
              size: 4 + Math.random() * 6,
              life: 1.0,
              decay: 0.035,
              type: 'fire' as any,
            });
          }

          // Dégâts d'impact explosifs aux entités à proximité
          characters.forEach(char => {
            if (char.alive && !char.knocked) {
              const dist = getDistance(char.x, char.y, comet.x, comet.y);
              if (dist <= comet.radius) {
                const force = 1 - (dist / comet.radius);
                const dmg = Math.round(18 + force * 24);
                char.health = Math.max(0, char.health - dmg);

                if (char.isPlayer && char.health <= 0) {
                  pushKillFeed("☄️ [LAVA] Vous avez été désintégrés par une comète de magma !");
                } else if (char.health <= 0) {
                  pushKillFeed(`☄️ [LAVA] ${char.name} a été détruit par une comète magma !`);
                }
              }
            }
          });

          // Retirer de la pile de vol
          activeComets.splice(i, 1);
        }
      }
    }

    // 3. Simuler les Supply Drops actifs
    supplyDropsRef.current.forEach(drop => {
      if (!drop.isLanded) {
        drop.altitude -= 1.8; // Vitesse de descente agréable
        if (drop.altitude <= 0) {
          drop.altitude = 0;
          drop.isLanded = true;
          
          // Flash, étincelles d'atterrissage
          spawnParticlesCircle(drop.x, drop.y, '#f59e0b', 20);
          pushKillFeed("📦 [RAVITAILLEMENT] Le colis stratégique a atterri sur le champ de bataille !");
          sounds.playHeal();
        }
      } else if (drop.isLanded && !drop.isOpened) {
        // Est-ce qu'un personnage vivant (joueur/bot) touche le colis ?
        const touchRange = drop.radius + 18;
        const opener = characters.find(char => char.alive && !char.knocked && getDistance(char.x, char.y, drop.x, drop.y) < touchRange);
        
        if (opener) {
          drop.isOpened = true;
          
          // Célébration visuelle et sonore
          spawnParticlesCircle(drop.x, drop.y, '#fbbf24', 25);
          pushKillFeed(`📦 [LARGAGE] ${opener.name} a ouvert le colis d'élite !`);
          if (opener.isPlayer) sounds.playHeal(); // Joue un jingle victorieux allié !

          // Générer des armes et items ultra rares autour du coffre pour de rudes batailles de loot
          const types: WeaponType[] = ['sniper', 'rocket', 'rifle', 'shotgun'];
          const randType1 = types[Math.floor(Math.random() * types.length)];
          const randType2 = types[Math.floor(Math.random() * types.length)];
          const weapon1 = generateWeapon(randType1, 'legendary');
          const weapon2 = generateWeapon(randType2, 'epic');

          lootItemsRef.current.push({
            id: `loot-supply-${Date.now()}-w1-${Math.random()}`,
            type: 'weapon',
            name: weapon1.name,
            x: drop.x + (Math.random() - 0.5) * 40,
            y: drop.y + (Math.random() - 0.5) * 40,
            weaponData: weapon1,
            rarity: 'legendary',
            radius: 17,
          });

          lootItemsRef.current.push({
            id: `loot-supply-${Date.now()}-w2-${Math.random()}`,
            type: 'weapon',
            name: weapon2.name,
            x: drop.x + (Math.random() - 0.5) * 40,
            y: drop.y + (Math.random() - 0.5) * 40,
            weaponData: weapon2,
            rarity: 'epic',
            radius: 17,
          });

          lootItemsRef.current.push({
            id: `loot-supply-${Date.now()}-item1-${Math.random()}`,
            type: 'item',
            name: 'Potion Bouclier Légendaire (+100)',
            x: drop.x + (Math.random() - 0.5) * 35,
            y: drop.y + (Math.random() - 0.5) * 35,
            itemType: 'shield',
            amount: 2,
            rarity: 'legendary',
            radius: 15,
          });

          lootItemsRef.current.push({
            id: `loot-supply-${Date.now()}-item2-${Math.random()}`,
            type: 'item',
            name: 'Grande Trousse de secours',
            x: drop.x + (Math.random() - 0.5) * 35,
            y: drop.y + (Math.random() - 0.5) * 35,
            itemType: 'medkit',
            amount: 2,
            rarity: 'epic',
            radius: 15,
          });
        }
      }
    });

    // Supprimer les supply drops ouverts de la liste active pour libérer de la mémoire et décharger l'AI
    supplyDropsRef.current = supplyDropsRef.current.filter(d => !d.isOpened);

    // 4. Simuler les Poison Zones actifs
    poisonZonesRef.current.forEach(zone => {
      if (!zone.active) return;
      zone.timer -= 1/60;

      if (zone.isWarning) {
        if (zone.timer <= 0) {
          zone.isWarning = false;
          zone.timer = 18; // 18 secondes de nuage empoisonné actif
          zone.maxTimer = 18;

          setCenterNotification({
            text: "☣️ ATTENTION DANGER TOXIQUE ACTIF ! Le nuage de poison s'est répandu !",
            type: 'danger',
            expiresAt: Date.now() + 5000,
          });
          pushKillFeed("☣️ [DANGER TOXIQUE] Le gaz de poison vert s'est répandu ! Fuyez la zone !");
          sounds.playExplosion();
        }
      } else {
        // La zone de poison est active
        // Créer de magnifiques bulles d'acide vertes
        if (Math.random() < 0.35) {
          const randAngle = Math.random() * Math.PI * 2;
          const randDist = Math.random() * zone.radius;
          const px = zone.x + Math.cos(randAngle) * randDist;
          const py = zone.y + Math.sin(randAngle) * randDist;
          particles.push({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -1.0 - Math.random() * 1.5, // Monte vers le haut
            color: '#22c55e',
            size: 1.5 + Math.random() * 2.5,
            life: 0.8 + Math.random() * 0.2,
            decay: 0.015 + Math.random() * 0.01,
            type: 'smoke'
          });
        }

        // Appliquer des dégâts continus (sur la santé pure !) à tout personnage dans la zone
        charactersRef.current.forEach(char => {
          if (!char.alive) return;
          const dist = getDistance(char.x, char.y, zone.x, zone.y);
          if (dist < zone.radius) {
            // 2.5 dégâts par seconde
            char.health -= 2.5 / 60;
            
            // Effet d'étincelles acides
            if (Math.random() < 0.08) {
              spawnParticlesCircle(char.x, char.y, '#16a34a', 3);
            }

            if (char.health <= 0) {
              char.health = 0;
              char.alive = false;
              char.deathCause = "Asphyxié par la tempête de poison";
              triggerCharacterDeath(char);
            }
          }
        });

        if (zone.timer <= 0) {
          zone.active = false;
          pushKillFeed("🍃 [AIR PUR] Le nuage de poison s'est dissipé !");
          setCenterNotification({
            text: "🍃 ARÈNE PURIFIÉE : Les vapeurs toxiques ont disparu !",
            type: 'info',
            expiresAt: Date.now() + 4000,
          });
        }
      }
    });

    // Éliminer zones mortes
    poisonZonesRef.current = poisonZonesRef.current.filter(z => z.active);

    // --- APPELER L'INFLUENCE DE L'ENVIRONNEMENT ET DES TUILES ---
    const envTiles = environmentalTilesRef.current;
    characters.forEach(char => {
      if (!char.alive) return;

      let speedMultiplier = 1.0;
      let onLava = false;
      let onAcid = false;
      let onHealer = false;
      let onSpeedBoost = false;

      // Calculer si sur une tuile
      for (let i = 0; i < envTiles.length; i++) {
        const tile = envTiles[i];
        const dist = getDistance(char.x, char.y, tile.x, tile.y);
        if (dist < tile.radius) {
          if (tile.type === 'mud') {
            speedMultiplier *= (currentArena === 'skeletal_desert' ? 0.45 : 0.60);
            if (currentArena === 'industrial') {
              onAcid = true;
            }
          } else if (tile.type === 'lava') {
            onLava = true;
            speedMultiplier *= 0.75;
          } else if (tile.type === 'speed_boost') {
            onSpeedBoost = true;
            speedMultiplier *= 1.55;
          } else if (tile.type === 'healer') {
            onHealer = true;
          }
        }
      }

      // Appliquer le speedMultiplier à l'entité temporairement
      char.tempSpeedMultiplier = speedMultiplier;

      // Appliquer les modificateurs d'événements IA temporaires!
      if (currentArena === 'ai_custom' && activeAIEventRef.current) {
        const ev = activeAIEventRef.current;
        if (ev.type === 'gravity_warp') {
          char.tempSpeedMultiplier *= 0.65; // warp de gravité : on ralentit
        } else if (ev.type === 'neon_surcharge') {
          char.tempSpeedMultiplier *= 1.35; // Surcharge néon : vitesse de déplacement accrue
        }
      }

      // Effets de dégâts & soins
      if (onLava && char.alive) {
        char.health -= 15 / 60; // 15 dégâts / sec
        if (Math.random() < 0.25) {
          particles.push({
            x: char.x + (Math.random() - 0.5) * 20,
            y: char.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 2 - 0.5,
            color: '#f97316',
            size: 2.5 + Math.random() * 3,
            life: 0.7,
            decay: 0.05,
            type: 'spark'
          });
        }
        if (char.health <= 0) {
          char.health = 0;
          char.alive = false;
          char.deathCause = "Noyé dans des coulées de magma";
          triggerCharacterDeath(char);
          return; // Skip further checks for this entity
        }
      }

      if (onAcid && char.alive) {
        char.health -= 6 / 60; // 6 dégâts / sec
        if (Math.random() < 0.2) {
          particles.push({
            x: char.x + (Math.random() - 0.5) * 16,
            y: char.y + (Math.random() - 0.5) * 16,
            vx: (Math.random() - 0.5) * 1.0,
            vy: -Math.random() * 1.5,
            color: '#22c55e',
            size: 1.8 + Math.random() * 2,
            life: 0.6,
            decay: 0.06,
            type: 'smoke'
          });
        }
        if (char.health <= 0) {
          char.health = 0;
          char.alive = false;
          char.deathCause = "Dissous par de l'acide toxique";
          triggerCharacterDeath(char);
          return;
        }
      }

      if (onHealer && char.alive && !char.knocked) {
        if (char.health < 100) char.health = Math.min(100, char.health + 12 / 60);
        if (char.shield < 100) char.shield = Math.min(100, char.shield + 10 / 60);
        if (Math.random() < 0.15) {
          particles.push({
            x: char.x + (Math.random() - 0.5) * 25,
            y: char.y + (Math.random() - 0.5) * 25,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -Math.random() * 1.5 - 0.2,
            color: '#10b981',
            size: 2 + Math.random() * 2,
            life: 0.8,
            decay: 0.04,
            type: 'spark'
          });
        }
      }

      if (onSpeedBoost && char.alive && !char.knocked) {
        if (Math.random() < 0.3) {
          particles.push({
            x: char.x,
            y: char.y + 12,
            vx: -Math.cos(char.angle) * 1.5 + (Math.random() - 0.5) * 0.5,
            vy: -Math.sin(char.angle) * 1.5 + (Math.random() - 0.5) * 0.5,
            color: '#06b6d4',
            size: 1.5 + Math.random() * 1.5,
            life: 0.5,
            decay: 0.08,
            type: 'spark'
          });
        }
      }
    });

    // --- LE JOUEUR PRINCIPAL PHYSIQUE ET TIRS ---
    const player = playerRef.current;
    if (player && player.alive) {
      // Gérer récupération de cooldown du dash
      if (player.dashCooldown > 0) {
        const isSurcharge = currentArena === 'ai_custom' && activeAIEventRef.current?.type === 'neon_surcharge';
        player.dashCooldown -= (1000/60) * (isSurcharge ? 4 : 1);
      }

      // 1. LIRE LES INPUTS DE PILOTAGE
      let gamepadActive = false;
      let gpMoveX = 0;
      let gpMoveY = 0;
      let gpShoot = false;

      if (controlOption === 'gamepad' && navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        const gp = Array.from(gamepads).find(g => g !== null);
        if (gp) {
          gamepadActive = true;
          // Analog Stick Gauche (Mouvement)
          let stickX = gp.axes[0] || 0;
          let stickY = gp.axes[1] || 0;
          if (Math.abs(stickX) < 0.15) stickX = 0;
          if (Math.abs(stickY) < 0.15) stickY = 0;
          gpMoveX = stickX;
          gpMoveY = stickY;

          // Analog Stick Droit (Visée)
          let lookX = gp.axes[2] || 0;
          let lookY = gp.axes[3] || 0;
          if (Math.abs(lookX) < 0.15) lookX = 0;
          if (Math.abs(lookY) < 0.15) lookY = 0;

          if (Math.abs(lookX) > 0.05 || Math.abs(lookY) > 0.05) {
            player.angle = Math.atan2(lookY, lookX);
          }

          // Détecteurs de transitions d'action de boutons
          const currentButtons = gp.buttons.map(b => b.pressed);
          const prevButtons = prevGamepadButtonsRef.current;
          const isButtonPressed = (idx: number) => currentButtons[idx] && !prevButtons[idx];

          if (isButtonPressed(0) || isButtonPressed(6)) {
            // Bouton A (0) ou LT (6) -> Dash
            triggerPlayerDash();
          }
          if (isButtonPressed(1) || isButtonPressed(4)) {
            // Bouton B (1) ou LB (4) -> Toggle active weapon index
            const nextSlot = player.selectedWeaponIndex === 0 ? 1 : 0;
            switchPlayerWeapon(nextSlot);
          }
          if (isButtonPressed(2)) {
            // Bouton X (2) -> Use Medkit
            consumeItem('medkit');
          }
          if (isButtonPressed(3)) {
            // Bouton Y (3) -> Use Shield
            consumeItem('shield');
          }

          // Shoot : RT (7) ou RB (5)
          if (gp.buttons[7]?.pressed || gp.buttons[5]?.pressed) {
            gpShoot = true;
          }

          prevGamepadButtonsRef.current = currentButtons;
        }
      }

      let touchActive = false;
      let touchMoveX = touchMoveVectorRef.current.x;
      let touchMoveY = touchMoveVectorRef.current.y;

      if (controlOption === 'touch') {
        touchActive = true;
        const aimX = touchAimVectorRef.current.x;
        const aimY = touchAimVectorRef.current.y;
        if (aimX !== 0 || aimY !== 0) {
          player.angle = Math.atan2(aimY, aimX);
        }
      }

      if (!player.knocked) {
        // Calcul du vecteur de déplacement selon le mode actif
        let vx = 0;
        let vy = 0;

        if (controlOption === 'gamepad' && gamepadActive) {
          vx = gpMoveX;
          vy = gpMoveY;
          const stickLen = Math.sqrt(vx * vx + vy * vy);
          const currentSpeed = player.speed * (player.tempSpeedMultiplier || 1.0);
          if (stickLen > 0) {
            const scale = Math.min(1.0, stickLen);
            vx = (vx / stickLen) * scale * currentSpeed;
            vy = (vy / stickLen) * scale * currentSpeed;
          }
        } else if (controlOption === 'touch' && touchActive) {
          vx = touchMoveX;
          vy = touchMoveY;
          const stickLen = Math.sqrt(vx * vx + vy * vy);
          const currentSpeed = player.speed * (player.tempSpeedMultiplier || 1.0);
          if (stickLen > 0) {
            const scale = Math.min(1.0, stickLen);
            vx = (vx / stickLen) * scale * currentSpeed;
            vy = (vy / stickLen) * scale * currentSpeed;
          }
        } else {
          // Clavier + Souris standard
          if (keysPressedRef.current['z'] || keysPressedRef.current['arrowup'] || keysPressedRef.current['w']) vy -= 1;
          if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) vy += 1;
          if (keysPressedRef.current['q'] || keysPressedRef.current['arrowleft'] || keysPressedRef.current['a']) vx -= 1;
          if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) vx += 1;

          const currentSpeed = player.speed * (player.tempSpeedMultiplier || 1.0);
          if (vx !== 0 && vy !== 0) {
            const norm = Math.sqrt(vx * vx + vy * vy);
            vx = (vx / norm) * currentSpeed;
            vy = (vy / norm) * currentSpeed;
          } else if (vx !== 0 || vy !== 0) {
            vx *= currentSpeed;
            vy *= currentSpeed;
          }
        }

        // Simuler collision avec structures et map
        if (vx !== 0 || vy !== 0) {
          handleCharacterMovementWithCollisions(player, vx, vy, structures);
        }

        // Tirs manuels si pression clic gauche ou analogiques ou tactile
        const isShootingInFrame = isMouseDownRef.current || 
                                  (controlOption === 'gamepad' && gpShoot) || 
                                  (controlOption === 'touch' && isTouchShootingRef.current);
        if (isShootingInFrame) {
          playerShootWeapon(player);
        }
      } else {
        // En K.O., crawl très doucement
        let vx = 0;
        let vy = 0;
        if (controlOption === 'gamepad' && gamepadActive) {
          vx = gpMoveX;
          vy = gpMoveY;
        } else if (controlOption === 'touch' && touchActive) {
          vx = touchMoveX;
          vy = touchMoveY;
        } else {
          if (keysPressedRef.current['z'] || keysPressedRef.current['arrowup'] || keysPressedRef.current['w']) vy -= 1;
          if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) vy += 1;
          if (keysPressedRef.current['q'] || keysPressedRef.current['arrowleft'] || keysPressedRef.current['a']) vx -= 1;
          if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) vx += 1;
        }

        if (vx !== 0 || vy !== 0) {
          const norm = Math.sqrt(vx * vx + vy * vy);
          vx = (vx / norm) * 0.9; // Vitesse de rampant
          vy = (vy / norm) * 0.9;
          handleCharacterMovementWithCollisions(player, vx, vy, structures);
        }
      }

      // Check dégâts de zone
      const distToStormCenter = getDistance(player.x, player.y, storm.x, storm.y);
      if (distToStormCenter > storm.radius) {
        // Subit dégâts de zone
        player.health -= storm.damage / 60; // par frame
        if (player.health <= 0) {
          player.health = 0;
          player.alive = false;
          player.deathCause = "Englouti par la tempête";
          triggerCharacterDeath(player);
        }
      }
    }

    // --- COÉQUIPIER & BOTS ENNEMIS AI SIMULATION ---
    const safeZoneCenter = { x: storm.targetX, y: storm.targetY };
    const safeRadius = storm.targetRadius;

    characters.forEach(char => {
      if (!char.alive || char.isPlayer) return; // Uniquement bots en vie

      // Gérer dash cooldown
      if (char.dashCooldown > 0) {
        const isSurcharge = currentArena === 'ai_custom' && activeAIEventRef.current?.type === 'neon_surcharge';
        char.dashCooldown -= (1000/60) * (isSurcharge ? 4 : 1);
      }

      // Check dégât de zone pour bots
      const dS = getDistance(char.x, char.y, storm.x, storm.y);
      if (dS > storm.radius) {
        char.health -= storm.damage / 60;
        if (char.health <= 0) {
          char.health = 0;
          char.alive = false;
          char.deathCause = "Perdu dans la tempête";
          triggerCharacterDeath(char);
          return;
        }
      }

      if (char.knocked) {
        // Bots rampent doucement vers l'allié vivant le plus proche
        const friendlyTeam = characters.filter(c => c.alive && !c.knocked && c.teamId === char.teamId);
        if (friendlyTeam.length > 0) {
          const closestF = friendlyTeam.reduce((closest, current) => {
            const d1 = getDistance(char.x, char.y, closest.x, closest.y);
            const d2 = getDistance(char.x, char.y, current.x, current.y);
            return d1 < d2 ? closest : current;
          });
          const angle = Math.atan2(closestF.y - char.y, closestF.x - char.x);
          const vx = Math.cos(angle) * 0.7;
          const vy = Math.sin(angle) * 0.7;
          handleCharacterMovementWithCollisions(char, vx, vy, structures);
        }
        return; // Pas d'actions AI complexes quand K.O
      }

      // --- PRISE DE DÉCISION IA TOUTES LES 1/3s POUR SAUVER LA CPU ---
      const now = Date.now();
      if (now - char.lastDecisionTime > 300) {
        char.lastDecisionTime = now;
        
        const inStorm = dS > storm.radius;
        const stormLowTime = storm.timer < 10 && !storm.isShrinking;

        // ÉTAPE 0: Priorité de fuir la zone empoisonnée toxique
        const insidePoison = poisonZonesRef.current.find(z => !z.isWarning && z.active && getDistance(char.x, char.y, z.x, z.y) < z.radius);

        if (insidePoison) {
          char.aiState = 'run_zone';
          const angleAway = Math.atan2(char.y - insidePoison.y, char.x - insidePoison.x);
          char.targetX = char.x + Math.cos(angleAway) * 350;
          char.targetY = char.y + Math.sin(angleAway) * 350;
        }
        // ÉTAPE 1: Priorité absolue d'échapper à la tempête
        else if (inStorm || stormLowTime) {
          char.aiState = 'run_zone';
          char.targetX = storm.x + (Math.random() - 0.5) * (storm.radius * 0.8);
          char.targetY = storm.y + (Math.random() - 0.5) * (storm.radius * 0.8);
        } 
        
        // ÉTAPE 2: Se soigner si PV bas et à l'abri
        else if (char.health < 45 && char.medkits > 0) {
          char.aiState = 'heal';
          // Consommer immédiatement
          char.medkits -= 1;
          char.health = Math.min(100, char.health + 50);
          sounds.playHeal();
          spawnParticlesCircle(char.x, char.y, '#10b981', 8);
        } 
        else if (char.shield < 50 && char.shieldPotions > 0) {
          char.aiState = 'heal';
          char.shieldPotions -= 1;
          char.shield = Math.min(100, char.shield + 50);
          sounds.playHeal();
          spawnParticlesCircle(char.x, char.y, '#3b82f6', 8);
        }

        // ÉTAPE 3: Réanimer un copain K.O en duo / squad
        else {
          const downedAllies = characters.filter(c => c.alive && c.knocked && c.teamId === char.teamId && getDistance(char.x, char.y, c.x, c.y) < 600);
          if (downedAllies.length > 0) {
            char.aiState = 'revive_ally';
            char.targetCharacterId = downedAllies[0].id;
            char.targetX = downedAllies[0].x;
            char.targetY = downedAllies[0].y;
          } 
          
          // ÉTAPE 4: Recherche d'ennemis en priorité
          else {
            const activeEnemies = characters.filter(c => c.alive && c.teamId !== char.teamId);
            let closestEnemy: Character | null = null;
            const sandstormReduction = weatherEvent === 'sandstorm' ? 0.35 : 1.0;
            const baseSight = 700 * sandstormReduction;
            let minDist = baseSight; // Rayon de perception dynamique de l'IA

            activeEnemies.forEach(e => {
              const d = getDistance(char.x, char.y, e.x, e.y);
              // Vérifier si caché dans un buisson (rayon réduit à 120px)
              const standingInBush = structures.some(s => s.type === 'bush' && getDistance(s.x, s.y, e.x, e.y) < s.w / 2);
              const appliedSight = (standingInBush ? 120 : 700) * sandstormReduction;

              if (d < appliedSight && d < minDist) {
                minDist = d;
                closestEnemy = e;
              }
            });

            if (closestEnemy) {
              char.aiState = 'combat';
              char.targetCharacterId = (closestEnemy as Character).id;
            } 
            
            // ÉTAPE 5: Si rien, chercher du butin proche ou un largage de ravitaillement !
            else {
              let closestLoot: LootItem | null = null;
              let minLootDist = 500;
              
              const activeDrops = supplyDropsRef.current.filter(d => d.isLanded && !d.isOpened);
              let targetDrop = null;
              let minDropDist = 1200;

              activeDrops.forEach(d => {
                const dist = getDistance(char.x, char.y, d.x, d.y);
                if (dist < minDropDist) {
                  minDropDist = dist;
                  targetDrop = d;
                }
              });

              if (targetDrop) {
                char.aiState = 'search_loot';
                char.targetX = (targetDrop as SupplyDrop).x;
                char.targetY = (targetDrop as SupplyDrop).y;
              } else {
                lootItemsRef.current.forEach(item => {
                  const d = getDistance(char.x, char.y, item.x, item.y);
                  if (d < minLootDist) {
                    minLootDist = d;
                    closestLoot = item;
                  }
                });

                if (closestLoot) {
                  char.aiState = 'search_loot';
                  char.targetLootId = (closestLoot as LootItem).id;
                  char.targetX = (closestLoot as LootItem).x;
                  char.targetY = (closestLoot as LootItem).y;
                } else {
                  // Errance libre
                  char.aiState = 'idle';
                  if (Math.random() > 0.7) {
                    char.targetX = char.x + (Math.random() - 0.5) * 300;
                    char.targetY = char.y + (Math.random() - 0.5) * 300;
                  }
                }
              }
            }
          }
        }
      }

      // --- EXÉCUTION DE L'ACTION DU BOT A CHAQUE FRAME ---
      if (char.aiState === 'run_zone' || char.aiState === 'idle' || char.aiState === 'search_loot') {
        if (char.targetX && char.targetY) {
          const d = getDistance(char.x, char.y, char.targetX, char.targetY);
          if (d > 15) {
            char.angle = getSmartBotAngle(char, char.targetX, char.targetY, structures);
            const currentSpeed = char.speed * (char.tempSpeedMultiplier || 1.0);
            const vx = Math.cos(char.angle) * currentSpeed * 0.95;
            const vy = Math.sin(char.angle) * currentSpeed * 0.95;
            handleCharacterMovementWithCollisions(char, vx, vy, structures);
          }
        }
      } 
      
      else if (char.aiState === 'revive_ally') {
        const ally = characters.find(c => c.id === char.targetCharacterId);
        if (ally && ally.alive && ally.knocked) {
          const d = getDistance(char.x, char.y, ally.x, ally.y);
          if (d > 35) {
            // Marcher vers lui avec angle d'évitement d'obstacles
            char.angle = getSmartBotAngle(char, ally.x, ally.y, structures);
            const currentSpeed = char.speed * (char.tempSpeedMultiplier || 1.0);
            const vx = Math.cos(char.angle) * currentSpeed;
            const vy = Math.sin(char.angle) * currentSpeed;
            handleCharacterMovementWithCollisions(char, vx, vy, structures);
          } else {
            // Près de lui, soigner !
            char.reviveTimer += 1000/60; // 1 frame
            ally.reviveTimer += 1000/60;
            ally.revivedBy = char.name;

            if (char.reviveTimer >= 3000) { // 3 secondes pour réanimer
              ally.knocked = false;
              ally.health = 35;
              ally.reviveTimer = 0;
              char.reviveTimer = 0;
              char.aiState = 'idle';
              pushKillFeed(`🩹 ${char.name} a relevé ${ally.name}`);
            }
          }
        } else {
          char.reviveTimer = 0;
          char.aiState = 'idle';
        }
      }

      else if (char.aiState === 'combat') {
        const enemy = characters.find(c => c.id === char.targetCharacterId);
        if (enemy && enemy.alive) {
          char.angle = Math.atan2(enemy.y - char.y, enemy.x - char.x);
          const d = getDistance(char.x, char.y, enemy.x, enemy.y);

          // Choisir si on avance ou recule selon sa vie et distance
          let speedFactor = 0;
          if (d > 350) {
            speedFactor = 1.0; // Se rapprocher
          } else if (d < 180) {
            speedFactor = -0.8; // Reculer tactiquement
          } else {
            speedFactor = (Math.random() - 0.5) * 0.6; // Zigzag latéral
          }

          // Évitement intelligent d'obstacles en combat
          const driftX = enemy.x + (speedFactor < 0 ? -(enemy.x - char.x) * 1.5 : 0);
          const driftY = enemy.y + (speedFactor < 0 ? -(enemy.y - char.y) * 1.5 : 0);
          const moveAngle = getSmartBotAngle(char, driftX, driftY, structures);

          const currentSpeed = char.speed * (char.tempSpeedMultiplier || 1.0);
          const vx = Math.cos(moveAngle) * currentSpeed * Math.abs(speedFactor);
          const vy = Math.sin(moveAngle) * currentSpeed * Math.abs(speedFactor);
          handleCharacterMovementWithCollisions(char, vx, vy, structures);

          // Essayer de tirer
          const activeW = char.weapons[char.activeWeaponIndex];
          if (activeW && d < activeW.range) {
            // Si charge restante vide, recharger auto
            if (activeW.currentClip <= 0 && activeW.reserveAmmo > 0) {
              activeW.currentClip = activeW.clipSize; // Recharge instant bot
            } else {
              playerShootWeapon(char);
            }
          }
        } else {
          char.aiState = 'idle';
        }
      }
    });

    // --- COLLISION RAMASSAGE BUTIN (AUTO S'IL PASSE DESSUS) ---
    characters.forEach(char => {
      if (!char.alive || char.knocked) return;

      lootItemsRef.current = lootItemsRef.current.filter(item => {
        const d = getDistance(char.x, char.y, item.x, item.y);
        if (d < char.radius + item.radius) {
          // Ramassage
          if (item.type === 'weapon' && item.weaponData) {
            // Est-ce qu'on a un slot d'arme dispo ?
            if (!char.weapons[0]) {
              char.weapons[0] = item.weaponData;
              char.activeWeaponIndex = 0;
              if (char.isPlayer) sounds.playLoot();
            } else if (!char.weapons[1]) {
              char.weapons[1] = item.weaponData;
              char.activeWeaponIndex = 1;
              if (char.isPlayer) sounds.playLoot();
            } else {
              // Remplacer l'arme dans l'index actif
              const dropWType = char.weapons[char.activeWeaponIndex]?.type;
              
              // Recréer le butin jeté au sol
              const activeSlot = char.activeWeaponIndex;
              const replacedW = char.weapons[activeSlot];
              
              char.weapons[activeSlot] = item.weaponData;
              if (char.isPlayer) sounds.playLoot();

              // Laisser l'ancienne arme au sol
              if (replacedW) {
                lootItemsRef.current.push({
                  id: `loot-dropped-${Date.now()}-${Math.random()}`,
                  type: 'weapon',
                  name: replacedW.name,
                  x: char.x + (Math.random() - 0.5) * 40,
                  y: char.y + (Math.random() - 0.5) * 40,
                  weaponData: replacedW,
                  rarity: replacedW.rarity,
                  radius: 17,
                });
              }
            }
          } else if (item.type === 'item' && item.itemType) {
            if (item.itemType === 'medkit') {
              char.medkits += item.amount || 1;
            } else if (item.itemType === 'shield') {
              char.shieldPotions += item.amount || 1;
            } else if (item.itemType === 'dash_recharge') {
              char.dashCharges = Math.min(3, char.dashCharges + 1);
            } else {
              // Munitions
              const ammoType = item.itemType.replace('ammo_', '') as keyof typeof char.ammo;
              char.ammo[ammoType] = (char.ammo[ammoType] || 0) + (item.amount || 10);
            }
            if (char.isPlayer) sounds.playLoot();
          }
          return false; // Retirer du sol
        }
        return true;
      });
    });

    // --- DÉPLACEMENT ET CRASH DES PROJECTILES (BALLES / ROQUETTES) ---
    projectilesRef.current = projectilesRef.current.filter(proj => {
      // Avancer
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.rangeRemaining -= proj.bulletSpeed;

      // Émettre des particules de traînée premium colorées !
      if (proj.ownerId === 'player-main' && stats.equippedWeaponEffect && stats.equippedWeaponEffect !== 'none') {
        if (Math.random() > 0.4) {
          particlesRef.current.push({
            x: proj.x,
            y: proj.y,
            vx: -proj.vx * 0.08 + (Math.random() - 0.5) * 1.0,
            vy: -proj.vy * 0.08 + (Math.random() - 0.5) * 1.0,
            color: proj.color,
            size: 1.5 + Math.random() * 2,
            life: 0.8,
            decay: 0.04 + Math.random() * 0.04,
            type: 'spark',
          });
        }
      }

      if (proj.rangeRemaining <= 0) {
        if (proj.type === 'rocket') triggerRocketExplosion(proj.x, proj.y, proj.ownerId);
        return false; // Portée expirée
      }

      // Check collision avec murs solides du décor
      const hitWall = structures.some(s => {
        if (s.type === 'bush') return false; // On traverse les buissons !
        const halfW = s.w / 2;
        const halfH = s.h / 2;
        return proj.x > s.x - halfW && proj.x < s.x + halfW && proj.y > s.y - halfH && proj.y < s.y + halfH;
      });

      if (hitWall) {
        if (proj.type === 'rocket') triggerRocketExplosion(proj.x, proj.y, proj.ownerId);
        else spawnParticlesCircle(proj.x, proj.y, '#94a3b8', 5); // Étincelle grise
        return false;
      }

      // Check collision avec personnages
      let hitChar = false;
      for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        if (!char.alive || char.id === proj.ownerId || char.teamId === proj.teamId) continue; // Pas de friendly fire !
        
        const d = getDistance(proj.x, proj.y, char.x, char.y);
        if (d < char.radius + proj.radius) {
          hitChar = true;
          damageCharacter(char, proj.damage, proj.ownerId);
          break;
        }
      }

      if (hitChar) {
        if (proj.type === 'rocket') triggerRocketExplosion(proj.x, proj.y, proj.ownerId);
        return false;
      }

      // Garder
      return true;
    });

    // --- PARTICULES DE JEU PHYSIQUE ---
    particlesRef.current = particlesRef.current.filter(part => {
      part.x += part.vx;
      part.y += part.vy;
      part.life -= part.decay;
      return part.life > 0;
    });

    // --- COHÉRENCE DU NOMBRE DE SURVIVANTS ---
    const totalLiving = characters.filter(c => c.alive).length;
    if (totalLiving !== survivorCount) {
      setSurvivorCount(totalLiving);
    }

    // --- CONDITION DE FIN DE PARTIE ---
    // Trouver combien d'équipes distinctes en vie
    const livingTeams = Array.from(new Set(characters.filter(c => c.alive).map(c => c.teamId)));
    if (livingTeams.length <= 1 && gameState === 'playing') {
      handleMatchComplete();
    }
  };

  // Fin de match triomphale ou spectateur
  const handleMatchComplete = () => {
    // Calculer classement final
    const livingPlayers = charactersRef.current.filter(c => c.alive);
    const isPlayerTeamLiving = livingPlayers.some(c => c.teamId === 'team-player');

    let finalRank = 40;
    if (isPlayerTeamLiving) {
      finalRank = 1; // Victoire Royale !
    } else {
      // Déjà calculé au moment du décès
      finalRank = endGameRank;
    }

    // Sauvegarder les statistiques
    const timeSurv = Math.round((Date.now() - matchStartTimeRef.current) / 1000);
    const finalKills = playerRef.current ? playerRef.current.kills : 0;
    const finalWeapon = playerRef.current?.weapons[playerRef.current?.activeWeaponIndex]?.name || 'Fusil d\'Assaut AR-15';
    
    const newHistory = {
      playedAt: new Date().toLocaleDateString('fr'),
      mode: playMode,
      rank: finalRank,
      kills: finalKills,
      survivedTime: timeSurv,
      weaponOfChoice: finalWeapon,
    };

    // Calculer XP et niveaux
    const earnedXpResult = calculateMatchXp(finalRank, finalKills, timeSurv);
    let currentLvl = stats.level ?? 1;
    let currentXp = stats.xp ?? 0;
    let xpToAdd = earnedXpResult.totalEarnedXp;

    while (xpToAdd > 0) {
      const required = getXpRequired(currentLvl);
      const space = required - currentXp;

      if (xpToAdd >= space) {
        xpToAdd -= space;
        currentXp = 0;
        currentLvl += 1;
      } else {
        currentXp += xpToAdd;
        xpToAdd = 0;
      }
    }

    const newStats: PlayerStats = {
      gamesPlayed: stats.gamesPlayed + 1,
      wins: stats.wins + (finalRank === 1 ? 1 : 0),
      kills: stats.kills + finalKills,
      top10: stats.top10 + (finalRank <= 10 ? 1 : 0),
      history: [newHistory, ...stats.history].slice(0, 20), // Conserver les 20 derniers
      level: currentLvl,
      xp: currentXp,
      equippedWeaponEffect: stats.equippedWeaponEffect || 'none',
      equippedEmote: stats.equippedEmote || 'none',
    };

    setStats(newStats);
    localStorage.setItem('aura_royale_2d_stats', JSON.stringify(newStats));

    // Configurer rapports de combat finaux
    setEndGameRank(finalRank);
    setEndGameKills(finalKills);
    setEndGameTime(timeSurv);
    setWeaponOfChoice(finalWeapon);
    setGameState('report');

    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  };

  // Infliger dégâts à un personnage
  const damageCharacter = (char: Character, dmg: number, attackerId: string) => {
    if (!char.alive) return;

    // Calculer répartition bouclier vs vie
    if (char.shield > 0) {
      char.shield -= dmg;
      if (char.shield < 0) {
        char.health += char.shield; // Soustraire le débordement
        char.shield = 0;
      }
      // Étincelles bleues
      spawnParticlesCircle(char.x, char.y, '#60a5fa', 6);
    } else {
      char.health -= dmg;
      // Sang/étincelles de dégâts
      spawnParticlesCircle(char.x, char.y, '#ef4444', 6);
    }

    // Check mort / knocked down
    if (char.health <= 0) {
      char.health = 0;
      
      const friendlyLeft = charactersRef.current.filter(c => c.alive && !c.knocked && c.teamId === char.teamId && c.id !== char.id);

      if (playMode !== 'solo' && friendlyLeft.length > 0 && !char.knocked) {
        // KO relevable
        char.knocked = true;
        char.health = 100; // jauge de bleed-out à 100
        char.reviveTimer = 0;
        
        const attackerName = charactersRef.current.find(c => c.id === attackerId)?.name || 'Anonyme';
        pushKillFeed(`🚨 ${char.name} a été mis K.O par ${attackerName}`);
      } else {
        // Mort définitive
        char.alive = false;
        const attacker = charactersRef.current.find(c => c.id === attackerId);
        if (attacker) {
          attacker.kills += 1;
          if (attacker.isPlayer) {
            setKills(attacker.kills);
          }
          char.deathCause = `Éliminé par ${attacker.name}`;
        } else {
          char.deathCause = "Blessure fatale";
        }
        triggerCharacterDeath(char, attacker?.name);
      }
    }
  };

  // Traiter décès
  const triggerCharacterDeath = (char: Character, attackerName?: string) => {
    const killer = attackerName || "Tempête";
    pushKillFeed(`🪦 ${char.name} a été éliminé par ${killer}`);

    // Laisser au sol tout son butin !
    char.weapons.forEach(w => {
      if (w) {
        lootItemsRef.current.push({
          id: `loot-dropped-${Date.now()}-${Math.random()}`,
          type: 'weapon',
          name: w.name,
          x: char.x + (Math.random() - 0.5) * 60,
          y: char.y + (Math.random() - 0.5) * 60,
          weaponData: w,
          rarity: w.rarity,
          radius: 17,
        });
      }
    });

    // Laisser des potions / kits d'urgence au sol
    if (char.medkits > 0 || char.shieldPotions > 0 || Math.random() > 0.5) {
      lootItemsRef.current.push({
        id: `loot-dropped-med-${Date.now()}`,
        type: 'item',
        name: 'Kit de Soin d\'Urgence (+50)',
        x: char.x + (Math.random() - 0.5) * 40,
        y: char.y + (Math.random() - 0.5) * 40,
        itemType: Math.random() > 0.5 ? 'medkit' : 'shield',
        amount: 1,
        rarity: 'common',
        radius: 14,
      });
    }

    // Explosion de feux d'artifice/particules de poof
    spawnParticlesCircle(char.x, char.y, char.skinColor, 25);

    // Si tu es mort
    if (char.isPlayer) {
      sounds.playExplosion();
      const finalLivingRemaining = charactersRef.current.filter(c => c.alive).length + 1;
      setEndGameRank(finalLivingRemaining);
      setEndGameKills(char.kills);
      setDeathCause(char.deathCause || "Mort dans l'arène");
      
      // Proposer le mode spectateur immédiat
      setSpectatorMode(true);
      setSpectatorCamType('follow');
      setFreeCamZoom(1.0);
      freeCamPosRef.current = { x: char.x, y: char.y };
      spectatorTargetIdxRef.current = 0;
    }
  };

  // Gérer explosion de roquette (dégâts de zone)
  const triggerRocketExplosion = (ex: number, ey: number, ownerId: string) => {
    sounds.playExplosion();

    // Spawn particules d'explosion rouge orange
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particlesRef.current.push({
        x: ex,
        y: ey,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
        size: 5 + Math.random() * 8,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.03,
        type: 'explosion',
      });
    }

    // Appliquer dégâts de zone à proximité (rayon de 150px)
    const splashRadius = 150;
    const owner = charactersRef.current.find(c => c.id === ownerId);

    charactersRef.current.forEach(char => {
      if (!char.alive) return;
      const d = getDistance(char.x, char.y, ex, ey);
      if (d < splashRadius) {
        // Dégâts proportionnels à la distance
        const pct = 1.0 - (d / splashRadius);
        const splashDmg = Math.round(85 * pct);
        if (splashDmg > 5) {
          damageCharacter(char, splashDmg, ownerId);
        }
      }
    });
  };

  // Shoot weapon algorithm
  const playerShootWeapon = (char: Character) => {
    const activeW = char.weapons[char.activeWeaponIndex];
    if (!activeW) return;

    let bulletColor = char.isPlayer ? '#facc15' : '#f87171';
    if (char.isPlayer) {
      if (stats.equippedWeaponEffect === 'laser_blue') bulletColor = '#00ffff';
      else if (stats.equippedWeaponEffect === 'void_purple') bulletColor = '#d946ef';
      else if (stats.equippedWeaponEffect === 'golden_aura') bulletColor = '#ffd700';
      else if (stats.equippedWeaponEffect === 'fire_tracer') bulletColor = '#ff4500';
    } else {
      bulletColor = activeW.type === 'shotgun' ? '#fb923c' : '#f87171';
    }

    const now = Date.now();
    if (now - char.lastShootTime < activeW.fireRate) return; // Cooldown de tir
    
    if (activeW.currentClip <= 0) {
      // Besoin de recharger
      if (char.isPlayer) {
        // Tenter recharge si munitions en réserve
        const isPistol = activeW.type === 'pistol';
        if (char.ammo[activeW.type] > 0) {
          const reloadAmt = Math.min(activeW.clipSize, char.ammo[activeW.type]);
          activeW.currentClip = reloadAmt;
          char.ammo[activeW.type] -= reloadAmt;
          char.lastShootTime = now + 1200; // Temps de rechargement simulé
          sounds.playHeal(); // Son de recharge léger
        }
      }
      return;
    }

    char.lastShootTime = now;
    activeW.currentClip -= 1;

    // Jouer le bon son
    if (activeW.type === 'shotgun') {
      sounds.playShotgun();
    } else if (activeW.type === 'sniper') {
      sounds.playSniper();
    } else if (activeW.type === 'rocket') {
      // rocket sounds play on explosion too
      sounds.playShoot();
    } else {
      sounds.playShoot();
    }

    // Spawner projectiles
    const idSeed = `proj-${char.id}-${now}-${Math.random()}`;

    if (activeW.type === 'shotgun') {
      // Fusil à pompe : 5 plomb en éventail
      const pelletCount = 5;
      for (let i = 0; i < pelletCount; i++) {
        const spreadOffset = (i - (pelletCount - 1) / 2) * 0.12;
        const finalAngle = char.angle + spreadOffset + (Math.random() - 0.5) * 0.05;
        projectilesRef.current.push({
          id: `${idSeed}-pellet-${i}`,
          ownerId: char.id,
          x: char.x + Math.cos(char.angle) * 19,
          y: char.y + Math.sin(char.angle) * 19,
          vx: Math.cos(finalAngle) * activeW.bulletSpeed,
          vy: Math.sin(finalAngle) * activeW.bulletSpeed,
          damage: activeW.damage,
          rangeRemaining: activeW.range,
          bulletSpeed: activeW.bulletSpeed,
          color: bulletColor,
          type: 'bullet',
          radius: 3,
          teamId: char.teamId,
        });
      }
    } else if (activeW.type === 'rocket') {
      // Lance-roquettes : 1 gros projectile lent
      projectilesRef.current.push({
        id: idSeed,
        ownerId: char.id,
        x: char.x + Math.cos(char.angle) * 19,
        y: char.y + Math.sin(char.angle) * 19,
        vx: Math.cos(char.angle) * activeW.bulletSpeed,
        vy: Math.sin(char.angle) * activeW.bulletSpeed,
        damage: activeW.damage,
        rangeRemaining: activeW.range,
        bulletSpeed: activeW.bulletSpeed,
        color: char.isPlayer && stats.equippedWeaponEffect && stats.equippedWeaponEffect !== 'none' ? bulletColor : '#f97316',
        type: 'rocket',
        radius: 7,
        teamId: char.teamId,
      });
    } else {
      // Armes normales : 1 balle droite avec légère dispersion
      const spreadVal = activeW.spread;
      const finalAngle = char.angle + (Math.random() - 0.5) * spreadVal;

      projectilesRef.current.push({
        id: idSeed,
        ownerId: char.id,
        x: char.x + Math.cos(char.angle) * 19,
        y: char.y + Math.sin(char.angle) * 19,
        vx: Math.cos(finalAngle) * activeW.bulletSpeed,
        vy: Math.sin(finalAngle) * activeW.bulletSpeed,
        damage: activeW.damage,
        rangeRemaining: activeW.range,
        bulletSpeed: activeW.bulletSpeed,
        color: bulletColor,
        type: 'bullet',
        radius: 3.5,
        teamId: char.teamId,
      });
    }
  };

  // Algorithme d'évitement d'obstacles par balayage angulaire (Steering Pathfinding)
  const getSmartBotAngle = (char: Character, targetX: number, targetY: number, structures: Building[]) => {
    const directAngle = Math.atan2(targetY - char.y, targetX - char.x);
    
    // Anticiper le pas devant de 45px
    const nextStepX = char.x + Math.cos(directAngle) * 45;
    const nextStepY = char.y + Math.sin(directAngle) * 45;
    
    let blocker: Building | null = null;
    for (let s of structures) {
      if (s.type === 'bush') continue;
      const halfW = s.w / 2;
      const halfH = s.h / 2;
      const closestX = Math.max(s.x - halfW, Math.min(nextStepX, s.x + halfW));
      const closestY = Math.max(s.y - halfH, Math.min(nextStepY, s.y + halfH));
      if (getDistance(nextStepX, nextStepY, closestX, closestY) < char.radius + 12) {
        blocker = s;
        break;
      }
    }

    if (!blocker) {
      return directAngle; // Pas de structure bloquante à proximité
    }

    // Tester des déviations angulaires alternées en cascade (Balayage)
    const candidates = [0.75, -0.75, 1.45, -1.45];
    for (let angleDev of candidates) {
      const testAngle = directAngle + angleDev;
      const testStepX = char.x + Math.cos(testAngle) * 55;
      const testStepY = char.y + Math.sin(testAngle) * 55;
      
      let testBlocked = false;
      for (let s of structures) {
        if (s.type === 'bush') continue;
        const halfW = s.w / 2;
        const halfH = s.h / 2;
        const closestX = Math.max(s.x - halfW, Math.min(testStepX, s.x + halfW));
        const closestY = Math.max(s.y - halfH, Math.min(testStepY, s.y + halfH));
        if (getDistance(testStepX, testStepY, closestX, closestY) < char.radius + 10) {
          testBlocked = true;
          break;
        }
      }
      if (!testBlocked) {
        return testAngle; // Trouvé un angle de contournement dégagé !
      }
    }

    // Si tout est obstrué, s'éloigner du centre de l'obstacle
    return Math.atan2(char.y - blocker.y, char.x - blocker.x);
  };

  // Collision boîte-cercle haute fidélité avec glissement polygonal fluide le long des angles
  const handleCharacterMovementWithCollisions = (
    char: Character,
    vx: number,
    vy: number,
    structures: Building[]
  ) => {
    let nextX = char.x + vx;
    let nextY = char.y + vy;

    // Rester dans les limites de la carte
    nextX = Math.max(char.radius, Math.min(MAP_SIZE - char.radius, nextX));
    nextY = Math.max(char.radius, Math.min(MAP_SIZE - char.radius, nextY));

    // Résolution multi-passes pour glisser parfaitement le long des angles de bâtiments
    structures.forEach(s => {
      if (s.type === 'bush') return; // On marche dans les buissons librement !

      const halfW = s.w / 2;
      const halfH = s.h / 2;

      // Calculer le point le plus proche sur le rectangle de la building
      const closestX = Math.max(s.x - halfW, Math.min(nextX, s.x + halfW));
      const closestY = Math.max(s.y - halfH, Math.min(nextY, s.y + halfH));

      const dist = getDistance(nextX, nextY, closestX, closestY);
      if (dist < char.radius) {
        // Obtenir le vecteur de recul
        let diffX = nextX - closestX;
        let diffY = nextY - closestY;
        let len = Math.sqrt(diffX * diffX + diffY * diffY);

        if (len === 0) {
          // Si le joueur est exactement au centre ou sur le point de contact, repousser vers l'extérieur le plus proche
          const overlapLeft = nextX - (s.x - halfW);
          const overlapRight = (s.x + halfW) - nextX;
          const overlapTop = nextY - (s.y - halfH);
          const overlapBottom = (s.y + halfH) - nextY;

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
          if (minOverlap === overlapLeft) { diffX = -1; }
          else if (minOverlap === overlapRight) { diffX = 1; }
          else if (minOverlap === overlapTop) { diffY = -1; }
          else { diffY = 1; }
          len = 1;
        }

        const nx = diffX / len; // Normal de collision
        const ny = diffY / len;

        // Repousser le personnage hors de la structure
        const overlap = char.radius - dist;
        nextX += nx * overlap;
        nextY += ny * overlap;

        // Projection du vecteur mouvement (vx, vy) sur l'arête de tangente (glissement polygonal)
        const dot = vx * nx + vy * ny;
        if (dot < 0) {
          nextX -= nx * dot * 0.95; // Permettre un glissement tangentiel presque parfait
          nextY -= ny * dot * 0.95;
        }
      }
    });

    char.x = nextX;
    char.y = nextY;
  };

  const pushKillFeed = (msg: string) => {
    setKillFeed(prev => [...prev, msg].slice(-10)); // Conserver 10 max
  };

  // --- RENDU 2D DE LA SCÈNE SUR LE CANVAS ---
  const drawGameScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Configuration thématique de l'arène active
    const themeConfig = ARENA_THEMES[currentArena];
    const groundColor = (currentArena === 'ai_custom' && aiCustomThemeRef.current) ? aiCustomThemeRef.current.groundColor : (themeConfig?.groundColor || '#0f172a');
    const gridColor = (currentArena === 'ai_custom' && aiCustomThemeRef.current) ? aiCustomThemeRef.current.gridColor : (themeConfig?.gridColor || '#1e293b');
    const borderColor = (currentArena === 'ai_custom' && aiCustomThemeRef.current) ? aiCustomThemeRef.current.borderColor : (themeConfig?.borderColor || '#dc2626');

    // Nettoyer canvas
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, 0, width, height);

    // Sauvegarder pour le zoom camera du spectateur
    ctx.save();

    const zoom = spectatorMode ? freeCamZoom : 1.0;
    if (zoom !== 1.0) {
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);
    }

    // Facteurs de décalage caméra
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;

    const toScreenX = (wx: number) => wx - camX + width / 2;
    const toScreenY = (wy: number) => wy - camY + height / 2;

    // Calculer le Frustum (champ de vision caméra tenant compte du zoom)
    const viewW = width / zoom;
    const viewH = height / zoom;
    const visibleMinX = camX - viewW / 2 - 130;
    const visibleMaxX = camX + viewW / 2 + 130;
    const visibleMinY = camY - viewH / 2 - 130;
    const visibleMaxY = camY + viewH / 2 + 130;

    const isOutsideFrustum = (wx: number, wy: number, radius: number = 80) => {
      return wx + radius < visibleMinX || wx - radius > visibleMaxX || wy + radius < visibleMinY || wy - radius > visibleMaxY;
    };

    // Rendre les textures procédurales IA interactives relatives de la caméra
    if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
      const theme = aiCustomThemeRef.current;
      const textureStep = 180;
      const startTexX = Math.floor((camX - width / 2) / textureStep) * textureStep;
      const endTexX = Math.ceil((camX + width / 2) / textureStep) * textureStep;
      const startTexY = Math.floor((camY - height / 2) / textureStep) * textureStep;
      const endTexY = Math.ceil((camY + height / 2) / textureStep) * textureStep;

      ctx.save();
      ctx.lineWidth = 1.5;
      
      for (let tx = startTexX; tx <= endTexX; tx += textureStep) {
        if (tx < 0 || tx > MAP_SIZE) continue;
        for (let ty = startTexY; ty <= endTexY; ty += textureStep) {
          if (ty < 0 || ty > MAP_SIZE) continue;
          
          const sx = toScreenX(tx);
          const sy = toScreenY(ty);
          
          // Seed Offset persistante basée sur coordonnées du monde
          const seed = Math.sin(tx * 12.9898 + ty * 78.233) * 43758.5453;
          const offsetX = (seed % 1) * 60;
          const offsetY = ((seed * 1.543) % 1) * 60;
          
          ctx.strokeStyle = theme.textureDetailColor;
          ctx.fillStyle = theme.textureDetailColor;
          
          if (theme.textureStyle === 'stars') {
            const size = 2 + Math.abs(seed % 4);
            ctx.beginPath();
            ctx.arc(sx + offsetX, sy + offsetY, size, 0, Math.PI * 2);
            ctx.fill();
            if (size > 4) {
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(sx + offsetX - 8, sy + offsetY);
              ctx.lineTo(sx + offsetX + 8, sy + offsetY);
              ctx.moveTo(sx + offsetX, sy + offsetY - 8);
              ctx.lineTo(sx + offsetX, sy + offsetY + 8);
              ctx.stroke();
            }
          }
          else if (theme.textureStyle === 'cracks') {
            ctx.strokeStyle = theme.textureSecondaryColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + offsetX * 1.5, sy + offsetY * 1.5);
            ctx.lineTo(sx + textureStep - offsetX, sy + textureStep - offsetY);
            ctx.stroke();
          }
          else if (theme.textureStyle === 'digital') {
            ctx.fillStyle = theme.textureDetailColor;
            ctx.fillRect(sx + offsetX, sy + offsetY, 6, 6);
            if (seed > 0.5) {
              ctx.strokeStyle = theme.textureSecondaryColor;
              ctx.beginPath();
              ctx.moveTo(sx + offsetX + 3, sy + offsetY + 3);
              ctx.lineTo(sx + offsetX + 40, sy + offsetY + 3);
              ctx.stroke();
            }
          }
          else if (theme.textureStyle === 'organic_cells') {
            ctx.fillStyle = theme.textureSecondaryColor + "33"; // Transluminescence
            ctx.beginPath();
            ctx.arc(sx + offsetX, sy + offsetY, 12 + Math.abs(seed % 15), 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = theme.textureDetailColor;
            ctx.beginPath();
            ctx.arc(sx + offsetX, sy + offsetY, 12 + Math.abs(seed % 15), 0, Math.PI * 2);
            ctx.stroke();
          }
          else if (theme.textureStyle === 'sand_drift') {
            ctx.strokeStyle = theme.textureSecondaryColor;
            ctx.beginPath();
            ctx.arc(sx, sy, 35, 0, Math.PI);
            ctx.stroke();
          }
          else if (theme.textureStyle === 'energy_grids') {
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sx - 5, sy); ctx.lineTo(sx + 5, sy);
            ctx.moveTo(sx, sy - 5); ctx.lineTo(sx, sy + 5);
            ctx.stroke();
          }
          else if (theme.textureStyle === 'waves') {
            ctx.strokeStyle = theme.textureSecondaryColor + "99";
            ctx.beginPath();
            ctx.arc(sx + offsetX, sy + offsetY, 10 + Math.abs(seed % 30), 0, Math.PI * 2);
            ctx.stroke();
          }
          else {
            ctx.fillStyle = theme.accentColor + "44";
            ctx.beginPath();
            ctx.arc(sx + offsetX, sy + offsetY, 3 + Math.abs(seed % 6), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // Déssiner grille de terrain pour l'effet de vitesse et grandeur
    ctx.strokeStyle = gridColor; // Lignes de grille
    ctx.lineWidth = 1;
    const gridStep = 100;
    
    const startGridX = Math.floor((camX - width / 2) / gridStep) * gridStep;
    const endGridX = Math.ceil((camX + width / 2) / gridStep) * gridStep;
    const startGridY = Math.floor((camY - height / 2) / gridStep) * gridStep;
    const endGridY = Math.ceil((camY + height / 2) / gridStep) * gridStep;

    for (let x = startGridX; x <= endGridX; x += gridStep) {
      if (x < 0 || x > MAP_SIZE) continue;
      ctx.beginPath();
      ctx.moveTo(toScreenX(x), toScreenY(0));
      ctx.lineTo(toScreenX(x), toScreenY(MAP_SIZE));
      ctx.stroke();
    }
    for (let y = startGridY; y <= endGridY; y += gridStep) {
      if (y < 0 || y > MAP_SIZE) continue;
      ctx.beginPath();
      ctx.moveTo(toScreenX(0), toScreenY(y));
      ctx.lineTo(toScreenX(MAP_SIZE), toScreenY(y));
      ctx.stroke();
    }

    // --- RENDRE LES TUILES ENVIRONNEMENTALES PROCÉDURALES ---
    const envTiles = environmentalTilesRef.current;
    envTiles.forEach(tile => {
      // Optimisation RAM : Frustum Culling dynamique ultra rapide
      if (isOutsideFrustum(tile.x, tile.y, tile.radius)) return;

      const tx = toScreenX(tile.x);
      const ty = toScreenY(tile.y);

      if (tile.type === 'mud') {
        ctx.save();
        if (currentArena === 'industrial') {
          // Boue toxique acide verte
          ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
        } else if (currentArena === 'skeletal_desert') {
          // Sables mouvants ocre
          ctx.fillStyle = 'rgba(251, 146, 60, 0.22)';
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 2.5;
        } else if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
          ctx.fillStyle = aiCustomThemeRef.current.mudColor + '30';
          ctx.strokeStyle = aiCustomThemeRef.current.mudColor;
          ctx.lineWidth = 3;
        } else {
          // Forêt militaire : Eau marécageuse sombre
          ctx.fillStyle = 'rgba(120, 53, 15, 0.35)';
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2.5;
        }
        ctx.beginPath();
        ctx.arc(tx, ty, tile.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Vagues ou bulles intérieures
        ctx.fillStyle = currentArena === 'industrial' ? 'rgba(34, 197, 94, 0.4)' : (currentArena === 'ai_custom' && aiCustomThemeRef.current) ? aiCustomThemeRef.current.accentColor + '60' : 'rgba(251, 146, 60, 0.3)';
        for (let j = 0; j < 3; j++) {
          const bo = (Date.now() * 0.0015 + j * 1.5) % 1;
          const bx = tx + Math.cos(j * 2) * (tile.radius * 0.4);
          const by = ty + Math.sin(j * 2) * (tile.radius * 0.4);
          ctx.beginPath();
          ctx.arc(bx, by, 3 + (1 - bo) * 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw custom label if custom AI arena
        if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(aiCustomThemeRef.current.mudLabel.toUpperCase(), tx, ty + tile.radius - 12);
        }
        ctx.restore();
      } 
      
      else if (tile.type === 'lava') {
        ctx.save();
        // Lave brûlante rouge craquelée
        if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
          ctx.fillStyle = aiCustomThemeRef.current.lavaColor + '44';
          ctx.strokeStyle = aiCustomThemeRef.current.lavaColor;
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.strokeStyle = '#ef4444';
        }
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tx, ty, tile.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cœur en fusion jaune fuyant
        const pulse = Math.sin(Date.now() * 0.003) * tile.radius * 0.08;
        const innerRad = tile.radius * 0.65 + pulse;
        const grad = ctx.createRadialGradient(tx, ty, 5, tx, ty, innerRad);
        
        const gradC1 = currentArena === 'ai_custom' && aiCustomThemeRef.current ? aiCustomThemeRef.current.accentColor : '#facc15';
        const gradC2 = currentArena === 'ai_custom' && aiCustomThemeRef.current ? aiCustomThemeRef.current.lavaColor : '#f97316';
        grad.addColorStop(0, gradC1); // Or chaud / Accent
        grad.addColorStop(0.5, gradC2); // Orange / Lava
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(tx, ty, innerRad, 0, Math.PI * 2);
        ctx.fill();

        // Rochers basaltiques flottant noirs sur la lave
        ctx.fillStyle = '#1c1917';
        for (let rIdx = 0; rIdx < 3; rIdx++) {
          const angle = rIdx * 2.1 + (Date.now() * 0.0001);
          const rx = tx + Math.cos(angle) * (tile.radius * 0.4);
          const ry = ty + Math.sin(angle) * (tile.radius * 0.4);
          ctx.fillRect(rx - 8, ry - 8, 16, 16);
        }

        if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(aiCustomThemeRef.current.lavaLabel.toUpperCase(), tx, ty + tile.radius - 12);
        }
        ctx.restore();
      } 
      
      else if (tile.type === 'speed_boost') {
        ctx.save();
        // Cyber Piste de vitesse cyan rétro-éclairée
        if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
          ctx.fillStyle = aiCustomThemeRef.current.speedBoostColor + '20';
          ctx.strokeStyle = aiCustomThemeRef.current.speedBoostColor;
        } else {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
          ctx.strokeStyle = '#06b6d4';
        }
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        ctx.arc(tx, ty, tile.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Étoile de vitesse laser ou flèches
        ctx.fillStyle = (currentArena === 'ai_custom' && aiCustomThemeRef.current) ? aiCustomThemeRef.current.speedBoostColor : '#22d3ee';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Chevron animés vers le dehors ou centre
        ctx.fillText('>>', tx, ty);
        ctx.fillText('>>', tx + Math.cos(Date.now() * 0.001) * 20, ty + Math.sin(Date.now() * 0.001) * 20);

        if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(aiCustomThemeRef.current.speedBoostLabel.toUpperCase(), tx, ty + tile.radius - 12);
        }
        ctx.restore();
      } 
      
      else if (tile.type === 'healer') {
        ctx.save();
        // Oasis guérisseur émeraude / bleu étincelant
        if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
          ctx.fillStyle = aiCustomThemeRef.current.healerColor + '22';
          ctx.strokeStyle = aiCustomThemeRef.current.healerColor;
        } else {
          ctx.fillStyle = 'rgba(20, 184, 166, 0.22)';
          ctx.strokeStyle = '#14b8a6';
        }
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(tx, ty, tile.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Petit dôme d'eau intérieur
        const waterPulse = 4 * Math.sin(Date.now() * 0.002);
        ctx.fillStyle = (currentArena === 'ai_custom' && aiCustomThemeRef.current) ? aiCustomThemeRef.current.healerColor + '30' : 'rgba(45, 212, 191, 0.15)';
        ctx.beginPath();
        ctx.arc(tx, ty, tile.radius * 0.7 + waterPulse, 0, Math.PI * 2);
        ctx.fill();

        if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(aiCustomThemeRef.current.healerLabel.toUpperCase(), tx, ty + tile.radius - 12);
        }

        // Dessiner des étincelles de soins ✨
        ctx.fillStyle = (currentArena === 'ai_custom' && aiCustomThemeRef.current) ? aiCustomThemeRef.current.accentColor : '#2dd4bf';
        ctx.font = '11px sans-serif';
        const sparkleCount = 4;
        for (let sIdx = 0; sIdx < sparkleCount; sIdx++) {
          const angle = (Date.now() * 0.0015 + sIdx * (Math.PI / 2)) % (Math.PI * 2);
          const distOffset = tile.radius * 0.5 * Math.sin(Date.now() * 0.0008 + sIdx);
          const sx = tx + Math.cos(angle) * (tile.radius * 0.4 + distOffset);
          const sy = ty + Math.sin(angle) * (tile.radius * 0.4 + distOffset);
          ctx.fillText('✦', sx, sy);
        }
        ctx.restore();
      }
    });

    // Déssiner limites de la carte avec une grosse bordure thématique
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(toScreenX(0), toScreenY(0), MAP_SIZE, MAP_SIZE);

    // --- RENDRE LES STRUCURES (BÂTIMENTS / CAISSES) (Sous les joueurs) ---
    const structures = structuresRef.current;
    
    // Rendre d'abord les structures et buissons
    structures.forEach(s => {
      // Optimisation RAM : Frustum Culling dynamique standardisé
      if (isOutsideFrustum(s.x, s.y, Math.max(s.w, s.h))) return;

      const halfW = s.w / 2;
      const halfH = s.h / 2;

      const sx = toScreenX(s.x);
      const sy = toScreenY(s.y);

      if (s.type === 'bush') {
        // Buisson translucide
        ctx.fillStyle = 'rgba(21, 128, 61, 0.65)';
        ctx.beginPath();
        ctx.arc(sx, sy, s.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (s.type === 'tree') {
        // Tronc d'arbre d'abord
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.fill();

        // Feuillage
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(sx, sy, s.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (s.type === 'crate') {
        if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
          const theme = aiCustomThemeRef.current;
          ctx.fillStyle = theme.customCrateColor;
          ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
          ctx.strokeStyle = theme.accentColor;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);

          // Cratère / Caisse détails futuristes
          ctx.beginPath();
          ctx.moveTo(sx - halfW + 4, sy - halfH + 4);
          ctx.lineTo(sx + halfW - 4, sy + halfH - 4);
          ctx.stroke();
        } else {
          // Caisse en bois
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 3;
          ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);
          
          // Diagonale caisse
          ctx.beginPath();
          ctx.moveTo(sx - halfW, sy - halfH);
          ctx.lineTo(sx + halfW, sy + halfH);
          ctx.stroke();
        }
      } else {
        // Personnalisation des bâtiments selon leur type / thème
        ctx.save();
        if (s.subType === 'sandbags') {
          // Sacs de sable empilés
          ctx.fillStyle = '#78716c';
          ctx.strokeStyle = '#44403c';
          ctx.lineWidth = 2;
          ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
          ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);
          
          // Lignes de séparation de sacs de sable
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          for (let syOffset = 6; syOffset < s.h; syOffset += 12) {
            ctx.moveTo(sx - halfW, sy - halfH + syOffset);
            ctx.lineTo(sx + halfW, sy - halfH + syOffset);
          }
          ctx.stroke();
        } 
        else if (s.subType === 'barracks_main') {
          // Caserne verte militaire de taïga
          ctx.fillStyle = '#166534';
          ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 3;
          ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);

          // Toit
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(sx - halfW + 8, sy - halfH + 8, s.w - 16, s.h - 16);
          // Marquage étoile jaune émilie militaire du commandeur au toit !
          ctx.fillStyle = '#eab308';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('★', sx, sy + 3);
        } 
        else if (s.subType === 'hangar_metal') {
          // Hangar métallique industriel foudroyant
          ctx.fillStyle = '#334155';
          ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 4;
          ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);

          // Rayures jaunes industrielles de danger
          ctx.save();
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          for (let i = -halfW; i < halfW; i += 24) {
            ctx.moveTo(sx + i, sy - halfH);
            ctx.lineTo(sx + i + 10, sy - halfH);
            ctx.lineTo(sx + i - 6, sy + halfH);
            ctx.lineTo(sx + i - 16, sy + halfH);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();

          // Centre de cellule
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(sx - halfW + 12, sy - halfH + 12, s.w - 24, s.h - 24);
        } 
        else if (s.subType === 'shipping_container') {
          // Conteneurs de transport aux couleurs vives
          ctx.fillStyle = s.containerColor || '#991b1b';
          ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 3;
          ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);

          // Rayures de tôle ondulée verticale
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let rx = sx - halfW + 10; rx < sx + halfW; rx += 14) {
            ctx.moveTo(rx, sy - halfH + 4);
            ctx.lineTo(rx, sy + halfH - 4);
          }
          ctx.stroke();
        } 
        else if (s.subType === 'obsidian_pillar') {
          // Temples de magma d'obsidienne noire brûlante
          ctx.fillStyle = '#09090b';
          ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3.5;
          ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);

          // Fissures de lave luminescente orange
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(sx - halfW + 10, sy - halfH + 10);
          ctx.lineTo(sx - halfW + 25, sy - halfH + 18);
          ctx.lineTo(sx - 10, sy + 15);
          ctx.lineTo(sx + halfW - 12, sy + halfH - 12);
          ctx.stroke();

          // Centre
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(sx - halfW + 10, sy - halfH + 10, s.w - 20, s.h - 20);
        } 
        else if (s.subType === 'server_block') {
          // Serveurs de données cyberpunk avec DEL clignotantes
          ctx.fillStyle = '#020617';
          ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);

          // Grilles de disques
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(sx - halfW + 8, sy - halfH + 8, s.w - 16, s.h - 16);

          // DELs animées clignotantes
          const flash = Math.floor(Date.now() / 400) % 3;
          ctx.fillStyle = flash === 0 ? '#ef4444' : '#22c55e';
          ctx.beginPath();
          ctx.arc(sx - 12, sy - 8, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = flash === 1 ? '#22c55e' : '#facc15';
          ctx.beginPath();
          ctx.arc(sx, sy - 8, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = flash === 2 ? '#3b82f6' : '#22c55e';
          ctx.beginPath();
          ctx.arc(sx + 12, sy - 8, 3, 0, Math.PI * 2);
          ctx.fill();
        } 
        else if (s.subType === 'pharaoh_altar') {
          // Altar égyptienne aux teintes dorées de sable
          ctx.fillStyle = '#d97706';
          ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 3;
          ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);

          // Ornement doré
          ctx.fillStyle = '#fef08a';
          ctx.font = '12px serif';
          ctx.textAlign = 'center';
          ctx.fillText('👁', sx, sy + 4);
        } 
        else if (s.subType === 'bone_structure') {
          // Os calcifié ou fossile désertique
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);

          // Des fissures de fossils
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx - halfW + 4, sy - halfH + 12);
          ctx.lineTo(sx + halfW - 4, sy + halfH - 12);
          ctx.stroke();
        } 
        else {
          if (currentArena === 'ai_custom' && aiCustomThemeRef.current) {
            const theme = aiCustomThemeRef.current;
            ctx.fillStyle = theme.customStructureColor;
            ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
            
            ctx.strokeStyle = theme.accentColor;
            ctx.lineWidth = 3.5;
            ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);

            // Tech core drawing
            ctx.fillStyle = theme.groundColor;
            ctx.fillRect(sx - halfW + 10, sy - halfH + 10, s.w - 20, s.h - 20);

            // Core neon lines / label
            const flash = Math.floor(Date.now() / 450) % 2;
            ctx.fillStyle = flash === 0 ? theme.accentColor : theme.textureDetailColor;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(theme.customObstacleName.substring(0, 16).toUpperCase(), sx, sy + 3);
          } else {
            // Bâtiment classique robuste
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(sx - halfW, sy - halfH, s.w, s.h);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 4;
            ctx.strokeRect(sx - halfW, sy - halfH, s.w, s.h);

            // Toit
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(sx - halfW + 10, sy - halfH + 10, s.w - 20, s.h - 20);
          }
        }
        ctx.restore();
      }
    });

    // --- RENDRE LES ZONES DE POISON CHIMIQUES ---
    poisonZonesRef.current.forEach(zone => {
      if (!zone.active) return;
      
      // Optimisation RAM : Frustum Culling dynamique
      if (isOutsideFrustum(zone.x, zone.y, zone.radius)) return;

      const zx = toScreenX(zone.x);
      const zy = toScreenY(zone.y);
      const zr = zone.radius;

      ctx.save();
      if (zone.isWarning) {
        // Mode avertissement : jaune clignotant
        const pulse = Math.abs(Math.sin(Date.now() * 0.007));
        ctx.strokeStyle = `rgba(234, 179, 8, ${0.4 + pulse * 0.4})`;
        ctx.fillStyle = `rgba(234, 179, 8, ${0.08 + pulse * 0.05})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        
        ctx.beginPath();
        ctx.arc(zx, zy, zr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Texte d'alarme
        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`⚠️ IMPACT CHIMIQUE DANS ${Math.ceil(zone.timer)}s`, zx, zy - zr + 20);
      } else {
        // Nuage empoisonné actif : vert toxique radioactif
        const pulse = Math.sin(Date.now() * 0.003) * 0.15;
        // Gradient radial de brouillard hyper immersif
        const grad = ctx.createRadialGradient(zx, zy, zr * 0.1, zx, zy, zr);
        grad.addColorStop(0, 'rgba(34, 197, 94, 0.42)');
        grad.addColorStop(0.5, 'rgba(22, 163, 74, 0.28)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(zx, zy, zr * (1 + pulse), 0, Math.PI * 2);
        ctx.fill();

        // Cercle extérieur flou
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(zx, zy, zr, 0, Math.PI * 2);
        ctx.stroke();

        // Label danger
        ctx.fillStyle = '#22c55e';
        ctx.font = '900 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`☣️ NUAGE EMPOISONNÉ TOXIQUE`, zx, zy - zr + 20);
      }
      ctx.restore();
    });

    // --- RENDRE LE BUTIN AU SOL (LOOT ITEMS) ---
    const lootItems = lootItemsRef.current;
    lootItems.forEach(item => {
      // Optimisation RAM : Frustum Culling dynamique
      if (isOutsideFrustum(item.x, item.y, item.radius + 35)) return;

      const ix = toScreenX(item.x);
      const iy = toScreenY(item.y);

      // Lueur selon la rareté
      let glowColor = '#64748b';
      if (item.rarity === 'rare') glowColor = '#3b82f6';
      else if (item.rarity === 'epic') glowColor = '#a855f7';
      else if (item.rarity === 'legendary') glowColor = '#f59e0b';

      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.arc(ix, iy, item.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowBlur = 0; // Reset ombre

      // Miniature icône/emoji
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let shortLabel = item.name.substring(0, 10);
      if (item.type === 'weapon' && item.weaponData) {
        if (item.weaponData.type === 'pistol') shortLabel = '🔫';
        else if (item.weaponData.type === 'shotgun') shortLabel = '⚡ Pompe';
        else if (item.weaponData.type === 'rifle') shortLabel = '💎 AR';
        else if (item.weaponData.type === 'sniper') shortLabel = '⭐ Sniper';
        else shortLabel = '🔥 RPG';
      } else {
        if (item.itemType === 'medkit') shortLabel = '🩹';
        else if (item.itemType === 'shield') shortLabel = '🧪';
        else if (item.itemType === 'dash_recharge') shortLabel = '⚡';
        else shortLabel = '📦';
      }

      ctx.fillText(shortLabel, ix, iy);
    });

    // --- RENDRE LES LARGAGES DE RAVITAILLEMENT STRATÉGIQUES ---
    supplyDropsRef.current.forEach(drop => {
      // Optimisation RAM : Frustum Culling dynamique
      if (isOutsideFrustum(drop.x, drop.y, drop.radius + 150)) return;

      const dx = toScreenX(drop.x);
      const dy = toScreenY(drop.y);

      // 1. Si en l'air, dessiner le marqueur d'impact au sol et le parachute/colis en altitude
      if (!drop.isLanded) {
        // Cible d'atterrissage
        ctx.save();
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.15;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(dx, dy, drop.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath();
        ctx.arc(dx, dy, drop.radius, 0, Math.PI * 2);
        ctx.fill();

        // Texte indicateur
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`📦 LARGAGE ${Math.round(drop.altitude)}m`, dx, dy + 5);
        ctx.restore();

        // Dessiner le colis et son parachute
        const py = dy - drop.altitude; // Hauteur virtuelle de chute !
        ctx.save();
        
        // Cordon parachute
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dx, py - 10);
        ctx.lineTo(dx - 22, py - 32);
        ctx.moveTo(dx, py - 10);
        ctx.lineTo(dx + 22, py - 32);
        ctx.stroke();

        // Le parachute en parachute-blanc
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dx, py - 32, 24, Math.PI, 0); // Demi cercle supérieur du parachute
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lignes de séparation de la coupole du parachute
        ctx.beginPath();
        ctx.moveTo(dx - 12, py - 32);
        ctx.quadraticCurveTo(dx, py - 44, dx + 12, py - 32);
        ctx.stroke();

        // Le colis militaire lui-même
        ctx.fillStyle = '#1e3a8a'; // Boîtier bleu royal/militaire
        ctx.strokeStyle = '#fbbf24'; // Bordure or dorée d'élite
        ctx.lineWidth = 2.5;
        ctx.fillRect(dx - 14, py - 10, 28, 20);
        ctx.strokeRect(dx - 14, py - 10, 28, 20);

        // Symbole d'élite or au milieu
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', dx, py);
        ctx.restore();
      } else if (!drop.isOpened) {
        // 2. Colis atterri, au sol et disponible !
        ctx.save();
        // Une magnifique faisceau lumineux halogène jaune/or projeté dans le ciel (style balise de détection)
        const pulse = Math.sin(Date.now() * 0.005) * 0.15;
        const beamWidth = 40 + pulse * 15;
        const grad = ctx.createLinearGradient(dx - beamWidth/2, dy, dx + beamWidth/2, dy);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0)');
        grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.12)');
        grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(dx - beamWidth/2, dy - 300, beamWidth, 300); // Balise monte de 300px dans le ciel

        // Aura vibratoire jaune autour de la caisse
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15 + Math.sin(Date.now() * 0.01) * 6;

        ctx.fillStyle = '#1e3a8a'; // Boitier d'élite bleu
        ctx.strokeStyle = '#fbbf24'; // Liseré doré
        ctx.lineWidth = 3;
        ctx.fillRect(dx - 16, dy - 12, 32, 24);
        ctx.strokeRect(dx - 16, dy - 12, 32, 24);

        ctx.shadowBlur = 0; // Reset

        // Sangle d'acier militaire
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(dx - 4, dy - 12, 8, 24);

        // Symbole étoile
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', dx, dy);

        // Curseur d'interaction
        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('📦 TOUCHER POUR PILLER', dx, dy - 20);
        ctx.restore();
      }
    });

    // --- RENDRE LES PARTICULES ---
    const particles = particlesRef.current;
    particles.forEach(p => {
      // Optimisation RAM : Frustum Culling dynamique
      if (isOutsideFrustum(p.x, p.y, p.size + 15)) return;

      ctx.save();
      ctx.globalAlpha = p.life;
      
      if (p.type === 'hazard_indicator') {
        const px = toScreenX(p.x);
        const py = toScreenY(p.y);
        
        // Hazard warnings and targeting lasers pulsating
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5 + Math.sin(Date.now() * 0.02) * 1.5;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.16;
        ctx.fill();
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.8;
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("⚠️ ZONE DE DANGER", px, py + 3);
      } else if (p.type === 'digital_rune') {
        ctx.fillStyle = p.color;
        ctx.font = "bold 10px monospace";
        const runes = ["0", "1", "[]", "<>", "AI", "SYS", "ERR", "⚡", "X", "7", "Ø"];
        const glyph = runes[Math.floor((p.x + p.y) % runes.length)];
        ctx.fillText(glyph, toScreenX(p.x), toScreenY(p.y));
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(toScreenX(p.x), toScreenY(p.y), p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    ctx.globalAlpha = 1.0; // Reset alpha global

    // --- RENDRE PERSONNAGES (LIVING & KNOCKED) ---
    const characters = charactersRef.current;
    characters.forEach(char => {
      if (!char.alive) return;

      // Optimisation RAM : Frustum Culling dynamique
      if (isOutsideFrustum(char.x, char.y, char.radius + 80)) return;

      const cx = toScreenX(char.x);
      const cy = toScreenY(char.y);

      // Est-ce caché dans un buisson pour le rendu visuel ?
      const inBush = structures.some(s => s.type === 'bush' && getDistance(s.x, s.y, char.x, char.y) < s.w / 2);
      if (inBush && !char.isPlayer && !spectatorMode && (playerRef.current && playerRef.current.teamId !== char.teamId)) {
        // Ennemi caché dans un buisson : Invisible sur le canvas !
        return;
      }
      
      if (inBush) {
        ctx.globalAlpha = 0.5; // Rendre légèrement transparent si c'est toi ou allié
      }

      // Dessiner ombre légère
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(cx + 2, cy + 4, char.radius, 0, Math.PI * 2);
      ctx.fill();

      // Dessiner mains d'attaque de part et d'autre orientées vers l'angle de tir
      const handOffsetDist = 14;
      const handRad = 6;
      ctx.fillStyle = char.skinColor;
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.5;

      const leftHandX = cx + Math.cos(char.angle - 0.7) * handOffsetDist;
      const leftHandY = cy + Math.sin(char.angle - 0.7) * handOffsetDist;
      ctx.beginPath();
      ctx.arc(leftHandX, leftHandY, handRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const rightHandX = cx + Math.cos(char.angle + 0.7) * handOffsetDist;
      const rightHandY = cy + Math.sin(char.angle + 0.7) * handOffsetDist;
      ctx.beginPath();
      ctx.arc(rightHandX, rightHandY, handRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Équiper arme visuellement s'il en a une
      const activeW = char.weapons[char.activeWeaponIndex];
      if (activeW) {
        ctx.strokeStyle = activeW.type === 'rocket' ? '#f97316' : activeW.type === 'sniper' ? '#a855f7' : '#475569';
        ctx.lineWidth = activeW.type === 'sniper' ? 5 : 3.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(char.angle) * 26, cy + Math.sin(char.angle) * 26);
        ctx.stroke();
      }

      // Dessiner le corps principal
      ctx.fillStyle = char.skinColor;
      ctx.beginPath();
      ctx.arc(cx, cy, char.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = char.knocked ? '#dc2626' : '#020617';
      ctx.lineWidth = char.knocked ? 3.0 : 2.0;
      ctx.stroke();

      // Rendre les motifs de corps
      if (char.patternStyle === 'stripes') {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 10);
        ctx.lineTo(cx + 10, cy + 10);
        ctx.moveTo(cx - 5, cy - 10);
        ctx.lineTo(cx + 10, cy + 5);
        ctx.stroke();
      } else if (char.patternStyle === 'dots') {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(cx - 5, cy, 2, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy + 3, 2.5, 0, Math.PI * 2);
        ctx.arc(cx, cy - 5, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (char.patternStyle === 'lightning') {
        ctx.fillStyle = '#fde047';
        ctx.font = '10px sans-serif';
        ctx.fillText('⚡', cx, cy + 3);
      }

      // Yeux orientés vers l'angle de tir
      const eyeXOffset = 6;
      const eyeYOffset = 5;
      ctx.fillStyle = '#ffffff';

      const eyeLeftX = cx + Math.cos(char.angle - 0.4) * eyeXOffset;
      const eyeLeftY = cy + Math.sin(char.angle - 0.4) * eyeXOffset;
      ctx.beginPath();
      ctx.arc(eyeLeftX, eyeLeftY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(eyeLeftX + Math.cos(char.angle) * 1, eyeLeftY + Math.sin(char.angle) * 1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      const eyeRightX = cx + Math.cos(char.angle + 0.4) * eyeXOffset;
      const eyeRightY = cy + Math.sin(char.angle + 0.4) * eyeXOffset;
      ctx.beginPath();
      ctx.arc(eyeRightX, eyeRightY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(eyeRightX + Math.cos(char.angle) * 1, eyeRightY + Math.sin(char.angle) * 1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Dessiner Chapeau/Accessoire !
      if (char.hatStyle !== 'none') {
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Emojis de chapeaux correspondants
        let hatEmoji = '🧢';
        if (char.hatStyle === 'crown') hatEmoji = '👑';
        else if (char.hatStyle === 'helmet') hatEmoji = '🪖';
        else if (char.hatStyle === 'headphones') hatEmoji = '🎧';
        else if (char.hatStyle === 'bandana') hatEmoji = '🧣';
        else if (char.hatStyle === 'ninja') hatEmoji = '🥷';
        else if (char.hatStyle === 'wizard') hatEmoji = '🧙';

        ctx.fillText(hatEmoji, cx, cy - 9);
      }

      // Rendre pseudo au-dessus du joueur
      ctx.fillStyle = char.isPlayer ? '#fbbf24' : char.teamId === 'team-player' ? '#60a5fa' : '#f1f5f9';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      
      const badgeIndicator = char.knocked ? ' 🚨 K.O' : '';
      ctx.fillText(char.name + badgeIndicator, cx, cy - 20);

      // Rendre l'Émote si active !
      if (char.activeEmote && char.emoteExpiresAt && Date.now() < char.emoteExpiresAt) {
        ctx.save();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const timeLeft = char.emoteExpiresAt - Date.now();
        const bobOffset = Math.sin(timeLeft * 0.015) * 4 - 42; // Précisément au-dessus de la jauge hp

        // Dessiner une bulle de dialogue stylée
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(cx, cy + bobOffset, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(char.activeEmote, cx, cy + bobOffset + 1);
        ctx.restore();
      }

      // Jauge de HP miniature pour les ennemis au-dessus de leur tête s'ils ont subi des dégâts
      if (char.health < 100) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx - 15, cy - 30, 30, 3);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(cx - 15, cy - 30, 30 * (char.health / 100), 3);
      }

      ctx.globalAlpha = 1.0; // Reset alpha
    });

    // --- RENDRE LES PROJECTILES (TRAIT DE LUMIÈRE) ---
    const projectiles = projectilesRef.current;
    projectiles.forEach(proj => {
      // Optimisation RAM : Frustum Culling dynamique
      if (isOutsideFrustum(proj.x, proj.y, proj.radius + 40)) return;

      ctx.strokeStyle = proj.color;
      ctx.lineWidth = proj.radius;
      ctx.beginPath();
      ctx.moveTo(toScreenX(proj.x - proj.vx * 1.5), toScreenY(proj.y - proj.vy * 1.5));
      ctx.lineTo(toScreenX(proj.x), toScreenY(proj.y));
      ctx.stroke();

      // Si roquette, spawner de fines volutes de fumée
      if (proj.type === 'rocket' && Math.random() > 0.4) {
        particlesRef.current.push({
          x: proj.x - proj.vx * 2,
          y: proj.y - proj.vy * 2,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          color: '#64748b',
          size: 3 + Math.random() * 4,
          life: 0.8,
          decay: 0.04,
          type: 'smoke',
        });
      }
    });

    // --- RENDRE LE FILTRE MULTICOLORE DE POST-TRAITEMENT METEO IA ---
    if (currentArena === 'ai_custom' && activeAIEventRef.current) {
      ctx.save();
      ctx.fillStyle = activeAIEventRef.current.overlayColor;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // --- RENDRE L'ANNEAU GÉANT DE LA TEMPÊTE (INNER ET OUTER) ---
    const storm = stormZoneRef.current;
    const sx = toScreenX(storm.x);
    const sy = toScreenY(storm.y);
    const sRadiusScreen = storm.radius;

    // Cercle intérieur bleu fluide de sécurité
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sx, sy, sRadiusScreen, 0, Math.PI * 2);
    ctx.stroke();

    // Ombrage géant électrique sur l'extérieur du cercle
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(sx, sy, sRadiusScreen + 7, 0, Math.PI * 2);
    ctx.stroke();

    // --- RENDRE LES EFFETS CLIMATIQUES VISUELS ET AMBIANCES REELLES ---
    if (weatherEvent !== 'none') {
      ctx.save();
      if (weatherEvent === 'acid_rain') {
        // Pluie verte acide tombant délicatement en diagonale
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.lineWidth = 1.8;
        const rainCount = 45;
        for (let i = 0; i < rainCount; i++) {
          const rx = camX + (Math.sin(i * 139) * (viewW * 0.7));
          const ry = camY + (Math.cos(i * 97) * (viewH * 0.7));
          const sxLoc = toScreenX(rx);
          const syLoc = toScreenY(ry);
          ctx.beginPath();
          ctx.moveTo(sxLoc, syLoc);
          ctx.lineTo(sxLoc - 12, syLoc + 24);
          ctx.stroke();
        }
      } 
      
      else if (weatherEvent === 'sandstorm') {
        // Tempête ocre desertique avec vents de sable horizontaux
        ctx.fillStyle = 'rgba(230, 160, 80, 0.16)';
        ctx.fillRect(toScreenX(camX - viewW / 2), toScreenY(camY - viewH / 2), viewW, viewH);

        ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
        ctx.lineWidth = 1.2;
        const windLinesCount = 35;
        for (let i = 0; i < windLinesCount; i++) {
          const wx = camX + (Math.sin(i * 57) * (viewW * 0.7)) + ((Date.now() * 0.35) % 200) - 100;
          const wy = camY + (Math.cos(i * 81) * (viewH * 0.7));
          const sxLoc = toScreenX(wx);
          const syLoc = toScreenY(wy);
          ctx.beginPath();
          ctx.moveTo(sxLoc, syLoc);
          ctx.lineTo(sxLoc + 45, syLoc + 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Restaurer le zoom d'arène pour que le HUD / Minimap soit à l'échelle 1:1 de l'écran stable
    ctx.restore();

    // --- DESSINER LA MINI-CARTE (MINIMAP) INDESTRUCTIBLE ET EXPLICITE ---
    const miniSize = 130;
    const miniX = width - miniSize - 20;
    const miniY = height - miniSize - 20;

    // Permettre l'interaction cliquable sur le reste du HUD
    ctx.save();
    
    // Fond minimap
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.fillRect(miniX, miniY, miniSize, miniSize);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(miniX, miniY, miniSize, miniSize);

    const mapToMiniX = (wx: number) => miniX + (wx / MAP_SIZE) * miniSize;
    const mapToMiniY = (wy: number) => miniY + (wy / MAP_SIZE) * miniSize;

    // Dessiner de minis plots pour les structures
    structures.forEach(s => {
      if (s.type === 'structure') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(
          miniX + (s.x / MAP_SIZE) * miniSize - 2,
          miniY + (s.y / MAP_SIZE) * miniSize - 2,
          4,
          4
        );
      }
    });

    // Dessiner le cercle de tempête sur la minimap
    const miniStormX = miniX + (storm.x / MAP_SIZE) * miniSize;
    const miniStormY = miniY + (storm.y / MAP_SIZE) * miniSize;
    const miniStormR = (storm.radius / MAP_SIZE) * miniSize;

    if (miniStormR > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(miniStormX, miniStormY, miniStormR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Prochain cercle de tempête
    const miniNextX = miniX + (storm.targetX / MAP_SIZE) * miniSize;
    const miniNextY = miniY + (storm.targetY / MAP_SIZE) * miniSize;
    const miniNextR = (storm.targetRadius / MAP_SIZE) * miniSize;
    
    if (miniNextR > 0) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(miniNextX, miniNextY, miniNextR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset les pointillés
    }

    // --- LEGENDE DES ÉVÉNEMENTS SUR LA MINIMAP ---
    // 1. Dessiner les zones de poison actives ou d'avertissement sur la minimap
    poisonZonesRef.current.forEach(zone => {
      if (!zone.active) return;
      const mx = mapToMiniX(zone.x);
      const my = mapToMiniY(zone.y);
      const mr = (zone.radius / MAP_SIZE) * miniSize;

      ctx.save();
      ctx.fillStyle = zone.isWarning ? 'rgba(234, 179, 8, 0.28)' : 'rgba(34, 197, 94, 0.38)';
      ctx.strokeStyle = zone.isWarning ? '#fbbf24' : '#22c55e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // 2. Dessiner les largages de ravitaillement actifs sur la minimap
    supplyDropsRef.current.forEach(drop => {
      if (drop.isOpened) return;
      const mx = mapToMiniX(drop.x);
      const my = mapToMiniY(drop.y);

      ctx.save();
      ctx.fillStyle = '#f59e0b'; // Or
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      
      // Dessiner un petit carré doré orné d'un liseré blanc clignotant
      ctx.beginPath();
      ctx.rect(mx - 3, my - 3, 6, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Dessiner joueurs en vie (points blancs, joueur actuel en jaune/orange, alliés en bleu)
    characters.forEach(char => {
      if (!char.alive) return;
      
      const mx = mapToMiniX(char.x);
      const my = mapToMiniY(char.y);

      if (char.isPlayer) {
        ctx.fillStyle = '#fbbf24'; // Jaune intense pour toi
        ctx.beginPath();
        ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Une petite pulsation
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (char.teamId === 'team-player') {
        ctx.fillStyle = '#60a5fa'; // Bleu pour coéquipier allié
        ctx.beginPath();
        ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#ef4444'; // rouge discret pour les ennemis si proches
        // Option : n'afficher que si proches ou toujours afficher pour simplifier la démo
        const distToPlayer = playerRef.current ? getDistance(char.x, char.y, playerRef.current.x, playerRef.current.y) : MAP_SIZE;
        if (distToPlayer < 650) {
          ctx.beginPath();
          ctx.arc(mx, my, 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    ctx.restore();
  };

  // Callback de trigger soings hud click
  const handleHUDConsumeItem = (type: 'medkit' | 'shield') => {
    consumeItem(type);
  };

  const handleHUDSelectWeapon = (idx: number) => {
    switchPlayerWeapon(idx);
  };

  const handleHUDDash = () => {
    triggerPlayerDash();
  };

  // --- LOGIQUE MULTI-TOUCH ET JOYSTICKS TACTILES SANS COUTURES ---
  const handleLeftTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.changedTouches[0] || e.touches[0];
    if (!touch) return;

    leftTouchIdRef.current = touch.identifier;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateLeftJoystick(touch.clientX - centerX, touch.clientY - centerY);
  };

  const handleLeftTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    if (leftTouchIdRef.current === null) return;

    let touch: Touch | null = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === leftTouchIdRef.current) {
        touch = e.touches[i];
        break;
      }
    }
    if (!touch) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateLeftJoystick(touch.clientX - centerX, touch.clientY - centerY);
  };

  const handleLeftTouchEnd = (e?: React.TouchEvent<HTMLDivElement>) => {
    if (e && e.cancelable) e.preventDefault();
    let shouldReset = false;
    if (!e) {
      shouldReset = true;
    } else {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === leftTouchIdRef.current) {
          shouldReset = true;
          break;
        }
      }
    }

    if (shouldReset) {
      leftTouchIdRef.current = null;
      setLeftKnobPos({ x: 0, y: 0 });
      touchMoveVectorRef.current = { x: 0, y: 0 };
    }
  };

  const updateLeftJoystick = (dx: number, dy: number) => {
    const maxRadius = 60; // amplitude max augmentée pour match la nouvelle taille
    const dist = Math.sqrt(dx * dx + dy * dy);
    let finalX = dx;
    let finalY = dy;
    if (dist > maxRadius) {
      finalX = (dx / dist) * maxRadius;
      finalY = (dy / dist) * maxRadius;
    }
    setLeftKnobPos({ x: finalX, y: finalY });
    // Normaliser entre -1 et 1
    touchMoveVectorRef.current = { x: finalX / maxRadius, y: finalY / maxRadius };
  };

  const handleRightTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.changedTouches[0] || e.touches[0];
    if (!touch) return;

    rightTouchIdRef.current = touch.identifier;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateRightJoystick(touch.clientX - centerX, touch.clientY - centerY);
  };

  const handleRightTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    if (rightTouchIdRef.current === null) return;

    let touch: Touch | null = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === rightTouchIdRef.current) {
        touch = e.touches[i];
        break;
      }
    }
    if (!touch) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateRightJoystick(touch.clientX - centerX, touch.clientY - centerY);
  };

  const handleRightTouchEnd = (e?: React.TouchEvent<HTMLDivElement>) => {
    if (e && e.cancelable) e.preventDefault();
    let shouldReset = false;
    if (!e) {
      shouldReset = true;
    } else {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === rightTouchIdRef.current) {
          shouldReset = true;
          break;
        }
      }
    }

    if (shouldReset) {
      rightTouchIdRef.current = null;
      setRightKnobPos({ x: 0, y: 0 });
      touchAimVectorRef.current = { x: 0, y: 0 };
      isTouchShootingRef.current = false;
    }
  };

  const updateRightJoystick = (dx: number, dy: number) => {
    const maxRadius = 60;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let finalX = dx;
    let finalY = dy;
    if (dist > maxRadius) {
      finalX = (dx / dist) * maxRadius;
      finalY = (dy / dist) * maxRadius;
    }
    setRightKnobPos({ x: finalX, y: finalY });

    if (dist > 10) {
      touchAimVectorRef.current = { x: dx, y: dy };
      isTouchShootingRef.current = true;
    } else {
      touchAimVectorRef.current = { x: 0, y: 0 };
      isTouchShootingRef.current = false;
    }
  };

  // Spectator control loops
  const handleNextSpectate = () => {
    const listBots = charactersRef.current.filter(c => c.alive && !c.isPlayer);
    if (listBots.length > 0) {
      spectatorTargetIdxRef.current = (spectatorTargetIdxRef.current + 1) % listBots.length;
    }
  };

  const handlePrevSpectate = () => {
    const listBots = charactersRef.current.filter(c => c.alive && !c.isPlayer);
    if (listBots.length > 0) {
      spectatorTargetIdxRef.current = (spectatorTargetIdxRef.current - 1 + listBots.length) % listBots.length;
    }
  };

  const handleQuitSpectate = () => {
    handleMatchComplete();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden font-sans select-none antialiased">
      
      {/* MENUS FLOTTANTS REACT */}
      {gameState === 'menu' && (
        <div className="w-full flex justify-center py-4 animate-fade-in z-10 overflow-y-auto">
          <MainMenu
            stats={stats}
            playerName={playerName}
            setPlayerName={setPlayerName}
            selectedMode={playMode}
            setSelectedMode={setSelectedMode}
            selectedDifficulty={selectedDifficulty}
            setSelectedDifficulty={setSelectedDifficulty}
            skinColor={skinColor}
            setSkinColor={setSkinColor}
            hatStyle={hatStyle}
            setHatStyle={setHatStyle}
            patternStyle={patternStyle}
            setPatternStyle={setPatternStyle}
            onStartGame={handleStartGame}
            onUpdateStats={(updated) => {
              setStats(updated);
              localStorage.setItem('aura_royale_2d_stats', JSON.stringify(updated));
            }}
            selectedArena={selectedArena}
            onSelectArena={setSelectedArena}
            controlOption={controlOption}
            setControlOption={setControlOption}
          />
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full h-screen relative flex">
          {/* Le Canvas central */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair"
          />

          {/* Les Overlays du HUD */}
          {playerRef.current && (
            <GameHUD
              player={playerRef.current}
              mate={mateRef.current || undefined}
              survivorCount={survivorCount}
              kills={kills}
              stormPhase={stormPhase}
              stormTimer={stormTimer}
              stormIsShrinking={stormIsShrinking}
              killFeed={killFeed}
              onConsumeItem={handleHUDConsumeItem}
              onSelectWeapon={handleHUDSelectWeapon}
              playMode={playMode}
              onDash={handleHUDDash}
              spectatorMode={spectatorMode}
              spectatingName={spectatingName}
              equippedEmote={stats.equippedEmote}
              onTriggerEmote={handleTriggerEmote}
              touchLayout={touchLayout}
              onReload={triggerPlayerReload}
            />
          )}

          {/* SENSOR JOYSTICKS TACTILES SENSITIFS MOBILE */}
          {controlOption === 'touch' && playerRef.current && playerRef.current.alive && !spectatorMode && (
            <div className="absolute inset-0 pointer-events-none select-none z-40">
              
              {/* JOYSTICK GAUCHE : Déplacements libres à 360° */}
              <div 
                className="absolute w-36 h-36 bg-slate-900/60 border border-slate-700/50 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-auto touch-none shadow-2xl"
                style={{
                  left: `${touchLayout.leftJoystick.x}%`,
                  top: `${touchLayout.leftJoystick.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onTouchStart={handleLeftTouchStart}
                onTouchMove={handleLeftTouchMove}
                onTouchEnd={handleLeftTouchEnd}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const cX = rect.left + rect.width / 2;
                  const cY = rect.top + rect.height / 2;
                  const onMouseMove = (moveEv: MouseEvent) => {
                    updateLeftJoystick(moveEv.clientX - cX, moveEv.clientY - cY);
                  };
                  const onMouseUp = () => {
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    handleLeftTouchEnd();
                  };
                  window.addEventListener('mousemove', onMouseMove);
                  window.addEventListener('mouseup', onMouseUp);
                  updateLeftJoystick(e.clientX - cX, e.clientY - cY);
                }}
              >
                {/* Centre / Knob */}
                <div 
                  className="w-14 h-14 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.75)] cursor-grab active:cursor-grabbing border-2 border-slate-950 flex items-center justify-center"
                  style={{
                    transform: `translate(${leftKnobPos.x}px, ${leftKnobPos.y}px)`,
                  }}
                >
                  <span className="text-xs text-slate-950 font-black">⚙️</span>
                </div>
                
                {/* Repères cardinaux discrets */}
                <span className="absolute top-3 text-[10px] font-mono text-slate-400 font-bold opacity-60">Z</span>
                <span className="absolute bottom-3 text-[10px] font-mono text-slate-400 font-bold opacity-60">S</span>
                <span className="absolute left-3 text-[10px] font-mono text-slate-400 font-bold opacity-60">Q</span>
                <span className="absolute right-3 text-[10px] font-mono text-slate-400 font-bold opacity-60">D</span>
              </div>

              {/* JOYSTICK DROIT : Visée et Tir Auto */}
              <div 
                className="absolute w-36 h-36 bg-slate-900/60 border border-slate-700/50 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-auto touch-none shadow-2xl"
                style={{
                  left: `${touchLayout.rightJoystick.x}%`,
                  top: `${touchLayout.rightJoystick.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onTouchStart={handleRightTouchStart}
                onTouchMove={handleRightTouchMove}
                onTouchEnd={handleRightTouchEnd}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const cX = rect.left + rect.width / 2;
                  const cY = rect.top + rect.height / 2;
                  const onMouseMove = (moveEv: MouseEvent) => {
                    updateRightJoystick(moveEv.clientX - cX, moveEv.clientY - cY);
                  };
                  const onMouseUp = () => {
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    handleRightTouchEnd();
                  };
                  window.addEventListener('mousemove', onMouseMove);
                  window.addEventListener('mouseup', onMouseUp);
                  updateRightJoystick(e.clientX - cX, e.clientY - cY);
                }}
              >
                {/* Centre / Knob rouge feu */}
                <div 
                  className="w-14 h-14 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.75)] cursor-grab active:cursor-grabbing border-2 border-slate-950 flex items-center justify-center"
                  style={{
                    transform: `translate(${rightKnobPos.x}px, ${rightKnobPos.y}px)`,
                  }}
                >
                  <span className="text-base text-white">🎯</span>
                </div>
              </div>

              {/* ACTION ULTRA-BOUTON : Dash de vitesse */}
              <button
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (e.cancelable) e.preventDefault();
                  triggerPlayerDash();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  triggerPlayerDash();
                }}
                className="absolute w-16 h-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(245,158,11,0.55)] border border-amber-300 font-black text-slate-950 active:scale-95 pointer-events-auto hover:brightness-110 cursor-pointer select-none transition-all"
                style={{
                  left: `${touchLayout.dashButton.x}%`,
                  top: `${touchLayout.dashButton.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title="Dash instantané"
              >
                ⚡
              </button>

              {/* BOUTON RELOAD (🔄) */}
              <button
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (e.cancelable) e.preventDefault();
                  triggerPlayerReload();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  triggerPlayerReload();
                }}
                className="absolute w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center text-2xl shadow-xl border border-slate-600 font-black text-slate-100 active:scale-95 pointer-events-auto hover:brightness-110 cursor-pointer select-none transition-all"
                style={{
                  left: `${touchLayout.reloadButton.x}%`,
                  top: `${touchLayout.reloadButton.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title="Recharger l'arme"
              >
                🔄
              </button>

            </div>
          )}

          {/* BANNÈRE D'ÉVÉNEMENTS ALÉATOIRES TACTIQUES */}
          {weatherEvent !== 'none' && (
            <div className="absolute top-[4.5rem] left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-full px-5 py-1.5 flex items-center gap-3 shadow-[0_10px_25px_rgba(0,0,0,0.65)] z-40 select-none pointer-events-none transition-all duration-300 animate-pulse">
              <div className={`w-2.5 h-2.5 rounded-full animate-ping absolute ${
                weatherEvent === 'magma_comets' ? 'bg-rose-500' :
                weatherEvent === 'acid_rain' ? 'bg-green-500' :
                'bg-amber-500'
              }`} />
              <div className={`w-2.5 h-2.5 rounded-full relative ${
                weatherEvent === 'magma_comets' ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]' :
                weatherEvent === 'acid_rain' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' :
                'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
              }`} />
              <span className="text-[11px] font-black font-sans tracking-widest text-slate-200 uppercase">
                {weatherEvent === 'magma_comets' && '☄️ AVERSE DE COMÈTES MAGMA'}
                {weatherEvent === 'acid_rain' && '🌧️ PLUIE ACIDE CORROSIVE'}
                {weatherEvent === 'sandstorm' && '🌪️ TEMPÊTE DE SABLE DESERTIQUE'}
              </span>
              <span className="text-[11px] font-mono font-black text-slate-100 bg-slate-800/90 py-0.5 px-2 rounded-md">
                {weatherDuration}s
              </span>
            </div>
          )}

          {centerNotification && Date.now() < centerNotification.expiresAt && (
            <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-slate-950/95 border-2 border-amber-500 rounded-2xl px-6 py-3 shadow-[0_0_25px_rgba(245,158,11,0.35)] text-center z-50 max-w-md pointer-events-none transition-all duration-300 transform scale-100">
              <span className="text-xs font-black font-sans text-amber-400 uppercase tracking-widest block">
                {centerNotification.type === 'supply' ? '📦 RAVITAILLEMENT D\'ÉLITE' : '☣️ ALERTE TEMPÊTE DE POISON'}
              </span>
              <p className="text-xs font-mono text-slate-100 mt-1 uppercase leading-normal">
                {centerNotification.text}
              </p>
            </div>
          )}

          {/* Contrôles Spectateurs */}
          {spectatorMode && (
            <SpectatorControls
              livingBotsList={charactersRef.current.filter(c => c.alive && !c.isPlayer)}
              currentSpectateIdx={spectatorTargetIdxRef.current}
              onNextSpectate={handleNextSpectate}
              onPrevSpectate={handlePrevSpectate}
              onViewReport={handleQuitSpectate}
            />
          )}
        </div>
      )}

      {gameState === 'report' && (
        <div className="w-full h-screen overflow-y-auto py-8 z-10 flex justify-center items-center">
          <BattleReport
            rank={endGameRank}
            kills={endGameKills}
            survivedTime={endGameTime}
            mode={playMode}
            weaponOfChoice={weaponOfChoice}
            deathCause={deathCause}
            playerName={playerName}
            skinColor={skinColor}
            hatStyle={hatStyle}
            patternStyle={patternStyle}
            stats={stats}
            onRestart={() => setGameState('menu')}
          />
        </div>
      )}

      {/* PORTRAIT OVERLAY : CONSEIL DE ROTATION POUR SMARTPHONES */}
      <div className="portrait:flex hidden md:portrait:hidden fixed inset-0 bg-slate-950/95 z-50 flex-col items-center justify-center p-6 text-center animate-fade-in pointer-events-auto">
        <span className="text-5xl animate-bounce mb-4">🔄📱</span>
        <h3 className="text-xl font-bold text-amber-500 font-sans uppercase">Rotation Recommandée</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-xs font-sans leading-relaxed">
          Pour piloter vos joysticks tactiles à 360° avec précision et voir venir vos adversaires, veuillez incliner votre smartphone à l'horizontale.
        </p>
        <button 
          onClick={(e) => {
            const target = e.currentTarget.parentElement;
            if (target) target.style.display = 'none';
          }}
          className="mt-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold font-sans active:scale-95 transition-all cursor-pointer"
        >
          Jouer en Écran Vertical
        </button>
      </div>

    </div>
  );
}
