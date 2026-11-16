import { Suspense } from 'react'
import LoginPage from '@/components/auth/LoginPage'

export const metadata = {
  title: 'Sign In | KnowFlags',
  description: 'Sign in to KnowFlags to save your scores and track your progress.',
}

// LoginPage lit useSearchParams : sur une page rendue statiquement, Next exige
// une frontière Suspense autour.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  )
}
