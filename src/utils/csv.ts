import { Match } from '@/lib/api-types'

export const convertMatchesToCSV = (matches: Match[]): Blob => {
  // Create headers
  const headers = ['Sport', 'Date', 'Start Time', 'End Time', 'Players']

  // Convert matches to CSV rows
  const csvRows = matches.map(match => {
    const startDate = new Date(match.startDate)
    const endDate = new Date(match.endDate)
    // Get all player names from all teams and join them into a single string
    const playerNames = match.teams
      .flatMap(team => team.players)
      .map(player => player.displayName)
      .join(', ')

    return [
      match.sport,
      startDate.toLocaleDateString(),
      startDate.toLocaleTimeString(),
      endDate.toLocaleTimeString(),
      `"${playerNames}"`, // Wrap in quotes to handle commas between names
    ]
  })

  // Combine headers and rows
  const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n')

  return new Blob([csvContent], { type: 'text/csv' })
}
