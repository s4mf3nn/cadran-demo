import { describe, expect, it } from 'vitest';
import { clusterPoints, zoomToSplit, type MapPoint } from './geo';

const pt = (item: string, x: number, y: number, count: number): MapPoint<string> => ({ item, x, y, count });

describe('clusterPoints', () => {
  it('regroupe les points proches et laisse les autres seuls', () => {
    const clusters = clusterPoints([pt('a', 0, 0, 10), pt('b', 5, 0, 30), pt('c', 100, 0, 1)], 20);
    expect(clusters).toHaveLength(2);
    expect(clusters[0]!.members.map((m) => m.item)).toEqual(['b', 'a']);
    expect(clusters[0]!.count).toBe(40);
    expect(clusters[1]!.members.map((m) => m.item)).toEqual(['c']);
  });

  it('place le cluster au barycentre pondéré par le volume', () => {
    const [c] = clusterPoints([pt('a', 0, 0, 10), pt('b', 10, 0, 30)], 20);
    expect(c!.x).toBeCloseTo(7.5);
  });

  it('gère les volumes nuls sans NaN', () => {
    const [c] = clusterPoints([pt('a', 0, 0, 0), pt('b', 10, 0, 0)], 20);
    expect(c!.x).toBeCloseTo(5);
  });
});

describe('zoomToSplit', () => {
  it('zoome assez pour que la plus petite distance dépasse le rayon', () => {
    const k = zoomToSplit([pt('a', 0, 0, 1), pt('b', 6, 0, 1)], 30, 1, 8);
    expect(6 * k).toBeGreaterThan(30);
  });

  it('respecte le zoom maximal', () => {
    expect(zoomToSplit([pt('a', 0, 0, 1), pt('b', 0.1, 0, 1)], 30, 1, 8)).toBe(8);
  });
});
