import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ScriptureConfig, VerseReference, ApiResponse } from '@/lib/types'


export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    const scriptureId = detectScripture(query)
    const config = SCRIPTURES_CONFIG[scriptureId]
    const classification = await classifyQuery(query) // ADD await here

    
    let response
    switch (classification.type) {
      case 'EXACT_REFERENCE':
        if (classification.data) {
          response = await handleExactReference(classification.data, config)
        } else {
          response = { response: 'Invalid reference format' }
        }
        break
      case 'VERSE_SEARCH':
        response = await handleVerseSearch(query, config)
        break
      case 'QUESTION':
        response = await handleQuestion(query, config)
        break
      default:
        response = { error: 'Could not understand query type' }
    }

    return NextResponse.json({
      scripture: config.name,
      queryType: classification.type,
      ...response
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

async function classifyQuery(query: string) {
  // Quick checks for obvious exact references first (to save API calls)
  const simpleRefPattern = /^(\d+)[\.:]\s*(\d+)$/
  const match = query.trim().match(simpleRefPattern)
  if (match) {
    return {
      type: 'EXACT_REFERENCE' as const,
      data: {
        chapter: parseInt(match[1]),
        verse: parseInt(match[2])
      }
    }
  }

  // Use LLM for everything else
  const classificationPrompt = `Classify this query into ONE of these categories:

Query: "${query}"

Categories:
1. EXACT_REFERENCE - User wants a specific verse by number (like "Chapter 2 Verse 47", "BG 2:47", "gita 2.47")
2. VERSE_SEARCH - User is searching for a verse by its content (Sanskrit text, partial words, quotes)
3. QUESTION - User is asking a spiritual/philosophical question

Respond with ONLY the category name and if EXACT_REFERENCE, also provide chapter and verse numbers.

Format:
- EXACT_REFERENCE: chapter=2, verse=47
- VERSE_SEARCH
- QUESTION`

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GOOGLE_API_KEY!
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: classificationPrompt }] }]
        })
      }
    )

    const data = await response.json()
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    console.log('LLM Classification result:', result)

    // Parse the result
    if (result.includes('EXACT_REFERENCE')) {
      const chapterMatch = result.match(/chapter\s*=\s*(\d+)/i)
      const verseMatch = result.match(/verse\s*=\s*(\d+)/i)
      
      if (chapterMatch && verseMatch) {
        return {
          type: 'EXACT_REFERENCE' as const,
          data: {
            chapter: parseInt(chapterMatch[1]),
            verse: parseInt(verseMatch[1])
          }
        }
      }
    }

    if (result.includes('QUESTION')) {
      return { type: 'QUESTION' as const }
    }

    // Default to VERSE_SEARCH
    return { type: 'VERSE_SEARCH' as const }

  } catch (error) {
    console.error('Classification error:', error)
    // Fallback to simple heuristics
    if (query.includes('?') || /^(what|why|how|when|who)/i.test(query)) {
      return { type: 'QUESTION' as const }
    }
    return { type: 'VERSE_SEARCH' as const }
  }
}

async function handleExactReference(data: VerseReference, config: ScriptureConfig): Promise<ApiResponse> {
  try {
    const fileName = config.filePattern.replace('{num}', data.chapter.toString())
    const filePath = path.join(process.cwd(), config.dataPath, fileName)
    
    if (!fs.existsSync(filePath)) {
      return { response: `File not found: ${fileName}` }
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const chapterData = JSON.parse(fileContent) as { BhagavadGitaChapter: Array<{
      verse: number
      text: string
      commentaries: Record<string, string>
      translations: Record<string, string>
    }> }
    
    const verses = chapterData.BhagavadGitaChapter
    
    if (!verses || !Array.isArray(verses)) {
      return { response: `Invalid JSON structure in ${fileName}` }
    }
    
    const verse = verses.find((v) => v.verse === data.verse)
    
    if (!verse) {
      return { response: `Verse ${data.chapter}.${data.verse} not found` }
    }

    let response = `**${config.name}, Chapter ${data.chapter}, Verse ${data.verse}**\n\n`
    response += `**Sanskrit:**\n${verse.text}\n\n`
    
    if (verse.translations) {
      response += `**Translations:**\n\n`
      for (const [author, translation] of Object.entries(verse.translations)) {
        response += `**${author}:**\n${translation}\n\n`
      }
    }
    
    if (verse.commentaries) {
      response += `**Commentaries:**\n\n`
      for (const [author, commentary] of Object.entries(verse.commentaries)) {
        response += `**${author}:**\n${commentary}\n\n`
      }
    }

    return { response }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in handleExactReference:', error)
    return { response: `Error: ${errorMessage}` }
  }
}

async function handleVerseSearch(query: string, config: ScriptureConfig): Promise<ApiResponse> {
  try {
    console.log('=== handleVerseSearch called ===')
    console.log('Query:', query)
    console.log('Using store:', config.fileSearchStore)
    
    const identifyPrompt = `Find this verse and respond ONLY: "Chapter X, Verse Y"

Search: "${query}"`

    console.log('Calling File Search API...')
    
    const apiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GOOGLE_API_KEY!
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: identifyPrompt }] }],
          tools: [{ file_search: { file_search_store_names: [config.fileSearchStore] } }]
        })
      }
    )

    const data = await apiResponse.json()
    console.log('File Search API response:', JSON.stringify(data, null, 2))
    
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log('Result text:', resultText)
    
    const match = resultText.match(/Chapter (\d+),?\s*Verse (\d+)/i)
    console.log('Regex match result:', match)
    
    if (!match) {
      return { response: 'Verse not found' }
    }

    const [, chapter, verse] = match
    console.log('Found:', { chapter, verse })
    
    return await handleExactReference({ 
      chapter: parseInt(chapter), 
      verse: parseInt(verse) 
    }, config)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('handleVerseSearch error:', errorMessage)
    return { response: `Error: ${errorMessage}` }
  }
}

async function handleQuestion(query: string, config: ScriptureConfig): Promise<ApiResponse> {
  try {
    const prompt = `You are a knowledgeable guide on Hindu scriptures.

🌐 LANGUAGE: Respond in the SAME language as the question.

Question: "${query}"

Provide a well-structured answer from ${config.name} following this format:

## Overview
[Brief answer to the question]

## Key Verses
[List relevant verses with:]
- **Verse Reference:** [Chapter X, Verse Y]
- **Sanskrit:** [verse in Devanagari]
- **Translation:** [English translation]
- **Explanation:** [What this verse teaches]

## Deeper Understanding
[Connect the verses and provide deeper insights]

Use markdown formatting with:
- ## for main headings
- ### for subheadings
- **bold** for emphasis
- > for important quotes
- Clear paragraph breaks

Include specific verse references and their meanings.`

    const apiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GOOGLE_API_KEY!
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ file_search: { file_search_store_names: [config.fileSearchStore] } }]
        })
      }
    )

    const data = await apiResponse.json()
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'

    return { response: resultText }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { response: `Error: ${errorMessage}` }
  }
}