/** Logique du faux LLM, partagée entre le dev server Vite et la Vercel Function. */

export function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

type CountryCount = { country: string; count: number };

/** Phrase sur les deux pays les plus exposés, avec leur part des exigences en risque. */
function concentration(atRisk: number, top: CountryCount[], fallback: string): string {
  if (top.length < 2 || atRisk <= 0) return `, avec une concentration sur ${fallback}`;
  const share = Math.round(((top[0]!.count + top[1]!.count) / atRisk) * 100);
  return `. Deux pays en portent à eux seuls **${share} %** : ${top[0]!.country} et ${top[1]!.country}`;
}

export function buildAnswer(question: string, context: Record<string, unknown>): string {
  const total = Number(context.total ?? 0).toLocaleString('fr-FR');
  const atRiskN = Number(context.atRisk ?? 0);
  const atRisk = atRiskN.toLocaleString('fr-FR');
  const topCountry = String(context.topCountry ?? 'n/a');
  const top = (Array.isArray(context.topCountries) ? context.topCountries : [])
    .filter((c): c is CountryCount => typeof c?.country === 'string' && Number.isFinite(c?.count));
  return [
    `Analyse de la sélection courante (${total} exigences).`,
    `\n\n**Constat principal** : **${atRisk}** exigences sont non conformes ou en risque élevé${concentration(atRiskN, top, topCountry)}.`,
    `\n\n**Recommandation** : prioriser un plan de validation pour les catégories à fort risque sur ce marché, puis vérifier les échéances à moins de 90 jours.`,
    question ? `\n\nPour répondre à « ${question} » : je m'appuie uniquement sur les filtres actifs, ces chiffres sont donc à recouper avec le référentiel source.` : '',
  ].join('');
}

export function tokenize(answer: string): string[] {
  return answer.match(/\S+\s*/g) ?? [];
}
