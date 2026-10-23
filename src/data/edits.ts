import {
  CATEGORIES, COUNTRIES, REGULATIONS, RISKS, STATUSES,
  type Requirement,
} from './types';

/** Champs modifiables d'une exigence (la référence et l'id restent ceux du référentiel). */
export const EDITABLE_KEYS = ['title', 'regulation', 'country', 'category', 'status', 'risk', 'dueAt'] as const;
export type Edit = Partial<Pick<Requirement, (typeof EDITABLE_KEYS)[number]>>;
/** Modifications par id d'exigence : une couche posée par-dessus le référentiel généré. */
export type Edits = Record<number, Edit>;

/**
 * Exigence modifiée. L'intitulé du référentiel porte sa réglementation (« Sujet (REACH) ») :
 * changer la réglementation sans toucher à l'intitulé garde les deux cohérents.
 */
export function applyEdit(r: Requirement, edit: Edit | undefined): Requirement {
  if (!edit) return r;
  const next = { ...r, ...edit };
  if (edit.regulation && edit.title === undefined) {
    const suffix = ` (${r.regulation})`;
    if (r.title.endsWith(suffix)) next.title = `${r.title.slice(0, -suffix.length)} (${edit.regulation})`;
  }
  return next;
}

const oneOf = <T,>(list: readonly T[], v: unknown): v is T => list.includes(v as T);

/** Relit une modification venue du stockage : champs et valeurs inconnus sont écartés. */
export function sanitizeEdit(raw: unknown): Edit | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const out: Edit = {};
  if (typeof e.title === 'string' && e.title.trim()) out.title = e.title;
  if (oneOf(REGULATIONS, e.regulation)) out.regulation = e.regulation;
  if (oneOf(COUNTRIES, e.country)) out.country = e.country;
  if (oneOf(CATEGORIES, e.category)) out.category = e.category;
  if (oneOf(STATUSES, e.status)) out.status = e.status;
  if (oneOf(RISKS, e.risk)) out.risk = e.risk;
  if (typeof e.dueAt === 'number' && Number.isFinite(e.dueAt)) out.dueAt = e.dueAt;
  return Object.keys(out).length ? out : null;
}

export function sanitizeEdits(raw: unknown): Edits {
  const out: Edits = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, value] of Object.entries(raw)) {
    const n = Number(id);
    const edit = sanitizeEdit(value);
    if (Number.isInteger(n) && n >= 0 && edit) out[n] = edit;
  }
  return out;
}
