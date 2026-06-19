import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || "";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper static fallbacks for offline mode / missing API Key
  const FALLBACK_THEMES = [
    {
      name: "Labyrinthe d'Améthyste",
      desc: "Un complexe de cavernes mystiques parsemé de cristaux violets géants luisants sous une brume instable d'éther stellaire.",
      groundColor: "#120b24",
      gridColor: "#1f103b",
      borderColor: "#a21caf",
      accentColor: "#d946ef",
      textureStyle: "crystals",
      textureDetailColor: "#c084fc",
      textureSecondaryColor: "#581c87",
      textureDensity: 45,
      mudLabel: "Champ d'Éther Visqueux",
      lavaLabel: "Geyser Surchauffé",
      speedBoostLabel: "Balise Gravitationnelle",
      healerLabel: "Fontaine de Vitalité Nanite",
      mudColor: "#3b0764",
      lavaColor: "#f472b6",
      speedBoostColor: "#a21caf",
      healerColor: "#0d9488",
      customObstacleName: "Monolithe d'Améthyste",
      customCrateName: "Coffre Runique",
      customStructureColor: "#4a044e",
      customCrateColor: "#a21caf",
      events: [
        {
          name: "Aura Quantique Instable",
          desc: "Les cristaux violet s'activent ! Le continuum espace-temps s'accélère.",
          type: "neon_surcharge",
          overlayColor: "rgba(162, 28, 175, 0.12)",
          particleColor: "#f472b6",
          particleType: "spark",
          gameplayEffectDesc: "Dashs illimités : Temps de recharge réduit de 90 % !"
        },
        {
          name: "Pluie de Métagrammes",
          desc: "Des météorites d'éther s'abattent du dôme cosmique, fissurant le sol.",
          type: "tempest",
          overlayColor: "rgba(88, 28, 135, 0.16)",
          particleColor: "#c084fc",
          particleType: "rain_drop",
          gameplayEffectDesc: "La tempête s'intensifie ! Cachez-vous dans les structures !"
        },
        {
          name: "Brume de Soins Runiques",
          desc: "Une brume émeraude s'élève des failles géologiques de la caverne.",
          type: "healing_rain",
          overlayColor: "rgba(13, 148, 136, 0.12)",
          particleColor: "#2dd4bf",
          particleType: "bubble",
          gameplayEffectDesc: "Tous les combattants régénèrent passivement de la santé (+2 PV/s) !"
        }
      ]
    },
    {
      name: "Mainframe Cyber-Émeraude",
      desc: "Une grille virtuelle rétro-futuriste piratée par un protocole infectieux vert fluorescent, avec circuits imprimés géants.",
      groundColor: "#021e17",
      gridColor: "#043c22",
      borderColor: "#10b981",
      accentColor: "#34d399",
      textureStyle: "digital",
      textureDetailColor: "#059669",
      textureSecondaryColor: "#064e43",
      textureDensity: 65,
      mudLabel: "Flux d'Étranglement de Bande Passante",
      lavaLabel: "Zone de Fuite Thermique",
      speedBoostLabel: "Point de Routage Hyper-Vitesse",
      healerLabel: "Protocole de Restauration Sûre",
      mudColor: "#064e3b",
      lavaColor: "#10b981",
      speedBoostColor: "#34d399",
      healerColor: "#059669",
      customObstacleName: "Unité Serveur Firewall",
      customCrateName: "Caisse Cryogénique de Données",
      customStructureColor: "#022c22",
      customCrateColor: "#10b981",
      events: [
        {
          name: "Survoltage de Fréquence",
          desc: "Le processeur de l'arène est overclocké à 9.9 GHz !",
          type: "neon_surcharge",
          overlayColor: "rgba(52, 211, 153, 0.14)",
          particleColor: "#a7f3d0",
          particleType: "spark",
          gameplayEffectDesc: "Vitesse d'action maximale : rebooste tous les condensateurs de dash !"
        },
        {
          name: "Nuage d'Acide Cryogénique",
          desc: "Du fluide de refroidissement toxique s'échappe des serveurs endommagés.",
          type: "radioactive_fallout",
          overlayColor: "rgba(6, 78, 59, 0.18)",
          particleColor: "#10b981",
          particleType: "smoke",
          gameplayEffectDesc: "Pluie acide : inflige 3 dégâts par seconde aux joueurs non abrités !"
        }
      ]
    }
  ];

  function generateFallbackStructures(subTypeSeed: string) {
    const structures: any[] = [];
    const quadrants = [
      { x: 550, y: 550 }, { x: 1950, y: 550 },
      { x: 550, y: 1950 }, { x: 1950, y: 1950 },
      { x: 1250, y: 350 }, { x: 1250, y: 2150 },
      { x: 350, y: 1250 }, { x: 2150, y: 1250 }
    ];

    quadrants.forEach((q, idx) => {
      // Structure centrale du bastion
      structures.push({
        x: q.x,
        y: q.y,
        w: idx % 2 === 0 ? 150 : 110,
        h: idx % 2 === 0 ? 110 : 150,
        type: "structure",
        subType: subTypeSeed === "crystals" ? "bone_structure" : subTypeSeed === "digital" ? "server_block" : "shipping_container"
      });

      // Sacs protecteurs
      structures.push({
        x: q.x - 100,
        y: q.y,
        w: 24,
        h: 90,
        type: "structure",
        subType: "sandbags"
      });
      structures.push({
        x: q.x + 100,
        y: q.y,
        w: 24,
        h: 90,
        type: "structure",
        subType: "sandbags"
      });

      // Petites caisses complémentaires
      structures.push({
        x: q.x,
        y: q.y - 85,
        w: 32,
        h: 32,
        type: "crate",
        subType: "ammo_crate"
      });
      structures.push({
        x: q.x + 45,
        y: q.y + 65,
        w: 30,
        h: 30,
        type: "crate",
        subType: "weapon_crate"
      });
    });

    // Autres obstacles aléatoires en périphérie d'arène
    for (let i = 0; i < 22; i++) {
      const rx = 300 + (Math.sin(i * 1.9) * 0.5 + 0.5) * 1900;
      const ry = 300 + (Math.cos(i * 2.7) * 0.5 + 0.5) * 1900;
      const distCenter = Math.sqrt(Math.pow(rx - 1250, 2) + Math.pow(ry - 1250, 2));

      if (distCenter < 220) continue; // Garder le centre dégagé !

      structures.push({
        x: Math.round(rx),
        y: Math.round(ry),
        w: i % 3 === 0 ? 90 : 60,
        h: i % 3 === 0 ? 90 : 60,
        type: i % 5 === 0 ? "crate" : "structure",
        subType: i % 5 === 0 ? "weapon_crate" : "natural_rock"
      });
    }

    return structures;
  }

  // API Route: AI custom arena dynamic environmental theme maker
  app.post("/api/arena/generate", async (req, res) => {
    const { prompt } = req.body;
    const cleanPrompt = prompt ? prompt.trim() : "Arène de combat futuriste";

    if (!API_KEY) {
      // Offline procedural feedback matches schema!
      const isDigital = cleanPrompt.toLowerCase().includes("cyber") || cleanPrompt.toLowerCase().includes("neon") || cleanPrompt.toLowerCase().includes("virtuel") || cleanPrompt.toLowerCase().includes("tron");
      const fallbackPreset = isDigital ? FALLBACK_THEMES[1] : FALLBACK_THEMES[0];
      
      const completeTheme = {
        ...fallbackPreset,
        name: cleanPrompt.length > 5 ? `${cleanPrompt} (Procédural)` : fallbackPreset.name,
        structuresList: generateFallbackStructures(fallbackPreset.textureStyle)
      };

      return res.json(completeTheme);
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `Tu es le noyau de calcul central d'un moteur graphique 2D évolué d'arène de combat en vue de dessus.
Tu génères un environnement de jeu entier en t'adaptant de manière créative au thème dicté par l'utilisateur.
Consigne d'écriture : Exprime-toi exclusivement en français pour les descriptions. Respecte le schéma JSON requis.`;

      const promptCommand = `Conçois les spécifications graphiques, de textures d'arrière-plan, opérationnelles et environnementales dynamiques pour le thème suivant : "${cleanPrompt}". \
Génère également un ensemble de disposition logique de 35 à 45 structures physiques et coffres de loot répartis stratégiquement sur une arène globale de 2500x2500 unités (coordonnées x et y comprises entre 150 et 2350, à au moins 200 unités de distance du centre absolu à (1250, 1250)).`;

      const responseSchema = {
        type: Type.OBJECT,
        required: [
          "name", "desc", "groundColor", "gridColor", "borderColor", "accentColor",
          "textureStyle", "textureDetailColor", "textureSecondaryColor", "textureDensity",
          "mudLabel", "lavaLabel", "speedBoostLabel", "healerLabel", "mudColor", "lavaColor", "speedBoostColor", "healerColor",
          "customObstacleName", "customCrateName", "customStructureColor", "customCrateColor",
          "events", "structuresList"
        ],
        properties: {
          name: { type: Type.STRING, description: "Nom stylisé ultra-classe et court de l'environnement généré (ex: 'Secteur Cosmique Sigma')" },
          desc: { type: Type.STRING, description: "Description narrative de 1 ou 2 phrases percutantes sur les conditions atmosphériques de l'arène." },
          groundColor: { type: Type.STRING, description: "Style de fond CSS principal au format HEX compatible (ex: #110e20), favorise les teintes sombres et contrastantes" },
          gridColor: { type: Type.STRING, description: "Couleur des lignes de quadrillage du sol en HEX (généralement plus claire ou foncée que le fond pour de la lisibilité)" },
          borderColor: { type: Type.STRING, description: "Couleur néon de la limite de terrain hexagonale extérieure en HEX" },
          accentColor: { type: Type.STRING, description: "La couleur d'accent néon représentative du thème entier en HEX" },
          
          textureStyle: { 
            type: Type.STRING, 
            description: "Le style de texture de fond fluide à peindre", 
            enum: ["stars", "cracks", "digital", "organic_cells", "sand_drift", "energy_grids", "waves", "crystals"] 
          },
          textureDetailColor: { type: Type.STRING, description: "Couleur HEX des détails graphiques secondaires de la texture" },
          textureSecondaryColor: { type: Type.STRING, description: "Couleur HEX tertiaire de texture pour ajouter du relief (ex: cracks s'assombrissant)" },
          textureDensity: { type: Type.INTEGER, description: "Densité des détails de texture dessinés de 10 (rare) à 100 (dense)" },
          
          mudLabel: { type: Type.STRING, description: "Alias thématique très original pour les flaques d'eau marécageuses ralentissantes (ex: 'Nappe d'Acide Liquide')" },
          lavaLabel: { type: Type.STRING, description: "Alias thématique pour les flaques mortelles (ex: 'Puits de Surcharge Thermique')" },
          speedBoostLabel: { type: Type.STRING, description: "Alias thématique pour les pistes d'accélération (ex: 'Piste Synaptique Cyan')" },
          healerLabel: { type: Type.STRING, description: "Alias thématique pour les cercles de soin (ex: 'Station Nanomédicale Aura')" },
          
          mudColor: { type: Type.STRING, description: "Couleur HEX représentative de la flaque ralentissante" },
          lavaColor: { type: Type.STRING, description: "Couleur HEX représentative de la flaque mortelle" },
          speedBoostColor: { type: Type.STRING, description: "Couleur HEX d'accélération" },
          healerColor: { type: Type.STRING, description: "Couleur HEX de régénération de santé" },
          
          customObstacleName: { type: Type.STRING, description: "Nom des grands abris physiques (ex: 'Relique Cristalline de Basalte')" },
          customCrateName: { type: Type.STRING, description: "Nom des boîtes d'arsenal (ex: 'Banque d'Extraction d'Armes')" },
          customStructureColor: { type: Type.STRING, description: "Couleur solide HEX des obstacles" },
          customCrateColor: { type: Type.STRING, description: "Couleur HEX des coffres de butin" },
          
          events: {
            type: Type.ARRAY,
            description: "Génère exactement 3 événements d'effets atmosphériques dynamiques surprenants à déclencher en partie.",
            items: {
              type: Type.OBJECT,
              required: ["name", "desc", "type", "overlayColor", "particleColor", "particleType", "gameplayEffectDesc"],
              properties: {
                name: { type: Type.STRING, description: "Nom de l'événement météo d'ambiance (ex: 'Surcharge Solaire')" },
                desc: { type: Type.STRING, description: "Texte narratif court expliquant l'événement aux joueurs." },
                type: { 
                  type: Type.STRING, 
                  description: "Niveau d'effet physique matériel sur le gameplay",
                  enum: ["tempest", "radioactive_fallout", "neon_surcharge", "healing_rain", "gravity_warp"] 
                },
                overlayColor: { type: Type.STRING, description: "Filtre d'ambiance à appliquer à tout l'écran au format CSS RGBA translucide (ex: 'rgba(239, 68, 68, 0.12)')" },
                particleColor: { type: Type.STRING, description: "Couleur HEX des particules météorologiques descendantes" },
                particleType: { 
                  type: Type.STRING, 
                  description: "Dessin visuel de particule",
                  enum: ["spark", "smoke", "bubble", "digital_rune", "rain_drop"] 
                },
                gameplayEffectDesc: { type: Type.STRING, description: "Indication textuelle courte de l'impact en jeu (ex: '+3 PV/s à tous', 'Dash infini !')" }
              }
            }
          },
          
          structuresList: {
            type: Type.ARRAY,
            description: "Liste de 35 à 45 obstacles de structures et de caisses. Coordonnées x, y distribuées intelligemment pour faire de jolies places, allées, bastions et corridors tactiques",
            items: {
              type: Type.OBJECT,
              required: ["x", "y", "w", "h", "type", "subType"],
              properties: {
                x: { type: Type.INTEGER, description: "Coordonnée X centrale (150 à 2350, éviter 1050-1450 pour spawn)" },
                y: { type: Type.INTEGER, description: "Coordonnée Y centrale (150 à 2350, éviter 1050-1450 pour spawn)" },
                w: { type: Type.INTEGER, description: "Largeur entre 40 et 160" },
                h: { type: Type.INTEGER, description: "Hauteur entre 40 && 160" },
                type: { type: Type.STRING, enum: ["structure", "crate"] },
                subType: { type: Type.STRING, description: "Nom interne du shape de dessin (ex: container, server_block, bone_structure, sandbags, barracks_main)" }
              }
            }
          }
        }
      };

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptCommand,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema
        }
      });

      const parsedData = JSON.parse(result.text.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      // Fallback in case of server-side Google SDK or JSON errors
      const fallbackPreset = FALLBACK_THEMES[Math.floor(Math.random() * FALLBACK_THEMES.length)];
      res.json({
        ...fallbackPreset,
        name: `${cleanPrompt} (Génération Plan B)`,
        structuresList: generateFallbackStructures(fallbackPreset.textureStyle)
      });
    }
  });

  // API Route: IA Battle Report with Gemini
  app.post("/api/report", async (req, res) => {
    const { rank, kills, survivedTime, mode, weaponOfChoice, deathCause, playerName, skinColor, hatStyle, patternStyle } = req.body;

    if (!API_KEY) {
      // Message de secours si la clé d'API n'est pas disponible
      const defaultComment = `Rapport de combat pour ${playerName} (Skin: ${skinColor}, Chapeau: ${hatStyle}) : ` +
        `Place #${rank} en mode ${mode} avec ${kills} éliminations en survivant ${survivedTime}s. ` +
        `Arme fétiche : ${weaponOfChoice}. Mort par : ${deathCause}. Super effort soldat, la prochaine sera la bonne !`;
      return res.json({ text: defaultComment });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const modeInFrench = mode === 'solo' ? 'Solo' : mode === 'duo' ? 'Duo' : 'Squad';
      const prompt = `Génère un rapport de combat de battle royale humoristique, immersif et stratégique en français pour le joueur nommé "${playerName}". Accompagne-le d'un ton d'assistant d'organisation pragmatique et analyste quantitatif (Aura Prime / SigmaQuery).
Voici les statistiques de sa partie :
- Classement (Rank) : #${rank} sur 40 joueurs
- Éliminations (Kills) : ${kills} ennemis abattus
- Temps de survie : ${survivedTime} secondes
- Mode de jeu : ${modeInFrench}
- Arme principale de prédilection : ${weaponOfChoice || "Aucune (combat aux poings !)"}
- Cause de sa mort : ${deathCause || "Inconnue"}
- Style de skin du joueur : Couleur ${skinColor}, chapeau style "${hatStyle}", motif corporel "${patternStyle}".

Consignes pour le rapport :
1. Reste pragmatique mais dynamique, utilise des termes gaming de battle royale ("la zone", "la tempête", "loot", "top 1", "clutch", "laser").
2. Analyse les données chiffrées avec une pointe de quantitativement génial (ex: "Efficacité brute de ${(kills / Math.max(1, survivedTime) * 60).toFixed(2)} éliminations par minute").
3. Adresse-toi directement à ${playerName} avec une citation ou un commentaire sur ses choix esthétiques (le chapeau "${hatStyle}").
4. Reste concis (environ 4-5 phrases percutantes ou de courts paragraphes stylés) pour donner envie de relancer une partie !`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Erreur lors de la génération du rapport par l'IA." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
