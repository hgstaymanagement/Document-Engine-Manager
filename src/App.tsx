import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { AirtableProvider, useAirtableData } from './lib/airtableStore'
import ProtectedRoute from './lib/ProtectedRoute'

import Login from './pages/Login'

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
  return (
    <AuthProvider>
      <AirtableProvider>
        <DataGate />
      </AirtableProvider>
    </AuthProvider>
  )
}

/** Blocks rendering the app until the initial Airtable fetch settles. */
function DataGate() {
  const { loading, error, refresh } = useAirtableData()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <p className="text-[13.5px] text-ink/50">Loading barangays, forms, and submissions from Airtable…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-6">
        <div className="max-w-md text-center">
          <h1 className="text-[16px] font-semibold mb-2 text-clay">Couldn't load data from Airtable</h1>
          <p className="text-[13px] text-ink/60 leading-relaxed font-mono break-words">{error}</p>
          <button
            onClick={refresh}
            className="focus-ring mt-5 bg-bottle-600 hover:bg-bottle-700 text-white text-[13px] font-medium px-4 py-2 rounded-sm2"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

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
  )
}
