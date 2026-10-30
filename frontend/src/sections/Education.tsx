
import { Section, Chip } from "../components/ui";
import { education } from "../data/profile";

export function Education() {
  // Display education chronologically, oldest first.
  const items = [education[2], education[1], education[0]];

  return (
    <Section
      id="education"
      eyebrow="Academic Background"
      title="Education"
    >
      <ol className="timeline education-timeline">
        {items.map((e, index) => {
          const isUndergraduate = e.id === "bit";

          const qualification =
            e.id === "icse"
              ? "10th Standard · ICSE"
              : e.id === "puc"
                ? "2nd PUC · Karnataka Pre-University Board"
                : "Bachelor of Engineering";

          return (
            <li key={e.id} className="card edu education-card">
              <div className="education-main">
                <div className="education-heading">
                  <span className="education-index mono">
                    0{index + 1}
                  </span>

                  <div>
                    <p className="mono muted education-meta">
                      {e.years} · {e.level}
                    </p>

                    <h3 className="h3 education-school">
                      {e.school}
                    </h3>

                    <p className="education-qualification">
                      {qualification}
                    </p>
                  </div>
                </div>

                <div className="education-details">
                  <div className="education-detail-card">
                    <span className="education-label">
                      Qualification
                    </span>
                    <p>{e.title}</p>
                  </div>

                  {e.id === "puc" && (
                    <div className="education-detail-card">
                      <span className="education-label">
                        Stream
                      </span>
                      <p>
                        PCMB — Physics, Chemistry, Mathematics
                        and Biology
                      </p>
                    </div>
                  )}

                  {isUndergraduate && e.notes.length > 0 && (
                    <div className="education-detail-card coursework-card">
                      <span className="education-label">
                        Relevant Coursework
                      </span>

                      <div className="chips education-chips">
                        {e.notes.map((note) => (
                          <Chip key={note}>{note}</Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <aside
                className="education-score"
                aria-label={
                  e.id === "bit"
                    ? `CGPA: ${e.score}`
                    : `Academic score: ${e.score}`
                }
              >
                <span className="education-label">
                  {e.id === "bit"
                    ? "CGPA"
                    : "Score"}
                </span>

                <span className="display education-score-value">
                  {e.score}
                </span>

                {e.id === "bit" && (
                  <span className="education-score-scale">
                    out of 10
                  </span>
                )}
              </aside>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
