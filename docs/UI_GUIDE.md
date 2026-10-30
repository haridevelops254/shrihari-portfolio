# UI guide: sections, cards, buttons, dropdowns, sliders, and how to change them

All paths are under `frontend/src/`. After any edit run `npm run dev` (hot reload) and, before deploying, `npm run build`.

## 1. Global look (one place)
`styles/global.css` → the `:root` block holds every colour, font, font size (`--fs-*`), spacing (`--sp-*`) and radius. Change `--color-primary` to re-colour buttons, links, active tabs and the progress bar at once. Fonts load from `index.html` (Google Fonts link) and are named in `--font-*`.

## 2. Public page sections (order set in `pages/Home.tsx`)
| # | Section | File | Content comes from |
|---|---|---|---|
| 1 | Hero (title, 4 buttons) | `sections/Hero.tsx` | text inline; resume button appears only if a PDF is published |
| 2 | About + Engineering approach (5 cards) | `sections/About.tsx` | `data/profile.ts` → `approach` |
| 3 | Projects gallery (search, category chips, cards) | `sections/Projects.tsx` | `data/projects.ts` |
| 4 | Engineering stories (accordions) | `sections/Stories.tsx` | `data/stories.ts` |
| 5 | Technical domains (tabs + skill search) | `sections/Domains.tsx` | `data/streams.ts` |
| 6 | Pipeline explorer (stepper, slider, dropdown) | `sections/Pipelines.tsx` | `data/pipelines.ts` |
| 7 | Skills (label chips + search) | `sections/Skills.tsx` | `data/skills.ts` |
| 8 | Education timeline (3 cards, always visible) | `sections/Education.tsx` | `data/profile.ts` → `education` |
| 9 | Coursework (search, chips, expand/collapse) | `sections/Coursework.tsx` | `data/coursework.ts` |
| 10 | Achievements (2 award cards) | `sections/Achievements.tsx` | `data/profile.ts` → `achievements` |
| 11 | Internship + independent exploration table | `sections/Achievements.tsx` | `data/profile.ts` → `internship`, `exploration` |
| 12 | Resumes (role dropdown + download) | `sections/Resumes.tsx` | live from the API (published only) |
| 13 | Contact (form, mailto) | `sections/Contact.tsx` | `data/profile.ts` → `profile` |
Project detail pages: `pages/ProjectPage.tsx` (route `/projects/:slug`). Header/footer/dropdown/mobile menu: `components/Layout.tsx`.

## 3. Components and how to change them
**Cards** (`.card`, `.project-card`, `.award`, `.stat` in CSS). Change padding/border/radius in `.card`; change a project card's contents in `sections/Projects.tsx` (the `<article className="card project-card">` block). Number of chips shown: `p.tools.slice(0, 6)`.

**Buttons** (`.btn` + `.btn-primary | .btn-secondary | .btn-ghost | .btn-danger`, `.btn-sm`, `.icon-btn`, `.link-btn`). Add a button anywhere with `<a className="btn btn-primary" href="...">Label</a>`. Change Hero buttons in `sections/Hero.tsx`.

**Filter chips** (`.chip.btn-chip`, `aria-pressed`). Projects chips derive from each project's `categories` array, so adding a category to a project adds a chip automatically.

**Dropdowns**
- *Header "More" menu*: `components/Layout.tsx` → the `more` array (label, `/#section-id`). Closes on Escape/outside click.
- *Resume role select*: `sections/Resumes.tsx`; options come from published resumes only.
- *Pipeline "Decision point"*: `sections/Pipelines.tsx`; options come from each pipeline's `alternatives` array in `data/pipelines.ts`.
- *Admin filters/sort and upload category*: `admin/ResumesPage.tsx`, `admin/UploadPage.tsx`; the category list is `lib/categories.ts` (keep in sync with `backend/app/core/categories.py`).

**Sliders**: the **pipeline step slider** (`<input type="range">`) in `sections/Pipelines.tsx` (class `.slider-row`). Its max is the number of steps in the selected pipeline; add steps in `data/pipelines.ts` and the slider grows. The **upload progress bar** (`.progress`) is in `admin/UploadPage.tsx` and the replace dialog.

**Tabs** (`components/ui.tsx` → `Tabs`, arrow-key navigation) used by Domains and Pipelines. **Accordions** (`Accordion`) used by Stories, Domains, Pipelines, Achievements. Coursework uses native `<details>`.

**Dialogs / toasts**: `Dialog`, `ConfirmDialog`, `ToastProvider` in `components/ui.tsx`. Native `<dialog>` gives focus trapping and Escape-to-close.

**Admin**: shell + sidebar `admin/AdminApp.tsx`; login `Login.tsx`; stats `Dashboard.tsx`; table + edit/replace/delete/history `ResumesPage.tsx`; upload form `UploadPage.tsx`; password change `SettingsPage.tsx`.

## 4. Common edits
- **Change a project's text/links/metrics**: edit its object in `data/projects.ts` (`repo`, `demo`, `results`, etc.). Use `I('text', 'Implemented' | 'Experimented' | 'Conceptual' | 'Proposed')` so the label shows.
- **Add a RAGAS result when ready**: in `carnaticprep` set `results: [{ label: 'Faithfulness', value: '…' }]` and update `resultsNote`.
- **Add a project**: copy an object in `projects`; give it a unique `slug`. It appears in the gallery, search and project route automatically.
- **Add a pipeline step**: append `st('Name', 'What it does', 'Failure mode', 'Evaluation')` to the pipeline's `steps`.
- **Add a skill**: `S('Group', 'Name', 'Implemented', 'Evidence')` in `data/skills.ts`. Only use a label you can back with evidence.
- **Add a course**: add the string to a group's `courses` in `data/coursework.ts` (duplicates are removed on render).
- **Edit education scores/dates**: `data/profile.ts` → `education` (dates are shown exactly as stored).
- **Nav items**: `components/Layout.tsx` → `main` (top bar) and `more` (dropdown/mobile).
- **Page title/description/OG tags/favicon**: `index.html`, `public/favicon.svg`.
- **Admin category list**: `lib/categories.ts` and `backend/app/core/categories.py` (custom categories need no code change).
- **Upload size limit**: backend `MAX_UPLOAD_SIZE_BYTES`; the client hint is `MAX` in `admin/UploadPage.tsx`.
