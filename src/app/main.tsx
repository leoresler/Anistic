import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AiRecommendationsPage } from '../features/ai/AiRecommendationsPage';
import { DetailPage } from '../features/detail/DetailPage';
import { ExplorePage } from '../features/explore/ExplorePage';
import { HomePage } from '../features/home/HomePage';
import { MyListPage } from '../features/mylist/MyListPage';
import { WatchPartyPage } from '../features/watch-party/WatchPartyPage';
import '../styles/globals.css';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/recomendaciones-ai" element={<AiRecommendationsPage />} />
        <Route path="/watch-party" element={<WatchPartyPage />} />
        <Route path="/:id" element={<DetailPage />} />
        <Route path="/my-list" element={<MyListPage />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
