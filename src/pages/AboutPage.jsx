// About.jsx

import "./About.css";

export default function About() {
  return (
    <main className="about-page">
      {/* ABOUT CONTENT */}
      <section className="about-hero">
        {/* LEFT IMAGE */}
        <div className="about-main-image">
          <img
            src="/Ai.jpg"
            alt="Lara's Crochet"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div className="about-right">
          {/* Heading + Lara image */}
          <div className="about-intro">
            <h1>This is Lara’s Crochet</h1>

            <div className="meet-lara">
              <span>MEET LARA</span>

              <img
                src="/download (66).jpg"
                alt="Lara"
              />
            </div>
          </div>

          {/* Description */}
          <div className="about-description">
            <p>
              At Lara’s Crochet, every piece here starts as a single strand
              of yarn and a pair of hands, no factories, no shortcuts.
              Made-to-order, one piece at a time, out of Lagos, Nigeria.
            </p>

            <a href="/contact">
              Connect with Lara’s Crochet
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}