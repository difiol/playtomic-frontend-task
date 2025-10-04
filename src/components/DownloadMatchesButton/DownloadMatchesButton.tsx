import { Button } from '@mui/material'
import { convertMatchesToCSV } from '../../utils/csv'
import { useApiFetcher } from '@/lib/api'

export interface MatchesProps {
  filename?: string
  className?: string
}

const defaultFilename = `matches-${new Date().toLocaleDateString().replace('/', '-')}.csv`

export function DownloadMatchesButton({ filename = defaultFilename, className }: MatchesProps) {
  const fetcher = useApiFetcher()

  /**
   * Fetches all matches from the API (by making multiple paginated requests if necessary).
   * TODO: Create an endpoint in the API to fetch all matches at once to optimize this method.
   * @returns All matches available from the API
   */
  const fetchAllMatches = async () => {
    const pageSize = 10 // Max page size supported by the API
    const firstRes = await fetcher('GET /v1/matches', { page: 0, size: pageSize })
    if (!firstRes.ok) {
      throw new Error(firstRes.data.message)
    }
    const totalCount = firstRes.headers.get('total')
    const total = totalCount ? Number.parseInt(totalCount) : firstRes.data.length
    const totalPages = Math.ceil(total / pageSize)

    // Fetch remaining pages in parallel (from page 1)
    let allMatches = firstRes.data
    const fetchPromises = []
    for (let page = 1; page < totalPages; page++) {
      fetchPromises.push(fetcher('GET /v1/matches', { page, size: pageSize }))
    }
    const results = await Promise.all(fetchPromises)

    // Combine results
    for (const res of results) {
      if (!res.ok) {
        throw new Error(res.data.message)
      }
      allMatches = [...allMatches, ...res.data]
    }
    return allMatches
  }

  /**
   * Triggers the download of all matches as a CSV file
   */
  const downloadMatches = async () => {
    const allMatches = await fetchAllMatches()
    if (allMatches.length === 0) {
      console.error('No matches available for download')
      return
    }

    // Generate the CSV file
    const file = convertMatchesToCSV(allMatches)

    // Create a temporary link to trigger the download
    const link = document.createElement('a')
    const url = URL.createObjectURL(file)

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()

    // Clean up after the download
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="contained"
      onClick={() => {
        downloadMatches().catch((error: unknown) => {
          console.error(error)
        })
      }}
      className={className}>
      Download matches
    </Button>
  )
}
