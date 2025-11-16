



	
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





		// Helper: removes http:// or https:// and trailing slashes
		export function removeHttpTags (url?: string | null) {
		if (!url) return '';
		return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
		};






    		// Function to parse text and remove HTMLTags
		export function removeHTMLTags (description: string) {
			return description.replace(/<\/?a[^>]*>/g, "");
		};
	


    
		/**
 * Splits a long description into smaller readable chunks.
 * - Keeps paragraphs roughly 3–5 sentences long.
 * - Preserves bullet lists and line breaks.
 */
export function splitDescriptionIntoChunks (text: string, maxSentencesPerChunk = 4): string[] {
  if (!text) return [];

  // Remove any HTML tags and trim
  let clean = removeHTMLTags(text).trim();

  // Handle bullet points and manual line breaks first
  if (clean.includes("•") || clean.includes("\n")) {
    // Split into segments on bullets or line breaks
    const lines = clean
      .split(/\n|•/g)
      .map(line => line.trim())
      .filter(Boolean);
    return lines;
  }

  // Otherwise, split into sentences
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  const chunks: string[] = [];

  for (let i = 0; i < sentences.length; i += maxSentencesPerChunk) {
    const chunk = sentences.slice(i, i + maxSentencesPerChunk).join(" ").trim();
    if (chunk) chunks.push(chunk);
  }

  return chunks;
};

