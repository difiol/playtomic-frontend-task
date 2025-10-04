import localforage from 'localforage'
import { TokensData } from './types'

export const authLocalStorage = localforage.createInstance({ name: 'my-app-auth' })

/**
 * @param initialTokens initial tokens passed to AuthProvider as prop.
 * @returns The TokensData if provided directly, or null if it's a Promise or undefined
 * Promises need to be handled asynchronously.
 */
export const getInitialTokensValue = (
  initialTokens: TokensData | Promise<TokensData | null | undefined> | null | undefined,
): TokensData | null => {
  if (initialTokens instanceof Promise || initialTokens === undefined) {
    return null
  }
  return initialTokens
}
