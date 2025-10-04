import { ReactNode, useEffect, useState } from 'react'
import { AuthInitializeConfig, TokensData, UserData } from './types'
import { useApiFetcher } from '../api'
import { AuthContext } from './AuthContext'
import { getTokensFromCookies, removeTokensFromCookies, saveTokensToCookies } from './helpers'

interface AuthProviderProps extends AuthInitializeConfig {
  children?: ReactNode

  /**
   * @see {@link AuthInitializeConfig.initialTokens}
   */
  initialTokens?: AuthInitializeConfig['initialTokens']

  /**
   * @see {@link AuthInitializeConfig.onAuthChange}
   */
  onAuthChange?: AuthInitializeConfig['onAuthChange']
}

/**
 * Initializes the auth state and exposes it to the component-tree below.
 *
 * This allow separate calls of `useAuth` to communicate among each-other and share
 * a single source of truth.
 */
function AuthProvider(props: AuthProviderProps): JSX.Element {
  const { initialTokens, onAuthChange, children } = props
  const [tokens, setTokens] = useState<TokensData | null | undefined>()
  const [currentUser, setCurrentUser] = useState<UserData | null>()
  const fetcher = useApiFetcher()

  /**
   * Loads the current user data from the API using the current access token.
   * Updates the `currentUser` state with the loaded data.
   * @returns Promise that resolves when the user data is loaded
   * @throws Error if the user data could not be loaded (e.g. invalid token
   */
  const loadUser = async () => {
    if (!tokens?.access || !tokens.accessExpiresAt) {
      setCurrentUser(null)
      return
    }
    const response = await fetcher(
      'GET /v1/users/me',
      {},
      {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      },
    )
    if (!response.ok) throw new Error(response.data.message)

    const { userId, displayName, email } = response.data

    if (!userId || !email || !displayName) throw new Error('Invalid user data received')

    setCurrentUser({
      userId,
      email,
      name: displayName,
    })
  }

  /**
   * @param tokens The new tokens to be set
   * This method will save the tokens to cookies for persistence and update the `tokens` state.
   */
  const updateTokens = (tokens: TokensData) => {
    saveTokensToCookies(tokens)
    setTokens(tokens)
  }

  const clearTokens = () => {
    removeTokensFromCookies()
    setTokens(null)
  }

  /**
   * @param credentials The user credentials to use for login
   * @throws Error if the login fails for any reason
   * @returns Promise that resolves when the login is successful
   */
  const login = async (credentials: { email: string; password: string }) => {
    const response = await fetcher('POST /v3/auth/login', {
      data: credentials,
    })

    if (!response.ok) {
      throw new Error(response.data.message)
    }

    const newTokens = {
      access: response.data.accessToken,
      accessExpiresAt: response.data.accessTokenExpiresAt,
      refresh: response.data.refreshToken,
      refreshExpiresAt: response.data.refreshTokenExpiresAt,
    }
    updateTokens(newTokens)
  }

  const logout = () => {
    clearTokens()
  }

  useEffect(() => {
    if (tokens) {
      // If tokens are set, load the user data
      void loadUser()
    } else {
      // If tokens are note set, try to load them from cookies if available

      const tokensFromCookies = getTokensFromCookies()
      if (tokensFromCookies) {
        setTokens(tokensFromCookies)
      } else {
        // If no tokens are available, ensure currentUser is null
        setCurrentUser(null)
      }
    }
  }, [tokens])

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        tokens,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthProvider, type AuthProviderProps }
