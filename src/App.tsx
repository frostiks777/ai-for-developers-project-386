import { Route, Routes } from 'react-router-dom'

import DashboardPage from '@/pages/dashboard-page'
import HomePage from '@/pages/home-page'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  )
}
