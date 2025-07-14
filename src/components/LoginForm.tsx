import { useState } from 'react'
import { authManager } from '../lib/supabase'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'

interface LoginFormProps {
  onLoginSuccess?: () => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        await authManager.signIn(email, password)
      } else {
        await authManager.signUp(email, password)
      }
      onLoginSuccess?.()
    } catch (err: any) {
      setError(err.message ?? 'Errore durante l\'autenticazione')
    } finally {
      setLoading(false)
    }
  }

  // iOS keyboard stability
  const handleInputFocus = () => {
    setIsKeyboardOpen(true)
    // Previeni scroll del body
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    
    // Scroll ottimizzato per iOS
    setTimeout(() => {
      if (document.activeElement) {
        document.activeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest' 
        })
      }
    }, 300)
  }

  const handleInputBlur = () => {
    setIsKeyboardOpen(false)
    // Ripristina scroll del body
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
    document.body.style.height = ''
  }

  return (
    <div 
      className={`login-container ${isKeyboardOpen ? 'keyboard-open' : ''}`}
      style={{ 
        backgroundColor: '#2c0405',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: isKeyboardOpen ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: '1rem',
        paddingTop: isKeyboardOpen ? '2rem' : '1rem',
        overflow: 'hidden',
        zIndex: 1000
      }}
    >
      <div 
        className="rounded-lg p-6 w-full max-w-xs shadow-xl"
        style={{ 
          backgroundColor: '#24161d', 
          border: '1px solid #374151',
          transform: isKeyboardOpen ? 'translateY(0)' : 'translateY(0)',
          transition: 'transform 0.3s ease'
        }}
      >



        <div className="text-center mb-6">
          <img 
            src="/logo 1 CCV.png" 
            alt="Logo" 
            className="h-44 w-44 object-contain mx-auto"
          />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-cream mb-1">EMAIL</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-cream rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-sm"
              placeholder="inserisci la tua email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              inputMode="email"
              style={{ 
                fontSize: '16px',
                WebkitAppearance: 'none',
                borderRadius: '6px',
                WebkitBorderRadius: '6px',
                backgroundClip: 'padding-box',
                WebkitBackgroundClip: 'padding-box',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-cream mb-1">PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-cream rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all pr-10 text-sm"
                placeholder="inserisci la password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                style={{ 
                  fontSize: '16px',
                  WebkitAppearance: 'none',
                  borderRadius: '6px',
                  WebkitBorderRadius: '6px',
                  backgroundClip: 'padding-box',
                  WebkitBackgroundClip: 'padding-box',
                  transform: 'translateZ(0)',
                  WebkitTransform: 'translateZ(0)',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cream transition-colors"
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded-md text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-cream font-semibold py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center gap-1 text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {isLogin ? 'ACCEDI' : 'REGISTRATI'}
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(prev => !prev)
                setError(null)
              }}
              className="text-amber-400 hover:text-amber-300 transition-colors text-xs"
            >
              {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}