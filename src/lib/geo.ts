import { geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import land110m from 'world-atlas/land-110m.json';

export const MAP_W = 960;
export const projection = geoEqualEarth().fitWidth(MAP_W, { type: 'Sphere' });

/** Tracé des terres émergées (Natural Earth 1:110 M, ~50 Ko), calculé une fois au chargement. */
const topo = land110m as unknown as Topology<{ land: GeometryCollection }>;
export const LAND_PATH = geoPath(projection)(feature(topo, topo.objects.land)) ?? '';

const y = (lat: number) => projection([0, lat])![1];
/** Bande affichée : du nord du Canada au sud de l'Afrique et de l'Australie (Antarctique exclu). */
export const MAP_TOP = y(78);
export const MAP_H = y(-48) - MAP_TOP;

export interface MapPoint<T> {
  x: number;
  y: number;
  count: number;
  item: T;
}

export interface MapCluster<T> {
  x: number;
  y: number;
  count: number;
  members: MapPoint<T>[];
}

/**
 * Regroupement glouton : du plus gros au plus petit, chaque point rejoint le premier cluster
 * dont le barycentre (pondéré par le volume) est à moins de `radius`, sinon en ouvre un.
 * Les barycentres se déplaçant, deux clusters peuvent finir trop proches : on les fusionne
 * jusqu'à stabilité. Suffisant pour quelques dizaines de points ; au-delà, passer à un index
 * spatial (supercluster).
 */
export function clusterPoints<T>(points: MapPoint<T>[], radius: number): MapCluster<T>[] {
  let clusters = points.map((p) => ({ x: p.x, y: p.y, count: p.count, members: [p] }));
  for (let n = Infinity; clusters.length < n; ) {
    n = clusters.length;
    clusters = mergePass(clusters, radius);
  }
  for (const c of clusters) c.members.sort((a, b) => b.count - a.count);
  return clusters;
}

function mergePass<T>(input: MapCluster<T>[], radius: number): MapCluster<T>[] {
  const out: MapCluster<T>[] = [];
  for (const p of [...input].sort((a, b) => b.count - a.count)) {
    const c = out.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < radius);
    if (!c) {
      out.push({ ...p, members: [...p.members] });
      continue;
    }
    const w = c.count + p.count;
    // Volumes nuls (pays sélectionné sans exigence en risque) : barycentre au prorata des membres.
    const t = w > 0 ? p.count / w : p.members.length / (c.members.length + p.members.length);
    c.x += (p.x - c.x) * t;
    c.y += (p.y - c.y) * t;
    c.count = w;
    c.members.push(...p.members);
  }
  return out;
}

/** Zoom qui sépare les membres d'un cluster (plus petite distance > rayon de regroupement). */
export function zoomToSplit<T>(members: MapPoint<T>[], radius: number, current: number, max: number): number {
  let min = Infinity;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      min = Math.min(min, Math.hypot(members[i]!.x - members[j]!.x, members[i]!.y - members[j]!.y));
    }
  }
  const split = min > 0 ? (radius * 1.2) / min : max;
  return Math.min(max, Math.max(current * 2, split));
}
