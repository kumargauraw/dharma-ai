// Vector Store Configuration
export const VECTOR_STORES = {
  GITA: 'bhagavad-gita-commentaries-fj3lqvggxy23',
  RAMAYANA: '',
  BHAGAVATA_PURANA: '',
} as const

export function getActiveStores(): string[] {
  return Object.values(VECTOR_STORES).filter(id => id !== '')
}

export function isStoreConfigured(storeName: keyof typeof VECTOR_STORES): boolean {
  return VECTOR_STORES[storeName] !== ''
}