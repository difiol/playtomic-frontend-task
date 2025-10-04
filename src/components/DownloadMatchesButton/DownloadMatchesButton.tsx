import { Button } from '@mui/material'
import { Match } from '@/lib/api-types'
import { convertMatchesToCSV } from '../../utils/csv'

export interface MatchesProps {
  matchesToDownload: Match[]
  filename?: string
  className?: string
}

const defaultFilename = `matches-${new Date().toLocaleDateString().replace('/', '-')}.csv`

export function DownloadMatchesButton({
  matchesToDownload,
  filename = defaultFilename,
  className,
}: MatchesProps) {
  const handleClickDownload = () => {
    // Generate the CSV file
    const file = convertMatchesToCSV(matchesToDownload)

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
    <Button variant="contained" onClick={handleClickDownload} className={className}>
      Download matches
    </Button>
  )
}
