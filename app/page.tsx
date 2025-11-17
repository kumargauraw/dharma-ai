'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { VerseResult } from '@/components/VerseResult'

export default function Home() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    scripture: string
    queryType: string
    response: string
    error?: string
  } | null>(null)

  const handleSubmit = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
      setResult({ 
        scripture: '',
        queryType: '',
        response: '',
        error: 'Failed to process query' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🕉️</div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
            Dharma AI
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive Knowledge of Hindu Shastras
          </p>
        </div>

        {/* Main Input Card */}
        <Card className="shadow-xl border-orange-100 mb-6">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
            <CardTitle className="text-2xl text-orange-900">
              Ask Anything
            </CardTitle>
            <CardDescription className="text-orange-700">
              Search verses, lookup references, or ask spiritual questions
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Language Support Banner */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🌐</div>
                <div>
                  <p className="font-semibold text-blue-900 mb-1">
                    Ask in Your Language
                  </p>
                  <p className="text-sm text-blue-700">
                    Type in Hindi, English, Sanskrit, Tamil, Telugu, or any language - I respond in the same language!
                  </p>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Examples:
- कर्मण्येवाधिकारस्ते (search for verse)
- 2.47 or Chapter 2, Verse 47 (exact lookup)
- What does Krishna say about dharma? (ask question)"
                className="min-h-[150px] text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && query.trim()) {
                    handleSubmit()
                  }
                }}
              />
              
              <Button 
                onClick={handleSubmit}
                disabled={!query.trim() || isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-lg py-6"
              >
                {isLoading ? 'Processing...' : 'Search / Ask (Ctrl+Enter)'}
              </Button>
            </div>

            {/* Examples */}
            {!result && (
              <Card className="mt-6 bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-blue-900 mb-3">
                    💡 Try these examples:
                  </p>
                  <div className="space-y-2 text-sm">
                    <button
                      onClick={() => setQuery('2.47')}
                      className="block w-full text-left px-3 py-2 rounded hover:bg-blue-100 text-blue-800"
                    >
                      <strong>Exact Reference:</strong> 2.47 or BG 2:47
                    </button>
                    <button
                      onClick={() => setQuery('कर्मण्येवाधिकारस्ते')}
                      className="block w-full text-left px-3 py-2 rounded hover:bg-blue-100 text-blue-800"
                    >
                      <strong>Search Verse:</strong> कर्मण्येवाधिकारस्ते
                    </button>
                    <button
                      onClick={() => setQuery('What does Krishna say about dharma?')}
                      className="block w-full text-left px-3 py-2 rounded hover:bg-blue-100 text-blue-800"
                    >
                      <strong>Ask Question:</strong> What does Krishna say about dharma?
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && !result.error && (
          <VerseResult
            scripture={result.scripture}
            queryType={result.queryType}
            response={result.response}
          />
        )}

        {result && result.error && (
          <Card className="shadow-xl border-red-100">
            <CardContent className="pt-6">
              <div className="text-red-600">{result.error}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}