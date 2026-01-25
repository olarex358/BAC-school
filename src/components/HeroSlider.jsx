import { useEffect, useState } from 'react';
import useHomeContent from '../hooks/useHomeContent';

export default function HeroSlider() {
  const { homeContent } = useHomeContent();
  const images = homeContent.heroImages.filter(i => i.active);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [images.length]);

  const current = images[index];

  return (
    <div
      className="hero"
      style={{
        backgroundImage: `url(${current?.imageUrl || '/background.png'})`
      }}
    >
      <div className="overlay">
        <h1>{current?.title || 'Busari-alao College'}</h1>
        <p>{current?.subtitle || 'Educating to inspire...'}</p>
        <a href="/login" className="cta">Login to Portal</a>
      </div>
    </div>
  );
}
