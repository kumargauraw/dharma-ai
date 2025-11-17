import { NextRequest, NextResponse } from 'next/server'

const GITA_STORE = 'fileSearchStores/bhagavadgitacomplete-1jvvdhtbnqja'

export async function POST(request: NextRequest) {
  try {
    const { verseText } = await request.json()

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GOOGLE_API_KEY!
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `Find exact text: "तमुवाच हृषीकेशः प्रहसन्निव भारत"` }]
          }],
          tools: [{
            file_search: {
              file_search_store_names: [GITA_STORE]
            }
          }]
        })
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API Error')
    }

    // Return formatted for debugging
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text found'
    const grounding = data.candidates?.[0]?.groundingMetadata || {}
    
    return NextResponse.json({ 
      foundVerse: true,
      isAuthentic: true,
      analysis: `${resultText}\n\n---DEBUG INFO---\nGrounding Chunks: ${grounding.groundingChunks?.length || 0}\nFull grounding: ${JSON.stringify(grounding, null, 2)}`,
      source: 'Debug Mode'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}