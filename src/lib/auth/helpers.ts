import { TokensData } from './types'

/**
 *
 * @param name The name of the cookie to retrieve.
 * @returns The value of the cookie; or an empty string if not found.
 */
const getCookie = (name: string): string => {
  return document.cookie.replace(new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*=\\s*([^;]*).*$)|^.*$`), '$1')
}

const setCookie = (name: string, value: string) => {
  document.cookie = name + '=' + value + '; path=/; secure; samesite=strict'
}

const deleteCookie = (name: string) => {
  document.cookie = name + '=; path=/;'
}

/**
 *
 * @param tokens The tokens to be saved in cookies.
 * This method will set four cookies: `accessToken`, `refreshToken`, `accessExpiresAt` and `refreshExpiresAt`.
 * All cookies are set with `path=/`, `secure` and `samesite=strict` attributes.
 */
export const saveTokensToCookies = (tokens: TokensData) => {
  setCookie('accessToken', tokens.access)
  setCookie('refreshToken', tokens.refresh)
  setCookie('accessExpiresAt', tokens.accessExpiresAt)
  setCookie('refreshExpiresAt', tokens.refreshExpiresAt)
}

export const removeTokensFromCookies = () => {
  deleteCookie('accessToken')
  deleteCookie('refreshToken')
  deleteCookie('accessExpiresAt')
  deleteCookie('refreshExpiresAt')
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
