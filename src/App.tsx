import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { authManager, isSupabaseAvailable } from './lib/supabase'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'

import LoginForm from './components/LoginForm'
import SaldoCommand from './components/SaldoCommand'
import { Session } from '@supabase/supabase-js'
import ManualWineInsertPage from './pages/ManualWineInsertPage'
import FornitoriPage from './pages/FornitoriPage'
import ArchiviPage from './pages/ArchiviPage'
import ImportaPage from './pages/ImportaPage'
import AccountPage from './pages/AccountPage'
import PreferenzePage from './pages/PreferenzePage'
import FoglioExcelPage from './pages/FoglioExcelPage'
import OrdiniSospesiPage from './pages/OrdiniSospesiPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [showSaldo, setShowSaldo] = useState(false)
  const [bypassAuth, setBypassAuth] = useState(false)

  // Global saldo command listener
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 's' && e.ctrlKey) {
        e.preventDefault()
        setShowSaldo(!showSaldo)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showSaldo])

  useEffect(() => {
    // App startup

    if (!isSupabaseAvailable) {
      console.log('⚠️ Supabase non disponibile, modalità fallback')
      setFallbackMode(true)
      setIsLoading(false)
      return
    }

    // 🎯 Gestione migliorata del cambio stato autenticazione con persistenza
    const unsubscribe = authManager.onAuthStateChange((user) => {
      if (user && process.env.NODE_ENV === 'development') {
        console.log('Auth state: Logged in as', user.email)
      }
      
      setIsAuthenticated(!!user)
      
      // Crea sessione completa dall'utente autenticato
      if (user) {
        const currentSession = authManager.getCurrentSession()
        setSession(currentSession)
      } else {
        setSession(null)
      }
      
      // 🚀 Rimuovi loading solo dopo aver processato lo stato dell'utente
      setIsLoading(false)
    })

    // 🔄 Valida immediatamente la sessione esistente
    authManager.validateSession().then((isValid) => {
      if (!isValid) {
        console.log('📝 Nessuna sessione valida trovata, richiesto nuovo login')
      }
    })

    return unsubscribe
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cream">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        <Route path="/" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <HomePage /> : <LoginForm />
        } />
        <Route path="/settings" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <SettingsPage /> : <LoginForm />
        } />
        <Route path="/settings/fornitori" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <FornitoriPage /> : <LoginForm />
        } />
        <Route path="/settings/archivi" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <ArchiviPage /> : <LoginForm />
        } />
        <Route path="/settings/archivi/importa" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <ImportaPage /> : <LoginForm />
        } />
        <Route path="/settings/archivi/manuale" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <ManualWineInsertPage /> : <LoginForm />
        } />

        <Route path="/settings/preferenze" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <PreferenzePage /> : <LoginForm />
        } />
        <Route path="/settings/account" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <AccountPage bypassAuth={bypassAuth} setBypassAuth={setBypassAuth} /> : <LoginForm />
        } />

        <Route path="/manual-wine-insert" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <ManualWineInsertPage /> : <LoginForm />
        } />
        <Route path="/saldo" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <SaldoCommand /> : <LoginForm />
        } />
        <Route path="/foglio-excel" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <FoglioExcelPage /> : <LoginForm />
        } />
        <Route path="/ordini/sospesi" element={
          (isAuthenticated || fallbackMode || bypassAuth) ? <OrdiniSospesiPage /> : <LoginForm />
        } />
      </Routes>

      {/* Global Saldo Overlay */}
      {showSaldo && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSaldo(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <SaldoCommand />
            <div className="text-center mt-4">
              <button 
                onClick={() => setShowSaldo(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                Chiudi (o premi Ctrl+S)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App