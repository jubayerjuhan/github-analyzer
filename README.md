# GoodHive GitHub Talent Analyzer

A production-ready web application that generates professional hiring reports for Web3 developers by analyzing their GitHub profiles. Built for GoodHive, a Web3 talent marketplace.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Features

- **GitHub Profile Analysis**: Fetches comprehensive data from GitHub API including repos, languages, topics, and activity
- **Web3 Detection**: Automatically identifies Web3 technologies (Solidity, Hardhat, Foundry, ethers, wagmi, etc.)
- **AI-Powered Reports**: Uses OpenAI to generate structured hiring assessments
- **Code Quality Metrics**: Evaluates testing practices, CI/CD, documentation, and maintainability
- **Role Fit Assessment**: Scores candidates for different roles (Solidity, Web3 Frontend, Full-stack, etc.)
- **Interview Preparation**: Generates customized interview questions based on candidate's work
- **Professional UI**: Clean, dashboard-style interface with shadcn/ui components
- **Rate Limiting & Caching**: Built-in rate limiting and 10-minute cache for API optimization
- **Markdown Export**: Download reports as markdown files

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **APIs**: GitHub REST API, OpenAI API
- **Validation**: Zod

## Prerequisites

Before you begin, ensure you have:

- Node.js 18.0.0 or higher
- npm or yarn package manager
- A GitHub account
- An OpenAI account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd github_analyzer
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Get API Keys

#### GitHub Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "GoodHive Analyzer")
4. Select scopes:
   - `public_repo` (Access public repositories)
   - `read:user` (Read user profile data)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

#### OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Give it a name (e.g., "GoodHive Analyzer")
4. **Copy the key immediately**

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
GITHUB_TOKEN=ghp_your_github_token_here
OPENAI_API_KEY=sk-your_openai_key_here
OPENAI_MODEL=gpt-4-turbo-preview
NODE_ENV=development
```

**Important**: Never commit your `.env` file to version control!

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Usage

1. **Enter a GitHub Profile**: Paste a GitHub URL (e.g., `https://github.com/vitalik`) or just the username (`vitalik`)
2. **Analyze**: Click the "Analyze" button
3. **View Report**: Review the comprehensive hiring report with scores, assessments, and recommendations
4. **Download**: Export the report as a markdown file

## Project Structure

```
github_analyzer/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # API endpoint for analysis
│   ├── report/
│   │   └── [username]/
│   │       └── page.tsx          # Report display page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── ...
├── lib/
│   ├── env.ts                    # Environment validation
│   ├── github.ts                 # GitHub API integration
│   ├── openai.ts                 # OpenAI API integration
│   ├── cache.ts                  # Caching & rate limiting
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utility functions
├── .env.example                  # Environment template
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## How It Works

### 1. Data Collection

The app fetches data from GitHub:
- User profile (bio, location, followers, repos)
- Top 30 repositories (sorted by stars and activity)
- Repository metadata (languages, topics, stars, forks)
- Content analysis for top repos (README, package.json, config files)
- CI/CD and testing indicators

### 2. Web3 Detection

Repositories are analyzed for Web3 relevance using:
- **Topics**: web3, blockchain, solidity, ethereum, defi, nft, etc.
- **Languages**: Solidity detection
- **Dependencies**: Hardhat, Foundry, ethers, wagmi, viem, etc.
- **Config Files**: hardhat.config.js, foundry.toml, etc.
- **README Keywords**: Smart contracts, DeFi, NFT mentions

### 3. AI Analysis

The collected data is sent to OpenAI with:
- Structured JSON schema for consistent output
- Professional recruiter persona
- Instructions to provide evidence-based assessments
- Guidelines to avoid hallucination

### 4. Report Generation

The AI generates:
- **Scores**: Overall, Engineering, Web3, Consistency, Maintainability, Risk
- **Web3 Assessment**: Detected technologies and notable projects
- **Engineering Assessment**: Strengths, weaknesses, code quality signals
- **Repository Insights**: Detailed analysis of key repos
- **Hiring Recommendation**: Verdict (Strong Yes/Yes/Maybe/No) with rationale
- **Role Fit**: Scores for different engineering roles
- **Interview Plan**: Customized questions and take-home tasks

## Rate Limits

- **GitHub API**: 5,000 requests/hour with authenticated token
- **OpenAI API**: Depends on your plan
- **App Rate Limit**: 20 requests per hour per IP address
- **Cache**: Reports cached for 10 minutes

## Customization

### Adjusting Rate Limits

Edit `lib/cache.ts`:

```typescript
export const rateLimiter = new RateLimiter(20, 60); // 20 requests per 60 minutes
```

### Changing OpenAI Model

Update `.env`:

```env
OPENAI_MODEL=gpt-4-turbo-preview  # or gpt-3.5-turbo for lower cost
```

### Modifying Web3 Detection

Edit `lib/github.ts` in the `detectWeb3` function to add new technologies:

```typescript
const web3Topics = [
  'web3',
  'blockchain',
  'your-custom-topic',
  // ...
];
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### "GITHUB_TOKEN is required" Error

Make sure your `.env` file exists and contains valid API keys.

### GitHub Rate Limit Exceeded

Wait for the rate limit to reset or use a different GitHub token.

### OpenAI API Errors

Check your OpenAI API key and account balance.

### "User not found"

Verify the GitHub username is correct and the profile is public.

## Security

- API keys are server-side only and never exposed to the client
- Environment variables are validated on server boot
- Rate limiting prevents abuse
- No user data is stored in a database
- Reports are cached in-memory only

## Privacy

This tool:
- Only analyzes public GitHub data
- Does not store personal information
- Caches reports temporarily for performance
- Does not track users

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Open a GitHub issue
- Check existing issues for solutions

## Acknowledgments

- Built with Next.js, TypeScript, and Tailwind CSS
- UI components from shadcn/ui
- Powered by GitHub API and OpenAI

---

**Built for GoodHive** - Web3 Talent Marketplace
