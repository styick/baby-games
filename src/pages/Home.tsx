import { GameCard } from '../components/GameCard'
import { GAME_CARD_COLORS } from '../utils/colors'
import styles from './Home.module.css'

const GAMES = [
  { title: '戳泡泡', icon: '🫧', to: '/bubble-pop' },
  { title: '动物乐园', icon: '🦁', to: '/animals' },
  { title: '宝宝钢琴', icon: '🎹', to: '/piano' },
  { title: '开礼物', icon: '🎁', to: '/gifts' },
  { title: '小烟花', icon: '🎆', to: '/fireworks' },
  { title: '涂鸦画板', icon: '🎨', to: '/doodle' },
  { title: '打地鼠', icon: '🐹', to: '/whack' },
  { title: '星星收集', icon: '⭐', to: '/stars' },
] as const

export function Home() {
  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <h1 className={styles.title}>宝宝小游戏</h1>
        <p className={styles.subtitle}>点一点，玩一玩 ✨</p>
      </header>
      <div className={styles.grid}>
        {GAMES.map((game, index) => (
          <GameCard
            key={game.to}
            title={game.title}
            icon={game.icon}
            to={game.to}
            color={GAME_CARD_COLORS[index]}
          />
        ))}
      </div>
    </div>
  )
}
