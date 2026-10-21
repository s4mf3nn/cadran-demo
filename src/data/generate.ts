import { CATEGORIES, COUNTRIES, STATUSES, type Requirement, type Risk } from './types';

/** PRNG déterministe : même seed, même dataset, donc des tests et des démos reproductibles. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REGULATIONS = [
  'REACH', 'RoHS', 'DEEE', 'EN 14764', 'EN 15194', 'EN 12572', 'ISO 20957',
  'CPSIA', 'Prop 65', 'GB 18401', 'UKCA', 'Loi AGEC', 'Étiquetage textile', 'CE Marking',
];
const SUBJECTS = [
  'Substances restreintes', 'Traçabilité des lots', 'Marquage et étiquetage',
  'Essais de résistance', 'Compatibilité électromagnétique', 'Documentation utilisateur',
  'Recyclabilité', 'Sécurité batterie', 'Allergènes', 'Information consommateur',
];

const DAY = 86_400_000;

export function generateRequirements(size: number, seed = 42, now = Date.UTC(2026, 9, 1)): Requirement[] {
  const rand = mulberry32(seed);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)] as T;
  const out: Requirement[] = new Array(size);

  for (let i = 0; i < size; i++) {
    // Distribution volontairement asymétrique : la majorité est conforme.
    const r = rand();
    const status = r < 0.55 ? STATUSES[0] : r < 0.75 ? STATUSES[1] : r < 0.9 ? STATUSES[2] : STATUSES[3];
    const regulation = pick(REGULATIONS);
    out[i] = {
      id: i,
      ref: `REQ-${String(i + 1).padStart(6, '0')}`,
      title: `${pick(SUBJECTS)} (${regulation})`,
      regulation,
      country: pick(COUNTRIES),
      category: pick(CATEGORIES),
      status,
      risk: (1 + Math.floor(rand() * 4)) as Risk,
      dueAt: now + Math.floor(rand() * 400 - 30) * DAY,
    };
  }
  return out;
}
