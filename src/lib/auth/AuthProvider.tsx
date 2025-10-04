import { ReactNode, useEffect, useState } from 'react'
import { AuthInitializeConfig, TokensData, UserData } from './types'
import { useApiFetcher } from '../api'
import { AuthContext } from './AuthContext'
import { authLocalStorage, getInitialTokensValue } from './helpers'

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
  const [tokens, setTokens] = useState<TokensData | null | undefined>(getInitialTokensValue(initialTokens))
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
   * This method will save the tokens locally for persistence and update the `tokens` state.
   */
  const updateTokens = async (tokens: TokensData) => {
    await authLocalStorage.setItem('tokens', tokens)
    setTokens(tokens)
  }

  /**
   * Loads the tokens from local storage and updates the `tokens` state.
   * If no tokens are found, resets the state.
   * @returns Promise that resolves when the tokens are loaded
   */
  const loadTokensFromLocalStorage = async () => {
    const tokensFromLocalStorage = await authLocalStorage.getItem('tokens')
    if (
      tokensFromLocalStorage &&
      typeof tokensFromLocalStorage === 'object' &&
      'access' in tokensFromLocalStorage
    ) {
      setTokens(tokensFromLocalStorage as TokensData)
    } else {
      setTokens(null)
      setCurrentUser(null)
    }
  }

  /**
   * Clears the tokens from local storage and updates the `tokens` state.
   * @returns Promise that resolves when the tokens are cleared
   */
  const clearTokens = async () => {
    await authLocalStorage.removeItem('tokens')
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
    await updateTokens(newTokens)
  }

  const logout = async () => {
    await clearTokens()
  }

  useEffect(() => {
    if (tokens) {
      // If tokens are set, load the user data
      void loadUser()
    } else {
      // If tokens are note set, try to load them from the local storage if available
      void loadTokensFromLocalStorage()
    }

    // Notify auth state change
    onAuthChange?.(tokens ?? null)
  }, [tokens, onAuthChange])

  // Handle Promise-based initialTokens
  useEffect(() => {
    if (initialTokens instanceof Promise) {
      initialTokens
        .then(resolvedTokens => {
          setTokens(resolvedTokens ?? null)
        })
        .catch((error: unknown) => {
          console.error('Failed to resolve initial tokens:', error)
          setTokens(null)
        })
    }
  }, [initialTokens])

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
