# 🚀 Wand Wiser Setup Guide

Complete step-by-step guide to get Wand Wiser running on your machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
  - Check: `node --version`
  - Download: https://nodejs.org/

- **npm** or **yarn**
  - Check: `npm --version`
  - Comes with Node.js

- **OpenAI API Key**
  - Get one: https://platform.openai.com/api-keys
  - You'll need credits on your OpenAI account

## 🔧 Installation Steps

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- OpenAI SDK
- Framer Motion
- And more...

### Step 2: Configure Environment Variables

1. Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

2. Add your OpenAI API key to `.env.local`:

```env
# Required: Your OpenAI API Key
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Customize the model (default: gpt-4o)
OPENAI_MODEL=gpt-4o

# Optional: Rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

> **⚠️ Important:** Never commit `.env.local` to git. It's already in `.gitignore`.

### Step 3: Run the Development Server

```bash
npm run dev
```

The application will start at: **http://localhost:3000**

### Step 4: Verify Installation

1. Open http://localhost:3000 in your browser
2. You should see the Wand Wiser dashboard
3. Try generating some content to verify the OpenAI integration

## 🏗️ Build for Production

### Development Build

```bash
npm run dev
```
Starts the development server with hot-reload.

### Production Build

```bash
npm run build
npm start
```

Creates an optimized production build and starts the production server.

### Linting

```bash
npm run lint
```

Checks for code issues and style problems.

## 🔑 Getting Your OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the key (you won't be able to see it again!)
6. Add credits to your account if needed

## 💰 API Costs

Content generation uses OpenAI's API which charges per token:

- **Short content (500-800 words)**: ~$0.05-0.10
- **Medium content (800-1500 words)**: ~$0.10-0.20
- **Long content (1500-2500 words)**: ~$0.20-0.40
- **Extra long (2500+ words)**: ~$0.40-0.70

> Prices vary based on the model used. GPT-4 Turbo is more expensive but provides better quality.

## 📱 Browser Compatibility

Wand Wiser works best on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🐛 Common Issues

### Issue: "OpenAI API key not configured"

**Solution:**
- Ensure `.env.local` exists in the root directory
- Verify the API key is correctly formatted: `OPENAI_API_KEY=sk-...`
- Restart the development server after adding the key

### Issue: "Failed to generate content"

**Solutions:**
- Check your OpenAI account has sufficient credits
- Verify your API key is valid
- Check your internet connection
- Review the browser console for detailed errors

### Issue: Rate limit exceeded

**Solutions:**
- Wait a moment and try again
- Check your OpenAI account usage
- Consider upgrading your OpenAI plan

### Issue: Port 3000 already in use

**Solution:**
```bash
# Use a different port
PORT=3001 npm run dev
```

### Issue: Module not found errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It contains sensitive API keys
2. **Use environment variables** - Don't hardcode API keys in code
3. **Limit API key permissions** - Use restricted keys when possible
4. **Monitor usage** - Keep track of your OpenAI API usage
5. **Set rate limits** - Prevent excessive API calls

## 📊 Project Structure

```
Wand Wiser/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── generate/         # Content generation endpoint
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Main page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── Dashboard.tsx         # Main dashboard
│   ├── ContentGenerator.tsx # Content generation interface
│   ├── GenerationForm.tsx   # Form component
│   ├── ContentPreview.tsx   # Preview component
│   ├── ProjectsManager.tsx  # Project management
│   └── Sidebar.tsx          # Navigation sidebar
├── lib/                      # Utility libraries
│   ├── seo-optimizer.ts     # SEO tools
│   └── humanization.ts      # Humanization tools
├── public/                   # Static files
├── .env.local               # Environment variables (create this!)
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind CSS config
├── next.config.js           # Next.js config
└── README.md                # Documentation
```

## 🎯 Next Steps

After installation:

1. **Explore the Dashboard** - Check out different content types
2. **Generate Test Content** - Try creating a short blog post
3. **Customize Settings** - Adjust tone, style, and length
4. **Save Projects** - Use the projects manager to organize content
5. **Read the Docs** - Check README.md for detailed features

## 🆘 Getting Help

If you encounter issues:

1. Check this setup guide
2. Review the README.md
3. Check the browser console for errors
4. Verify your `.env.local` configuration
5. Ensure all dependencies are installed
6. Try clearing cache and rebuilding

## 🎉 You're Ready!

Once everything is set up, you can start generating amazing content!

Happy content creating! 🚀


