import { TokensData } from './types'

/**
 *
 * @param name The name of the cookie to retrieve.
 * @returns The value of the cookie; or an empty string if not found.
 */
const getCookie = (name: string): string => {
  return document.cookie.replace(new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*=\\s*([^;]*).*$)|^.*$`), '$1')
}

/**
 *
 * @param tokens The tokens to be saved in cookies.
 * This method will set four cookies: `accessToken`, `refreshToken`, `accessExpiresAt` and `refreshExpiresAt`.
 * All cookies are set with `path=/`, `secure` and `samesite=strict` attributes.
 */
export const saveTokensToCookies = (tokens: TokensData) => {
  document.cookie = `accessToken=${tokens.access}; path=/; secure; samesite=strict`
  document.cookie = `refreshToken=${tokens.refresh}; path=/; secure; samesite=strict`
  document.cookie = `accessExpiresAt=${tokens.accessExpiresAt}; path=/; secure; samesite=strict`
  document.cookie = `refreshExpiresAt=${tokens.refreshExpiresAt}; path=/; secure; samesite=strict`
}

/**
 *
 * @returns The tokens stored in cookies; or null if any of them is missing.
 */
export const getTokensFromCookies = (): TokensData | null => {
  const access = getCookie('accessToken')
  const refresh = getCookie('refreshToken')
  const accessExpiresAt = getCookie('accessExpiresAt')
  const refreshExpiresAt = getCookie('refreshExpiresAt')

  if (access && refresh && accessExpiresAt && refreshExpiresAt) {
    return {
      access,
      refresh,
      accessExpiresAt,
      refreshExpiresAt,
    }
  }

  return null
}
