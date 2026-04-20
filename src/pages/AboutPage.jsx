import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="page">
      <section className="hero about-hero">
        <h1>ⓘ About ClassSync</h1>
        <p>
          ClassSync is a student-friendly space for sharing notes, reviewing lessons,
          and keeping academic resources organized in one place.
        </p>
      </section>

      <section className="about-grid">
        <article className="about-card">
          <h2>What ClassSync Does</h2>
          <p>
            The platform helps students upload reviewers, browse shared materials,
            and revisit useful notes anytime they need a quick study session.
          </p>
        </article>

        <article className="about-card">
          <h2>Why It Helps</h2>
          <p>
            Instead of searching through chats and scattered files, students can
            find study materials faster and learn from contributions shared by classmates.
          </p>
        </article>
      </section>

      <section className="about-section">
        <h2>How It Works</h2>
        <div className="about-steps">
          <div className="about-step">
            <span className="about-step-number">1</span>
            <div>
              <h3>Upload Notes</h3>
              <p>
                Add a title, subject, content, and reference information when needed on the
                <Link to="/upload"> Upload</Link> page.
              </p>
            </div>
          </div>

          <div className="about-step">
            <span className="about-step-number">2</span>
            <div>
              <h3>Browse Shared Materials</h3>
              <p>
                Explore available uploads and search for topics quickly from the
                <Link to="/browse"> Browse</Link> page.
              </p>
            </div>
          </div>

          <div className="about-step">
            <span className="about-step-number">3</span>
            <div>
              <h3>Open Full Note Details</h3>
              <p>
                Select any note card to read the full content and see source details for referenced material.
              </p>
            </div>
          </div>

          <div className="about-step">
            <span className="about-step-number">4</span>
            <div>
              <h3>Track Your Contributions</h3>
              <p>
                Check your uploaded notes anytime from your <Link to="/profile">Profile</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Core Features</h2>
        <div className="about-feature-list">
          <div className="about-feature-item">
            <h3>Simple Note Uploading</h3>
            <p>Students can quickly share reviewers and lesson notes with structured input fields.</p>
          </div>
          <div className="about-feature-item">
            <h3>Reference Awareness</h3>
            <p>Notes that are not original work can show source details to support responsible sharing.</p>
          </div>
          <div className="about-feature-item">
            <h3>Organized Browsing</h3>
            <p>Search and scan note cards in a cleaner layout built for quick studying.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
