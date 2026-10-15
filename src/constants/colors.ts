// Our app's own color palette — "Muted Modern", approved 2026-10-10.
// This is separate from constants/theme.ts, which belongs to the Expo
// template's own demo screens and light/dark mode system. Our screens
// always use one fixed look, so we pull colors from here instead.

export const colors = {
  background: '#F4F3F0',      // main screen background
  surface: '#FFFFFF',         // cards, inputs, headers
  textPrimary: '#22252B',     // headings, body text
  textSecondary: '#65656B',   // captions, metadata, placeholders
  primary: '#2E3A59',         // primary buttons, active tab/chip, links, icons
  accent: '#C99A3B',          // star ratings, weather icon, secondary accents
  tagText: '#8A6A1F',         // category tag text
  tagBackground: '#F1E8D2',   // category tag background
  destructive: '#B3261E',     // delete-review icon only
  border: '#E2E1DC',          // card borders, dividers
  placeholderFill: '#E8E7E2', // image placeholder background
  placeholderBorder: '#C7C5BC', // image placeholder dashed border
  inactiveTab: '#B7B6B0',     // unselected bottom-tab items
} as const;