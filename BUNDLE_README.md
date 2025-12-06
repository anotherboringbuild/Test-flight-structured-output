# Objects - Document Extraction Application

**Product-centric document extraction powered by AI**

## What's Included

This is a complete full-stack TypeScript application that extracts structured product information from Word/PDF documents using AI (GPT-4o + Gemini 2.5 Pro).

### Architecture
- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + TailwindCSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Drizzle ORM)
- **AI**: OpenAI GPT-4o for extraction, dual-judge validation (GPT-4o + Gemini)

### Key Features
- Document upload (DOCX/PDF) with AI-powered extraction
- Product-first interface with ProductBrowser as persistent view
- Multi-document folder support for language variants
- AI-as-a-Judge validation (dual models: GPT-4o + Gemini 2.5 Pro)
- Translation support, comparison view, analytics dashboard
- Excel export, search, filtering, and bulk operations

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key
- Gemini API key (optional, for dual-judge validation)

### Installation

1. **Extract the bundle**
   ```bash
   tar -xzf objects-app.tar.gz
   cd objects-app
   ```

2. **Install dependencies**
   Run the package manager install command for your dependencies

3. **Set up environment variables**
   Create a `.env` file in the root:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   OPENAI_API_KEY=your_openai_api_key
   AI_INTEGRATIONS_GEMINI_API_KEY=your_gemini_api_key (optional)
   SESSION_SECRET=your_random_secret_string
   NODE_ENV=development
   ```

4. **Run database migrations**
   Use drizzle-kit to push schema changes

5. **Start the application**
   Run the dev script from package.json

   The app will be available at `http://localhost:5000`

## Document Parsing Pipeline

The application uses a sophisticated multi-stage AI pipeline:

1. **Text Extraction**: Uses mammoth (DOCX) and pdf-parse (PDF)
2. **Language Detection**: GPT-4o-mini detects document language
3. **AI Extraction**: GPT-4o with structured outputs enforces JSON schema
4. **Field Normalization**: Guarantees consistent field order
5. **Dual-Judge Validation**: GPT-4o + Gemini cross-validate (70% threshold)

### Extraction Schema

Documents are parsed into this structure:
```json
{
  "ProductCopy": [
    {
      "ProductName": "Product name",
      "Headlines": ["headline 1", "headline 2"],
      "AdvertisingCopy": "Main copy with {{sup:1}} tokens",
      "KeyFeatureBullets": ["feature 1{{sup:2}}", "feature 2"],
      "LegalReferences": ["{{sup:1}} Legal text", "{{sup:2}} More legal"]
    }
  ],
  "BusinessCopy": [...],
  "UpgraderCopy": [...]
}
```

**Key Rules:**
- JSON field names ALWAYS in English
- Content values in source document language (no translation)
- Superscripts converted to `{{sup:N}}` tokens for traceability
- Each section is an array (supports multi-product documents)

## Project Structure

```
objects-app/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # ProductBrowser, etc.
│   │   ├── lib/         # Query client, utilities
│   │   └── App.tsx      # Root component
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database interface
│   ├── validation.ts    # AI-as-a-Judge logic
│   └── index.ts         # Server entry
├── shared/              # Shared types
│   └── schema.ts        # Drizzle schemas
├── db/                  # Database migrations
└── package.json         # Dependencies
```

## Key Technologies

- **Text Extraction**: mammoth (DOCX), pdf-parse (PDF)
- **AI Models**: GPT-4o-2024-08-06 (structured outputs), Gemini 2.5 Pro
- **UI Components**: shadcn/ui, Radix UI, Lucide icons
- **State Management**: TanStack Query v5
- **Database**: Drizzle ORM with PostgreSQL
- **Styling**: TailwindCSS with custom Apple-inspired theme

## Validation System

The AI-as-a-Judge system validates:
1. ✓ Field names in English
2. ✓ Content language preserved (no unwanted translation)
3. ✓ Superscripts → {{sup:N}} tokens
4. ✓ Completeness (all products extracted)
5. ✓ Legal references match markers

**Dual-judge approach**: Both GPT-4o and Gemini must agree (50/50 weighted average). Threshold: 70% confidence + all criteria passed.

## Branding

- **Product Name**: Objects
- **Tagline**: powered by knowledge kit
- **Design**: Apple Human Interface Guidelines-inspired

## Support

For implementation details, see the extensive documentation in `replit.md` and inline code comments.

## License

Proprietary - All rights reserved
