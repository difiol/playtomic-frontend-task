/**
 * @param expiresAt The token expiration date string
 * @returns True if the token is expired, false otherwise
 */
export const checkIsTokenExpired = (expiresAt: string): boolean => {
  const expirationDate = new Date(expiresAt)
  const now = new Date()
  return expirationDate.getTime() < now.getTime()
}
