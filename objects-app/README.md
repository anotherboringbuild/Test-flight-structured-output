# Objects

**Intelligent Document Extraction Platform**

Objects transforms unstructured marketing documents (Word, PDF) into structured, validated JSON data using AI-powered processing.

## Features

- **Document Upload** - Drag-and-drop single documents or multi-language document sets
- **AI Extraction** - GPT-4o extracts and structures content into consistent JSON schema
- **Dual-Model Validation** - GPT-4o + Gemini 2.5 Pro validate extraction accuracy
- **Product Browser** - Navigate by product across documents and languages
- **Original Preview** - Toggle between extracted text and original PDF/DOCX
- **Language Variants** - Organize translations in folders with original document marking

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript, Node.js
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **AI**: OpenAI GPT-4o, Google Gemini 2.5 Pro
- **Storage**: Replit Object Storage for persistent files
- **Text Extraction**: pdfjs-dist (PDF), mammoth (DOCX)

## Project Structure

```
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components
│       ├── pages/          # Page components
│       ├── hooks/          # Custom hooks
│       ├── lib/            # Utilities
│       └── App.tsx         # Main app
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database layer
│   ├── db.ts              # Database connection
│   ├── validation.ts      # AI validation
│   └── documentStorage.ts # Object storage
├── shared/                 # Shared code
│   └── schema.ts          # Database schema
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind configuration
├── drizzle.config.ts      # Drizzle ORM config
└── package.json           # Dependencies
```

## JSON Output Schema

```json
{
  "ProductCopy": [{
    "ProductName": "Product Name",
    "Headlines": ["Headline 1", "Headline 2"],
    "AdvertisingCopy": "Marketing description",
    "KeyFeatureBullets": ["Feature 1", "Feature 2"],
    "LegalReferences": ["{{sup:1}} Disclaimer text"]
  }],
  "BusinessCopy": [...],
  "UpgraderCopy": [...]
}
```

**Key Principle**: Field names always in English; content values preserve source language.

## Environment Variables

```
DATABASE_URL=           # PostgreSQL connection string
OPENAI_API_KEY=         # OpenAI API key
SESSION_SECRET=         # Session secret
```

## Development

```bash
npm install
npm run dev
```

The app runs on port 5000 with hot reload enabled.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/documents | List all documents |
| GET | /api/documents/:id | Get document by ID |
| POST | /api/documents/upload | Upload single document |
| POST | /api/documents/upload-set | Upload document set |
| GET | /api/documents/:id/preview | Get document preview |
| GET | /api/documents/:id/file | Stream original file |
| POST | /api/documents/:id/validate | Validate extraction |
| POST | /api/documents/:id/translate | Translate to English |
| GET | /api/products | List all products |
| GET | /api/folders | List all folders |

## License

Private - All rights reserved.

---

*Objects. Powered by knowledge kit.*
