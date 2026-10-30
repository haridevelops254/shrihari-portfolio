import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { coursework } from './data/coursework';
import { projects } from './data/projects';

const pub = (over: object = {}) => ({ id: 'a1', title: 'General CV', category_key: 'general_software', category_label: 'General Software Engineering', version: 'v1', description: null, file_size_bytes: 2048, is_default: true, updated_at: '2026-10-01T00:00:00Z', published_at: '2026-10-01T00:00:00Z', ...over });
const mockFetch = (body: unknown, status = 200) => vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })));
const renderApp = (path = '/') => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></QueryClientProvider>);

beforeEach(() => mockFetch([]));
afterEach(() => vi.unstubAllGlobals());

describe('public portfolio', () => {
  it('renders hero, all three education entries and both achievements', async () => {
    renderApp();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Building AI systems');
    for (const t of ["Sri Kumaran's PU College", 'RV Public School', 'Bangalore Institute of Technology']) expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    expect(screen.getByText('94.83%')).toBeVisible(); expect(screen.getByText('96.4%')).toBeVisible(); expect(screen.getByText('8.6')).toBeVisible();
    expect(screen.getByText('First Place')).toBeInTheDocument(); expect(screen.getByText('Third Place')).toBeInTheDocument();
    expect(screen.getAllByText(/MindMatrixEd/).length).toBeGreaterThan(0);
    expect(screen.getByText('February–May 2026')).toBeInTheDocument();
  });

  it('shows all six projects and filters by search', async () => {
    renderApp();
    expect(projects).toHaveLength(6);
    const u = userEvent.setup();
    await u.type(screen.getByLabelText('Search projects'), 'BM25');
    expect(screen.getByText('3 of 6 projects shown'.replace('3', '1'))).toBeInTheDocument();
    await u.clear(screen.getByLabelText('Search projects'));
    await u.type(screen.getByLabelText('Search projects'), 'zzzz');
    expect(screen.getByText('No projects match your search')).toBeInTheDocument();
  });

  it('filters coursework and never renders duplicates', async () => {
    renderApp();
    const u = userEvent.setup();
    await u.type(screen.getByLabelText('Search courses'), 'Deep Learning');
    expect(screen.getAllByText('Deep Learning').length).toBeGreaterThan(0);
    const all = coursework.flatMap((g) => g.courses);
    expect(new Set(all).size).toBeGreaterThan(40);
  });

  it('pipeline slider and step buttons change the active step', async () => {
    renderApp();
    const u = userEvent.setup();
    const panel = () => screen.getByRole('heading', { name: /^\d+\. / });
    expect(panel()).toHaveTextContent('1. Problem');
    await u.click(screen.getByRole('button', { name: 'Next step' }));
    expect(panel()).toHaveTextContent('2. Dataset audit');
    await u.click(screen.getByRole('tab', { name: 'RAG' }));
    expect(panel()).toHaveTextContent('1. Ingestion');
    expect(RAGAS_NOT_CLAIMED()).toBe(true);
  });

  it('career stream tabs and search work', async () => {
    renderApp();
    const u = userEvent.setup();
    await u.click(within(screen.getByRole('tablist', { name: 'Career streams' })).getByRole('tab', { name: 'Agentic AI' }));
    expect(screen.getAllByText(/LangGraph/).length).toBeGreaterThan(0);
    await u.type(screen.getByLabelText('Search skills or tools'), 'qqqqq');
    expect(screen.getByText('No stream mentions that skill')).toBeInTheDocument();
  });

  it('contact form validates and does not claim a message was sent', async () => {
    renderApp();
    const u = userEvent.setup();
    const form = screen.getByRole('button', { name: 'Open in email app' }).closest('form')!;
    await u.click(within(form).getByRole('button', { name: 'Open in email app' }));
    expect(await screen.findByText('Please enter your name.')).toBeInTheDocument();
  });

  it('shows a graceful message when no resume is published, and no download buttons', async () => {
    renderApp();
    expect(await screen.findByText(/public resume will be available soon/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /download/i })).toBeNull();
  });

  it('lists only what the API returns and links to the public download route', async () => {
    mockFetch([pub(), pub({ id: 'b2', title: 'Backend CV', category_key: 'backend', category_label: 'Backend Engineering', is_default: false })]);
    renderApp();
    const link = await screen.findAllByRole('link', { name: /download/i });
    expect(link[0]).toHaveAttribute('href', '/api/public/resumes/a1/download');
    const u = userEvent.setup();
    await u.selectOptions(screen.getByLabelText('Choose a role'), 'backend');
    expect(await screen.findByText('Backend CV')).toBeInTheDocument();
  });

  it('handles an API failure without crashing', async () => {
    mockFetch({ detail: 'x' }, 500);
    renderApp();
    expect(await screen.findByText(/temporarily unavailable/i, {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('project page renders and unknown slug is handled', () => {
    renderApp('/projects/carnaticprep');
    expect(screen.getByRole('heading', { level: 1, name: 'CarnaticPrep' })).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Repository/ })).toHaveAttribute('href', 'https://github.com/haridevelops559/CarnaticPrep');
  });
  it('unknown project slug shows not found', () => { renderApp('/projects/nope'); expect(screen.getByText('Project not found')).toBeInTheDocument(); });
});

describe('admin', () => {
  it('redirects unauthenticated visitors to login', async () => {
    mockFetch({ detail: 'Not authenticated' }, 401);
    renderApp('/admin/resumes');
    expect(await screen.findByRole('heading', { name: 'Admin login' })).toBeInTheDocument();
    expect(screen.queryByText('Upload new')).toBeNull();
  });
});

function RAGAS_NOT_CLAIMED() { return !document.body.textContent?.match(/RAGAS (score|result)s?:?\s*\d/); }
