import { ReactNode, useEffect, useState } from 'react'
import { AuthInitializeConfig, TokensData, UserData } from './types'
import { useApiFetcher } from '../api'
import { AuthContext } from './AuthContext'

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
  const isAccessTokenExpired = tokens?.accessExpiresAt
    ? new Date(tokens.accessExpiresAt).getTime() < new Date().getTime()
    : false

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
   * Clears both tokens and current user data
   */
  const clearAuth = () => {
    setTokens(null)
    // Notify consumer tokens were cleared
    onAuthChange?.(null)
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
    setTokens(newTokens)

    // Notify consumer that new tokens are available
    onAuthChange?.(newTokens)
  }

  /**
   * Logs out the current user by clearing the authentication tokens and user data.
   * @returns Promise to respect the signature
   */
  const logout = () => {
    clearAuth()
    return Promise.resolve()
  }

  useEffect(() => {
    // Ensure clearing user if tokens are explicitly set to null
    if (tokens === null) {
      setCurrentUser(null)
      return
    }

    //If tokens is undefined (not yet loaded), do nothing
    if (!tokens) return

    // If access token expired, clear both tokens and user
    // TODO: Refresh token here in the future
    if (isAccessTokenExpired) {
      clearAuth()
      return
    }

    // If tokens are set, load the user data
    loadUser().catch((error: unknown) => {
      console.error('Failed to load user:', error)
    })
  }, [tokens])

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
