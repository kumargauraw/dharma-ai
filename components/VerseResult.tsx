'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface VerseResultProps {
  scripture: string
  queryType: string
  response: string
}

interface Translation {
  author: string
  text: string
}

interface Commentary {
  author: string
  text: string
}

interface ParsedSections {
  verseInfo?: string
  sanskrit?: string
  transliteration?: string
  wordMeanings?: string
  translations: Translation[]
  commentaries: Commentary[]
  general?: string
}

export function VerseResult({ scripture, queryType, response }: VerseResultProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sanskrit', 'translations']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // Parse response into sections
  const sections = parseResponse(response)

  return (
    <Card className="shadow-xl border-green-100">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
        <CardTitle className="text-xl text-green-900 flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <div>
            <div>{scripture}</div>
            <div className="text-sm font-normal text-green-700">{queryType}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Verse Info */}
        {sections.verseInfo && (
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-900">{sections.verseInfo}</div>
          </div>
        )}

        {/* Sanskrit Text */}
        {sections.sanskrit && (
          <CollapsibleSection
            title="Sanskrit"
            icon="🕉️"
            isExpanded={expandedSections.has('sanskrit')}
            onToggle={() => toggleSection('sanskrit')}
          >
            <div className="text-xl leading-relaxed text-gray-800 bg-amber-50 p-6 rounded-lg border border-amber-200">
              {formatSanskrit(sections.sanskrit)}
            </div>
          </CollapsibleSection>
        )}

        {/* Transliteration */}
        {sections.transliteration && (
          <CollapsibleSection
            title="Transliteration"
            icon="🔤"
            isExpanded={expandedSections.has('transliteration')}
            onToggle={() => toggleSection('transliteration')}
          >
            <div className="text-lg italic text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
              {sections.transliteration}
            </div>
          </CollapsibleSection>
        )}

        {/* Word Meanings */}
        {sections.wordMeanings && (
          <CollapsibleSection
            title="Word Meanings"
            icon="📖"
            isExpanded={expandedSections.has('meanings')}
            onToggle={() => toggleSection('meanings')}
          >
            <div className="prose max-w-none">
              <ReactMarkdown>{sections.wordMeanings}</ReactMarkdown>
            </div>
          </CollapsibleSection>
        )}

        {/* Translations */}
        {sections.translations && sections.translations.length > 0 && (
          <CollapsibleSection
            title={`Translations (${sections.translations.length})`}
            icon="🌐"
            isExpanded={expandedSections.has('translations')}
            onToggle={() => toggleSection('translations')}
          >
            <div className="space-y-4">
              {sections.translations.map((trans, idx) => (
                <div key={idx} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
                  <div className="font-semibold text-green-900 mb-2">{trans.author}</div>
                  <div className="text-gray-700">{trans.text}</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Commentaries */}
        {sections.commentaries && sections.commentaries.length > 0 && (
          <CollapsibleSection
            title={`Commentaries (${sections.commentaries.length})`}
            icon="💭"
            isExpanded={expandedSections.has('commentaries')}
            onToggle={() => toggleSection('commentaries')}
          >
            <div className="space-y-6">
              {sections.commentaries.map((comm, idx) => (
                <CommentaryCard key={idx} author={comm.author} text={comm.text} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* General Response (for questions) */}
        {sections.general && (
          <div className="prose max-w-none">
            <ReactMarkdown>{sections.general}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CollapsibleSection({ 
  title, 
  icon, 
  isExpanded, 
  onToggle, 
  children 
}: { 
  title: string
  icon: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isExpanded && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

function CommentaryCard({ author, text }: { author: string, text: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const previewLength = 200
  const needsTruncation = text.length > previewLength

  return (
    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
      <div className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
        <span className="text-lg">📜</span>
        {author}
      </div>
      <div className="text-gray-700">
        {needsTruncation && !isExpanded ? (
          <>
            {text.substring(0, previewLength)}...
            <button
              onClick={() => setIsExpanded(true)}
              className="ml-2 text-purple-700 hover:text-purple-900 font-medium"
            >
              Read more
            </button>
          </>
        ) : (
          <>
            {text}
            {needsTruncation && (
              <button
                onClick={() => setIsExpanded(false)}
                className="ml-2 text-purple-700 hover:text-purple-900 font-medium"
              >
                Show less
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function parseResponse(response: string): ParsedSections {
  const sections: ParsedSections = {
    translations: [],
    commentaries: []
  }

  // Extract verse info (Chapter X, Verse Y)
  const verseMatch = response.match(/\*\*([^*]+Chapter \d+, Verse \d+)\*\*/)
  if (verseMatch) {
    sections.verseInfo = verseMatch[1]
  }

  // Extract Sanskrit
  const sanskritMatch = response.match(/\*\*Sanskrit:\*\*\n([^*]+?)(?=\n\n\*\*|$)/s)
  if (sanskritMatch) {
    sections.sanskrit = sanskritMatch[1].trim()
  }

  // Extract Transliteration
  const translitMatch = response.match(/\*\*Transliteration:\*\*\n([^*]+?)(?=\n\n\*\*|$)/s)
  if (translitMatch) {
    sections.transliteration = translitMatch[1].trim()
  }

  // Extract Word Meanings
  const meaningsMatch = response.match(/\*\*Word Meanings:\*\*\n([^*]+?)(?=\n\n\*\*|$)/s)
  if (meaningsMatch) {
    sections.wordMeanings = meaningsMatch[1].trim()
  }

  // Extract Translations
  const translationsMatch = response.match(/\*\*Translations:\*\*\n\n([\s\S]+?)(?=\n\n\*\*Commentaries:|$)/)
  if (translationsMatch) {
    const transText = translationsMatch[1]
    const transEntries = transText.split(/\n\n(?=\*\*)/)
    transEntries.forEach(entry => {
      const match = entry.match(/\*\*([^*]+):\*\*\n(.+)/s)
      if (match) {
        sections.translations.push({
          author: match[1].trim(),
          text: match[2].trim()
        })
      }
    })
  }

  // Extract Commentaries
  const commentariesMatch = response.match(/\*\*Commentaries:\*\*\n\n([\s\S]+)$/)
  if (commentariesMatch) {
    const commText = commentariesMatch[1]
    const commEntries = commText.split(/\n\n(?=\*\*)/)
    commEntries.forEach(entry => {
      const match = entry.match(/\*\*([^*]+):\*\*\n(.+)/s)
      if (match) {
        sections.commentaries.push({
          author: match[1].trim(),
          text: match[2].trim()
        })
      }
    })
  }

  // If no structured content, treat as general response
  if (!sections.verseInfo && !sections.sanskrit) {
    sections.general = response
  }

  return sections
}

function formatSanskrit(text: string) {
  // Remove verse number at the end (।।3.37।। etc.)
  const cleanText = text.replace(/[\d.]+।।\s*$/, '').trim()
  
  // Split by \n\n to get separate parts
  const parts = cleanText.split(/\n\n/).filter(p => p.trim())
  
  // Check if first part is speaker (contains उवाच)
  const hasSpeaker = parts.length > 0 && parts[0].includes('उवाच')
  
  const speaker = hasSpeaker ? parts[0].trim() : null
  const verseLines = parts.slice(hasSpeaker ? 1 : 0)
  
  return (
    <div className="space-y-4">
      {speaker && (
        <div className="text-center font-semibold text-orange-800 italic text-lg">
          {speaker}:
        </div>
      )}
      <div className="text-center space-y-2 text-2xl leading-relaxed">
        {verseLines.map((line, idx) => (
          <div key={idx}>
            {line.trim()}
          </div>
        ))}
      </div>
    </div>
  )
}