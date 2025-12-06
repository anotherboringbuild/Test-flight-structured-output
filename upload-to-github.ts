import { getUncachableGitHubClient } from './github-helper';
import fs from 'fs';
import path from 'path';

const REPO_OWNER = 'anotherboringbuild';
const REPO_NAME = 'objects-document-extraction';

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'tmp',
  'dist',
  '.cache',
  '.local',
  '.replit',
  'replit.nix',
  '*.log',
  'objects-app.tar.gz',
  'github-helper.ts',
  'create-github-repo.ts',
  'upload-to-github.ts',
  'BUNDLE_README.md'
];

function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);

    if (shouldExclude(relativePath) || shouldExclude(item)) {
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else if (stat.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

async function uploadFile(octokit: any, filePath: string, content: string) {
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: `Add ${filePath}`,
      content: Buffer.from(content).toString('base64'),
      branch: 'main'
    });
    return true;
  } catch (error: any) {
    console.error(`Failed to upload ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🔍 Collecting files...');
    const files = getAllFiles('.');
    console.log(`📦 Found ${files.length} files to upload`);

    console.log('\n🔐 Authenticating with GitHub...');
    const octokit = await getUncachableGitHubClient();

    // Create README.md first
    const readmeContent = `# Objects - Document Extraction Application

**AI-powered document extraction with product-first architecture**

## Overview

Objects is a full-stack TypeScript application that extracts structured product information from Word/PDF documents using OpenAI GPT-4o and validates accuracy with dual AI judges (GPT-4o + Gemini 2.5 Pro).

### Key Features

- 📄 **Document Upload**: DOCX/PDF support with AI-powered extraction
- 🎯 **Product-First UI**: ProductBrowser as persistent container
- 🌍 **Multi-Language**: Preserves source language, optional translation
- ✅ **AI Validation**: Dual-judge system (GPT-4o + Gemini 2.5 Pro)
- 📊 **Analytics**: Product tracking, confidence scoring
- 📁 **Folder Organization**: Group language variants together
- 🔍 **Advanced Search**: Dual independent search in text/JSON
- 📤 **Export**: Excel/JSON export capabilities

## Tech Stack

**Frontend**
- React 18 + TypeScript + Vite
- shadcn/ui + Radix UI + TailwindCSS
- TanStack Query v5
- Wouter (routing)

**Backend**
- Express.js + TypeScript
- PostgreSQL (Drizzle ORM)
- OpenAI GPT-4o (extraction + validation)
- Google Gemini 2.5 Pro (validation)

**Document Processing**
- mammoth (DOCX text extraction)
- pdf-parse (PDF text extraction)
- Structured JSON schema enforcement

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Gemini API key (optional for dual-judge validation)

### Installation

\`\`\`bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your:
# - DATABASE_URL
# - OPENAI_API_KEY
# - AI_INTEGRATIONS_GEMINI_API_KEY (optional)
# - SESSION_SECRET

# Push database schema
npx drizzle-kit push

# Start development server
npm run dev
\`\`\`

App runs at \`http://localhost:5000\`

## Document Parsing Pipeline

1. **Text Extraction**: mammoth (DOCX) / pdf-parse (PDF)
2. **Language Detection**: GPT-4o-mini identifies source language
3. **AI Extraction**: GPT-4o with structured outputs enforces JSON schema
4. **Field Normalization**: Guarantees consistent field order
5. **Dual-Judge Validation**: GPT-4o + Gemini cross-validate (70% threshold)

### Extraction Schema

\`\`\`json
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
\`\`\`

**Extraction Rules:**
- JSON field names: Always English
- Content values: Source document language (no translation)
- Superscripts: Converted to \`{{sup:N}}\` tokens
- Multi-product: Each section is an array

## Project Structure

\`\`\`
objects-document-extraction/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # ProductBrowser
│   │   └── App.tsx      # Root
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database layer
│   └── validation.ts    # AI judges
├── shared/
│   └── schema.ts        # Drizzle schemas
└── db/                  # Migrations
\`\`\`

## AI Validation

The dual-judge system validates:
1. ✓ Field names in English
2. ✓ Content language preserved
3. ✓ Superscripts → {{sup:N}} tokens
4. ✓ All products extracted (completeness)
5. ✓ Legal references match markers

**Judges:** GPT-4o (50%) + Gemini 2.5 Pro (50%)  
**Threshold:** 70% confidence + all criteria passed

## License

Proprietary
`;

    console.log('\n📝 Creating README.md...');
    await uploadFile(octokit, 'README.md', readmeContent);

    // Upload all files in batches
    const BATCH_SIZE = 10;
    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      console.log(`\n📤 Uploading batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)}...`);

      const results = await Promise.all(
        batch.map(async (file) => {
          try {
            const content = fs.readFileSync(file, 'utf-8');
            const success = await uploadFile(octokit, file, content);
            if (success) {
              console.log(`  ✓ ${file}`);
              return true;
            } else {
              console.log(`  ✗ ${file}`);
              return false;
            }
          } catch (error: any) {
            console.log(`  ✗ ${file} (${error.message})`);
            return false;
          }
        })
      );

      uploaded += results.filter(r => r).length;
      failed += results.filter(r => !r).length;
    }

    console.log(`\n✅ Upload complete!`);
    console.log(`   Uploaded: ${uploaded} files`);
    console.log(`   Failed: ${failed} files`);
    console.log(`\n🌐 Repository: https://github.com/${REPO_OWNER}/${REPO_NAME}`);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
