import { ScriptureConfig } from './types'

export const SCRIPTURES_CONFIG: Record<string, ScriptureConfig> = {
  'bhagavad-gita': {
    name: 'Bhagavad Gita',
    fileSearchStore: 'fileSearchStores/bhagavadgitacomplete-1jvvdhtbnqja',
    dataPath: 'data/bhagavad-gita',
    filePattern: 'bhagavad_gita_chapter_{num}.json',
    referencePatterns: [
      /^(\d+)\.(\d+)$/,
      /^(\d+):(\d+)$/,
      /^bg\s*(\d+)[:\.](\d+)/i,
      /^gita\s*(\d+)[:\.](\d+)/i,
      /chapter\s*(\d+)\s*verse\s*(\d+)/i,
    ],
    chapterKey: 'chapter',
    verseKey: 'verse'
  }
}

export function detectScripture(query: string): string {
  // Check explicit mentions
  if (/\b(gita|bg|bhagavad|krishna|arjuna)\b/i.test(query)) {
    return 'bhagavad-gita'
  }
  
  // Check reference patterns
  for (const [scriptureId, config] of Object.entries(SCRIPTURES_CONFIG)) {
    for (const pattern of config.referencePatterns) {
      if (pattern.test(query)) {
        return scriptureId
      }
    }
  }
  
  return 'bhagavad-gita'
}

export function parseReference(query: string, scriptureId: string): { chapter: number, verse: number } | null {
  const config = SCRIPTURES_CONFIG[scriptureId]
  if (!config) return null
  
  for (const pattern of config.referencePatterns) {
    const match = query.match(pattern)
    if (match) {
      return {
        chapter: parseInt(match[1]),
        verse: parseInt(match[2])
      }
    }
  }
  
  return null
}