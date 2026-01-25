// src/pages/NewsPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useHomeContent from '../hooks/useHomeContent';
import '../styles/uncreated-pages.css';

export default function NewsPage() {
  const { homeContent } = useHomeContent();
  const navigate = useNavigate();

  const publishedNews = homeContent.news.filter(
    n => n.status === 'published'
  );

  return (
    <div className="page-container">
      <h2>School News</h2>

      {publishedNews.length === 0 && <p>No news available.</p>}

      <div className="news-grid">
        {publishedNews.map(item => (
          <article key={item.id} className="news-card">
            {item.imageUrl && <img src={item.imageUrl} alt="" />}
            <h3>{item.title}</h3>
            <p>{item.description.slice(0, 120)}...</p>
            <small>{new Date(item.createdAt).toDateString()}</small>
            <br />
            <button onClick={() => navigate(`/news/${item.id}`)}>
              Read More
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
