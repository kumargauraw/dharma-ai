import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { SCRIPTURES_CONFIG, detectScripture, parseReference } from '@/lib/scriptures-config'
import { ScriptureConfig, VerseReference, ApiResponse } from '@/lib/types'


export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    const scriptureId = detectScripture(query)
    const config = SCRIPTURES_CONFIG[scriptureId]
    const classification = classifyQuery(query, scriptureId)
    
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

function classifyQuery(query: string, scriptureId: string) {
  const ref = parseReference(query, scriptureId)
  if (ref) {
    return {
      type: 'EXACT_REFERENCE' as const,
      data: ref
    }
  }

  const questionWords = ['what', 'why', 'how', 'when', 'who', 'should', 'can', 'could', 'क्या', 'कैसे', 'क्यों']
  const isQuestion = questionWords.some(word => query.toLowerCase().startsWith(word)) || query.includes('?')

  if (isQuestion) {
    return { type: 'QUESTION' as const }
  }

  return { type: 'VERSE_SEARCH' as const }
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
    const identifyPrompt = `Find this verse and respond ONLY: "Chapter X, Verse Y"

Search: "${query}"`

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
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    const match = resultText.match(/Chapter (\d+),?\s*Verse (\d+)/i)
    
    if (!match) {
      return { response: 'Verse not found' }
    }

    const [, chapter, verse] = match
    return await handleExactReference({ 
      chapter: parseInt(chapter), 
      verse: parseInt(verse) 
    }, config)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { response: `Error: ${errorMessage}` }
  }
}

async function handleQuestion(query: string, config: ScriptureConfig): Promise<ApiResponse> {
  try {
    const prompt = `🌐 Respond in the SAME language as the question.

Question: "${query}"

Provide guidance from ${config.name}. Include relevant verse references.`

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