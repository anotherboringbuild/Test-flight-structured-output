# Design Guidelines: Document Extraction & Review Application

## Design Approach

**Selected Framework:** Apple Human Interface Guidelines (Reference-Based)

Taking direct inspiration from macOS applications like Finder, Pages, and iCloud Drive to create a familiar, professional productivity tool. This approach emphasizes clarity, spatial organization, and purposeful restraint—hallmarks of Apple's design philosophy.

**Core Design Principles:**
- Clarity through hierarchy and whitespace
- Direct manipulation with immediate feedback
- Consistent spatial relationships
- Purposeful restraint in visual treatment

---

## Typography System

**Font Family:** SF Pro Display and SF Pro Text (via Google Fonts alternatives: Inter for headings, -apple-system fallback)

**Hierarchy:**
- **Large Title:** 34px/40px, weight 700 (main app header)
- **Title 1:** 28px/34px, weight 600 (section headers, folder names)
- **Title 2:** 22px/28px, weight 600 (card titles, modal headers)
- **Title 3:** 20px/25px, weight 600 (subsection headers)
- **Headline:** 17px/22px, weight 600 (emphasized content)
- **Body:** 17px/22px, weight 400 (primary content)
- **Subhead:** 15px/20px, weight 400 (secondary labels)
- **Footnote:** 13px/18px, weight 400 (metadata, timestamps)
- **Caption:** 12px/16px, weight 400 (tertiary information)

**Text Treatment:**
- Letter spacing: -0.01em for titles, normal for body
- Line height: 1.4-1.6 for readability
- Maximum line length: 65-75 characters for body text

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Micro spacing (between related elements): 2, 4
- Component internal spacing: 4, 6, 8
- Section spacing: 12, 16, 24
- Major layout breaks: 24

**Grid System:**
- Main container: max-w-screen-2xl with mx-auto
- Three-column layout: Sidebar (256px) | Main Content (flex-1) | Inspector Panel (320px, collapsible)
- Responsive breakpoints: All panels stack on tablet/mobile

**Layout Zones:**

1. **Top Navigation Bar** (h-16)
   - Fixed height, border bottom
   - Horizontal padding: px-6
   - Contains app title, breadcrumb navigation, global actions

2. **Sidebar** (w-64, collapsible to w-16)
   - Vertical padding: py-4
   - Item spacing: gap-1
   - Section headers with py-6 spacing
   - Contains: Library, Folders, Recent, Tags

3. **Main Content Area** (flex-1)
   - Padding: p-8 on desktop, p-4 on mobile
   - Minimum height: calc(100vh - 64px)
   - Dynamic based on current view

4. **Inspector Panel** (w-80, collapsible)
   - Padding: p-6
   - Sticky positioning for long documents
   - Contains: Document metadata, JSON preview, export options

---

## Component Library

### Navigation Components

**Top Bar:**
- Height: 64px (h-16)
- Blur background effect (backdrop-blur-lg)
- Translucent treatment when scrolling
- Left: App icon + title (text-xl font-semibold)
- Center: Breadcrumb trail (text-sm)
- Right: API key status indicator, settings button, user avatar

**Sidebar Navigation:**
- Item height: 36px (h-9)
- Horizontal padding: px-3
- Rounded corners: rounded-lg
- Icon size: 20px (w-5 h-5)
- Text: 15px font-medium
- Active state: subtle background, medium font-weight
- Hover state: background transition
- Expandable folder groups with chevron indicators

**Breadcrumb:**
- Separator: Chevron icon (w-4 h-4)
- Clickable segments: hover underline
- Current page: font-semibold, non-clickable
- Gap between items: gap-2

### Document Upload Zone

**Empty State:**
- Height: 400px (min-h-96)
- Dashed border: border-2 border-dashed
- Rounded: rounded-2xl
- Center-aligned content
- Icon: 64px (w-16 h-16) document icon
- Primary text: text-xl font-semibold
- Secondary text: text-sm
- CTA button: "Choose Files" with file type info below

**Active Upload:**
- Progress indicators with percentage
- File name, size, format display
- Cancel option (x icon button)
- Smooth height transitions

### Document Cards

**Grid Layout:**
- Grid: grid-cols-1 md:grid-cols-2 xl:grid-cols-3
- Gap: gap-6
- Card padding: p-6
- Border: border rounded-xl
- Shadow: subtle on hover

**Card Structure:**
- Document icon + type badge (top-left)
- File name: text-lg font-semibold, truncate
- Metadata row: text-sm (date, size, status)
- Action buttons: bottom-right, icon buttons (w-8 h-8)
- JSON preview indicator: checkmark icon if processed

### Side-by-Side Comparison View

**Split Pane Layout:**
- Two equal columns: grid-cols-2
- Gap: gap-8
- Each pane: min-h-screen, overflow-y-auto

**Left Pane (Original Document):**
- Header: Document name + metadata
- Content area: Extracted text display with formatting preservation
- Padding: p-8
- Background: subtle differentiation from main

**Right Pane (Structured JSON):**
- Header: "Structured Output" + edit toggle
- Monaco editor or JSON viewer component
- Syntax highlighting
- Line numbers
- Copy button (top-right)

**Sync Scroll:** Optional synchronized scrolling between panes

### Folder System

**Folder List View:**
- Folder item height: 52px (h-13)
- Icon: 24px folder icon
- Name: text-base font-medium
- Document count: text-sm in muted text
- Chevron for expansion
- Drag-and-drop target zones

**Folder Creation:**
- Inline input on new folder creation
- Auto-focus with placeholder "Untitled Folder"
- Save on Enter, cancel on Escape
- Validation for duplicate names

**Document Organization:**
- Draggable document cards
- Drop zones with visual feedback
- Folder hierarchy up to 3 levels
- Breadcrumb navigation in folder view

### Modals & Overlays

**Modal Container:**
- Max width: max-w-2xl for standard, max-w-4xl for export
- Padding: p-8
- Rounded: rounded-2xl
- Backdrop: Semi-transparent with blur

**API Key Setup Modal:**
- Title: text-2xl font-semibold
- Input field: h-12, full width
- Secure input masking with reveal toggle
- Save button: Primary CTA
- "Learn more" link to OpenAI docs

**Export Modal:**
- Format selection: Radio buttons (JSON, CSV, TXT)
- Preview section: 200px height with scrolling
- File name input with extension auto-append
- Export button: Primary CTA, disabled until format selected

### Form Elements

**Text Inputs:**
- Height: 44px (h-11)
- Padding: px-4
- Rounded: rounded-lg
- Border: border with focus ring
- Font size: 15px

**Buttons:**
- Primary: h-11, px-6, rounded-lg, font-medium
- Secondary: h-11, px-6, rounded-lg, border
- Icon button: w-9 h-9, rounded-lg
- Disabled state: reduced opacity

**Search Bar:**
- Height: 36px (h-9)
- Rounded: rounded-full
- Icon: 16px search icon (left-aligned)
- Padding: pl-10 pr-4
- Placeholder text styling

### Data Display

**JSON Viewer:**
- Monaco Editor integration
- Theme: Light mode matching UI
- Font: Monospace (JetBrains Mono or Fira Code)
- Size: 14px
- Line height: 1.6
- Collapsible sections
- Copy functionality per section

**Document Metadata Panel:**
- Label-value pairs
- Labels: text-sm font-medium, uppercase tracking-wide
- Values: text-base
- Vertical spacing: gap-4 between pairs
- Dividers: border-t between logical groups

**Status Indicators:**
- Processing: Animated spinner icon (w-4 h-4) + text
- Success: Checkmark icon + timestamp
- Error: Alert icon + error message
- Size: h-6 items-center flex gap-2

### Lists & Tables

**Document List:**
- Row height: 56px (h-14)
- Hover state: subtle background
- Selection: checkbox on hover (left)
- Columns: Icon | Name | Modified | Size | Status | Actions
- Sort indicators in column headers

**Tags Display:**
- Inline flex layout
- Tag height: h-6
- Rounded: rounded-full
- Padding: px-3
- Font: text-xs font-medium
- Gap: gap-2 between tags

---

## Interaction Patterns

**Drag and Drop:**
- Visual feedback: Elevated shadow on drag
- Drop zones: Dashed border highlight
- Ghost preview follows cursor
- Snap animation on successful drop

**Inline Editing:**
- Double-click to edit document/folder names
- Input auto-sized to content
- Save on blur or Enter key
- Cancel on Escape key

**Loading States:**
- Skeleton screens for initial loads
- Spinner for processing operations
- Progress bars for uploads with percentage
- Optimistic UI updates where possible

**Transitions:**
- Panel slide: 300ms ease-in-out
- Fade: 200ms
- Scale on hover: 100ms
- All transitions smooth, never jarring

---

## Responsive Behavior

**Desktop (1280px+):**
- Three-column layout visible
- Side-by-side comparison in split view
- Grid of 3 columns for document cards

**Tablet (768px - 1279px):**
- Collapsible sidebar (icon only or hidden)
- Inspector panel toggleable via button
- Grid of 2 columns for document cards
- Comparison view remains split

**Mobile (<768px):**
- Single column stack
- Hamburger menu for navigation
- Inspector panel as bottom sheet
- Comparison view tabs instead of split
- Document cards full width
- Touch-optimized hit targets (min 44px)

---

## Special Considerations

**No Images:** This is a productivity application—no hero images or decorative imagery. Focus on functional iconography and clear information architecture.

**Performance:**
- Virtual scrolling for large document lists
- Lazy loading for folder contents
- Debounced search (300ms)
- Optimized JSON parsing and rendering

**Accessibility:**
- Keyboard navigation throughout
- Focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Screen reader announcements for status changes
- High contrast mode support

**Iconography:** Use SF Symbols style icons via Heroicons library (outline variant primarily, solid for active states)