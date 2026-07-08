import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Today from './screens/Today'
import Session from './screens/Session'
import Program from './screens/Program'
import History from './screens/History'
import Maxes from './screens/Maxes'
import Settings from './screens/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Today />} />
        <Route path="/session" element={<Session />} />
        <Route path="/program" element={<Program />} />
        <Route path="/history" element={<History />} />
        <Route path="/maxes" element={<Maxes />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
