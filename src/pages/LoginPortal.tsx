import { Link } from 'react-router-dom'
import AppBrand from '../components/AppBrand'
import { Button } from '../components/ui'

export default function LoginPortal() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md text-center">
        <AppBrand size="lg" stacked />

        <div className="mt-10 bg-white border border-line shadow-doc rounded-sm2 p-8">
          <p className="text-[14px] text-ink/70 leading-relaxed mb-6">
            Sign in to manage documents, forms, and submissions for the Municipality of Bulan.
          </p>

          <div className="flex flex-col gap-3">
            <Link to="/login/client" className="block">
              <Button className="w-full justify-center py-2.5">Client sign in</Button>
            </Link>
            <Link to="/login/admin" className="block">
              <Button variant="secondary" className="w-full justify-center py-2.5">
                Admin sign in
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-6 text-[11.5px] text-ink/40">
          Client accounts are created by the administrator. There is no public registration.
        </p>
      </div>
    </div>
  )
}
