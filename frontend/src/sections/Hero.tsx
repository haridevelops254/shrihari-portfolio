
import { ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { profile } from "../data/profile";

export function Hero() {
  return (
    <section className="hero hero-centered" aria-labelledby="hero-h">
      <div className="container hero-content">
        <img
          className="hero-portrait"
          src="/images/shrihari-mv.jpg"
          alt="Portrait of Shrihari M V"
        />

        <p className="eyebrow mono">
          SOFTWARE ENGINEERING · APPLIED AI · DATA SCIENCE
        </p>

        <h1 id="hero-h" className="display hero-title">
          Hi, I’m Shrihari M V.
        </h1>

        <p className="hero-summary">
          I build practical software and AI systems—from data preparation and
          model evaluation to APIs, product interfaces, and reliable workflows.
          I enjoy turning complex ideas into useful, understandable experiences,
          while staying curious, collaborative, and honest about what is tested
          and what is still evolving.
        </p>

        <p className="mono muted identity">
          {profile.degree} · {profile.institution} · Class of 2026
        </p>

        <div className="row wrap gap hero-actions">
          <Link className="btn btn-primary" to="/#projects">
            Explore projects <ArrowRight size={16} aria-hidden />
          </Link>

          <Link className="btn btn-secondary" to="/#resumes">
            View role-specific resumes
          </Link>

          <Link className="btn btn-ghost" to="/#contact">
            Contact me
          </Link>
        </div>

        <div className="hero-socials" aria-label="Professional links">
          <a href={profile.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>

          <a href={profile.github} target="_blank" rel="noreferrer">
            GitHub
          </a>

          <a href={`mailto:${profile.email}`}>
            <Mail size={17} aria-hidden /> Email
          </a>
        </div>
      </div>
    </section>
  );
}
