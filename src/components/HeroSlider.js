import { useEffect, useState } from "react";
import slide1 from "../assets/hero/slide1.jpg";
import slide2 from "../assets/hero/slide2.jpg";
import slide3 from "../assets/hero/slide3.jpg";

const slides = [slide1, slide2, slide3];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      5000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-section">
      <img src={slides[index]} alt="School life" className="hero-img" />
      <div className="hero-overlay" />

      <div className="hero-content">
        <h1></h1>
        <p>Educating to inspire......</p>
        <div style={{ display: "flex", gap: "12px", marginTop: "15px" }}>
  <a href="/login" className="cta-button">
    Access Portal
  </a>

  <a href="/application-info" className="cta-button secondary">
  Apply for Admission
</a>
<a
  href="https://wa.me/2348012345678"
  target="_blank"
  rel="noreferrer"
  className="cta-button"
  style={{ background: "#25D366" }}
>
  WhatsApp Enquiry
</a>

</div>

      </div>

      {/* Arrows */}
      <button className="arrow left" onClick={() => setIndex((index - 1 + slides.length) % slides.length)}>‹</button>
      <button className="arrow right" onClick={() => setIndex((index + 1) % slides.length)}>›</button>

      {/* Dots */}
      <div className="dots">
        {slides.map((_, i) => (
          <span
            key={i}
            className={i === index ? "dot active" : "dot"}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
