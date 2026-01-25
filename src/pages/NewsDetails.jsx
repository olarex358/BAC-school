// src/pages/NewsDetails.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useHomeContent from '../hooks/useHomeContent';
import '../styles/uncreated-pages.css';

export default function NewsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { homeContent } = useHomeContent();

  const news = homeContent.news.find(n => n.id === id);

  if (!news || news.status !== 'published') {
    return (
      <div className="page-container">
        <p>News not found.</p>
        <button onClick={() => navigate('/news')}>Back to News</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button onClick={() => navigate('/news')}>← Back</button>

      <article className="news-details">
        {news.imageUrl && <img src={news.imageUrl} alt="" />}
        <h2>{news.title}</h2>
        <small>{new Date(news.createdAt).toDateString()}</small>
        <p>{news.description}</p>
      </article>
    </div>
  );
}
