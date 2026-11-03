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
          AI / ML ENGINEERING · APPLIED AI · DEEP LEARNING
        </p>

        <h1 id="hero-h" className="display hero-title">
          Hi, I’m Shrihari M V.
        </h1>

        <p className="hero-summary">
          I focus on building practical AI and machine learning solutions,
          from data preparation and model development to experimentation,
          evaluation, and deployment. My interests include applied machine
          learning, deep learning, computer vision, and generative AI.
          I use data science to make informed modelling decisions and
          software engineering to turn intelligent models into useful,
          reliable applications.
        </p>

        <p className="mono muted identity">
          {profile.degree} · {profile.institution} · Class of 2026
        </p>

        <div className="row wrap gap hero-actions">
          <Link className="btn btn-primary" to="/#projects">
            Explore AI/ML projects <ArrowRight size={16} aria-hidden />
          </Link>

          <Link className="btn btn-secondary" to="/#resumes">
            View AI/ML resume
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
