import { STATUS_LABEL, type Requirement } from '../data/types';

const cell = (v: string | number) => {
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Exporte les lignes filtrées en CSV (UTF-8 avec BOM pour Excel) et déclenche le téléchargement. */
export function exportCsv(rows: Requirement[], filename = 'exigences.csv') {
  const head = ['Référence', 'Intitulé', 'Règlement', 'Pays', 'Catégorie', 'Statut', 'Risque', 'Échéance'];
  const lines = [head.join(',')];
  for (const r of rows) {
    lines.push([r.ref, r.title, r.regulation, r.country, r.category, STATUS_LABEL[r.status], r.risk, new Date(r.dueAt).toISOString().slice(0, 10)].map(cell).join(','));
  }
  const url = URL.createObjectURL(new Blob(['﻿', lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
