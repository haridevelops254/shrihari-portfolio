import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ApiError } from './lib/api';
import './styles/global.css';

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (e, q) => { if (e instanceof ApiError && e.status === 401 && q.queryKey[0] !== 'me') queryClient.setQueryData(['me'], null); } }),
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><App /></BrowserRouter></QueryClientProvider></StrictMode>,
);
