# Content Generation Troubleshooting Guide

## Error: Empty Content (lastWordCount: 0)

### Symptoms
```json
{
  "error": "OpenAI returned empty content",
  "details": {
    "attempts": 4,
    "lastWordCount": 0,
    "targetRange": "600-1000"
  }
}
```

### Possible Causes & Solutions

#### 1. OpenAI API Key Not Set or Invalid

**Check:**
```bash
# Check if key is set
echo $OPENAI_API_KEY

# Or check .env.local file
cat .env.local | grep OPENAI_API_KEY
```

**Solution:**
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. **Restart your dev server** (very important!)
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

**Verify:**
- Key should start with `sk-`
- Key should be 51+ characters long
- No extra spaces or quotes around the key

---

#### 2. OpenAI API Rate Limits or Quota Exceeded

**Check server logs for:**
```
Error: 429 - Rate limit exceeded
Error: 429 - You exceeded your current quota
```

**Solution:**
1. **Rate Limit**: Wait a few minutes and try again
2. **Quota Exceeded**: 
   - Check your OpenAI usage at https://platform.openai.com/usage
   - Add billing information if needed
   - Upgrade your plan if you've hit the limit

---

#### 3. Content Filtering

**Check server logs for:**
```
finish_reason: 'content_filter'
```

**Causes:**
- Topic contains sensitive content
- Keywords trigger OpenAI's content policy
- Combination of topic + keywords is flagged

**Solution:**
- Try a different topic
- Remove or rephrase sensitive keywords
- Simplify your prompt
- Remove additional instructions that might be problematic

---

#### 4. Model Not Available

**Check server logs for:**
```
Error: The model `gpt-4o` does not exist
Error: 404 - Model not found
```

**Solution:**
1. Check which models you have access to at https://platform.openai.com/account/limits
2. Update `.env.local` to use a model you have access to:
   ```env
   # Use GPT-3.5 if you don't have GPT-4 access
   OPENAI_MODEL=gpt-3.5-turbo
   
   # Or use GPT-4 if you have access
   OPENAI_MODEL=gpt-4
   ```
3. Restart your dev server

**Available Models:**
- `gpt-3.5-turbo` - Fast, cheaper (everyone has access)
- `gpt-4` - Better quality (requires GPT-4 API access)
- `gpt-4o` - Latest, best quality (requires GPT-4 API access)

---

#### 5. Network/Connection Issues

**Check server logs for:**
```
Error: ECONNREFUSED
Error: ETIMEDOUT
Error: Network request failed
```

**Solution:**
- Check your internet connection
- Check if OpenAI API is down: https://status.openai.com
- Try again in a few minutes
- Check firewall/proxy settings

---

## Error: Content Too Short

### Symptoms
```json
{
  "error": "Generated content is significantly shorter than requested",
  "details": {
    "lastWordCount": 200,
    "targetRange": "600-1000"
  }
}
```

### Solutions

1. **Use a smaller word count range**
   - Instead of 600-1000, try 300-600
   - Or use fixed count: 400 words

2. **Simplify your topic**
   - Very specific topics may not have enough to say
   - Try a broader topic

3. **Remove conflicting requirements**
   - Too many advanced options can confuse the AI
   - Try with basic settings first

4. **Check your additional instructions**
   - Instructions like "be concise" conflict with long word counts
   - Remove or adjust conflicting instructions

---

## Error: Content Too Long

### Symptoms
```json
{
  "error": "Generated content is significantly longer than requested",
  "details": {
    "lastWordCount": 2000,
    "targetRange": "600-1000"
  }
}
```

### Solutions

1. **Use a larger word count range**
   - Instead of 600-1000, try 1500-2500
   - Or use fixed count: 2000 words

2. **Be more specific in your topic**
   - Broad topics generate more content
   - Narrow down the scope

3. **Add constraints in additional instructions**
   - "Focus only on X aspect"
   - "Keep it concise and to the point"
   - "Limit to 3 main sections"

---

## General Troubleshooting Steps

### 1. Check Server Logs

Look at your terminal where `npm run dev` is running:

```bash
# Look for these patterns:
OpenAI Response: { model: '...', finishReason: '...', ... }
Attempt 1: Generated X words (target: Y, range: Z-W)
✓ Success on attempt 1: X words within range
```

### 2. Test with Simple Input

Try generating with minimal settings:
- **Topic**: "Benefits of exercise"
- **Tone**: Professional
- **Style**: Informative
- **Word Count**: 500-800 (range mode)
- **No advanced options**

If this works, gradually add back your original settings to find what's causing issues.

### 3. Check Environment Variables

Create a test endpoint to verify:

```typescript
// app/api/test-env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'not set',
    model: process.env.OPENAI_MODEL || 'default',
  })
}
```

Visit: `http://localhost:3000/api/test-env`

Expected output:
```json
{
  "hasOpenAIKey": true,
  "keyPrefix": "sk-proj",
  "model": "gpt-4o"
}
```

### 4. Test OpenAI API Directly

Use curl to test your API key:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 10
  }'
```

Expected: You should get a response with "hello" or similar.

If you get an error, the problem is with your OpenAI account/key, not the app.

---

## Common Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Empty content (0 words) | Check OpenAI API key, restart server |
| Rate limit error | Wait 1-5 minutes, try again |
| Quota exceeded | Add billing at OpenAI platform |
| Content filtered | Change topic or keywords |
| Model not found | Use `gpt-3.5-turbo` instead |
| Content too short | Use smaller word count range |
| Content too long | Use larger word count range |
| Network error | Check internet, try again |

---

## Still Having Issues?

### Check These Files

1. **`.env.local`** - Environment variables
   ```env
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o
   ```

2. **Server logs** - Terminal where `npm run dev` is running
   - Look for error messages
   - Check OpenAI response logs

3. **Browser console** - F12 → Console tab
   - Look for network errors
   - Check API response details

### Get More Info

Add this to see full error details in the UI:

```typescript
// In your component
try {
  const response = await fetch('/api/generate', { ... })
  const data = await response.json()
  
  if (!response.ok) {
    console.error('Full error:', data)
    // Show data.suggestions if available
  }
} catch (error) {
  console.error('Fetch error:', error)
}
```

### Contact Support

If nothing works, provide:
1. Server logs (terminal output)
2. Browser console errors
3. The exact topic/settings you're trying
4. Your OpenAI model (from `.env.local`)
5. Whether simple topics work

---

## Prevention Tips

### Best Practices

1. **Use word count ranges** (default)
   - More flexible for AI
   - Higher success rate
   - Example: 600-1000 words

2. **Start simple, add complexity**
   - Test with basic settings first
   - Add advanced options one at a time
   - Easier to debug issues

3. **Monitor your OpenAI usage**
   - Check https://platform.openai.com/usage regularly
   - Set up billing alerts
   - Know your rate limits

4. **Keep API key secure**
   - Never commit `.env.local` to git
   - Use environment variables in production
   - Rotate keys periodically

5. **Test after changes**
   - Always restart server after changing `.env.local`
   - Test with simple content first
   - Check logs for errors

---

## Quick Diagnostic Checklist

- [ ] OpenAI API key is set in `.env.local`
- [ ] API key starts with `sk-`
- [ ] Dev server was restarted after adding key
- [ ] OpenAI account has billing set up
- [ ] Not hitting rate limits (check OpenAI dashboard)
- [ ] Model name is correct (gpt-3.5-turbo or gpt-4)
- [ ] Internet connection is working
- [ ] OpenAI API status is operational
- [ ] Topic is not sensitive/filtered
- [ ] Word count range is reasonable (e.g., 500-1000)
- [ ] Server logs show OpenAI responses
- [ ] No errors in browser console

If all checked and still failing, the issue is likely with OpenAI's API or your account.

