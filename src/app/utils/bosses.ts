export type WeeklyBossTemplate = {
  id: string;
  name: string;
  tagline: string;
  maxHP: number;
  rewardText: string;
};

/**
 * Weekly Boss roster.
 *
 * Intentionally small and static:
 * - feels curated like a weekly boss encounter
 * - easy to maintain
 * - no server required
 */
export const WEEKLY_BOSSES: WeeklyBossTemplate[] = [
  {
    id: 'igris',
    name: 'Igris, Commander of Shadows',
    tagline: 'A calm blade that never misses.',
    maxHP: 500,
    rewardText: 'Balanced fight, perfect for building rhythm.',
  },
  {
    id: 'cerberus',
    name: 'Cerberus of the Gate',
    tagline: 'Three heads, one stubborn will.',
    maxHP: 350,
    rewardText: 'Short week? This is your quick clear.',
  },
  {
    id: 'baran',
    name: 'Baran, Demon King',
    tagline: 'Heavy fight for heavy XP days.',
    maxHP: 800,
    rewardText: 'Defeat this and your week was not an accident.',
  },
];

export function getWeeklyBossTemplate(bossId: string): WeeklyBossTemplate | undefined {
  return WEEKLY_BOSSES.find((b) => b.id === bossId);
}
