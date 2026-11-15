const BRAND = {
  navy: "#172B3A",
  green: "#173B35",
  gold: "#D5A642",
  cream: "#FAF9F6",
  white: "#FFFFFF",
  charcoal: "#292D32",
  muted: "#747C80",
  border: "#E8E6DF",
};

export default {
  light: {
    text: BRAND.charcoal,
    background: BRAND.cream,
    tint: BRAND.green,
    tabIconDefault: BRAND.muted,
    tabIconSelected: BRAND.gold,
    card: BRAND.white,
    border: BRAND.border,
    primary: BRAND.green,
    secondary: BRAND.navy,
    accent: BRAND.gold,
  },
  dark: {
    text: BRAND.cream,
    background: BRAND.navy,
    tint: BRAND.gold,
    tabIconDefault: BRAND.muted,
    tabIconSelected: BRAND.gold,
    card: "#213746",
    border: "#344957",
    primary: BRAND.green,
    secondary: BRAND.navy,
    accent: BRAND.gold,
  },
};
