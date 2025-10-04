import { createContext } from 'react'
import { TokensData, UserData } from './types'

interface AuthContextType {
  currentUser?: UserData | null
  tokens?: TokensData | null
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: undefined,
  tokens: undefined,
  login: () => Promise.resolve(),
  logout: () => {
    return
  },
})
