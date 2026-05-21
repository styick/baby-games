import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AnimalSounds } from './games/AnimalSounds'
import { BabyPiano } from './games/BabyPiano'
import { BubblePop } from './games/BubblePop'
import { ColorDoodle } from './games/ColorDoodle'
import { Fireworks } from './games/Fireworks'
import { GiftBox } from './games/GiftBox'
import { StarCollect } from './games/StarCollect'
import { WhackAMole } from './games/WhackAMole'
import { Home } from './pages/Home'

function App() {
  return (
    <BrowserRouter basename="/baby-games">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="bubble-pop" element={<BubblePop />} />
          <Route path="animals" element={<AnimalSounds />} />
          <Route path="piano" element={<BabyPiano />} />
          <Route path="gifts" element={<GiftBox />} />
          <Route path="fireworks" element={<Fireworks />} />
          <Route path="doodle" element={<ColorDoodle />} />
          <Route path="whack" element={<WhackAMole />} />
          <Route path="stars" element={<StarCollect />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
