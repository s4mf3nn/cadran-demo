/** Logique du faux LLM, partagée entre le dev server Vite et la Vercel Function. */

export function safeJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function buildAnswer(question: string, context: Record<string, unknown>): string {
  const total = Number(context.total ?? 0).toLocaleString('fr-FR');
  const atRisk = Number(context.atRisk ?? 0).toLocaleString('fr-FR');
  const topCountry = String(context.topCountry ?? 'n/a');
  return [
    `Analyse de la sélection courante (${total} exigences).`,
    `\n\n**Constat principal** : ${atRisk} exigences sont non conformes ou en risque élevé, avec une concentration sur ${topCountry}.`,
    `\n\n**Recommandation** : prioriser un plan de validation pour les catégories à fort risque sur ce marché, puis vérifier les échéances à moins de 90 jours.`,
    question ? `\n\nPour répondre à « ${question} » : je m'appuie uniquement sur les filtres actifs, ces chiffres sont donc à recouper avec le référentiel source.` : '',
  ].join('');
}

export function tokenize(answer: string): string[] {
  return answer.match(/\S+\s*/g) ?? [];
}
