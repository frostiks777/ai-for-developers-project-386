import { Route, Routes } from 'react-router-dom'

import CancelPage from '@/pages/cancel-page'
import DashboardPage from '@/pages/dashboard-page'
import HomePage from '@/pages/home-page'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/cancel/:token" element={<CancelPage />} />
    </Routes>
  )
}
