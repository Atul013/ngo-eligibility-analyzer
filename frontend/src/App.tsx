import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Beneficiaries from './pages/Beneficiaries'
import Predict from './pages/Predict'
import Training from './pages/Training'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="beneficiaries" element={<Beneficiaries />} />
        <Route path="predict" element={<Predict />} />
        <Route path="training" element={<Training />} />
      </Route>
    </Routes>
  )
}
