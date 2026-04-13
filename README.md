# ATS Resume Formatter

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![JSZip](https://img.shields.io/badge/JSZip-3.10-orange)
![Nginx](https://img.shields.io/badge/Deployed-Nginx-009639?logo=nginx&logoColor=white)
![Status](https://img.shields.io/badge/Status-Live-34d399)

A browser-based tool that generates tailored ATS-friendly resumes by merging user input into a Word template — no backend, no data stored, everything runs in the browser.

## Live Demo

**[http://46.225.208.197/cv-formatter/](http://46.225.208.197/cv-formatter/)**

No login needed. Open and use immediately.

## What It Does

- **Two application modes** — Part-Time (uses Experience section) and Full-Time (uses Projects section) — each tailored to different job types
- **4-step wizard** — Mode select → Upload template → Fill form → Download .docx — clean guided flow, no confusion
- **Direct Word XML manipulation** — Unzips the .docx, finds and replaces placeholders in the XML, re-zips into a valid .docx file — all in the browser
- **Dynamic sections** — Add multiple experience entries or project entries, each with bullet points, links, dates, and locations
- **Smart section removal** — Unused sections (Experience in Full-Time mode, Projects in Part-Time mode) are completely removed from the output — not just hidden, actually deleted from the XML
- **Placeholder handling across split XML runs** — Word sometimes splits text across multiple XML runs; the app detects and handles this correctly
- **Zero data transmission** — Nothing leaves the browser. No server. No database. No API calls. The user's resume data stays on their machine

## Why I Built It

Every job application needs a tailored CV. Editing a Word file manually for each application is slow and error-prone — wrong company name, outdated skills, mismatched formatting. Built this to solve that. Upload the template once, fill in the job-specific details, download a perfectly formatted .docx every time. Chose to do all processing in the browser so there is no backend to maintain and no privacy concerns — the user's data never touches a server.

## Tech Stack

| Layer | Technology | Why This Choice |
|-------|-----------|-----------------|
| UI Framework | React 18.3 | Manages complex multi-step form state cleanly with hooks — the app has 12+ state variables that change together |
| Build Tool | Vite 6.4 | Instant dev server, fast production builds — modern standard that replaced Create React App |
| .docx Processing | JSZip (CDN) | Unzips and re-zips Word files in the browser — loaded dynamically so users who never generate don't download it |
| Styling | Inline CSS-in-JS | Component is self-contained with no external CSS dependencies — dark theme with mode-specific color accents |
| Deployment | Nginx on Hetzner VPS | Static file serving from a subpath — fast, no cold starts, no free-tier limitations |

## Architecture

```
[User opens browser]
        ↓
[Nginx serves static files from /var/www/html/cv-formatter/]
        ↓
[index.html loads] → [main.jsx runs] → [App.jsx renders] → [ATSFormatter.jsx mounts]
        ↓
[Step 0: User picks mode — Part-Time or Full-Time]
        ↓
[Step 1: User uploads their customized .docx template]
        ↓
[Step 2: User fills form — job title, profile, skills, experiences/projects]
        ↓
[Step 3: User clicks "Generate CV"]
        ↓
[JSZip loads from CDN] → [Unzips .docx into XML files]
        ↓
[Reads word/document.xml] → [Finds {{PROFILE}}, {{SKILLS}}, {{EXPERIENCE}}, {{PROJECTS}}]
        ↓
[Replaces placeholders with formatted WordprocessingML XML]
        ↓
[Removes unused section completely from XML]
        ↓
[Re-zips into new .docx blob] → [Creates download link]
        ↓
[User downloads tailored CV]
```

## How To Run Locally

**Prerequisites:** Node.js 18+ and npm installed.

```bash
# 1. Clone the repo
git clone https://github.com/NakuSurrey/cv-formatter.git

# 2. Navigate into the project
cd cv-formatter

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

The app opens at `http://localhost:5173`. No environment variables needed.

**To build for production:**

```bash
npm run build
```

Output goes to `dist/` — static HTML, CSS, and JS ready to serve from any web server.

## Key Decisions

- **JSZip loaded from CDN instead of bundled** — keeps the initial bundle small (160KB). JSZip only downloads when the user actually generates a CV. Most visitors testing the app never trigger it
- **Inline styles instead of CSS framework** — the component is fully self-contained. No Tailwind, no styled-components, no external CSS. Copy the component file anywhere and it works
- **Client-side only, no backend** — resume data is sensitive. By doing everything in the browser, there is zero chance of data leaks. No server to secure, no database to protect, no GDPR concerns
- **Template-based approach instead of building .docx from scratch** — Word documents have complex XML. Instead of generating perfect XML from nothing, start with a real .docx template and replace only the dynamic parts. This preserves all formatting, fonts, margins, and structure
- **Hetzner VPS instead of Vercel** — already had the server running other projects. Nginx serves static files with zero cold start time, unlike serverless platforms

## What I Learned

- Word .docx files are ZIP archives containing XML — `word/document.xml` holds the main content
- WordprocessingML XML uses `<w:r>` (runs) for text styling and `<w:p>` (paragraphs) for structure
- Word splits text across multiple XML runs unpredictably — placeholder replacement must handle fragmented text
- Nginx `alias` and `try_files` together cause path resolution bugs — use `root` with matching folder structure instead
- Nginx `server_name` matching takes priority over `default_server` — the specific match wins even when the default block has the right config
- React `useState` with arrays of objects needs spread operators to trigger re-renders — mutating in place does not work
- JSZip can process files entirely in the browser using `Blob` and `URL.createObjectURL` — no server round-trip needed
