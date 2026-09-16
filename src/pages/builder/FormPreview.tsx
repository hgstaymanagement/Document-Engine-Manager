import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAirtableData } from '../../lib/airtableStore'
import DocumentRender from '../../components/DocumentRender'
import { Button } from '../../components/ui'

export default function FormPreview() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { versionIdx?: number } }
  const { getForm } = useAirtableData()

  // Always read the form live from the shared store, so edits made in the
  // builder are reflected here even without relying on router state.
  const form = getForm(formId ?? '')

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <p className="text-[13.5px] text-ink/50">This form could not be found.</p>
      </div>
    )
  }

  const versionIdx = Math.min(location.state?.versionIdx ?? form.versions.length - 1, form.versions.length - 1)
  const version = form.versions[versionIdx]

  const sampleData = {
    barangay_name: 'Zone I (Pob.)',
    punong_barangay: 'Juan Dela Cruz',
    treasurer: 'Maria Santos',
    secretary: 'Pedro Reyes',
    kagawad: 'Ana Bautista',
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="h-14 border-b border-line bg-white flex items-center px-5 gap-4 sticky top-0 z-10 print:hidden">
        <button onClick={() => navigate(-1)} className="focus-ring text-[13px] text-ink/50 hover:text-ink">
          ← Back to builder
        </button>
        <div className="text-[13.5px] font-medium">{form.name} · Preview (v{version.version})</div>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>
      <div id="print-root" className="py-10">
        <DocumentRender pageLayout={version.page} elements={version.elements} data={sampleData} />
      </div>
    </div>
  )
}
