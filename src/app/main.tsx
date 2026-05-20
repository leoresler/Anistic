import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DetailPage } from '../features/detail/DetailPage';
import { ExplorePage } from '../features/explore/ExplorePage';
import { HomePage } from '../features/home/HomePage';
import { MyListPage } from '../features/mylist/MyListPage';
import '../styles/globals.css';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
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
