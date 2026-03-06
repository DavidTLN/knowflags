import LoginForm from '@/components/auth/LoginForm'
import AuthButtons from '@/components/auth/AuthButtons'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your KnowFlags account'
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main style={{backgroundColor: '#F4F1E6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'}}>
        <div style={{backgroundColor: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)'}}>

          {/* Logo */}
          <div style={{textAlign: 'center', marginBottom: '32px'}}>
            <h1 style={{fontSize: '28px', fontWeight: '900', color: '#0B1F3B', margin: 0}}>knowflags</h1>
            <p style={{color: '#64748b', fontSize: '15px', marginTop: '8px'}}>Sign in to your account</p>
          </div>

          {/* Boutons OAuth */}
          <AuthButtons />

          {/* Separateur */}
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0'}}>
            <div style={{flex: 1, height: '1px', backgroundColor: '#e2e8f0'}} />
            <span style={{color: '#94a3b8', fontSize: '13px'}}>or continue with email</span>
            <div style={{flex: 1, height: '1px', backgroundColor: '#e2e8f0'}} />
          </div>

          {/* Formulaire email/password */}
          <LoginForm />

        </div>
      </main>
    </>
  )
}