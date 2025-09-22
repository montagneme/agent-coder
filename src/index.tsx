import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import './index.css';
import Editor from './pages/Editor';
import EditorPreview from './pages/EditorPreview';
import Preview from './pages/Preview';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Editor />} />
      <Route path="/editor-preview" element={<EditorPreview />} />
      <Route path="/preview" element={<Preview />} />
    </Routes>
  </BrowserRouter>
);