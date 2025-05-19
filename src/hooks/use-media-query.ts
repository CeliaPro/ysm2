import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Initial check
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // Create listener
    const listener = () => setMatches(media.matches)

    // Add listener
    media.addEventListener('change', listener)

    // Cleanup
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}
