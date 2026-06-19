import React, { useState, useRef, useEffect } from 'react';

interface ElementPosition {
  x: number;
  y: number;
}

export interface TouchHUDLayout {
  leftJoystick: ElementPosition;
  rightJoystick: ElementPosition;
  dashButton: ElementPosition;
  mobileHUD: ElementPosition;
  reloadButton: ElementPosition;
}

interface TouchHUDCustomizerProps {
  initialLayout: TouchHUDLayout;
  onSave: (layout: TouchHUDLayout) => void;
  onClose: () => void;
}

const DEFAULT_LAYOUT: TouchHUDLayout = {
  leftJoystick: { x: 15, y: 80 },
  rightJoystick: { x: 80, y: 80 },
  dashButton: { x: 82, y: 55 },
  mobileHUD: { x: 50, y: 82 },
  reloadButton: { x: 70, y: 82 },
};

export default function TouchHUDCustomizer({
  initialLayout,
  onSave,
  onClose,
}: TouchHUDCustomizerProps) {
  const [layout, setLayout] = useState<TouchHUDLayout>({ ...initialLayout });
  const [draggedElement, setDraggedElement] = useState<keyof TouchHUDLayout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gérer le déplacement via la souris globale/tactile quand on drag
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (!draggedElement) return;
      handleDragMove(e.clientX, e.clientY);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!draggedElement) return;
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleGlobalUp = () => {
      if (draggedElement) {
        setDraggedElement(null);
      }
    };

    if (draggedElement) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      window.addEventListener('touchend', handleGlobalUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [draggedElement]);

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!draggedElement || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let xPercent = ((clientX - rect.left) / rect.width) * 100;
    let yPercent = ((clientY - rect.top) / rect.height) * 100;

    // Définir des limites de sécurité pour éviter de perdre les contrôles en dehors de l'écran
    let minX = 8;
    let maxX = 92;
    let minY = 8;
    let maxY = 92;

    if (draggedElement === 'mobileHUD') {
      minY = 30; // On évite de caler le HUD d'armes tout en haut
      minX = 20;
      maxX = 80;
    }

    xPercent = Math.max(minX, Math.min(maxX, xPercent));
    yPercent = Math.max(minY, Math.min(maxY, yPercent));

    setLayout((prev) => ({
      ...prev,
      [draggedElement]: {
        x: Math.round(xPercent),
        y: Math.round(yPercent),
      },
    }));
  };

  const handleStartDrag = (
    e: React.MouseEvent | React.TouchEvent,
    element: keyof TouchHUDLayout
  ) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    setDraggedElement(element);
  };

  const handleReset = () => {
    setLayout({ ...DEFAULT_LAYOUT });
  };

  const handleSave = () => {
    onSave(layout);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl font-sans text-left animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 mb-5 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>📱</span> Éditeur de Disposition Tactile
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Faites glisser les joysticks et les boutons virtuels pour ajuster la prise en main de votre appareil.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-mono border border-slate-700 bg-slate-950/35 hover:bg-slate-950 text-slate-300 transition-all cursor-pointer"
          >
            🔄 Réinitialiser
          </button>
        </div>
      </div>

      {/* ZONE DE SIMULATION DE COQUE DE TÉLÉPHONE */}
      <div className="relative w-full max-w-4xl mx-auto mb-6 bg-slate-950 border-4 border-slate-800 rounded-3xl shadow-inner overflow-hidden select-none">
        {/* Notch / Caméra simu smartphone */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-4 h-12 bg-slate-800 rounded-r-xl z-20 hidden md:block"></div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-12 bg-slate-800 rounded-l-xl z-20 hidden md:block"></div>

        {/* Cadre de l'écran 16:9 dynamique */}
        <div
          ref={containerRef}
          className="relative w-full aspect-[21/9] sm:aspect-[16/7] md:aspect-[16/7] bg-slate-900/45 overflow-hidden grid-pattern-bg touch-none"
          style={{
            backgroundImage: `radial-gradient(ellipse at center, rgba(15, 23, 42, 0.4) 0%, rgba(2, 6, 23, 0.95) 100%)`,
          }}
        >
          {/* Grille technique de repères optiques */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-[0.03] pointer-events-none">
            {[...Array(72)].map((_, i) => (
              <div key={i} className="border border-slate-200"></div>
            ))}
          </div>

          {/* Simulateur d'arène de jeu miniature en arrière-plan */}
          <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
            <div className="w-1/2 h-1/2 border-4 border-dashed border-amber-500/20 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500/30">CERCLE DE TEMPÊTE</span>
            </div>
            {/* Simulation de buissons, joueurs minimaux */}
            <div className="absolute top-1/3 left-1/4 w-10 h-10 bg-emerald-950/40 border border-emerald-800/40 rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/3 w-12 h-12 bg-emerald-950/40 border border-emerald-800/40 rounded-full"></div>
            <div className="absolute top-1/4 right-1/4 w-6 h-6 bg-slate-800/30 border border-slate-700/30 rounded-full"></div>
            
            {/* Personnage simulé au centre */}
            <div className="w-8 h-8 rounded-full bg-amber-500/30 border-2 border-amber-300/30 flex items-center justify-center">
              <span className="text-[10px] text-amber-300 font-bold opacity-40">ST</span>
            </div>
          </div>

          {/* Guide explicatif intégré au fond */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-950/70 py-1.5 px-4 rounded-full border border-slate-800 pointer-events-none text-center">
            <p className="text-[10px] md:text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              🖱️ {draggedElement ? `Ajustement de : ${draggedElement}` : 'Faites glisser les éléments ci-dessous'}
            </p>
          </div>

          {/* ========================================================= */}
          {/* MOBILE ELEMENTS DRAGGABLES                                */}
          {/* ========================================================= */}

          {/* 1. JOYSTICK GAUCHE (MOUVEMENT) */}
          <div
            onMouseDown={(e) => handleStartDrag(e, 'leftJoystick')}
            onTouchStart={(e) => handleStartDrag(e, 'leftJoystick')}
            className={`absolute w-16 h-16 md:w-24 md:h-24 bg-slate-900/80 border-2 backdrop-blur-sm rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-shadow z-10 ${
              draggedElement === 'leftJoystick'
                ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)] ring-2 ring-amber-500/20'
                : 'border-slate-700/80 hover:border-slate-500 shadow-lg'
            }`}
            style={{
              left: `${layout.leftJoystick.x}%`,
              top: `${layout.leftJoystick.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Knob interne simulé */}
            <div className="w-6 h-6 md:w-10 md:h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full border border-slate-950 flex items-center justify-center shadow">
              <span className="text-[8px] md:text-xs text-slate-950 font-black">⚙️</span>
            </div>
            {/* Label */}
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[8px] md:text-[10px] text-amber-400 bg-slate-950/90 py-0.5 px-1.5 rounded uppercase font-black tracking-wider whitespace-nowrap">
              Mouvement
            </span>
          </div>

          {/* 2. JOYSTICK DROIT (VISÉE & TIR) */}
          <div
            onMouseDown={(e) => handleStartDrag(e, 'rightJoystick')}
            onTouchStart={(e) => handleStartDrag(e, 'rightJoystick')}
            className={`absolute w-16 h-16 md:w-24 md:h-24 bg-slate-900/80 border-2 backdrop-blur-sm rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-shadow z-10 ${
              draggedElement === 'rightJoystick'
                ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] ring-2 ring-red-500/20'
                : 'border-slate-700/80 hover:border-slate-500 shadow-lg'
            }`}
            style={{
              left: `${layout.rightJoystick.x}%`,
              top: `${layout.rightJoystick.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Knob interne rouge simulé */}
            <div className="w-6 h-6 md:w-10 md:h-10 bg-gradient-to-br from-red-500 to-red-650 rounded-full border border-slate-950 flex items-center justify-center shadow">
              <span className="text-[10px] md:text-sm text-white">🎯</span>
            </div>
            {/* Label */}
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[8px] md:text-[10px] text-red-400 bg-slate-950/90 py-0.5 px-1.5 rounded uppercase font-black tracking-wider whitespace-nowrap">
              Visée / Tir
            </span>
          </div>

          {/* 3. BOUTON DASH (⚡) */}
          <div
            onMouseDown={(e) => handleStartDrag(e, 'dashButton')}
            onTouchStart={(e) => handleStartDrag(e, 'dashButton')}
            className={`absolute w-10 h-10 md:w-14 md:h-14 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-all border-2 shadow-lg z-10 ${
              draggedElement === 'dashButton'
                ? 'border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.8)] scale-110'
                : 'border-amber-400/80 hover:border-amber-300'
            }`}
            style={{
              left: `${layout.dashButton.x}%`,
              top: `${layout.dashButton.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-xs md:text-lg">⚡</span>
            {/* Label */}
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[8px] md:text-[9px] text-amber-500 bg-slate-950/90 py-0.5 px-1 rounded uppercase font-black tracking-wider whitespace-nowrap">
              Dash
            </span>
          </div>

          {/* 3b. BOUTON RELOAD (🔄) */}
          <div
            onMouseDown={(e) => handleStartDrag(e, 'reloadButton')}
            onTouchStart={(e) => handleStartDrag(e, 'reloadButton')}
            className={`absolute w-10 h-10 md:w-14 md:h-14 bg-slate-800/90 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-all border-2 shadow-lg z-10 ${
              draggedElement === 'reloadButton'
                ? 'border-blue-400 shadow-[0_0_15px_rgba(56,189,248,0.6)] scale-110'
                : 'border-slate-700/80 hover:border-slate-600'
            }`}
            style={{
              left: `${layout.reloadButton.x}%`,
              top: `${layout.reloadButton.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-xs md:text-lg">🔄</span>
            {/* Label */}
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[8px] md:text-[9px] text-blue-400 bg-slate-950/90 py-0.5 px-1 rounded uppercase font-black tracking-wider whitespace-nowrap">
              Reload
            </span>
          </div>

          {/* 4. MOBILE HUD PANEL */}
          <div
            onMouseDown={(e) => handleStartDrag(e, 'mobileHUD')}
            onTouchStart={(e) => handleStartDrag(e, 'mobileHUD')}
            className={`absolute w-44 md:w-64 bg-slate-950/95 border-2 rounded-xl p-2 flex flex-col gap-1 backdrop-blur shadow-2xl cursor-grab active:cursor-grabbing select-none text-center transition-all z-10 ${
              draggedElement === 'mobileHUD'
                ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                : 'border-slate-800 hover:border-slate-750'
            }`}
            style={{
              left: `${layout.mobileHUD.x}%`,
              top: `${layout.mobileHUD.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Simulation PV / Bouclier */}
            <div className="flex justify-between items-center text-[7px] md:text-[9px] font-mono font-bold text-slate-400">
              <span className="text-emerald-400">❤️ 95%</span>
              <span className="text-blue-400">🛡️ 100%</span>
            </div>
            {/* Simulation d'armes */}
            <div className="grid grid-cols-2 gap-1 pointer-events-none">
              <div className="border border-amber-500/50 bg-amber-500/5 rounded p-1 text-[7px] md:text-[9px] font-mono font-black text-amber-400 flex items-center justify-center h-4 md:h-7">
                🔫 FUSIL
              </div>
              <div className="border border-slate-800 bg-slate-900/60 rounded p-1 text-[7px] md:text-[9px] font-mono text-slate-500 flex items-center justify-center h-4 md:h-7">
                🩹 SOINS (2)
              </div>
            </div>
            {/* Label */}
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[8px] md:text-[10px] text-purple-400 bg-slate-950/90 py-0.5 px-1.5 rounded uppercase font-black tracking-wider whitespace-nowrap">
              Barre d'État & Armes
            </span>
          </div>
        </div>
      </div>

      {/* Informations de repérage et pieds de page */}
      <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <p className="font-bold text-slate-300">📈 Coordonnées de disposition (X% / Y%) :</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-[10px] font-mono text-slate-400 mt-2">
            <div>• Mouvement : <span className="text-amber-500 font-bold">{layout.leftJoystick.x}% / {layout.leftJoystick.y}%</span></div>
            <div>• Viser & Tirer : <span className="text-red-400 font-bold">{layout.rightJoystick.x}% / {layout.rightJoystick.y}%</span></div>
            <div>• Bouton Dash : <span className="text-amber-400 font-bold">{layout.dashButton.x}% / {layout.dashButton.y}%</span></div>
            <div>• Bouton Reload : <span className="text-blue-400 font-bold">{layout.reloadButton.x}% / {layout.reloadButton.y}%</span></div>
            <div>• Barre HUD : <span className="text-purple-400 font-bold">{layout.mobileHUD.x}% / {layout.mobileHUD.y}%</span></div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={onClose}
            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 hover:text-slate-100 text-slate-300 font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs md:text-sm px-6 py-2.5 rounded-xl transition-all uppercase cursor-pointer"
          >
            Sauvegarder la disposition
          </button>
        </div>
      </div>
    </div>
  );
}
