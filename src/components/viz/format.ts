export const nf = new Intl.NumberFormat('fr-FR');
const pctFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Part (0..1) d'un volume, ou null si le dénominateur est nul (affiché « — », jamais 0 % inventé). */
export const ratio = (part: number, whole: number): number | null => (whole > 0 ? part / whole : null);

/** Pourcentage sans le signe : « 57,4 », « 13 », ou « — ». */
export const pctText = (v: number | null): string => (v == null ? '—' : pctFmt.format(v * 100));

/** Libellé accessible : « En risque 57,4 % » ou « En risque : non calculable ». */
export const pctLabel = (label: string, v: number | null): string =>
  v == null ? `${label} : non calculable` : `${label} ${pctText(v)} %`;

/** Classe de fond du segment n (1..5) de l'échelle vert vers rose. */
export const SEG_BG = ['bg-seg-1', 'bg-seg-2', 'bg-seg-3', 'bg-seg-4', 'bg-seg-5'] as const;
export const SEG_VAR = ['var(--seg-1)', 'var(--seg-2)', 'var(--seg-3)', 'var(--seg-4)', 'var(--seg-5)'] as const;
