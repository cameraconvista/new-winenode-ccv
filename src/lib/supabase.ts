import { createClient, type User, type Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        storage: localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      db: { schema: 'public' }
    })
  : null

export const isSupabaseAvailable = !!supabase

export type AuthUser = User | null
export type AuthSession = Session | null

export class AuthManager {
  private static instance: AuthManager
  private currentUser: AuthUser = null
  private currentSession: AuthSession = null
  private listeners: ((user: AuthUser) => void)[] = []

  private constructor() {
    this.initializeAuth()
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) AuthManager.instance = new AuthManager()
    return AuthManager.instance
  }

  private async initializeAuth() {
    if (!supabase) return

    try {
      // 🔄 Recupera la sessione corrente con gestione migliorata
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.warn('⚠️ Errore nel recupero sessione:', error.message)
        // Tenta il refresh automatico
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.warn('⚠️ Refresh fallito:', refreshError.message)
          this.currentSession = null
          this.currentUser = null
        } else {
          console.log('✅ Sessione recuperata tramite refresh')
          this.currentSession = refreshedSession
          this.currentUser = refreshedSession?.user || null
        }
      } else {
        this.currentSession = session
        this.currentUser = session?.user || null
        if (session) {
          console.log('✅ Sessione esistente trovata:', session.user?.email)
        }
      }

      // 📡 Listener migliorato per cambio stato autenticazione
      let authTimeout: NodeJS.Timeout | null = null
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Auth state change:', event, session ? 'con sessione' : 'senza sessione')
        
        if (authTimeout) clearTimeout(authTimeout)
        authTimeout = setTimeout(() => {
          this.currentSession = session
          this.currentUser = session?.user || null
          
          // 💾 Verifica persistenza in localStorage
          if (session && event === 'SIGNED_IN') {
            console.log('💾 Sessione salvata in localStorage')
          } else if (event === 'SIGNED_OUT') {
            console.log('🗑️ Sessione rimossa da localStorage')
          }
          
          this.notifyListeners()
        }, 100)
      })

      this.notifyListeners()
    } catch (error) {
      console.error('❌ Errore inizializzazione auth:', error)
      this.currentSession = null
      this.currentUser = null
      this.notifyListeners()
    }
  }

  getCurrentUser(): AuthUser {
    return this.currentUser
  }

  getCurrentSession(): AuthSession {
    return this.currentSession
  }

  isAuthenticated(): boolean {
    return !!this.currentUser
  }

  getUserId(): string | null {
    return this.currentUser?.id || null
  }

  async validateSession(): Promise<boolean> {
    if (!supabase) return false

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        console.warn('⚠️ Sessione non valida, tentativo refresh automatico...')
        
        // 🔄 Tenta refresh della sessione
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.warn('❌ Refresh sessione fallito:', refreshError.message)
          this.currentSession = null
          this.currentUser = null
          return false
        }

        if (refreshedSession) {
          console.log('✅ Sessione rinnovata con successo')
          this.currentSession = refreshedSession
          this.currentUser = refreshedSession.user || null
          this.notifyListeners()
          return true
        }
        
        return false
      }

      // 🕒 Verifica scadenza token
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || 0
      
      if (expiresAt - now < 300) { // Se scade tra meno di 5 minuti
        console.log('⏰ Token in scadenza, refresh preventivo...')
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (!refreshError && refreshedSession) {
          console.log('✅ Token rinnovato preventivamente')
          this.currentSession = refreshedSession
          this.currentUser = refreshedSession.user || null
          this.notifyListeners()
        }
      }

      return true
    } catch (error) {
      console.error('❌ Errore validazione sessione:', error)
      return false
    }
  }

  onAuthStateChange(callback: (user: AuthUser) => void) {
    this.listeners.push(callback)
    callback(this.currentUser)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser))
  }

  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase non configurato')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async signOut() {
    if (!supabase) throw new Error('Supabase non configurato')

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase non configurato')

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }
}

export const authManager = AuthManager.getInstance()

// Client secondario rimosso per evitare istanze multiple
