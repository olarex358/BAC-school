// src/pages/HomePage.js
import HeroSlider from "../components/HeroSlider";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import useHomeContent from "../hooks/useHomeContent";
import "../styles/uncreated-pages.css";

export default function HomePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { homeContent } = useHomeContent();

  const latestNews = (homeContent.news || [])
    .filter(n => n.status === "published")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  return (
    <div className="home-page">

      <HeroSlider />

      {/* Welcome */}
      <section className="welcome-address reveal">
        <h2>Welcome Busarialao College</h2>
        <p>
          {token
            ? "Welcome back to the Busarialao College Academic Portal."
            : "Welcome to Busarialao College  a place of excellence and discipline."}
        </p>
         <p>
      A place of learning, character formation,
    and excellence. We are proud to be an institution committed to academic
    distinction, innovation, and the holistic development of our students.
  </p>

  <p>
    At Busarialao College, we believe education goes beyond the classroom.
    Our dedicated faculty, supportive learning environment, and well-structured
    programs are designed to nurture intellectual growth, leadership skills,
    and strong moral values.
  </p>

  <p>
    As you explore our website, you will discover a vibrant academic community
    where curiosity is encouraged, talents are developed, and future leaders
    are shaped.
  </p>

  <p class="welcome-footer">
    Thank you for choosing Busarialao College. Together, we build a future of excellence.
  </p>
        <strong>Mr F. Onipede</strong>
        <p><span>Principal</span></p>
        
      </section>

      {/* Why Choose Us */}
      <section className="why-us reveal">
        <h2>Why Choose Us</h2>
        <div className="card-grid">
          <div className="card">Experienced Teachers</div>
          <div className="card">Strong Moral Values</div>
          <div className="card">Science-Focused Curriculum</div>
          <div className="card">Modern Academic Portal</div>
        </div>
      </section>

      {/* Academic Structure */}
      <section className="academics reveal">
        <h2>Academic Structure</h2>
        <div className="card-grid">
          <div className="card">Junior Secondary School (JSS)</div>
          <div className="card">Senior Secondary School (SSS)</div>
          <div className="card">WAEC & NECO Preparation</div>
        </div>
      </section>

      {/* Portal Features */}
      <section className="portal-features reveal">
        <h2>Portal Features</h2>
        <div className="card-grid">
          <div className="card">Student Management</div>
          <div className="card">Staff Management</div>
          <div className="card">Results & Records</div>
          <div className="card">Offline-Ready System</div>
        </div>
      </section>

      {/* 🔥 LATEST NEWS (DYNAMIC) */}
      <section className="news reveal">
        <h2>Latest News</h2>

        {latestNews.length === 0 ? (
          <p>No news published yet.</p>
        ) : (
          <div className="news-grid">
            {latestNews.map(item => (
              <div
                key={item.id}
                className="news-card"
                onClick={() => navigate(`/news/${item.id}`)}
                style={{ cursor: "pointer" }}
              >
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title} />
                )}
                <h3>{item.title}</h3>
                <small>
                  {new Date(item.createdAt).toDateString()}
                </small>
                <p>{item.description.slice(0, 80)}...</p>
                <strong>Read more →</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to Continue?</h2>
        <a href={token ? "/dashboard" : "/login"} className="cta-button">
          {token ? "Go to Dashboard" : "Login to Portal"}
        </a>
      </section>

    </div>
  );
}
