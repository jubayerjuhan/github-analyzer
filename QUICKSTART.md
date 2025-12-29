# Quick Start Guide

Get your GoodHive GitHub Talent Analyzer up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- GitHub account
- OpenAI account

## Setup Steps

### 1. ✅ Install Dependencies (Already Done!)

```bash
npm install
```

### 2. 🔑 Get Your API Keys

#### GitHub Token

1. Visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "GoodHive Analyzer"
4. Scopes to select:
   - ✅ `public_repo` - Access public repositories
   - ✅ `read:user` - Read user profile data
5. Generate and **copy the token immediately**

#### OpenAI API Key

1. Visit: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name: "GoodHive Analyzer"
4. **Copy the key immediately**

### 3. ⚙️ Configure Environment

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and paste your keys:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview
```

### 4. ✅ Verify Setup

Run the setup checker:

```bash
npm run check-setup
```

You should see:
```
✅ .env file found
✅ GITHUB_TOKEN: ghp_xxxx...xxxx
✅ OPENAI_API_KEY: sk-xxxx...xxxx
🎉 All required environment variables are configured!
```

### 5. 🚀 Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## Quick Test

Try analyzing these GitHub profiles:

1. **vitalik** - Ethereum founder
2. **bkrem** - Active Web3 developer
3. **austintgriffith** - Scaffold-ETH creator

## Available Commands

```bash
npm run dev         # Start development server (localhost:3000)
npm run build       # Build for production
npm start           # Run production server
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript type checking
npm run check-setup # Verify environment setup
```

## What to Expect

The app will:

1. Fetch GitHub profile data
2. Analyze top 30 repositories
3. Detect Web3 technologies (Solidity, Hardhat, ethers, wagmi, etc.)
4. Generate AI-powered hiring report with:
   - Overall, Engineering, Web3, Risk scores
   - Strengths & weaknesses
   - Repository insights
   - Interview questions
   - Hiring recommendation

## Rate Limits

- **GitHub API**: 5,000 requests/hour (with token)
- **App**: 20 requests/hour per IP
- **Cache**: 10-minute report cache

## Troubleshooting

### "Environment validation failed"
- Check your `.env` file exists
- Verify API keys are correct
- Run `npm run check-setup`

### "User not found"
- Verify GitHub username is correct
- Check if profile is public

### "Rate limit exceeded"
- Wait for reset time shown in error
- GitHub: wait 1 hour or use different token

### Port 3000 already in use
```bash
# Use different port
PORT=3001 npm run dev
```

## Production Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

### Manual Deployment

```bash
npm run build
npm start
```

## Security Notes

- Never commit `.env` to git
- Keep API keys secret
- Rotate keys if exposed
- Use read-only GitHub tokens

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Customize Web3 detection in `lib/github.ts`
- Adjust rate limits in `lib/cache.ts`
- Modify UI components in `components/ui/`

---

**Need Help?** Check the README.md or open an issue on GitHub.
