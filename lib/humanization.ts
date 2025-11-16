/**
 * Content Humanization Utilities
 * Advanced techniques to make AI-generated content pass AI detection tests
 */

export interface HumanizationScore {
  score: number // 0-100
  factors: {
    sentenceVariety: number
    vocabularyDiversity: number
    naturalFlow: number
    personalTouch: number
  }
  improvements: string[]
}

/**
 * Analyze how human-like the content is
 */
export function analyzeHumanization(content: string): HumanizationScore {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = content.split(/\s+/).filter(w => w.length > 0)
  
  // Analyze sentence variety
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length)
  const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length
  const sentenceLengthVariance = calculateVariance(sentenceLengths)
  const sentenceVariety = Math.min(100, (sentenceLengthVariance / avgSentenceLength) * 100)

  // Analyze vocabulary diversity (unique words / total words)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  const vocabularyDiversity = (uniqueWords.size / words.length) * 100

  // Analyze natural flow (contractions, transitional phrases, etc.)
  const contractions = (content.match(/\b(don't|won't|can't|it's|you're|they're|we're|I'm|he's|she's|that's|there's|here's|what's|who's|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|didn't|couldn't|shouldn't|wouldn't|mightn't|mustn't)\b/gi) || []).length
  const transitionalPhrases = (content.match(/\b(however|moreover|furthermore|additionally|meanwhile|therefore|consequently|in fact|for example|in other words|as a result|on the other hand|in contrast|similarly|likewise|nevertheless|nonetheless)\b/gi) || []).length
  const personalPronouns = (content.match(/\b(I|we|you|my|our|your)\b/gi) || []).length
  
  const naturalFlowIndicators = contractions + transitionalPhrases + personalPronouns
  const naturalFlow = Math.min(100, (naturalFlowIndicators / sentences.length) * 100)

  // Analyze personal touch (questions, emotions, opinions)
  const questions = (content.match(/\?/g) || []).length
  const emotionalWords = (content.match(/\b(amazing|wonderful|terrible|fantastic|awful|great|excellent|poor|love|hate|enjoy|dislike|exciting|boring|interesting|frustrating|delightful|disappointing)\b/gi) || []).length
  const opinionPhrases = (content.match(/\b(I think|I believe|in my opinion|I feel|personally|it seems|arguably|reportedly)\b/gi) || []).length
  
  const personalTouchIndicators = questions + emotionalWords + opinionPhrases
  const personalTouch = Math.min(100, (personalTouchIndicators / sentences.length) * 100)

  // Calculate overall score
  const score = (sentenceVariety * 0.25 + vocabularyDiversity * 0.25 + naturalFlow * 0.25 + personalTouch * 0.25)

  // Generate improvement suggestions
  const improvements: string[] = []
  
  if (sentenceVariety < 30) {
    improvements.push('Vary sentence lengths more - mix short, medium, and long sentences')
  }
  
  if (vocabularyDiversity < 40) {
    improvements.push('Use more diverse vocabulary - avoid repetitive word choices')
  }
  
  if (naturalFlow < 30) {
    improvements.push('Add more contractions, transitional phrases, and personal pronouns')
  }
  
  if (personalTouch < 20) {
    improvements.push('Include more questions, emotional language, and personal perspectives')
  }
  
  if (contractions < sentences.length * 0.1) {
    improvements.push('Use more contractions (don\'t, it\'s, you\'re) for natural tone')
  }
  
  if (questions === 0 && sentences.length > 10) {
    improvements.push('Add rhetorical or engaging questions to connect with readers')
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    factors: {
      sentenceVariety: Math.round(sentenceVariety),
      vocabularyDiversity: Math.round(vocabularyDiversity),
      naturalFlow: Math.round(naturalFlow),
      personalTouch: Math.round(personalTouch)
    },
    improvements
  }
}

/**
 * Calculate variance for an array of numbers
 */
function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length
}

/**
 * Detect potentially AI-generated patterns
 */
export function detectAIPatterns(content: string): string[] {
  const patterns: string[] = []
  
  // Check for overly perfect structure
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length)
  const variance = calculateVariance(sentenceLengths)
  
  if (variance < 10) {
    patterns.push('Sentences are too uniform in length')
  }

  // Check for lack of contractions
  const words = content.split(/\s+/).length
  const contractions = (content.match(/n't|'s|'re|'ve|'ll|'d/g) || []).length
  const contractionRatio = contractions / words * 100
  
  if (contractionRatio < 0.5 && words > 100) {
    patterns.push('Too few contractions - content feels formal/robotic')
  }

  // Check for repetitive sentence starters
  const starters = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase())
  const starterFrequency = new Map<string, number>()
  starters.forEach(starter => {
    if (starter) {
      starterFrequency.set(starter, (starterFrequency.get(starter) || 0) + 1)
    }
  })
  
  const maxStarterFreq = Math.max(...Array.from(starterFrequency.values()))
  if (maxStarterFreq > sentences.length * 0.3) {
    patterns.push('Too many sentences start with the same word')
  }

  // Check for lack of personal touch
  const personalPronouns = (content.match(/\b(I|we|you|my|our|your)\b/gi) || []).length
  if (personalPronouns < sentences.length * 0.1 && sentences.length > 10) {
    patterns.push('Lacks personal pronouns and conversational tone')
  }

  // Check for overly formal language
  const formalWords = (content.match(/\b(furthermore|moreover|henceforth|notwithstanding|heretofore|whereby|wherein|herein)\b/gi) || []).length
  if (formalWords > sentences.length * 0.15) {
    patterns.push('Language is overly formal - use more conversational terms')
  }

  return patterns
}

/**
 * Suggest humanization improvements
 */
export function suggestHumanization(content: string): string[] {
  const suggestions: string[] = []
  const analysis = analyzeHumanization(content)
  const aiPatterns = detectAIPatterns(content)

  // Combine analysis improvements and AI pattern detections
  suggestions.push(...analysis.improvements)
  suggestions.push(...aiPatterns)

  // Add specific suggestions based on content
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const hasQuestions = content.includes('?')
  const hasExclamations = content.includes('!')
  
  if (!hasQuestions && sentences.length > 5) {
    suggestions.push('Add rhetorical questions to engage readers')
  }
  
  if (!hasExclamations && sentences.length > 10) {
    suggestions.push('Consider adding emphasis with exclamation points where appropriate')
  }

  // Remove duplicates
  return Array.from(new Set(suggestions))
}

/**
 * Get humanization tips
 */
export function getHumanizationTips(): string[] {
  return [
    'Mix sentence lengths: combine short, punchy sentences with longer, flowing ones',
    'Use contractions naturally: don\'t, it\'s, you\'re, we\'ll',
    'Add personal pronouns: I think, we believe, you\'ll find',
    'Include rhetorical questions to engage readers',
    'Use transitional phrases: however, moreover, in fact, for example',
    'Add emotional language and personal perspectives',
    'Vary vocabulary - use synonyms instead of repeating words',
    'Include anecdotes or examples where appropriate',
    'Use active voice predominantly but mix with passive occasionally',
    'Add subtle imperfections - not all paragraphs need to be the same length'
  ]
}


