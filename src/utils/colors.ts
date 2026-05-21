export const COLORS = {
  pink: '#FF6B9D',
  orange: '#FF9F43',
  yellow: '#FFD93D',
  green: '#6BCB77',
  blue: '#4D96FF',
  purple: '#9B59B6',
  red: '#FF6B6B',
  teal: '#4ECDC4',
  coral: '#FF8A80',
  lime: '#A8E063',
} as const

export const GAME_CARD_COLORS = [
  COLORS.pink,
  COLORS.orange,
  COLORS.yellow,
  COLORS.green,
  COLORS.blue,
  COLORS.purple,
  COLORS.red,
  COLORS.teal,
] as const

export const BACKGROUND_GRADIENT =
  'linear-gradient(135deg, #FFE5F1 0%, #FFF9E6 50%, #E8F4FF 100%)'
