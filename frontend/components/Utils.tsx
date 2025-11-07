



	
import { useState, useEffect } from 'react';

    




export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Set initial value
    setMatches(mql.matches);

    // Listen for changes
    mql.addEventListener('change', onChange);
    return () => {
      mql.removeEventListener('change', onChange);
    };
  }, [query]);

  return matches;
}






	// Function to format date as 'Mon DD, YYYY' (e.g., 'Oct 07, 2025')
	export function formatDateMMDDYYYY(date: string) {
		const d = new Date(date);
		const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
		return d.toLocaleDateString('en-US', options);
	}


	// Helper to capitalize first letter safely
	export function capitalize (s?: string) {
		if (!s || typeof s !== 'string') return '';
		return s.charAt(0).toUpperCase() + s.slice(1);
	};
