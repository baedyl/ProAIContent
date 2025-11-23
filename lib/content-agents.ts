/**
 * Content Generation Agents
 * Multi-agent system for creating high-quality, human-like content
 */

import OpenAI from 'openai'
import { getJson } from 'serpapi'
import { calculateTokenBudget, countWords } from '@/lib/content-constraints'
import type { Persona } from '@/lib/personas'

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
          wordCount: this.estimateWordCount(result.snippet || '')
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

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let $content: any = $('body')
          for (const selector of contentSelectors) {
            const $found = $(selector)
            if ($found.length > 0) {
              $content = $found.first()
              break
            }
          }

          // Extract headers
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          $content.find('h1, h2, h3, h4').each((_: any, element: any) => {
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
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o'
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
 * Generate human-like content using step-by-step process to avoid hallucinations
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
    generationSteps: string[]
  }>> {
    const startTime = Date.now()
    const generationSteps: string[] = []

    try {
      console.log(`[Content Agent] Generating ${request.targetWordCount} word article on "${request.topic}"`)
      
      // Load persona
      const { getPersona } = await import('./personas')
      const persona = getPersona(request.personaId || 'default')
      generationSteps.push(`Using persona: ${persona.name}`)

      // Step 1: Generate Research Summary & Outline
      generationSteps.push('Step 1: Creating research-based outline...')
      const outline = await this.generateOutline(request, serpData, competitorHeaders, persona)
      
      // Step 2: Generate Full Content based on outline
      generationSteps.push('Step 2: Writing full content from outline...')
      const fullContent = await this.generateFullContent(request, outline, serpData, persona)
      
      // Step 3: Apply humanization post-processing
      generationSteps.push('Step 3: Humanizing content...')
      const humanizedContent = this.humanizeContent(fullContent)

      // Validate content
      const wordCount = countWords(humanizedContent)
      const targetMin = request.targetWordCount * 0.9

      console.log(`[Content Agent] Generated ${wordCount} words (target: ${request.targetWordCount})`)

      if (wordCount < targetMin) {
        console.warn(`[Content Agent] Content too short: ${wordCount} < ${targetMin}`)
      }

      return {
        success: true,
        data: {
          content: humanizedContent,
          wordCount,
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          tokensUsed: 0, // Will be summed from individual steps
          generationSteps
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

  /**
   * Step 1: Generate a detailed outline based on SERP data
   */
  private async generateOutline(
    request: ContentGenerationRequest,
    serpData?: SERPAnalysisData,
    competitorHeaders?: CompetitorHeader[],
    persona?: Persona
  ): Promise<string> {
    const { buildPersonaPrompt } = await import('./personas')
    
    const systemPrompt = `${buildPersonaPrompt(persona!)}

You are creating a detailed content outline based on real SERP data and competitor analysis.

Your role is to:
1. Analyze what's currently ranking on Google
2. Identify content gaps and opportunities
3. Create a comprehensive outline that can outrank competitors
4. Ground all sections in real data to avoid hallucinations`

    const userPrompt = this.buildOutlinePrompt(request, serpData, competitorHeaders)

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, // Moderate creativity for structure
      max_tokens: 2000,
    })

    return completion.choices[0]?.message?.content || ''
  }

  /**
   * Step 2: Generate full content from the outline
   */
  private async generateFullContent(
    request: ContentGenerationRequest,
    outline: string,
    serpData?: SERPAnalysisData,
    persona?: Persona
  ): Promise<string> {
    const { buildPersonaPrompt } = await import('./personas')
    
    const systemPrompt = `${buildPersonaPrompt(persona!)}

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

You are NOT an AI assistant. You are ${persona!.name}, a human writer with personality, opinions, and a distinctive voice.`

    const userPrompt = this.buildContentPrompt(request, outline, serpData)

    // Calculate required tokens
    const modelName = process.env.OPENAI_MODEL || 'gpt-4o'
    const { estimatedTokens, maxSafeTokens } = calculateTokenBudget(request.targetWordCount, modelName)

    if (estimatedTokens > maxSafeTokens) {
      throw new Error(
        `Requesting ${request.targetWordCount} words requires approximately ${estimatedTokens} tokens, but ${modelName} only allows ${maxSafeTokens}. ` +
        'Reduce the target length or switch to a higher-capacity model.'
      )
    }

    // Use the estimated tokens needed (not the max safe tokens!)
    // Add 20% buffer for formatting and structure, but cap at maxSafeTokens
    const targetTokens = Math.min(maxSafeTokens, Math.ceil(estimatedTokens * 1.2))

    console.log(`[Content Agent] Using ${targetTokens} max tokens for ${request.targetWordCount} words (estimated: ${estimatedTokens}, model limit: ${maxSafeTokens})`)

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8, // Balanced creativity (was 0.95 - too high!)
      max_tokens: targetTokens,
      presence_penalty: 0.3, // Moderate diversity (was 0.8 - too high!)
      frequency_penalty: 0.3, // Moderate repetition reduction (was 0.6 - too high!)
      top_p: 0.9, // Nucleus sampling (was 0.95)
    })

    return completion.choices[0]?.message?.content || ''
  }

  private getSystemPrompt(): string {
    // This method is now deprecated in favor of persona-based system prompts
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

  /**
   * Build outline prompt with SERP data to ground the structure
   */
  private buildOutlinePrompt(
    request: ContentGenerationRequest,
    serpData?: SERPAnalysisData,
    competitorHeaders?: CompetitorHeader[]
  ): string {
    let prompt = `Create a comprehensive article OUTLINE for "${request.topic}".

CONTENT SPECIFICATIONS:
- Content Type: ${request.contentType}
- Target Length: ${request.targetWordCount} words
- Tone: ${request.tone}
- Style: ${request.style}
- Target Audience: ${request.targetAudience}
- Primary Keywords: ${request.keywords}

`

    // Add SERP data to ground the outline in real search results
    if (serpData) {
      prompt += `\nSERP ANALYSIS - WHAT'S CURRENTLY RANKING:

Top 5 Ranking Articles:
${serpData.topResults.slice(0, 5).map((result, idx) => 
  `${idx + 1}. "${result.title}" - ${result.snippet}`
).join('\n\n')}

Top Keywords Found in Ranking Content:
${serpData.topKeywords.slice(0, 20).join(', ')}

Related Searches (User Intent):
${serpData.relatedSearches.slice(0, 8).join(', ')}

People Also Ask Questions:
${serpData.peopleAlsoAsk.slice(0, 10).map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

Average Competitor Word Count: ${serpData.avgWordCount} words
Target: ${Math.ceil(serpData.avgWordCount * 1.2)}+ words to outrank them

Content Gaps (opportunities):
${serpData.contentGaps.length > 0 ? serpData.contentGaps.map(gap => `- ${gap}`).join('\n') : '- No gaps identified'}
`
    }

    // Add competitor header structure analysis
    if (competitorHeaders && competitorHeaders.length > 0) {
      const h2Headers = competitorHeaders.filter(h => h.level === 'h2').slice(0, 12)
      const h3Headers = competitorHeaders.filter(h => h.level === 'h3').slice(0, 8)
      
      prompt += `\nCOMPETITOR CONTENT STRUCTURE:

Common H2 Topics (${h2Headers.length} sections):
${h2Headers.map(h => `- ${h.text}`).join('\n')}

Common H3 Subsections (${h3Headers.length} examples):
${h3Headers.map(h => `- ${h.text}`).join('\n')}
`
    }

    if (request.additionalInstructions) {
      prompt += `\nADDITIONAL INSTRUCTIONS:
${request.additionalInstructions}
`
    }

    prompt += `\n\nYOUR TASK:
Create a detailed outline that will OUTRANK the competitors by:
1. Covering ALL important topics from top-ranking content
2. Addressing the "People Also Ask" questions
3. Filling content gaps competitors missed
4. Including 8-12 main H2 sections with descriptive titles
5. Adding 2-4 H3 subsections under each H2
6. Ensuring comprehensive coverage of keywords

Format your outline as:
# [Main Title - Include Primary Keyword]

## Introduction
[2-3 key points to cover]

## [H2 Section Title]
### [H3 Subsection]
[Key points]
### [H3 Subsection]
[Key points]

[Repeat for all sections]

## Conclusion
[Key takeaways and CTA]

Base your outline on the SERP data above. Reference specific topics, questions, and gaps identified.`

    return prompt
  }

  /**
   * Build content prompt using the outline
   */
  private buildContentPrompt(
    request: ContentGenerationRequest,
    outline: string,
    serpData?: SERPAnalysisData
  ): string {
    const minWords = Math.floor(request.targetWordCount * 0.9)
    const maxWords = Math.ceil(request.targetWordCount * 1.1)
    
    let prompt = `⚠️ CRITICAL WORD COUNT LIMIT: Write between ${minWords} and ${maxWords} words. DO NOT EXCEED ${maxWords} words.

Write a comprehensive, engaging article following this outline:

${outline}

CONTENT SPECIFICATIONS:
- Target Length: ${request.targetWordCount} words (STRICT - between ${minWords}-${maxWords} words)
- Tone: ${request.tone}
- Style: ${request.style}
- Target Audience: ${request.targetAudience}
- Primary Keywords: ${request.keywords}

`

    // Add SERP context for factual grounding
    if (serpData) {
      prompt += `\nREFERENCE DATA (to avoid hallucinations):

Top Keywords to Include Naturally:
${serpData.topKeywords.slice(0, 15).join(', ')}

Related Topics to Cover:
${serpData.relatedSearches.slice(0, 6).join(', ')}

Questions Readers Are Asking:
${serpData.peopleAlsoAsk.slice(0, 8).map(q => `- ${q}`).join('\n')}

`
    }

    prompt += `${this.getHumanizationPrompts()}

`

    if (request.additionalInstructions) {
      prompt += `\nADDITIONAL INSTRUCTIONS:
${request.additionalInstructions}

`
    }

    prompt += `\nCRITICAL REQUIREMENTS:
1. ⚠️ WORD COUNT LIMIT: Write EXACTLY ${request.targetWordCount} words (between ${minWords}-${maxWords} words). STOP at ${maxWords} words maximum!
2. Follow the outline structure provided
3. Use markdown formatting (# for H1, ## for H2, ### for H3)
4. Write naturally and conversationally - NO robotic or AI-sounding language
5. Include specific examples, data, and actionable insights
6. Reference the SERP data when relevant to ensure accuracy
7. Address the "People Also Ask" questions naturally within sections
8. Make it engaging, unique, and valuable to readers
9. End with a compelling conclusion and call-to-action
10. AVOID making up facts - use the reference data provided

⚠️ REMEMBER: Maximum ${maxWords} words. Stop writing when you reach this limit!

Begin writing the FULL article now (not just an outline):`

    return prompt
  }

  // Deprecated - kept for backwards compatibility
  private buildPrompt(
    request: ContentGenerationRequest,
    serpData?: SERPAnalysisData
  ): string {
    return this.buildContentPrompt(request, '', serpData)
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
      totalTime: 0,
      contentIterations: 1 // New approach uses single comprehensive generation
    }

    let serpData: SERPAnalysisData | undefined
    let competitorHeaders: CompetitorHeader[] | undefined
    const progressLog: string[] = []

    // Step 1: SERP Analysis
    if (request.useSerpAnalysis !== false) {
      progressLog.push('Step 1: Performing SERP analysis...')
      const serpResult = await this.serpAgent.execute(request.topic, request.location)
      analytics.serpAnalysisTime = serpResult.executionTime

      if (serpResult.success && serpResult.data) {
        serpData = serpResult.data
        progressLog.push(`✓ Analyzed ${serpData.topResults.length} competitors, found ${serpData.peopleAlsoAsk.length} PAA questions`)

        // Step 2: Extract Competitor Headers
        if (request.includeCompetitorHeaders !== false && serpData.topResults.length > 0) {
          progressLog.push('Step 2: Extracting competitor headers...')
          const urls = serpData.topResults.slice(0, 5).map(r => r.link)
          const headersResult = await this.headersAgent.execute(urls, 5)
          analytics.headersExtractionTime = headersResult.executionTime

          if (headersResult.success && headersResult.data) {
            competitorHeaders = headersResult.data.headers
            progressLog.push(`✓ Extracted ${competitorHeaders.length} headers from ${headersResult.data.successfulUrls} URLs`)
          }
        }
      }
    } else {
      progressLog.push('SERP analysis disabled by request.')
    }

    // Step 3: Generate Content with Step-by-Step Process
    progressLog.push('Step 3: Generating content using step-by-step approach...')
    const contentResult = await this.contentAgent.execute(request, serpData, competitorHeaders)
    analytics.contentGenerationTime = contentResult.executionTime

    if (!contentResult.success || !contentResult.data) {
      throw new Error(contentResult.error || 'Content generation failed')
    }

    const contentSoFar = contentResult.data.content
    const totalWordCount = contentResult.data.wordCount
    const tokensAccumulated = contentResult.data.tokensUsed
    const finalModel = contentResult.data.model

    // Add generation steps to progress log
    if (contentResult.data.generationSteps) {
      progressLog.push(...contentResult.data.generationSteps)
    }

    progressLog.push(`✓ Generated ${totalWordCount} words (target: ${request.targetWordCount})`)

    // Step 4: Generate FAQs
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
        progressLog.push(`✓ Generated ${faqResult.data.faqs.length} FAQ items`)
      }
    }

    analytics.totalTime = Date.now() - overallStart
    progressLog.push(`✓ Content generation complete in ${(analytics.totalTime / 1000).toFixed(2)}s`)

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

