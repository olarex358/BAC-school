export default function GallerySection({ images = [] }) {
  if (images.length === 0) return null;

  return (
    <section className="gallery-section">
      <h2>School Gallery</h2>
      <div className="gallery-grid">
        {images.slice(0, 12).map((img, i) => (
          <img key={i} src={img} alt="School activity" loading="lazy" />
        ))}
      </div>
    </section>
  );
}
