/**
 * SERP Analyzer - Intelligent Search Engine Results Page Analysis
 * Analyzes top-ranking pages to extract successful patterns, keywords, and structures
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

export interface SERPResult {
  url: string
  title: string
  description: string
  position: number
}

export interface KeywordAnalysis {
  mainKeywords: string[]
  lsiKeywords: string[]
  entities: string[]
  synonyms: string[]
  relatedTerms: string[]
  keywordDensity: Record<string, number>
}

export interface ContentStructure {
  headings: {
    h1: string[]
    h2: string[]
    h3: string[]
  }
  wordCount: number
  paragraphCount: number
  listCount: number
  imageCount: number
  linkCount: number
}

export interface SEOMetrics {
  titleLength: number
  descriptionLength: number
  hasSchema: boolean
  hasFAQ: boolean
  readabilityScore: number
  keywordInTitle: boolean
  keywordInFirstParagraph: boolean
}

export interface PageAnalysis {
  url: string
  title: string
  description: string
  keywords: string[]
  headings: {
    h1: string[]
    h2: string[]
    h3: string[]
  }
  wordCount: number
  paragraphCount: number
  listCount: number
  imageCount: number
  linkCount: number
  hasSchema: boolean
  hasFAQ: boolean
}

export interface SERPAnalysisResult {
  query: string
  topResults: SERPResult[]
  aggregatedKeywords: KeywordAnalysis
  commonStructures: ContentStructure
  seoPatterns: SEOMetrics
  recommendations: string[]
}

/**
 * Analyze SERP results using SerpAPI
 */
export async function analyzeSERP(query: string, location: string = 'us'): Promise<SERPAnalysisResult> {
  const serpApiKey = process.env.SERPAPI_KEY
  
  if (!serpApiKey) {
    console.warn('SERPAPI_KEY not found, using mock data')
    return generateMockSERPAnalysis(query)
  }

  try {
    // Fetch SERP results from SerpAPI
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: serpApiKey,
        q: query,
        location: location,
        gl: location,
        hl: 'en',
        num: 10,
      },
      timeout: 10000,
    })

    const organicResults = response.data.organic_results || []
    const topResults: SERPResult[] = organicResults.slice(0, 10).map((result: { link?: string; title?: string; snippet?: string }, index: number) => ({
      url: result.link,
      title: result.title,
      description: result.snippet || '',
      position: index + 1,
    }))

    // Analyze top 5 pages in detail
    const detailedAnalyses = await Promise.all(
      topResults.slice(0, 5).map(result => analyzePageContent(result.url))
    )

    // Aggregate insights from all pages
    const aggregatedKeywords = aggregateKeywords(detailedAnalyses, query)
    const commonStructures = analyzeCommonStructures(detailedAnalyses)
    const seoPatterns = extractSEOPatterns(detailedAnalyses)
    const recommendations = generateRecommendations(aggregatedKeywords, commonStructures, seoPatterns)

    return {
      query,
      topResults,
      aggregatedKeywords,
      commonStructures,
      seoPatterns,
      recommendations,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SERP analysis failed'
    console.error('SERP analysis error:', message)
    return generateMockSERPAnalysis(query)
  }
}

/**
 * Analyze individual page content
 */
async function analyzePageContent(url: string): Promise<PageAnalysis | null> {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    const $ = cheerio.load(response.data)

    // Remove script and style tags
    $('script, style, nav, footer, header').remove()

    // Extract content
    const title = $('title').text() || $('h1').first().text()
    const description = $('meta[name="description"]').attr('content') || ''
    const bodyText = $('body').text()

    // Extract headings
    const h1s = $('h1').map((_, el) => $(el).text().trim()).get()
    const h2s = $('h2').map((_, el) => $(el).text().trim()).get()
    const h3s = $('h3').map((_, el) => $(el).text().trim()).get()

    // Extract keywords from content
    const keywords = extractKeywordsFromText(bodyText)

    // Count elements
    const wordCount = bodyText.split(/\s+/).length
    const paragraphCount = $('p').length
    const listCount = $('ul, ol').length
    const imageCount = $('img').length
    const linkCount = $('a').length

    // Check for schema and FAQ
    const hasSchema = $('script[type="application/ld+json"]').length > 0
    const hasFAQ = bodyText.toLowerCase().includes('faq') || 
                   $('[itemtype*="FAQPage"]').length > 0 ||
                   h2s.some(h => h.toLowerCase().includes('faq'))

    return {
      url,
      title,
      description,
      keywords,
      headings: { h1: h1s, h2: h2s, h3: h3s },
      wordCount,
      paragraphCount,
      listCount,
      imageCount,
      linkCount,
      hasSchema,
      hasFAQ,
    } as PageAnalysis
  } catch (error) {
    console.error(`Error analyzing ${url}:`, error)
    return null
  }
}

/**
 * Extract keywords from text using frequency analysis
 */
function extractKeywordsFromText(text: string): string[] {
  // Clean and normalize text
  const cleanText = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')

  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  ])

  // Count word frequencies
  const words = cleanText.split(' ').filter(word => 
    word.length > 3 && !stopWords.has(word)
  )

  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  // Get top keywords by frequency
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word)
}

/**
 * Aggregate keywords from multiple pages
 */
function aggregateKeywords(analyses: Array<PageAnalysis | null>, query: string): KeywordAnalysis {
  const allKeywords: string[] = []
  const keywordFrequency: Record<string, number> = {}

  analyses.forEach(analysis => {
    if (analysis?.keywords) {
      analysis.keywords.forEach((keyword: string) => {
        allKeywords.push(keyword)
        keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1
      })
    }
  })

  // Sort by frequency
  const sortedKeywords = Object.entries(keywordFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)

  // Categorize keywords
  const queryWords = query.toLowerCase().split(' ')
  const mainKeywords = sortedKeywords.filter(kw => 
    queryWords.some(qw => kw.includes(qw) || qw.includes(kw))
  ).slice(0, 10)

  const lsiKeywords = sortedKeywords.filter(kw => 
    !mainKeywords.includes(kw)
  ).slice(0, 20)

  // Extract entities (capitalized words that appear frequently)
  const entities = analyses
    .flatMap(a => a?.title?.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10)

  // Generate synonyms and related terms
  const synonyms = generateSynonyms(mainKeywords)
  const relatedTerms = lsiKeywords.slice(0, 15)

  // Calculate keyword density
  const totalWords = allKeywords.length
  const keywordDensity: Record<string, number> = {}
  mainKeywords.forEach(kw => {
    keywordDensity[kw] = ((keywordFrequency[kw] || 0) / totalWords) * 100
  })

  return {
    mainKeywords,
    lsiKeywords,
    entities,
    synonyms,
    relatedTerms,
    keywordDensity,
  }
}

/**
 * Generate synonyms for keywords
 */
function generateSynonyms(keywords: string[]): string[] {
  // Basic synonym mapping (in production, use a proper thesaurus API)
  const synonymMap: Record<string, string[]> = {
    'best': ['top', 'excellent', 'superior', 'outstanding', 'premier'],
    'guide': ['tutorial', 'handbook', 'manual', 'instructions', 'walkthrough'],
    'review': ['evaluation', 'assessment', 'analysis', 'critique', 'examination'],
    'tips': ['advice', 'suggestions', 'recommendations', 'guidelines', 'hints'],
    'how': ['method', 'process', 'technique', 'approach', 'way'],
    'benefits': ['advantages', 'perks', 'pros', 'positives', 'gains'],
    'features': ['characteristics', 'attributes', 'qualities', 'aspects', 'elements'],
    'comparison': ['versus', 'difference', 'contrast', 'evaluation', 'analysis'],
  }

  const synonyms: string[] = []
  keywords.forEach(keyword => {
    const words = keyword.split(' ')
    words.forEach(word => {
      if (synonymMap[word]) {
        synonyms.push(...synonymMap[word])
      }
    })
  })

  return [...new Set(synonyms)].slice(0, 15)
}

/**
 * Analyze common content structures
 */
function analyzeCommonStructures(analyses: Array<PageAnalysis | null>): ContentStructure {
  const validAnalyses = analyses.filter((a): a is PageAnalysis => a !== null)

  const avgWordCount = Math.round(
    validAnalyses.reduce((sum, a) => sum + (a.wordCount || 0), 0) / validAnalyses.length
  )

  const avgParagraphCount = Math.round(
    validAnalyses.reduce((sum, a) => sum + (a.paragraphCount || 0), 0) / validAnalyses.length
  )

  const avgListCount = Math.round(
    validAnalyses.reduce((sum, a) => sum + (a.listCount || 0), 0) / validAnalyses.length
  )

  const avgImageCount = Math.round(
    validAnalyses.reduce((sum, a) => sum + (a.imageCount || 0), 0) / validAnalyses.length
  )

  const avgLinkCount = Math.round(
    validAnalyses.reduce((sum, a) => sum + (a.linkCount || 0), 0) / validAnalyses.length
  )

  // Aggregate common headings
  const allH1s = validAnalyses.flatMap(a => a.headings?.h1 || [])
  const allH2s = validAnalyses.flatMap(a => a.headings?.h2 || [])
  const allH3s = validAnalyses.flatMap(a => a.headings?.h3 || [])

  return {
    headings: {
      h1: [...new Set(allH1s)].slice(0, 5),
      h2: [...new Set(allH2s)].slice(0, 10),
      h3: [...new Set(allH3s)].slice(0, 15),
    },
    wordCount: avgWordCount,
    paragraphCount: avgParagraphCount,
    listCount: avgListCount,
    imageCount: avgImageCount,
    linkCount: avgLinkCount,
  }
}

/**
 * Extract SEO patterns from top pages
 */
function extractSEOPatterns(analyses: Array<PageAnalysis | null>): SEOMetrics {
  const validAnalyses = analyses.filter((a): a is PageAnalysis => a !== null)

  const avgTitleLength = Math.round(
    validAnalyses.reduce((sum, a) => sum + (a.title?.length || 0), 0) / validAnalyses.length
  )

  const avgDescriptionLength = Math.round(
    validAnalyses.reduce((sum, a) => sum + (a.description?.length || 0), 0) / validAnalyses.length
  )

  const schemaPercentage = (validAnalyses.filter(a => a.hasSchema).length / validAnalyses.length) * 100
  const faqPercentage = (validAnalyses.filter(a => a.hasFAQ).length / validAnalyses.length) * 100

  return {
    titleLength: avgTitleLength,
    descriptionLength: avgDescriptionLength,
    hasSchema: schemaPercentage > 50,
    hasFAQ: faqPercentage > 30,
    readabilityScore: 70, // Placeholder
    keywordInTitle: true,
    keywordInFirstParagraph: true,
  }
}

/**
 * Generate SEO recommendations
 */
function generateRecommendations(
  keywords: KeywordAnalysis,
  structure: ContentStructure,
  seo: SEOMetrics
): string[] {
  const recommendations: string[] = []

  // Word count recommendation
  if (structure.wordCount > 0) {
    recommendations.push(
      `Target ${structure.wordCount} words (average of top-ranking pages)`
    )
  }

  // Keyword recommendations
  if (keywords.mainKeywords.length > 0) {
    recommendations.push(
      `Include these main keywords: ${keywords.mainKeywords.slice(0, 5).join(', ')}`
    )
  }

  if (keywords.lsiKeywords.length > 0) {
    recommendations.push(
      `Use LSI keywords: ${keywords.lsiKeywords.slice(0, 5).join(', ')}`
    )
  }

  // Structure recommendations
  if (structure.listCount > 0) {
    recommendations.push(
      `Include ${structure.listCount} lists (bullet points or numbered)`
    )
  }

  // Title optimization
  if (seo.titleLength > 0) {
    recommendations.push(
      `Optimize title length to ${seo.titleLength} characters`
    )
  }

  // Schema recommendation
  if (seo.hasSchema) {
    recommendations.push(
      'Add structured data (schema markup) for better SERP features'
    )
  }

  // FAQ recommendation
  if (seo.hasFAQ) {
    recommendations.push(
      'Include an FAQ section to target featured snippets'
    )
  }

  // Heading structure
  if (structure.headings.h2.length > 0) {
    recommendations.push(
      `Use ${Math.min(structure.headings.h2.length, 8)} H2 headings for better structure`
    )
  }

  return recommendations
}

/**
 * Generate mock SERP analysis (fallback when API is not available)
 */
function generateMockSERPAnalysis(query: string): SERPAnalysisResult {
  const queryWords = query.toLowerCase().split(' ')
  
  return {
    query,
    topResults: [
      {
        url: 'https://example.com/1',
        title: `Complete Guide to ${query}`,
        description: `Learn everything about ${query} with our comprehensive guide...`,
        position: 1,
      },
      {
        url: 'https://example.com/2',
        title: `${query}: Best Practices and Tips`,
        description: `Discover the best practices for ${query}...`,
        position: 2,
      },
    ],
    aggregatedKeywords: {
      mainKeywords: queryWords,
      lsiKeywords: [...queryWords.map(w => `${w} guide`), ...queryWords.map(w => `best ${w}`)],
      entities: ['Google', 'SEO', 'Content'],
      synonyms: ['tutorial', 'handbook', 'guide', 'tips', 'advice'],
      relatedTerms: ['optimization', 'strategy', 'technique', 'method', 'approach'],
      keywordDensity: Object.fromEntries(queryWords.map(w => [w, 2.5])),
    },
    commonStructures: {
      headings: {
        h1: [`Complete Guide to ${query}`],
        h2: ['Introduction', 'Benefits', 'How It Works', 'Best Practices', 'Conclusion'],
        h3: ['Getting Started', 'Common Mistakes', 'Pro Tips'],
      },
      wordCount: 1500,
      paragraphCount: 15,
      listCount: 3,
      imageCount: 5,
      linkCount: 10,
    },
    seoPatterns: {
      titleLength: 60,
      descriptionLength: 155,
      hasSchema: true,
      hasFAQ: true,
      readabilityScore: 70,
      keywordInTitle: true,
      keywordInFirstParagraph: true,
    },
    recommendations: [
      'Target 1500 words (average of top-ranking pages)',
      `Include main keywords: ${queryWords.join(', ')}`,
      'Use LSI keywords for semantic relevance',
      'Include 3 lists (bullet points or numbered)',
      'Optimize title length to 60 characters',
      'Add structured data (schema markup)',
      'Include an FAQ section',
      'Use 5 H2 headings for better structure',
    ],
  }
}

/**
 * Calculate SEO score for content
 */
export function calculateSEOScore(
  content: string,
  title: string,
  keywords: string[],
  serpAnalysis: SERPAnalysisResult
): {
  score: number
  breakdown: Record<string, { score: number; max: number; feedback: string }>
  suggestions: string[]
} {
  const breakdown: Record<string, { score: number; max: number; feedback: string }> = {}
  const suggestions: string[] = []

  // 1. Title Optimization (15 points)
  const titleScore = evaluateTitle(title, keywords, serpAnalysis.seoPatterns.titleLength)
  breakdown['Title Optimization'] = titleScore
  if (titleScore.score < titleScore.max) {
    suggestions.push(titleScore.feedback)
  }

  // 2. Keyword Usage (20 points)
  const keywordScore = evaluateKeywordUsage(content, keywords)
  breakdown['Keyword Usage'] = keywordScore
  if (keywordScore.score < keywordScore.max) {
    suggestions.push(keywordScore.feedback)
  }

  // 3. Content Length (15 points)
  const lengthScore = evaluateContentLength(content, serpAnalysis.commonStructures.wordCount)
  breakdown['Content Length'] = lengthScore
  if (lengthScore.score < lengthScore.max) {
    suggestions.push(lengthScore.feedback)
  }

  // 4. Heading Structure (15 points)
  const headingScore = evaluateHeadingStructure(content)
  breakdown['Heading Structure'] = headingScore
  if (headingScore.score < headingScore.max) {
    suggestions.push(headingScore.feedback)
  }

  // 5. LSI Keywords (15 points)
  const lsiScore = evaluateLSIKeywords(content, serpAnalysis.aggregatedKeywords.lsiKeywords)
  breakdown['LSI Keywords'] = lsiScore
  if (lsiScore.score < lsiScore.max) {
    suggestions.push(lsiScore.feedback)
  }

  // 6. Readability (10 points)
  const readabilityScore = evaluateReadability(content)
  breakdown['Readability'] = readabilityScore
  if (readabilityScore.score < readabilityScore.max) {
    suggestions.push(readabilityScore.feedback)
  }

  // 7. Content Structure (10 points)
  const structureScore = evaluateContentStructure(content)
  breakdown['Content Structure'] = structureScore
  if (structureScore.score < structureScore.max) {
    suggestions.push(structureScore.feedback)
  }

  // Calculate total score
  const totalScore = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0)
  const maxScore = Object.values(breakdown).reduce((sum, item) => sum + item.max, 0)
  const finalScore = Math.round((totalScore / maxScore) * 100)

  return {
    score: finalScore,
    breakdown,
    suggestions,
  }
}

function evaluateTitle(title: string, keywords: string[], targetLength: number) {
  let score = 0
  const max = 15
  const feedback: string[] = []

  // Check length (5 points)
  if (title.length >= 50 && title.length <= 70) {
    score += 5
  } else if (Math.abs(title.length - targetLength) <= 10) {
    score += 3
    feedback.push(`Title length is ${title.length} chars, aim for ${targetLength} chars`)
  } else {
    feedback.push(`Title should be ${targetLength} characters (currently ${title.length})`)
  }

  // Check keyword presence (10 points)
  const titleLower = title.toLowerCase()
  const keywordsInTitle = keywords.filter(kw => titleLower.includes(kw.toLowerCase()))
  if (keywordsInTitle.length >= 2) {
    score += 10
  } else if (keywordsInTitle.length === 1) {
    score += 5
    feedback.push('Include more target keywords in title')
  } else {
    feedback.push('Add primary keyword to title')
  }

  return {
    score,
    max,
    feedback: feedback.join('. ') || 'Title is well optimized',
  }
}

function evaluateKeywordUsage(content: string, keywords: string[]) {
  let score = 0
  const max = 20
  const feedback: string[] = []

  const contentLower = content.toLowerCase()
  const wordCount = content.split(/\s+/).length

  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    const matches = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length
    const density = (matches / wordCount) * 100

    if (density >= 1.5 && density <= 3) {
      score += 20 / keywords.length
    } else if (density > 0 && density < 1.5) {
      score += (10 / keywords.length)
      feedback.push(`Increase "${keyword}" usage (current density: ${density.toFixed(2)}%)`)
    } else if (density > 3) {
      score += (10 / keywords.length)
      feedback.push(`Reduce "${keyword}" usage to avoid keyword stuffing (current: ${density.toFixed(2)}%)`)
    } else {
      feedback.push(`Add keyword "${keyword}" to content`)
    }
  })

  return {
    score: Math.round(score),
    max,
    feedback: feedback.join('. ') || 'Keyword usage is optimal',
  }
}

function evaluateContentLength(content: string, targetWordCount: number) {
  const wordCount = content.split(/\s+/).length
  const max = 15
  let score = 0

  const difference = Math.abs(wordCount - targetWordCount)
  const percentDiff = (difference / targetWordCount) * 100

  if (percentDiff <= 10) {
    score = 15
  } else if (percentDiff <= 20) {
    score = 10
  } else if (percentDiff <= 30) {
    score = 5
  }

  const feedback = wordCount < targetWordCount * 0.8
    ? `Content is too short. Add ${targetWordCount - wordCount} more words`
    : wordCount > targetWordCount * 1.3
    ? `Content is too long. Consider reducing by ${wordCount - targetWordCount} words`
    : 'Content length is optimal'

  return { score, max, feedback }
}

function evaluateHeadingStructure(content: string) {
  const max = 15
  let score = 0
  const feedback: string[] = []

  const h1Count = (content.match(/^# /gm) || []).length
  const h2Count = (content.match(/^## /gm) || []).length
  const h3Count = (content.match(/^### /gm) || []).length

  // Check H1 (3 points)
  if (h1Count === 1) {
    score += 3
  } else {
    feedback.push(h1Count === 0 ? 'Add one H1 heading' : 'Use only one H1 heading')
  }

  // Check H2 (7 points)
  if (h2Count >= 4 && h2Count <= 8) {
    score += 7
  } else if (h2Count > 0) {
    score += 4
    feedback.push(`Add ${h2Count < 4 ? 'more' : 'fewer'} H2 headings (aim for 4-8)`)
  } else {
    feedback.push('Add H2 headings for better structure')
  }

  // Check H3 (5 points)
  if (h3Count >= 2) {
    score += 5
  } else if (h3Count === 1) {
    score += 3
    feedback.push('Add more H3 subheadings')
  } else {
    feedback.push('Add H3 subheadings for detailed sections')
  }

  return {
    score,
    max,
    feedback: feedback.join('. ') || 'Heading structure is well organized',
  }
}

function evaluateLSIKeywords(content: string, lsiKeywords: string[]) {
  const max = 15
  const contentLower = content.toLowerCase()
  
  const foundLSI = lsiKeywords.filter(kw => 
    contentLower.includes(kw.toLowerCase())
  ).length

  const percentage = (foundLSI / Math.min(lsiKeywords.length, 10)) * 100
  const score = Math.round((percentage / 100) * max)

  const feedback = foundLSI < 5
    ? `Add more LSI keywords: ${lsiKeywords.slice(0, 5).join(', ')}`
    : 'Good use of LSI keywords for semantic relevance'

  return { score, max, feedback }
}

function evaluateReadability(content: string) {
  const max = 10
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = content.split(/\s+/)
  const avgWordsPerSentence = words.length / sentences.length

  let score = 0
  let feedback = ''

  if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) {
    score = 10
    feedback = 'Readability is excellent'
  } else if (avgWordsPerSentence >= 12 && avgWordsPerSentence <= 25) {
    score = 7
    feedback = 'Readability is good'
  } else if (avgWordsPerSentence < 12) {
    score = 5
    feedback = 'Sentences are too short. Vary sentence length'
  } else {
    score = 3
    feedback = 'Sentences are too long. Break into shorter sentences'
  }

  return { score, max, feedback }
}

function evaluateContentStructure(content: string) {
  const max = 10
  let score = 0
  const feedback: string[] = []

  // Check for lists
  const hasLists = /^[-*]\s/gm.test(content) || /^\d+\.\s/gm.test(content)
  if (hasLists) {
    score += 5
  } else {
    feedback.push('Add bullet points or numbered lists')
  }

  // Check for paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0)
  if (paragraphs.length >= 5) {
    score += 5
  } else {
    score += 3
    feedback.push('Add more paragraphs for better readability')
  }

  return {
    score,
    max,
    feedback: feedback.join('. ') || 'Content structure is well organized',
  }
}

