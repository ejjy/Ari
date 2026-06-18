/**
 * Ari forest-on-cream design system — single source of truth.
 *
 * Sprint 2 ("Fast Entry + Forest Reskin"). Every color/font/size value lives
 * here. No inline hex anywhere else in the app. Derived 1:1 from the approved
 * prototype `docs/ari-v2-forest.html`.
 *
 * Rules (the anti-slop guardrails):
 *   1. No gradients. Every surface is a flat field.
 *   2. Warm paper, never pure white. Background = cream, cards = card.
 *   3. forest is structural, clay is spending/Add, gold is a sparing accent
 *      (max twice per screen) and NEVER a fill.
 *   4. Hairline borders (line) over drop shadows.
 */

/** Surfaces and text on the cream/paper side of the app. */
export const color = {
  forest: '#1F3D2B', // brand ink, primary actions, hero block, Tomo mark
  forest2: '#2E5239', // lighter forest — "received", secondary action
  forestDeep: '#152A1E', // headings, toast bg
  moss: '#5C7A63', // muted secondary text / links
  cream: '#F4EFE3', // app background (paper)
  cream2: '#EDE7D7', // sunk panels, pressed states, segment track
  card: '#FBF8F0', // raised cards, keypad keys
  line: '#E0D8C4', // hairlines
  lineStrong: '#CFC5AC', // stronger borders
  ink: '#23291F', // primary text on cream
  inkSoft: '#6E6B5C', // secondary text
  inkFaint: '#9A9683', // tertiary / decoration only (low contrast — not for reading text)
  clay: '#B4612F', // spending accent + Add FAB
  clayTint: '#F0E2D2',
  gold: '#A8862C', // single sparing highlight — never a fill
} as const;

/** Text tints that sit ON the dark forest hero surface. */
export const onForest = {
  textBright: '#FBF8F0', // hero amount
  text: '#EFEAD9', // pill values, body on forest
  muted: '#A9BBA8', // hero label
  label: '#8FAA8E', // pill keys / rupee mark
  clay: '#E8A06B', // "money out" value on forest
} as const;

/** Font family names as exported by @expo-google-fonts/{fraunces,inter}. */
export const font = {
  display: 'Fraunces_500Medium',
  displaySemi: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Type scale (pt). Display sizes use `font.display*`, the rest use `font.body*`. */
export const type = {
  heroAmount: 54,
  addAmount: 60,
  screenTitle: 16,
  sectionHead: 17,
  greeting: 27,
  body: 13.5,
  caption: 12,
  eyebrow: 11,
} as const;
