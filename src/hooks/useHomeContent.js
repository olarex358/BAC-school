import { useState } from 'react';

const DEFAULT = {
  heroImages: [],
  news: [],
  events: [],
  welcomeText: "",
  announcement: {
    enabled: false,
    text: ""
  },
  gallery: []
};

export default function useHomeContent() {
  const [homeContent, setHomeContent] = useState(() => {
    try {
      const saved = localStorage.getItem('homeContent');
      return saved ? JSON.parse(saved) : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  const saveContent = (data) => {
    setHomeContent(data);
    localStorage.setItem('homeContent', JSON.stringify(data));
  };

  return { homeContent, saveContent };
}
