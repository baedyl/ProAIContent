/**
 * Content Sanitizer
 * Detects and removes unwanted content from AI-generated text
 */

export interface SanitizationResult {
  content: string
  wasModified: boolean
  issues: string[]
  isSeverelyCorrupted: boolean
}

/**
 * Patterns that indicate the LLM refused or failed to generate proper content
 */
const REFUSAL_PATTERNS = [
  /I('m|\s+am)\s+(sorry|unable|afraid)/gi,
  /I\s+can('t|not)\s+(fulfill|complete|generate|provide|assist|help\s+with)/gi,
  /I\s+(don't|do not|cannot)\s+have\s+(access|the ability)/gi,
  /As\s+an\s+AI(\s+language)?\s+model/gi,
  /Unfortunately,?\s+I\s+(can't|cannot|am unable)/gi,
  /I\s+apologize,?\s+but/gi,
  /against\s+my\s+(guidelines|programming|capabilities)/gi,
  /violates?\s+(content\s+)?(policy|guidelines)/gi,
  /inappropriate\s+(content|request)/gi,
]

/**
 * Patterns that indicate HTML/CSS code blocks
 */
const CODE_BLOCK_PATTERNS = [
  /```(html|css|javascript|js|jsx|tsx|typescript|ts)\s*\n[\s\S]*?\n```/gi,
  /<(html|head|body|div|span|style|script)[^>]*>[\s\S]*?<\/\1>/gi,
  /<!DOCTYPE\s+html>/gi,
  /<style[^>]*>[\s\S]*?<\/style>/gi,
  /<script[^>]*>[\s\S]*?<\/script>/gi,
]

/**
 * Patterns for CSS code detection
 */
const CSS_PATTERNS = [
  /\{[^{}]*?(display|position|margin|padding|border|background|color|font|width|height):[^{}]*?\}/gi,
  /\.[\w-]+\s*\{[\s\S]*?\}/g, // CSS class selectors
  /#[\w-]+\s*\{[\s\S]*?\}/g, // CSS ID selectors
  /@media\s+[^{]*\{[\s\S]*?\}/gi, // Media queries
  /@keyframes\s+[\w-]+\s*\{[\s\S]*?\}/gi, // Keyframe animations
]

/**
 * Patterns that indicate meta-commentary or LLM artifacts
 */
const META_COMMENTARY_PATTERNS = [
  /\[Note:.*?\]/gi,
  /\(Note:.*?\)/gi,
  /\*\*Note:.*?\*\*/gi,
  /Editor's note:/gi,
  /Disclaimer:.*?(\.|\n)/gi,
  /This (is|was) (generated|created) by (an )?AI/gi,
]

/**
 * Check if content contains refusal/apology messages
 */
function containsRefusal(content: string): boolean {
  return REFUSAL_PATTERNS.some((pattern) => pattern.test(content))
}

/**
 * Check if content contains HTML/CSS code blocks
 */
function containsCodeBlocks(content: string): boolean {
  return CODE_BLOCK_PATTERNS.some((pattern) => pattern.test(content)) ||
         CSS_PATTERNS.some((pattern) => pattern.test(content))
}

/**
 * Remove refusal/apology messages from content
 */
function removeRefusalMessages(content: string): { content: string; removed: number } {
  let cleaned = content
  let removed = 0

  // Remove full paragraphs that contain refusals
  const paragraphs = cleaned.split(/\n\n+/)
  const filteredParagraphs = paragraphs.filter((para) => {
    const hasRefusal = REFUSAL_PATTERNS.some((pattern) => pattern.test(para))
    if (hasRefusal) removed++
    return !hasRefusal
  })
  cleaned = filteredParagraphs.join('\n\n')

  // Remove refusal sentences within paragraphs
  REFUSAL_PATTERNS.forEach((pattern) => {
    const matches = cleaned.match(pattern)
    if (matches) {
      removed += matches.length
      cleaned = cleaned.replace(pattern, '')
    }
  })

  return { content: cleaned, removed }
}

/**
 * Remove HTML/CSS code blocks from content
 */
function removeCodeBlocks(content: string): { content: string; removed: number } {
  let cleaned = content
  let removed = 0

  // Remove markdown code blocks with language tags
  CODE_BLOCK_PATTERNS.forEach((pattern) => {
    const matches = cleaned.match(pattern)
    if (matches) {
      removed += matches.length
      cleaned = cleaned.replace(pattern, '')
    }
  })

  // Remove CSS blocks
  CSS_PATTERNS.forEach((pattern) => {
    const matches = cleaned.match(pattern)
    if (matches) {
      removed += matches.length
      cleaned = cleaned.replace(pattern, '')
    }
  })

  return { content: cleaned, removed }
}

/**
 * Remove meta-commentary and LLM artifacts
 */
function removeMetaCommentary(content: string): { content: string; removed: number } {
  let cleaned = content
  let removed = 0

  META_COMMENTARY_PATTERNS.forEach((pattern) => {
    const matches = cleaned.match(pattern)
    if (matches) {
      removed += matches.length
      cleaned = cleaned.replace(pattern, '')
    }
  })

  return { content: cleaned, removed }
}

/**
 * Remove refusal footer (legacy function from route.ts)
 */
function removeRefusalFooter(content: string): string {
  const lines = content.split(/\r?\n/)
  while (lines.length > 0) {
    const trimmed = lines[lines.length - 1].trim()
    if (
      /^Unfortunately/i.test(trimmed) ||
      /I can't (complete|fulfill)/i.test(trimmed)
    ) {
      lines.pop()
      continue
    }
    break
  }
  return lines.join('\n').trim()
}

/**
 * Clean up excessive whitespace and formatting issues
 */
function cleanWhitespace(content: string): string {
  return content
    .replace(/\n{4,}/g, '\n\n\n') // Max 3 consecutive newlines
    .replace(/[ \t]+$/gm, '') // Remove trailing spaces
    .replace(/^[ \t]+/gm, '') // Remove leading spaces (except for indentation)
    .trim()
}

/**
 * Calculate corruption severity based on content ratio
 */
function calculateCorruptionSeverity(
  originalLength: number,
  cleanedLength: number,
  issuesCount: number
): boolean {
  // If we removed more than 50% of content, it's severely corrupted
  if (cleanedLength < originalLength * 0.5) {
    return true
  }

  // If we found multiple severe issues (3+), it's corrupted
  if (issuesCount >= 3) {
    return true
  }

  // If the cleaned content is too short (< 100 chars), it's corrupted
  if (cleanedLength < 100) {
    return true
  }

  return false
}

/**
 * Main sanitization function
 * Detects and removes unwanted content from AI-generated text
 */
export function sanitizeContent(content: string): SanitizationResult {
  const originalContent = content
  const originalLength = content.length
  const issues: string[] = []
  let cleaned = content

  // Step 1: Remove refusal messages
  const refusalResult = removeRefusalMessages(cleaned)
  if (refusalResult.removed > 0) {
    cleaned = refusalResult.content
    issues.push(`Removed ${refusalResult.removed} refusal/apology message(s)`)
  }

  // Step 2: Remove code blocks
  const codeResult = removeCodeBlocks(cleaned)
  if (codeResult.removed > 0) {
    cleaned = codeResult.content
    issues.push(`Removed ${codeResult.removed} HTML/CSS code block(s)`)
  }

  // Step 3: Remove meta-commentary
  const metaResult = removeMetaCommentary(cleaned)
  if (metaResult.removed > 0) {
    cleaned = metaResult.content
    issues.push(`Removed ${metaResult.removed} meta-commentary artifact(s)`)
  }

  // Step 4: Remove refusal footer (legacy)
  const beforeFooterRemoval = cleaned
  cleaned = removeRefusalFooter(cleaned)
  if (beforeFooterRemoval !== cleaned) {
    issues.push('Removed refusal footer')
  }

  // Step 5: Clean whitespace
  cleaned = cleanWhitespace(cleaned)

  // Calculate severity
  const cleanedLength = cleaned.length
  const isSeverelyCorrupted = calculateCorruptionSeverity(
    originalLength,
    cleanedLength,
    issues.length
  )

  return {
    content: cleaned,
    wasModified: originalContent !== cleaned,
    issues,
    isSeverelyCorrupted,
  }
}

/**
 * Quick check if content needs sanitization (without modifying it)
 */
export function needsSanitization(content: string): boolean {
  return containsRefusal(content) || containsCodeBlocks(content)
}

/**
 * Validate that content is acceptable for display
 */
export function validateContent(content: string): {
  isValid: boolean
  reason?: string
} {
  if (!content || content.trim().length === 0) {
    return { isValid: false, reason: 'Content is empty' }
  }

  if (content.trim().length < 50) {
    return { isValid: false, reason: 'Content is too short (< 50 characters)' }
  }

  // Check for severe corruption indicators
  if (containsRefusal(content)) {
    const refusalMatch = REFUSAL_PATTERNS.find((pattern) => pattern.test(content))
    if (refusalMatch) {
      return {
        isValid: false,
        reason: 'Content contains LLM refusal/apology messages',
      }
    }
  }

  // Check if content is mostly code
  const codeBlockMatches = content.match(/```[\s\S]*?```/g) || []
  const codeLength = codeBlockMatches.reduce((sum, block) => sum + block.length, 0)
  if (codeLength > content.length * 0.3) {
    return {
      isValid: false,
      reason: 'Content contains excessive code blocks (>30%)',
    }
  }

  return { isValid: true }
}

