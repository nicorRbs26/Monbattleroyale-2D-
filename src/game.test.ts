import { describe, it, expect } from 'vitest';
import { getDistance, generateWeapon, checkCircleCollision, checkPointInRect } from './utils';
import { getXpRequired, calculateMatchXp, isHatLocked } from './progression';

describe('Game Utilities (utils.ts)', () => {
  it('should calculate distance correctly between two points', () => {
    // test: Math.sqrt((3-0)^2 + (4-0)^2) = 5
    expect(getDistance(0, 0, 3, 4)).toBe(5);
    // test: Identical points distance
    expect(getDistance(100, 100, 100, 100)).toBe(0);
  });

  it('should detect circle collisions correctly', () => {
    // # test: Overlapping circles
    expect(checkCircleCollision(0, 0, 10, 5, 0, 10)).toBe(true);
    // # test: Touching circles (boundary case)
    expect(checkCircleCollision(0, 0, 10, 20, 0, 10)).toBe(false); // distance is 20, combined radius is 20
    // # test: Far away circles
    expect(checkCircleCollision(0, 0, 5, 100, 100, 5)).toBe(false);
  });

  it('should detect point in rectangle (AABB) correctly', () => {
    // Rect at (0,0) width 100, height 100 -> bounds [-50, 50]
    // # test: Point inside
    expect(checkPointInRect(0, 0, 0, 0, 100, 100)).toBe(true);
    // # test: Point on edge
    expect(checkPointInRect(50, 0, 0, 0, 100, 100)).toBe(false); // strictly inside
    // # test: Point outside
    expect(checkPointInRect(60, 60, 0, 0, 100, 100)).toBe(false);
  });

  it('should generate a weapon with requested rarity multipliers', () => {
    // test: Generation d'une arme commune (basique)
    const commonWeapon = generateWeapon('pistol', 'common');
    expect(commonWeapon.rarity).toBe('common');
    expect(commonWeapon.damage).toBeGreaterThan(0);

    // test: Multiplicateurs de rareté (Legendary -> 1.5x damage)
    // # test: On vérifie que les dégâts légendaires sont supérieurs aux communs pour le même type
    const commonDmg = generateWeapon('rifle', 'common').damage;
    const legendaryDmg = generateWeapon('rifle', 'legendary').damage;
    
    // damage: Math.round(selected.damage * dmgMult)
    // Common mult: 1.0, Legendary mult: 1.5
    // Note: possible variance because it picks from a pool of candidate weapons,
    // but globally legendary should be higher.
    expect(legendaryDmg).toBeGreaterThanOrEqual(commonDmg * 1.4); 
  });
});

describe('Progression Logic (progression.ts)', () => {
  it('should return correct XP required for levels', () => {
    // test: Niv 1 requirement
    expect(getXpRequired(1)).toBe(1000);
    // test: Niv 2 requirement
    expect(getXpRequired(2)).toBe(1300);
  });

  it('should calculate math match XP correctly', () => {
    // test: Victoire (rank 1) + 5 kills + 100s survie
    // survivalXp: 100 * 1.5 = 150
    // killsXp: 5 * 100 = 500
    // rankXp: 500
    // gamesPlayedXp: 50
    // Total: 1200
    const results = calculateMatchXp(1, 5, 100);
    expect(results.totalEarnedXp).toBe(1200);
    expect(results.rankXp).toBe(500);
  });

  it('should respect level-locked items', () => {
    // test: Crown is locked before level 8
    expect(isHatLocked('crown', 5)).toBe(true);
    expect(isHatLocked('crown', 8)).toBe(false);
    expect(isHatLocked('crown', 10)).toBe(false);

    // test: Non-locked items
    expect(isHatLocked('cap', 1)).toBe(false);
  });
});
