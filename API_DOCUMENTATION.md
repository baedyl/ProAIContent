# 🔌 API Documentation

Complete API reference for ProAIContent.

## Overview

ProAIContent uses Next.js API Routes for serverless API functionality. All API endpoints are located in `/app/api/`.

---

## Authentication

Currently, no authentication is required as the app runs locally. The OpenAI API key is configured via environment variables.

### Environment Configuration

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
```

---

## Endpoints

### POST /api/generate

Generate AI-powered content based on user specifications.

#### Request

**URL:** `/api/generate`  
**Method:** `POST`  
**Content-Type:** `application/json`

**Request Body:**

```typescript
{
  contentType: string        // 'blog' | 'product-review' | 'comparison' | 'affiliate'
  topic: string             // Main topic/subject (required)
  keywords: string          // Comma-separated SEO keywords (optional)
  tone: string              // 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational' | 'persuasive'
  style: string             // 'informative' | 'storytelling' | 'listicle' | 'how-to' | 'analytical' | 'entertaining'
  length: string            // 'short' | 'medium' | 'long' | 'extra-long'
  targetAudience: string    // Target audience description (optional)
  additionalInstructions: string // Any additional requirements (optional)
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "blog",
    "topic": "Best wireless headphones for 2025",
    "keywords": "wireless headphones, bluetooth, noise cancelling",
    "tone": "professional",
    "style": "informative",
    "length": "medium",
    "targetAudience": "Tech enthusiasts, age 25-40",
    "additionalInstructions": "Focus on battery life and comfort"
  }'
```

#### Response

**Success Response (200 OK):**

```typescript
{
  content: string           // Generated content in markdown format
  metadata: {
    model: string          // OpenAI model used
    tokens: number         // Total tokens consumed
    timestamp: string      // ISO 8601 timestamp
  }
}
```

**Example Success Response:**

```json
{
  "content": "# Best Wireless Headphones for 2025\n\nIn today's fast-paced world...",
  "metadata": {
    "model": "gpt-4-turbo-preview",
    "tokens": 1234,
    "timestamp": "2025-10-30T12:00:00.000Z"
  }
}
```

**Error Responses:**

```typescript
// 400 Bad Request - Missing required fields
{
  error: string            // Error message
}

// 401 Unauthorized - Invalid API key
{
  error: "Invalid OpenAI API key. Please check your configuration."
}

// 429 Too Many Requests - Rate limit exceeded
{
  error: "Rate limit exceeded. Please try again later."
}

// 500 Internal Server Error - Generation failed
{
  error: string            // Error message
}
```

#### Content Type Specifications

##### Blog Post

```typescript
{
  contentType: "blog",
  // ... other parameters
}
```

Generates:
- Compelling headline
- Hook introduction
- Well-structured body with subheadings
- Practical examples
- Engaging conclusion with CTA

##### Product Review

```typescript
{
  contentType: "product-review",
  // ... other parameters
}
```

Generates:
- Product overview
- Key features
- Pros and cons analysis
- Real-world use cases
- Comparison with alternatives
- Final verdict

##### Product Comparison

```typescript
{
  contentType: "comparison",
  // ... other parameters
}
```

Generates:
- Introduction to products
- Feature comparison
- Detailed analysis
- Price comparison
- Use case scenarios
- Winner recommendation

##### Affiliate Content

```typescript
{
  contentType: "affiliate",
  // ... other parameters
}
```

Generates:
- Problem-solution approach
- Product benefits
- Social proof elements
- Urgency elements
- Clear value proposition
- Strong call-to-action

#### Rate Limiting

Default rate limits:
- **Max Requests:** 100 per minute
- **Window:** 60 seconds

Rate limits are configurable via environment variables:

```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

#### Response Times

Typical response times:
- **Short (500-800 words):** 5-10 seconds
- **Medium (800-1500 words):** 10-15 seconds
- **Long (1500-2500 words):** 15-25 seconds
- **Extra Long (2500+ words):** 25-40 seconds

Response times vary based on:
- OpenAI API latency
- Content complexity
- Current load

---

## Error Handling

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 400 | Bad Request | Check request format and required fields |
| 401 | Unauthorized | Verify OpenAI API key configuration |
| 429 | Rate Limited | Wait and retry after window expires |
| 500 | Server Error | Check logs for detailed error information |

### Error Response Format

```typescript
{
  error: string              // Human-readable error message
}
```

### Common Errors

#### 1. Missing API Key

```json
{
  "error": "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file."
}
```

**Solution:** Add `OPENAI_API_KEY` to `.env.local`

#### 2. Invalid API Key

```json
{
  "error": "Invalid OpenAI API key. Please check your configuration."
}
```

**Solution:** Verify your OpenAI API key is correct

#### 3. Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

**Solution:** Wait 60 seconds and retry

#### 4. Missing Topic

```json
{
  "error": "Topic is required"
}
```

**Solution:** Include `topic` in request body

---

## Request Examples

### JavaScript/TypeScript

```typescript
async function generateContent() {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentType: 'blog',
        topic: 'Best wireless headphones for 2025',
        keywords: 'wireless headphones, bluetooth, noise cancelling',
        tone: 'professional',
        style: 'informative',
        length: 'medium',
        targetAudience: 'Tech enthusiasts',
        additionalInstructions: 'Focus on battery life'
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    const data = await response.json()
    console.log('Generated content:', data.content)
    console.log('Tokens used:', data.metadata.tokens)
    
    return data
  } catch (error) {
    console.error('Generation failed:', error)
    throw error
  }
}
```

### Python

```python
import requests
import json

def generate_content():
    url = "http://localhost:3000/api/generate"
    
    payload = {
        "contentType": "blog",
        "topic": "Best wireless headphones for 2025",
        "keywords": "wireless headphones, bluetooth, noise cancelling",
        "tone": "professional",
        "style": "informative",
        "length": "medium",
        "targetAudience": "Tech enthusiasts",
        "additionalInstructions": "Focus on battery life"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        print("Generated content:", data["content"])
        print("Tokens used:", data["metadata"]["tokens"])
        
        return data
    except requests.exceptions.RequestException as e:
        print("Generation failed:", e)
        raise

# Usage
result = generate_content()
```

### cURL

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "blog",
    "topic": "Best wireless headphones for 2025",
    "keywords": "wireless headphones, bluetooth, noise cancelling",
    "tone": "professional",
    "style": "informative",
    "length": "medium",
    "targetAudience": "Tech enthusiasts",
    "additionalInstructions": "Focus on battery life"
  }'
```

---

## Best Practices

### 1. Error Handling

Always implement proper error handling:

```typescript
try {
  const response = await fetch('/api/generate', {...})
  if (!response.ok) {
    // Handle error response
    const error = await response.json()
    throw new Error(error.error)
  }
  const data = await response.json()
  // Process successful response
} catch (error) {
  // Handle network or other errors
  console.error('Request failed:', error)
}
```

### 2. Loading States

Show loading indicators during generation:

```typescript
const [isLoading, setIsLoading] = useState(false)

const handleGenerate = async () => {
  setIsLoading(true)
  try {
    const data = await generateContent()
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setIsLoading(false)
  }
}
```

### 3. Retry Logic

Implement retry logic for transient failures:

```typescript
async function generateWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateContent()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 4. Request Validation

Validate requests before sending:

```typescript
function validateRequest(data) {
  if (!data.topic || data.topic.trim() === '') {
    throw new Error('Topic is required')
  }
  if (data.topic.length < 10) {
    throw new Error('Topic should be at least 10 characters')
  }
  // Add more validations
}
```

---

## Webhooks

**Status:** Coming in v1.2.0

Future webhook support for:
- Content generation completed
- Bulk generation finished
- Error notifications

---

## SDK

**Status:** Coming in v1.2.0

Official SDKs planned for:
- JavaScript/TypeScript
- Python
- PHP
- Ruby

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Content generation endpoint
- SEO optimization
- Humanization features

### Future Versions
- v1.1.0: Batch generation endpoint
- v1.2.0: Webhooks and SDK
- v2.0.0: Public API with authentication

---

## Support

For API issues or questions:
- Check error messages
- Review this documentation
- Check server logs
- Verify environment configuration

---

**API Version:** 1.0.0  
**Last Updated:** October 30, 2025


