/**
 * SEO Optimization Utilities
 * Advanced SEO features for content optimization
 */

export interface SEOAnalysis {
  keywordDensity: number
  readabilityScore: number
  headingStructure: {
    h1Count: number
    h2Count: number
    h3Count: number
  }
  wordCount: number
  suggestions: string[]
}

/**
 * Analyze content for SEO optimization
 */
export function analyzeSEO(content: string, targetKeywords: string[]): SEOAnalysis {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
  
  // Calculate keyword density
  const keywordMatches = targetKeywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi')
    return count + (content.match(regex) || []).length
  }, 0)
  const keywordDensity = (keywordMatches / wordCount) * 100

  // Analyze heading structure
  const h1Count = (content.match(/^# /gm) || []).length
  const h2Count = (content.match(/^## /gm) || []).length
  const h3Count = (content.match(/^### /gm) || []).length

  // Calculate readability (simplified Flesch reading ease)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  const syllables = estimateSyllables(content)
  const readabilityScore = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)

  // Generate suggestions
  const suggestions: string[] = []
  
  if (keywordDensity < 1) {
    suggestions.push('Consider adding more target keywords (aim for 2-3% density)')
  } else if (keywordDensity > 4) {
    suggestions.push('Keyword density is too high - reduce to avoid keyword stuffing')
  }
  
  if (h1Count === 0) {
    suggestions.push('Add a main H1 heading')
  } else if (h1Count > 1) {
    suggestions.push('Use only one H1 heading')
  }
  
  if (h2Count < 2 && wordCount > 500) {
    suggestions.push('Add more H2 subheadings for better structure')
  }
  
  if (wordCount < 300) {
    suggestions.push('Content is too short - aim for at least 300 words for better SEO')
  }
  
  if (readabilityScore < 30) {
    suggestions.push('Content is difficult to read - consider simplifying sentences')
  }

  return {
    keywordDensity,
    readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
    headingStructure: {
      h1Count,
      h2Count,
      h3Count
    },
    wordCount,
    suggestions
  }
}

/**
 * Estimate syllable count for readability calculation
 */
function estimateSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/)
  return words.reduce((count, word) => {
    word = word.replace(/[^a-z]/g, '')
    if (word.length <= 3) return count + 1
    
    const syllables = word
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
      .replace(/^y/, '')
      .match(/[aeiouy]{1,2}/g)
    
    return count + (syllables ? syllables.length : 1)
  }, 0)
}

/**
 * Generate LSI (Latent Semantic Indexing) keywords
 */
export function generateLSIKeywords(mainKeyword: string): string[] {
  // This is a simplified version. In production, you'd use a more sophisticated API
  const lsiMap: Record<string, string[]> = {
    'wireless headphones': ['bluetooth', 'audio quality', 'battery life', 'noise cancelling', 'comfort', 'sound quality'],
    'laptop': ['computer', 'processor', 'RAM', 'storage', 'display', 'performance'],
    'smartphone': ['mobile phone', 'camera', 'battery', 'screen', 'processor', 'apps'],
    'seo': ['search engine optimization', 'keywords', 'ranking', 'SERP', 'organic traffic', 'backlinks'],
  }

  const keyword = mainKeyword.toLowerCase()
  for (const [key, values] of Object.entries(lsiMap)) {
    if (keyword.includes(key) || key.includes(keyword)) {
      return values
    }
  }

  return []
}

/**
 * Extract meta description from content
 */
export function extractMetaDescription(content: string, maxLength: number = 160): string {
  // Remove markdown formatting
  const plainText = content
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()

  // Get first paragraph or first 160 characters
  const firstParagraph = plainText.split('\n\n')[0]
  
  if (firstParagraph.length <= maxLength) {
    return firstParagraph
  }

  // Truncate to maxLength and add ellipsis
  return firstParagraph.substring(0, maxLength - 3).trim() + '...'
}

/**
 * Generate SEO-friendly URL slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60)
}

/**
 * Calculate content quality score
 */
export function calculateQualityScore(content: string, keywords: string[]): number {
  const seoAnalysis = analyzeSEO(content, keywords)
  let score = 0

  // Word count (0-25 points)
  if (seoAnalysis.wordCount >= 1500) score += 25
  else if (seoAnalysis.wordCount >= 800) score += 20
  else if (seoAnalysis.wordCount >= 500) score += 15
  else if (seoAnalysis.wordCount >= 300) score += 10

  // Keyword density (0-25 points)
  if (seoAnalysis.keywordDensity >= 2 && seoAnalysis.keywordDensity <= 3) score += 25
  else if (seoAnalysis.keywordDensity >= 1 && seoAnalysis.keywordDensity <= 4) score += 20
  else if (seoAnalysis.keywordDensity > 0) score += 10

  // Heading structure (0-25 points)
  if (seoAnalysis.headingStructure.h1Count === 1) score += 10
  if (seoAnalysis.headingStructure.h2Count >= 2) score += 10
  if (seoAnalysis.headingStructure.h3Count >= 1) score += 5

  // Readability (0-25 points)
  if (seoAnalysis.readabilityScore >= 60) score += 25
  else if (seoAnalysis.readabilityScore >= 50) score += 20
  else if (seoAnalysis.readabilityScore >= 40) score += 15
  else if (seoAnalysis.readabilityScore >= 30) score += 10

  return Math.min(100, score)
}


