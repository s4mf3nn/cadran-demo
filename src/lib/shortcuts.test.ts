import { describe, expect, it } from 'vitest';
import { matchShortcut } from './shortcuts';

const press = (init: KeyboardEventInit, target?: Element) => {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  if (target) Object.defineProperty(e, 'target', { value: target });
  return matchShortcut(e)?.id;
};

describe('matchShortcut', () => {
  it('reconnaît les touches simples et les combinaisons ⌘/Ctrl', () => {
    expect(press({ key: '/' })).toBe('search');
    expect(press({ key: '?', shiftKey: true })).toBe('help');
    expect(press({ key: 'j', ctrlKey: true })).toBe('focusAssistant');
    expect(press({ key: 'k' })).toBeUndefined();
  });

  it('ignore les touches simples dans un champ, sauf Échap et ⌘/Ctrl', () => {
    const input = document.createElement('input');
    document.body.append(input);
    expect(press({ key: '/' }, input)).toBeUndefined();
    expect(press({ key: '1' }, input)).toBeUndefined();
    expect(press({ key: 'Escape' }, input)).toBe('escape');
    expect(press({ key: 'j', metaKey: true }, input)).toBe('focusAssistant');
  });

  it('désactive les touches simples sur demande, mais garde Échap et ⌘/Ctrl', () => {
    const off = (init: KeyboardEventInit) => matchShortcut(new KeyboardEvent('keydown', init), { charKeys: false })?.id;
    expect(off({ key: '/' })).toBeUndefined();
    expect(off({ key: '1' })).toBeUndefined();
    expect(off({ key: '?', shiftKey: true })).toBeUndefined();
    expect(off({ key: 'Escape' })).toBe('escape');
    expect(off({ key: 'j', ctrlKey: true })).toBe('focusAssistant');
  });
});
