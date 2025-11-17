export interface ScriptureConfig {
  name: string
  fileSearchStore: string
  dataPath: string
  filePattern: string
  referencePatterns: RegExp[]
  chapterKey: string
  verseKey: string
}

export interface VerseReference {
  chapter: number
  verse: number
}

export interface ApiResponse {
  response: string
  error?: string
}