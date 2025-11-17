/**
 * Content Generation Agents
 * Multi-agent system for creating high-quality, human-like content
 */

import OpenAI from 'openai'
import { getJson } from 'serpapi'
import { calculateTokenBudget, countWords } from '@/lib/content-constraints'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SERPResult {
  position: number
  title: string
  link: string
  snippet: string
  wordCount?: number
  headers?: string[]
}

export interface SERPAnalysisData {
  keyword: string
  topResults: SERPResult[]
  peopleAlsoAsk: string[]
  relatedSearches: string[]
  avgWordCount: number
  topKeywords: string[]
  contentGaps: string[]
  recommendations: string[]
}

export interface CompetitorHeader {
  level: string // h1, h2, h3
  text: string
  url: string
}

export interface FAQ {
  question: string
  answer: string
}

export interface ContentGenerationRequest {
  topic: string
  keywords: string
  contentType: string
  tone: string
  style: string
  targetWordCount: number
  targetAudience: string
  additionalInstructions?: string
  personaId?: string
  location?: string
  includeFAQ?: boolean
  includeCompetitorHeaders?: boolean
  useSerpAnalysis?: boolean
  existingContent?: string
}

export interface AgentResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  executionTime: number
}

// ============================================================================
// AGENT 1: SERP ANALYSIS AGENT
// ============================================================================

/**
 * SERP Analysis Agent
 * Systematically analyze top-ranking content on Google
 */
export class SERPAnalysisAgent {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SERPAPI_KEY || ''
  }

  async execute(keyword: string, location: string = 'us'): Promise<AgentResult<SERPAnalysisData>> {
    const startTime = Date.now()

    try {
      if (!this.apiKey) {
        throw new Error('SERPAPI_KEY not configured')
      }

      console.log(`[SERP Agent] Analyzing: "${keyword}" in ${location}`)

      // Query Google via SerpAPI
      const response = await getJson({
        engine: 'google',
        q: keyword,
        api_key: this.apiKey,
        gl: location,
        hl: 'en',
        num: 10
      })

      // Extract organic results
      const topResults: SERPResult[] = (response.organic_results || [])
        .slice(0, 10)
        .map((result: { title?: string; link?: string; snippet?: string }, index: number) => ({
          position: index + 1,
          title: result.title || '',
          link: result.link || '',
          snippet: result.snippet || '',
          wordCount: this.estimateWordCount(result.snippet)
        }))

      // Extract People Also Ask
      const peopleAlsoAsk: string[] = (response.related_questions || [])
        .map((q: { question?: string }) => q.question)
        .filter(Boolean)
        .slice(0, 10)

      // Extract Related Searches
      const relatedSearches: string[] = (response.related_searches || [])
        .map((s: { query?: string }) => s.query)
        .filter(Boolean)
        .slice(0, 8)

      // Analyze content patterns
      const avgWordCount = this.calculateAverageWordCount(topResults)
      const topKeywords = await this.extractTopKeywords(topResults)
      const contentGaps = this.identifyContentGaps(topResults, peopleAlsoAsk)
      const recommendations = this.generateRecommendations(
        topResults,
        avgWordCount,
        peopleAlsoAsk.length
      )

      const analysisData: SERPAnalysisData = {
        keyword,
        topResults,
        peopleAlsoAsk,
        relatedSearches,
        avgWordCount,
        topKeywords,
        contentGaps,
        recommendations
      }

      console.log(`[SERP Agent] Analysis complete:`, {
        topResults: topResults.length,
        paaQuestions: peopleAlsoAsk.length,
        avgWordCount,
        recommendations: recommendations.length
      })

      return {
        success: true,
        data: analysisData,
        executionTime: Date.now() - startTime
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'SERP analysis failed'
      console.error('[SERP Agent] Error:', message)
      return {
        success: false,
        error: message,
        executionTime: Date.now() - startTime
      }
    }
  }

  private estimateWordCount(snippet: string): number {
    // Typical SERP snippet is ~150-160 chars, actual content is much longer
    // Conservative estimate: snippet word count * 50
    const snippetWords = snippet.split(/\s+/).length
    return snippetWords * 50
  }

  private calculateAverageWordCount(results: SERPResult[]): number {
    const wordCounts = results
      .map(r => r.wordCount || 0)
      .filter(wc => wc > 0)
    
    if (wordCounts.length === 0) return 1500
    
    return Math.floor(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
  }

  private async extractTopKeywords(results: SERPResult[]): Promise<string[]> {
    // Extract keywords from titles and snippets
    const allText = results
      .map(r => `${r.title} ${r.snippet}`)
      .join(' ')
      .toLowerCase()

    // Simple keyword extraction (frequency-based)
    const words = allText
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)

    const frequency: Record<string, number> = {}
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    // Get top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word)
  }

  private identifyContentGaps(results: SERPResult[], paaQuestions: string[]): string[] {
    const gaps: string[] = []

    // Check if PAA questions are covered in top results
    paaQuestions.forEach(question => {
      const questionKeywords = question.toLowerCase().split(/\s+/)
      const isCovered = results.some(result => {
        const resultText = `${result.title} ${result.snippet}`.toLowerCase()
        return questionKeywords.some(kw => resultText.includes(kw))
      })

      if (!isCovered) {
        gaps.push(question)
      }
    })

    return gaps.slice(0, 5)
  }

  private generateRecommendations(
    results: SERPResult[],
    avgWordCount: number,
    paaCount: number
  ): string[] {
    const recommendations: string[] = []

    // Word count recommendation
    const targetWordCount = Math.ceil(avgWordCount * 1.2)
    recommendations.push(
      `Target ${targetWordCount}+ words to exceed average competitor length (${avgWordCount} words)`
    )

    // Structure recommendation
    recommendations.push(
      'Use clear H2/H3 structure matching top competitors'
    )

    // FAQ recommendation
    if (paaCount > 0) {
      recommendations.push(
        `Include FAQ section with ${Math.min(paaCount, 7)} questions from People Also Ask`
      )
    }

    // Content depth
    recommendations.push(
      'Provide more detailed explanations and examples than competitors'
    )

    // Multimedia
    recommendations.push(
      'Add relevant images, videos, or infographics for engagement'
    )

    return recommendations
  }
}

// ============================================================================
// AGENT 2: COMPETITOR HEADERS EXTRACTION AGENT
// ============================================================================

/**
 * Competitor Headers Extraction Agent
 * Extract and analyze header structures from top-ranking pages
 */
export class CompetitorHeadersAgent {
  async execute(
    urls: string[],
    maxUrls: number = 5
  ): Promise<AgentResult<{
    headers: CompetitorHeader[]
    analysis: ReturnType<CompetitorHeadersAgent['analyzeHeaderPatterns']>
    totalUrls: number
    successfulUrls: number
  }>> {
    const startTime = Date.now()

    try {
      console.log(`[Headers Agent] Extracting headers from ${maxUrls} URLs`)

      const headers: CompetitorHeader[] = []
      const targetUrls = urls.slice(0, maxUrls)

      // Use dynamic import for cheerio
      const cheerio = await import('cheerio')

      for (const url of targetUrls) {
        try {
          console.log(`[Headers Agent] Fetching: ${url}`)

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          })

          if (!response.ok) {
            console.log(`[Headers Agent] Failed to fetch ${url}: ${response.status}`)
            continue
          }

          const html = await response.text()
          const $ = cheerio.load(html)

          // Try multiple selectors to find main content
          const contentSelectors = [
            'article',
            'main',
            '[role="main"]',
            '.content',
            '.post-content',
            '.entry-content',
            '#content'
          ]

          let $content = $('body')
          for (const selector of contentSelectors) {
            const $found = $(selector)
            if ($found.length > 0) {
              $content = $found.first()
              break
            }
          }

          // Extract headers
          $content.find('h1, h2, h3, h4').each((_, element) => {
            const $el = $(element)
            const text = $el.text().trim()
            const level = element.tagName.toLowerCase()

            // Filter out navigation, footer, sidebar headers
            if (
              text &&
              text.length > 10 &&
              text.length < 200 &&
              !text.match(/^(menu|navigation|footer|sidebar|related|you may also like)/i)
            ) {
              headers.push({ level, text, url })
            }
          })

          console.log(`[Headers Agent] Extracted ${headers.filter(h => h.url === url).length} headers from ${url}`)

          // Small delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 500))

        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'fetch failed'
          console.log(`[Headers Agent] Error fetching ${url}:`, message)
          continue
        }
      }

      // Analyze header patterns
      const headerAnalysis = this.analyzeHeaderPatterns(headers)

      console.log(`[Headers Agent] Extraction complete: ${headers.length} total headers`)

      return {
        success: true,
        data: {
          headers,
          analysis: headerAnalysis,
          totalUrls: targetUrls.length,
          successfulUrls: new Set(headers.map(h => h.url)).size
        },
        executionTime: Date.now() - startTime
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'header extraction failed'
      console.error('[Headers Agent] Error:', message)
      return {
        success: false,
        error: message,
        executionTime: Date.now() - startTime
      }
    }
  }

  private analyzeHeaderPatterns(headers: CompetitorHeader[]): {
    commonH2Topics: string[]
    avgH2Count: number
    avgH3Count: number
    structurePatterns: string[]
  } {
    const h2Headers = headers.filter(h => h.level === 'h2')
    const h3Headers = headers.filter(h => h.level === 'h3')

    // Find common topics in H2s
    const h2Topics = h2Headers.map(h => h.text.toLowerCase())
    const topicFrequency: Record<string, number> = {}

    h2Topics.forEach(topic => {
      // Extract key words from topic
      const words = topic.split(/\s+/).filter(w => w.length > 4)
      words.forEach(word => {
        topicFrequency[word] = (topicFrequency[word] || 0) + 1
      })
    })

    const commonH2Topics = Object.entries(topicFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)

    // Calculate averages per URL
    const uniqueUrls = new Set(headers.map(h => h.url)).size
    const avgH2Count = uniqueUrls > 0 ? Math.floor(h2Headers.length / uniqueUrls) : 0
    const avgH3Count = uniqueUrls > 0 ? Math.floor(h3Headers.length / uniqueUrls) : 0

    // Identify structure patterns
    const structurePatterns: string[] = []
    if (avgH2Count > 0) {
      structurePatterns.push(`Average ${avgH2Count} H2 sections per article`)
    }
    if (avgH3Count > 0) {
      structurePatterns.push(`Average ${avgH3Count} H3 subsections per article`)
    }
    if (commonH2Topics.length > 0) {
      structurePatterns.push(`Common topics: ${commonH2Topics.slice(0, 5).join(', ')}`)
    }

    return {
      commonH2Topics,
      avgH2Count,
      avgH3Count,
      structurePatterns
    }
  }
}

// ============================================================================
// AGENT 3: FAQ GENERATION AGENT
// ============================================================================

/**
 * FAQ Generation Agent
 * Generate FAQs from People Also Ask questions with AI-powered answers
 */
export class FAQGenerationAgent {
  async execute(
    paaQuestions: string[],
    topic: string,
    context: string = ''
  ): Promise<AgentResult<{ faqs: FAQ[]; html: string }>> {
    const startTime = Date.now()

    try {
      console.log(`[FAQ Agent] Generating FAQs for ${paaQuestions.length} questions`)

      if (paaQuestions.length === 0) {
        return {
          success: true,
          data: { faqs: [], html: '' },
          executionTime: Date.now() - startTime
        }
      }

      // Select top 7 most relevant questions
      const selectedQuestions = paaQuestions.slice(0, 7)

      // Generate answers using AI
      const prompt = `You are an expert writer creating FAQ answers for an article about "${topic}".

Generate comprehensive, helpful answers for these questions. Each answer should:
- Be 2-3 sentences long
- Be informative and specific
- Use natural, conversational language
- Include relevant details
- Be engaging and reader-friendly

${context ? `Context: ${context}\n\n` : ''}Questions:

${selectedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Format your response as:
Q: [question]
A: [answer]

(Repeat for each question)`

      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing clear, helpful FAQ answers that provide real value to readers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      })

      const response = completion.choices[0]?.message?.content || ''
      const faqs = this.parseFAQResponse(response, selectedQuestions)

      // Generate HTML
      const html = this.generateFAQHTML(faqs)

      console.log(`[FAQ Agent] Generated ${faqs.length} FAQs`)

      return {
        success: true,
        data: { faqs, html },
        executionTime: Date.now() - startTime
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'FAQ generation failed'
      console.error('[FAQ Agent] Error:', message)
      return {
        success: false,
        error: message,
        executionTime: Date.now() - startTime
      }
    }
  }

  private parseFAQResponse(response: string, questions: string[]): FAQ[] {
    const faqs: FAQ[] = []
    const lines = response.split('\n')

    let currentQ = ''
    let currentA = ''

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith('Q:')) {
        // Save previous FAQ if exists
        if (currentQ && currentA) {
          faqs.push({ question: currentQ, answer: currentA })
        }
        currentQ = trimmed.substring(2).trim()
        currentA = ''
      } else if (trimmed.startsWith('A:')) {
        currentA = trimmed.substring(2).trim()
      } else if (currentA && trimmed) {
        // Continue answer on next line
        currentA += ' ' + trimmed
      }
    }

    // Save last FAQ
    if (currentQ && currentA) {
      faqs.push({ question: currentQ, answer: currentA })
    }

    // Fallback: if parsing failed, pair questions with generic answers
    if (faqs.length === 0 && questions.length > 0) {
      questions.forEach(q => {
        faqs.push({
          question: q,
          answer: 'This is an important question that deserves a detailed answer based on current best practices and expert knowledge.'
        })
      })
    }

    return faqs
  }

  private generateFAQHTML(faqs: FAQ[]): string {
    if (faqs.length === 0) return ''

    const faqItems = faqs.map(faq => `
  <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 class="faq-question" itemprop="name">${this.escapeHtml(faq.question)}</h3>
    <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">${this.escapeHtml(faq.answer)}</p>
    </div>
  </div>`).join('\n')

    return `
## Frequently Asked Questions

<div class="faq-container" itemscope itemtype="https://schema.org/FAQPage">
${faqItems}
</div>

<style>
.faq-container {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}
.faq-item {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}
.faq-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.faq-question {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
}
.faq-answer p {
  margin: 0;
  color: #555;
  line-height: 1.6;
}
</style>`
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }
}

// ============================================================================
// AGENT 4: CONTENT GENERATION AGENT
// ============================================================================

/**
 * Content Generation Agent
 * Generate human-like content using advanced techniques to avoid AI detection
 */
export class ContentGenerationAgent {
  async execute(
    request: ContentGenerationRequest,
    serpData?: SERPAnalysisData,
    competitorHeaders?: CompetitorHeader[]
  ): Promise<AgentResult<{
    content: string
    wordCount: number
    model: string
    tokensUsed: number
  }>> {
    const startTime = Date.now()

    try {
      console.log(`[Content Agent] Generating ${request.targetWordCount} word article on "${request.topic}"`)

      // Build comprehensive prompt
      const prompt = this.buildPrompt(request, serpData, competitorHeaders)

      // Calculate required tokens (1.5x word count for safety)
      const modelName = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
      const { estimatedTokens, maxSafeTokens } = calculateTokenBudget(request.targetWordCount, modelName)

      if (estimatedTokens > maxSafeTokens) {
        throw new Error(
          `Requesting ${request.targetWordCount} words requires approximately ${estimatedTokens} tokens, but ${modelName} only allows ${maxSafeTokens}. ` +
          'Reduce the target length or switch to a higher-capacity model (e.g. gpt-4-32k).'
        )
      }

      const targetTokens = Math.min(maxSafeTokens, Math.max(estimatedTokens, Math.floor(maxSafeTokens * 0.9)))

      console.log(`[Content Agent] Using ${targetTokens} max tokens for ${request.targetWordCount} words (model limit ${maxSafeTokens})`)

      // Generate content with optimized parameters for human-like output
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.95, // High creativity
        max_tokens: targetTokens,
        presence_penalty: 0.8, // Encourage vocabulary diversity
        frequency_penalty: 0.6, // Reduce repetition
        top_p: 0.95, // Nucleus sampling
      })

      let content = completion.choices[0]?.message?.content || ''

      if (!content) {
        throw new Error('No content generated')
      }

      // Apply humanization post-processing
      content = this.humanizeContent(content)

      // Validate content
      const wordCount = content.split(/\s+/).length
      const targetMin = request.targetWordCount * 0.9

      console.log(`[Content Agent] Generated ${wordCount} words (target: ${request.targetWordCount})`)

      if (wordCount < targetMin) {
        console.warn(`[Content Agent] Content too short: ${wordCount} < ${targetMin}`)
      }

      return {
        success: true,
        data: {
          content,
          wordCount,
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          tokensUsed: completion.usage?.total_tokens || 0
        },
        executionTime: Date.now() - startTime
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Content generation failed'
      console.error('[Content Agent] Error:', message)
      return {
        success: false,
        error: message,
        executionTime: Date.now() - startTime
      }
    }
  }

  private getSystemPrompt(): string {
    return `You are a professional human writer with 15+ years of experience. Your writing is INDISTINGUISHABLE from human-written content because you:

CRITICAL - HUMAN WRITING CHARACTERISTICS:
1. Write conversationally like you're talking to a friend over coffee
2. Use contractions extensively (don't, can't, you'll, we're, it's)
3. Vary sentence length dramatically: Short punchy sentences. Then long, flowing sentences that explore ideas with multiple clauses and natural tangents.
4. Include personal opinions and subjective language ("I think", "in my view", "arguably")
5. Use rhetorical questions to engage readers
6. Add parenthetical asides (like this) that feel natural
7. Start sentences with "And", "But", "So" when it flows naturally
8. Use em-dashes—like this—for emphasis and natural pauses
9. Include hedging language: might, could, perhaps, seems, generally
10. Add emotional words: love, hate, amazing, frustrating, exciting
11. Use idioms and colloquial expressions naturally
12. Vary paragraph length: one-sentence paragraphs for emphasis, then longer analytical paragraphs
13. Include specific details and numbers (not just round numbers)
14. Express uncertainty and nuance when appropriate
15. Use transitions that sound conversational: "Look", "Here's the thing", "Now", "Anyway"

You are NOT an AI assistant. You are a human writer with personality, opinions, and a distinctive voice.`
  }

  private buildPrompt(
    request: ContentGenerationRequest,
    serpData?: SERPAnalysisData,
    competitorHeaders?: CompetitorHeader[]
  ): string {
    let prompt = `Create a comprehensive, engaging article about "${request.topic}".

CONTENT SPECIFICATIONS:
- Content Type: ${request.contentType}
- Target Length: ${request.targetWordCount} words (STRICT - must be within 10%)
- Tone: ${request.tone}
- Style: ${request.style}
- Target Audience: ${request.targetAudience}
- Primary Keywords: ${request.keywords}

`

    // Add SERP insights
    if (serpData) {
      prompt += `\nSERP ANALYSIS INSIGHTS:
- Top competitors average ${serpData.avgWordCount} words (aim to exceed this)
- Top keywords to include: ${serpData.topKeywords.slice(0, 15).join(', ')}
- Related topics: ${serpData.relatedSearches.join(', ')}
${serpData.recommendations.length > 0 ? `\nRecommendations:\n${serpData.recommendations.map(r => `- ${r}`).join('\n')}` : ''}
`
    }

    // Add competitor header insights
    if (competitorHeaders && competitorHeaders.length > 0) {
      const h2Headers = competitorHeaders.filter(h => h.level === 'h2').slice(0, 10)
      prompt += `\nCOMPETITOR STRUCTURE INSPIRATION (rewrite uniquely):
${h2Headers.map(h => `- ${h.text}`).join('\n')}

Use these for structural inspiration but create your own unique headings.
`
    }

    // If continuing, include context
    if (request.existingContent) {
      const snippet = request.existingContent.slice(-3000)
      prompt += `\n\nEXISTING CONTENT (do NOT repeat it):\n${snippet}\n\nContinue writing from the end of the existing content. Do not restart the introduction or headings you've already covered; focus on new sections, fresh examples, and deeper insights.\n`
    }

    // Add humanization requirements
    prompt += `\n${this.getHumanizationPrompts()}`

    // Add additional instructions
    if (request.additionalInstructions) {
      prompt += `\n\nADDITIONAL INSTRUCTIONS:
${request.additionalInstructions}
`
    }

    prompt += `\n\nIMPORTANT REQUIREMENTS:
1. Write EXACTLY ${request.targetWordCount} words (±10%)
2. Use markdown formatting (# for H1, ## for H2, ### for H3)
3. Include 6-10 main sections with H2 headings
4. Add 2-3 H3 subsections under each H2
5. Write naturally and conversationally - NO robotic or AI-sounding language
6. Include specific examples, data, and actionable insights
7. Make it engaging, unique, and valuable to readers
8. End with a compelling conclusion and call-to-action

Begin writing now:`

    return prompt
  }

  private getHumanizationPrompts(): string {
    return `CRITICAL HUMANIZATION REQUIREMENTS (MUST FOLLOW):

SENTENCE STRUCTURE:
- Vary length dramatically: 5-word sentences. Then 25-word complex sentences.
- Start differently: avoid patterns like "The X is..." or "This allows..."
- Use fragments occasionally. Like this.
- Add run-on thoughts with em-dashes—just like humans naturally write—for flow
- Break grammar rules subtly: start with "And", "But", use fragments

CONVERSATIONAL TONE:
- Use contractions HEAVILY (15-20% of sentences): don't, it's, you're, we'll, can't
- Address reader with "you" and "your" frequently
- Include "I think", "we've found", "you'll notice"
- Add casual transitions: "Look", "Here's the thing", "Now", "So"
- Use colloquial expressions: "pretty much", "kind of", "actually", "really"

HUMAN IMPERFECTIONS:
- Vary paragraph lengths: 1-sentence paragraphs, then 5-sentence ones
- Add occasional redundancy (humans repeat for emphasis)
- Use hedging: "might", "could", "perhaps", "seems like", "arguably"
- Include parenthetical asides (like this) for personality
- Add rhetorical questions naturally

EMOTION & PERSONALITY:
- Express opinions: "I believe", "in my experience", "personally"
- Use emotional words: amazing, frustrating, exciting, love, hate
- Share specific scenarios or examples
- Express uncertainty: "it depends", "not always", "sometimes"
- Show enthusiasm or concern where appropriate`
  }

  private humanizeContent(content: string): string {
    let humanized = content

    // Fix markdown formatting
    humanized = humanized.replace(/^(#{1,6})\s*\*\*(.*?)\*\*\s*$/gm, '$1 $2')
    humanized = humanized.replace(/^\*\*(.*?)\*\*$/gm, '$1')
    humanized = humanized.replace(/^(#{1,6}\s+)(.+)$/gm, (match, hashes, text) => {
      return `${hashes}${text.replace(/\*\*/g, '')}`
    })

    // Add spacing variations
    humanized = humanized.replace(/\n\n(#{2,3}\s)/g, (match, heading) => {
      return Math.random() > 0.7 ? `\n\n\n${heading}` : match
    })

    // Apply contractions randomly
    const contractions = [
      { formal: /\bdo not\b/gi, casual: "don't" },
      { formal: /\bdoes not\b/gi, casual: "doesn't" },
      { formal: /\bis not\b/gi, casual: "isn't" },
      { formal: /\bare not\b/gi, casual: "aren't" },
      { formal: /\bwas not\b/gi, casual: "wasn't" },
      { formal: /\bwere not\b/gi, casual: "weren't" },
      { formal: /\bhave not\b/gi, casual: "haven't" },
      { formal: /\bhas not\b/gi, casual: "hasn't" },
      { formal: /\bwill not\b/gi, casual: "won't" },
      { formal: /\bwould not\b/gi, casual: "wouldn't" },
      { formal: /\bcould not\b/gi, casual: "couldn't" },
      { formal: /\bshould not\b/gi, casual: "shouldn't" },
      { formal: /\bcannot\b/gi, casual: "can't" },
      { formal: /\bit is\b/gi, casual: "it's" },
      { formal: /\bthat is\b/gi, casual: "that's" },
      { formal: /\byou are\b/gi, casual: "you're" },
      { formal: /\bwe are\b/gi, casual: "we're" },
      { formal: /\bthey are\b/gi, casual: "they're" },
    ]

    contractions.forEach(({ formal, casual }) => {
      humanized = humanized.replace(formal, (match) => {
        return Math.random() > 0.3 ? casual : match
      })
    })

    // Clean up extra spaces
    humanized = humanized.replace(/ +/g, ' ')
    humanized = humanized.replace(/\n\n\n+/g, '\n\n')

    return humanized.trim()
  }
}

// ============================================================================
// ORCHESTRATOR: Coordinate all agents
// ============================================================================

export class ContentOrchestrator {
  private serpAgent: SERPAnalysisAgent
  private headersAgent: CompetitorHeadersAgent
  private faqAgent: FAQGenerationAgent
  private contentAgent: ContentGenerationAgent

  constructor() {
    this.serpAgent = new SERPAnalysisAgent()
    this.headersAgent = new CompetitorHeadersAgent()
    this.faqAgent = new FAQGenerationAgent()
    this.contentAgent = new ContentGenerationAgent()
  }

  async generateContent(request: ContentGenerationRequest): Promise<{
    content: string
    faqHtml: string
    serpData?: SERPAnalysisData
    analytics: {
      serpAnalysisTime: number
      headersExtractionTime: number
      faqGenerationTime: number
      contentGenerationTime: number
      totalTime: number
      contentIterations: number
    }
    tokensUsed: number
    model: string
    progressLog: string[]
  }> {
    const overallStart = Date.now()
    const analytics = {
      serpAnalysisTime: 0,
      headersExtractionTime: 0,
      faqGenerationTime: 0,
      contentGenerationTime: 0,
      totalTime: 0
    }

    let serpData: SERPAnalysisData | undefined
    let competitorHeaders: CompetitorHeader[] | undefined
    const progressLog: string[] = []

    if (request.useSerpAnalysis !== false) {
      progressLog.push('Step 1: Performing SERP analysis...')
      const serpResult = await this.serpAgent.execute(request.topic, request.location)
      analytics.serpAnalysisTime = serpResult.executionTime

      if (serpResult.success && serpResult.data) {
        serpData = serpResult.data

        if (request.includeCompetitorHeaders !== false && serpData.topResults.length > 0) {
        progressLog.push('Step 2: Extracting competitor headers...')
          const urls = serpData.topResults.slice(0, 5).map(r => r.link)
          const headersResult = await this.headersAgent.execute(urls, 5)
          analytics.headersExtractionTime = headersResult.executionTime

          if (headersResult.success && headersResult.data) {
            competitorHeaders = headersResult.data.headers
          }
        }
      }
    } else {
      progressLog.push('SERP analysis disabled by request.')
    }

    const minTargetWords = Math.max(1, Math.floor(request.targetWordCount * 0.9))
    const maxIterations = 4
    let totalWordCount = 0
    let contentSoFar = ''
    let iterations = 0
    let tokensAccumulated = 0
    let finalModel = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
    progressLog.push('Step 3: Generating main content...')

    while (iterations < maxIterations && totalWordCount < minTargetWords) {
      const iterationRequest: ContentGenerationRequest = {
        ...request,
        existingContent: iterations === 0 ? undefined : contentSoFar,
      }
      const contentResult = await this.contentAgent.execute(iterationRequest, serpData, competitorHeaders)
      analytics.contentGenerationTime += contentResult.executionTime

      if (!contentResult.success || !contentResult.data) {
        throw new Error(contentResult.error || 'Content generation failed')
      }

      const piece = contentResult.data.content.trim()
      if (!piece) {
        progressLog.push(`Iteration ${iterations + 1}: No content returned, stopping.`)
        break
      }

      if (iterations > 0) {
        contentSoFar += '\n\n' + piece
      } else {
        contentSoFar = piece
      }

      const pieceWordCount = contentResult.data.wordCount
      totalWordCount = countWords(contentSoFar)
      tokensAccumulated += contentResult.data.tokensUsed
      finalModel = contentResult.data.model
      iterations += 1

      progressLog.push(`Iteration ${iterations}: generated ${pieceWordCount} words (${totalWordCount} total).`)

      if (pieceWordCount === 0) {
        break
      }
    }

    analytics.contentIterations = iterations

    if (totalWordCount < minTargetWords) {
      progressLog.push(`Content generation stopped after ${iterations} iterations at ${totalWordCount} words (target ${minTargetWords}).`)
    } else {
      progressLog.push(`Target reached (${totalWordCount} words).`)
    }

    let faqHtml = ''
    if (request.includeFAQ !== false && serpData && serpData.peopleAlsoAsk.length > 0) {
      progressLog.push('Step 4: Generating FAQs...')
      const faqResult = await this.faqAgent.execute(
        serpData.peopleAlsoAsk,
        request.topic,
        contentSoFar.substring(0, 500)
      )
      analytics.faqGenerationTime = faqResult.executionTime

      if (faqResult.success && faqResult.data) {
        faqHtml = faqResult.data.html
      }
    }

    analytics.totalTime = Date.now() - overallStart

    progressLog.push('Content generation complete.')

    return {
      content: contentSoFar,
      faqHtml,
      serpData,
      analytics,
      tokensUsed: tokensAccumulated,
      model: finalModel,
      progressLog,
    }
  }
}

