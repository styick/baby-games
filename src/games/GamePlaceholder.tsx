import styles from './GamePlaceholder.module.css'

type GamePlaceholderProps = {
  title: string
  icon: string
}

export function GamePlaceholder({ title, icon }: GamePlaceholderProps) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>游戏开发中，敬请期待</p>
    </div>
  )
}
