# Overview

DocExtract is a document extraction and review application that processes Word (DOCX), PDF, and Pages files to extract and structure their content using AI-powered processing. The application provides a macOS-inspired interface for uploading documents, viewing extracted text, and exporting structured data in various formats.

The system is built as a full-stack TypeScript application with React on the frontend and Express on the backend, using PostgreSQL for data persistence and OpenAI's GPT API for intelligent text extraction and structuring.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, bundled using Vite

**UI Component System**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design follows Apple Human Interface Guidelines, emphasizing clarity, spatial organization, and purposeful restraint in visual treatment.

**State Management**: 
- TanStack Query (React Query) for server state management and data fetching
- Local React state for UI interactions
- No global state management library (Redux, Zustand, etc.)

**Routing**: The application appears to be a single-page application without client-side routing

**Styling System**:
- Tailwind CSS with custom configuration for Apple-inspired design
- Custom CSS variables for theming (light/dark mode support)
- Typography system inspired by SF Pro Display/Text
- Spacing primitives: 2, 4, 6, 8, 12, 16, 24 pixel units

**Key Design Decisions**:
- Three-column layout: Sidebar (256px) | Main Content (flex-1) | Inspector Panel (320px, collapsible)
- Responsive design with panels stacking on mobile
- Monaco Editor integration for JSON editing
- File upload via react-dropzone
- Comprehensive document library with search, filtering, sorting, and bulk operations

**Key Features**:
1. **Document Upload** - Drag-and-drop interface for uploading DOCX/PDF files with folder selection
2. **Comparison View** - Side-by-side view of extracted text and structured JSON with hover-to-highlight
3. **Document Library** - Table-based document management with:
   - Real-time search by document name
   - Filtering by folder, file type (DOCX/PDF), and processing status
   - Sorting by name, date, or size (ascending/descending)
   - Bulk selection with checkboxes
   - Bulk operations: export, move to folder, delete
   - Individual document actions: rename, move, delete via context menu
4. **Folder Organization** - Create, edit, delete folders with automatic document count tracking
5. **Document Reprocessing** - Re-extract and re-process documents with latest AI extraction logic
6. **Export Functionality** - Export individual or multiple documents as JSON files

## Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Design**: RESTful API with JSON request/response format

**File Processing Pipeline**:
1. File upload via multer (stored in /tmp/uploads, 10MB limit)
2. Text extraction using format-specific libraries (mammoth for DOCX, pdf-parse for PDF)
3. AI processing via OpenAI API to structure extracted text
4. Storage of both raw extracted text and structured JSON data

**Key Routes**:
- `POST /api/documents/upload` - File upload and processing
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get specific document
- `PATCH /api/documents/:id` - Update document (supports updating name, structuredData, folderId, etc.)
- `POST /api/documents/:id/reprocess` - Reprocess document with latest AI extraction
- `DELETE /api/documents/:id` - Delete document
- Folder management endpoints (CRUD operations)

**Error Handling**: Custom error responses with appropriate HTTP status codes

**Development Features**:
- Request logging middleware
- Vite integration for HMR in development
- Static file serving in production

## Data Storage

**Database**: PostgreSQL (via Neon serverless)

**ORM**: Drizzle ORM with typed schema definitions

**Schema Design**:

*Folders Table*:
- id (UUID, primary key)
- name (text)
- createdAt (timestamp)

*Documents Table*:
- id (UUID, primary key)
- name (text)
- fileType (varchar - docx/pdf/pages)
- filePath (text - local file system path)
- size (text)
- folderId (foreign key to folders, nullable, cascades to null on delete)
- isProcessed (boolean, default false)
- extractedText (text, nullable)
- structuredData (jsonb, nullable)
- createdAt (timestamp)
- updatedAt (timestamp)

**Migration Strategy**: Drizzle Kit for schema migrations

**Connection Pooling**: Uses Neon's connection pooling via @neondatabase/serverless with WebSocket support

## External Dependencies

**AI Processing**:
- OpenAI API (GPT-4o as fallback for GPT-5)
- API key stored as environment variable
- Used for intelligent text structuring from extracted content
- Schema-based structured output extraction

**Structured JSON Output Format**:
The AI extracts product information into this JSON structure:
```json
{
  "Headlines": ["array of headline strings from the document"],
  "AdvertisingCopy": "string - main advertising copy/description",
  "KeyFeatureBullets": ["array of feature bullets"],
  "LegalReferences": [
    "{{sup:1}} First legal disclaimer/footnote text",
    "{{sup:2}} Second legal disclaimer/footnote text",
    "Legal text without marker (if no reference in content)"
  ]
}
```

**Superscript Handling**:
The system handles superscripts in three distinct ways:
- A. Footnote references (¹, ², ³) → Replaced with tokens like {{sup:1}} in content, and the SAME token prefixes the corresponding legal reference for traceability
- B. Legal marks (™, ®, ℠) → Removed from text (just visual indicators)
- C. Units and scientific notation (cm², CO₂e) → Kept as literal Unicode characters

**Example**:
If content says "battery lasts for days¹", the JSON will contain:
- In KeyFeatureBullets: "battery lasts for days{{sup:1}}"
- In LegalReferences: "{{sup:1}} Battery life varies by use and configuration."

**File Processing Libraries**:
- mammoth: DOCX text extraction
- pdf-parse: PDF text extraction
- multer: File upload handling
- Note: Pages format not currently supported (requires conversion to PDF/DOCX)

**UI Component Libraries**:
- Radix UI: Unstyled, accessible component primitives
- Monaco Editor: Code/JSON editor component
- Lucide React: Icon library
- react-dropzone: File upload interface

**Development Tools**:
- Replit-specific plugins for development environment
- ESBuild for production server bundling
- TypeScript for type safety across stack

**Environment Variables Required**:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication
- `NODE_ENV`: Development/production mode