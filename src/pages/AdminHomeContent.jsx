// src/pages/AdminHomeContent.jsx
import React, { useState } from 'react';
import useHomeContent from '../hooks/useHomeContent';
import Modal from '../components/Modal';
import '../styles/uncreated-pages.css';


const NEWS_LIMIT = 3;

export default function AdminHomeContent() {
  const { homeContent, saveContent } = useHomeContent();
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const saveNews = (item) => {
    let list = [...homeContent.news];

    const payload = {
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
      status: 'published'
    };

    if (!item.id && list.length >= NEWS_LIMIT) {
      alert('Maximum of 3 news allowed');
      return;
    }

    if (item.id) {
      list = list.map(n => (n.id === item.id ? payload : n));
    } else {
      list.unshift({ ...payload, id: crypto.randomUUID() });
    }

    saveContent({ ...homeContent, news: list });
    setModal(null);
    setEditItem(null);
  };

  const deleteNews = (id) => {
    saveContent({
      ...homeContent,
      news: homeContent.news.filter(n => n.id !== id)
    });
  };

  return (
    <div className="page-container">
      <h2>Home Content Manager</h2>

      {/* NEWS SECTION */}
      <section>
        <h3>News</h3>
        <button onClick={() => setModal('news')}>Add News</button>

        {homeContent.news.length === 0 && <p>No news added yet.</p>}

        {homeContent.news.map(n => (
          <div key={n.id} className="admin-list-item">
            <strong>{n.title}</strong>
            <div>
              <button onClick={() => { setEditItem(n); setModal('news'); }}>
                Edit
              </button>
              <button onClick={() => deleteNews(n.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>

      {modal === 'news' && (
        <Modal title="News Editor" onClose={() => setModal(null)}>
          <NewsForm onSave={saveNews} data={editItem} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- NEWS FORM ---------------- */

function NewsForm({ onSave, data }) {
  // 🔒 SAFETY: normalize data
  const safeData = data || {};

  const [title, setTitle] = useState(safeData.title || '');
  const [description, setDescription] = useState(safeData.description || '');
  const [imageUrl, setImageUrl] = useState(safeData.imageUrl || '');

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={e =>
          setImageUrl(URL.createObjectURL(e.target.files[0]))
        }
      />

      {imageUrl && (
        <img src={imageUrl} alt="preview" width="100%" />
      )}

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="News Title"
      />

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="News Content"
      />

      <button
        onClick={() =>
          onSave({
            ...safeData,
            title,
            description,
            imageUrl
          })
        }
      >
        Save News
      </button>
    </>
  );
}
