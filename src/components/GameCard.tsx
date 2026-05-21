import { Link } from 'react-router-dom'
import styles from './GameCard.module.css'

type GameCardProps = {
  title: string
  icon: string
  to: string
  color: string
}

export function GameCard({ title, icon, to, color }: GameCardProps) {
  return (
    <Link to={to} className={styles.card} style={{ backgroundColor: color }}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.title}>{title}</span>
    </Link>
  )
}
