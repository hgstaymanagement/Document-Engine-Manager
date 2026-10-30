import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { DataProvider } from './lib/dataStore'
import { isSupabaseConfigured } from './lib/supabaseClient'
import ProtectedRoute from './lib/ProtectedRoute'

import LoginPortal from './pages/LoginPortal'
import AdminLogin from './pages/AdminLogin'
import ClientLogin from './pages/ClientLogin'

import AdminLayout from './layouts/AdminLayout'
import Overview from './pages/admin/Overview'
import Clients from './pages/admin/Clients'
import Barangays from './pages/admin/Barangays'
import Forms from './pages/admin/Forms'
import Submissions from './pages/admin/Submissions'
import FormBuilder from './pages/builder/FormBuilder'
import FormPreview from './pages/builder/FormPreview'

import ClientLayout from './layouts/ClientLayout'
import Dashboard from './pages/client/Dashboard'
import NewForm from './pages/client/NewForm'
import MySubmissions from './pages/client/MySubmissions'

import SubmissionEditor from './pages/SubmissionEditor'

export default function App() {
  if (!isSupabaseConfigured()) {
    return <ConfigMissingScreen />
  }

  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPortal />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/login/client" element={<ClientLogin />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="clients" element={<Clients />} />
              <Route path="barangays" element={<Barangays />} />
              <Route path="forms" element={<Forms />} />
              <Route path="submissions" element={<Submissions />} />
            </Route>

            <Route
              path="/admin/forms/:formId"
              element={
                <ProtectedRoute role="admin">
                  <FormBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms/:formId/preview"
              element={
                <ProtectedRoute role="admin">
                  <FormPreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/submissions/:submissionId"
              element={
                <ProtectedRoute role="admin">
                  <SubmissionEditor mode="admin" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/client"
              element={
                <ProtectedRoute role="client">
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="new" element={<NewForm />} />
              <Route path="submissions" element={<MySubmissions />} />
            </Route>

            <Route
              path="/client/fill/:formId/:barangayId"
              element={
                <ProtectedRoute role="client">
                  <SubmissionEditor mode="client" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/fill/:formId/:barangayId/:submissionId"
              element={
                <ProtectedRoute role="client">
                  <SubmissionEditor mode="client" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  )
}

function ConfigMissingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6">
      <div className="max-w-md text-center">
        <h1 className="text-[16px] font-semibold mb-2">Supabase not configured</h1>
        <p className="text-[13.5px] text-ink/60 leading-relaxed">
          Copy <code className="font-mono bg-paper px-1 rounded-sm2">.env.example</code> to{' '}
          <code className="font-mono bg-paper px-1 rounded-sm2">.env</code> and add{' '}
          <code className="font-mono bg-paper px-1 rounded-sm2">VITE_SUPABASE_URL</code>,{' '}
          <code className="font-mono bg-paper px-1 rounded-sm2">VITE_SUPABASE_ANON_KEY</code>, and{' '}
          <code className="font-mono bg-paper px-1 rounded-sm2">VITE_ADMIN_EMAIL</code>, then restart the
          dev server.
        </p>
      </div>
    </div>
  )
}
