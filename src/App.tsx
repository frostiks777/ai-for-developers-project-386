import { Route, Routes, useParams } from 'react-router-dom'

import { TimeFormatProvider } from '@/components/time-format-provider'
import { host } from '@/config/host'
import CancelPage from '@/pages/cancel-page'
import ConfirmedPage from '@/pages/confirmed-page'
import DashboardPage from '@/pages/dashboard-page'
import EventsPage from '@/pages/events-page'
import HomePage from '@/pages/home-page'
import LandingPage from '@/pages/landing-page'
import NotFoundPage from '@/pages/not-found-page'
import ReschedulePage from '@/pages/reschedule-page'

function BookingRoute() {
  const { slug } = useParams<{ slug: string }>()

  return slug === host.slug ? <HomePage /> : <NotFoundPage />
}

export function App() {
  return (
    <TimeFormatProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/book/:slug" element={<BookingRoute />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/booking/:uuid/confirmed" element={<ConfirmedPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/admin/availability" element={<DashboardPage initialSection="availability" />} />
      <Route path="/admin/event-types" element={<DashboardPage initialSection="event-types" />} />
      <Route path="/admin/bookings" element={<DashboardPage initialSection="bookings" />} />
      <Route path="/admin/blocks" element={<DashboardPage initialSection="blocks" />} />
      <Route path="/cancel/:token" element={<CancelPage />} />
      <Route path="/reschedule/:token" element={<ReschedulePage />} />
      <Route path="/booking/:uuid/cancel" element={<CancelPage />} />
      <Route path="/booking/:uuid/reschedule" element={<ReschedulePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </TimeFormatProvider>
  )
}
