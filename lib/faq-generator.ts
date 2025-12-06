/**
 * FAQ Generation Utilities
 * Generate FAQ sections with schema markup
 */

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQSchema {
  html: string
  schema: object
}

/**
 * Generate FAQ HTML with schema markup
 */
export function generateFAQHTML(faqs: FAQItem[]): FAQSchema {
  if (faqs.length === 0) {
    return {
      html: '',
      schema: {}
    }
  }

  // Generate FAQ HTML with schema.org markup
  const faqItems = faqs.map(faq => `
    <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" class="faq-item">
      <h3 itemprop="name" class="faq-question">${escapeHtml(faq.question)}</h3>
      <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p itemprop="text" class="faq-answer">${escapeHtml(faq.answer)}</p>
      </div>
    </div>
  `).join('\n')

  const html = `
<div class="faq-section" itemscope itemtype="https://schema.org/FAQPage">
  <h2 class="faq-title">Frequently Asked Questions</h2>
  <div class="faq-container">
    ${faqItems}
  </div>
</div>
  `.trim()

  // Generate schema.org JSON-LD
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  }

  return { html, schema }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Generate FAQ prompt for AI
 */
export function generateFAQPrompt(questions: string[], context: string): string {
  return `
You are an expert content writer. Answer the following frequently asked questions about "${context}" in a clear, informative, and engaging way.

REQUIREMENTS:
- Provide accurate, helpful answers
- Keep each answer between 50-150 words
- Use a conversational yet professional tone
- Be specific and actionable
- Avoid fluff or generic responses

QUESTIONS TO ANSWER:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Format your response as a JSON array:
[
  {
    "question": "First question",
    "answer": "Detailed answer here"
  },
  {
    "question": "Second question", 
    "answer": "Detailed answer here"
  }
]

Provide only the JSON array, no additional text.
`.trim()
}

/**
 * Parse FAQ response from AI
 */
export function parseFAQResponse(response: string): FAQItem[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as unknown
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array')
    }

    const isFAQItem = (value: unknown): value is FAQItem => {
      return (
        typeof value === 'object' &&
        value !== null &&
        'question' in value &&
        'answer' in value &&
        typeof (value as { question?: unknown }).question === 'string' &&
        typeof (value as { answer?: unknown }).answer === 'string'
      )
    }

    return parsed.filter(isFAQItem)
  } catch (error: unknown) {
    console.error('Failed to parse FAQ response:', error)
    return []
  }
}

/**
 * Generate FAQ CSS styles
 */
export function getFAQStyles(): string {
  return `<style>.faq-section{margin:2rem 0;padding:2rem;background:#f8f9fa;border-radius:12px;border:1px solid #e9ecef}.faq-title{font-size:1.5rem;font-weight:700;color:#2c3e50;margin-bottom:1.5rem;text-align:center}.faq-container{display:flex;flex-direction:column;gap:1.5rem}.faq-item{background:white;padding:1.5rem;border-radius:8px;border-left:4px solid #007bff;box-shadow:0 2px 4px rgba(0,0,0,0.1)}.faq-question{font-size:1.1rem;font-weight:600;color:#2c3e50;margin-bottom:0.75rem;line-height:1.4}.faq-answer p{margin:0;color:#555;line-height:1.6}@media (max-width:768px){.faq-section{padding:1.5rem;margin:1.5rem 0}.faq-title{font-size:1.25rem}}</style>`.trim()
}

