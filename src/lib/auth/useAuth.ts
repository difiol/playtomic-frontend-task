import { useContext } from 'react'
import { Auth } from './types'
import { AuthContext } from './AuthContext'

/**
 * Returns the current auth state. See {@link Auth} for more information on
 * what is included there.
 *
 * @throws {TypeError} if called from a component not descendant of AuthProvider
 */
function useAuth(): Auth {
  const { currentUser, tokens, login, logout } = useContext(AuthContext)

  return {
    tokens,
    currentUser,
    login,
    logout,
  }
}

export { useAuth }
