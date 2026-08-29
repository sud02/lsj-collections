// Display helpers. These clean values for presentation only — they do NOT
// mutate stored data, so matching/lookups elsewhere are unaffected.

// Trim, collapse inner whitespace, and capitalise the first letter of each word.
// "  long Haram " -> "Long Haram", " bangles" -> "Bangles"
const cleanName = (value) => {
  if (value === null || value === undefined) return value
  return String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(\p{L})/gu, (ch) => ch.toUpperCase())
}

module.exports = { cleanName }
