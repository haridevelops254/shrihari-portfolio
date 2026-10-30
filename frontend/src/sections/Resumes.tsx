import { Download, ExternalLink, FileText } from 'lucide-react';
import { Section } from '../components/ui';

type Resume = {
  title: string;
  focus: string;
  description: string;
  file: string;
  tags: string[];
};

const resumes: Resume[] = [
  {
    title: 'Software Engineering',
    focus: 'Full-stack · SWE · Product Engineering',
    description: 'Highlights software design, frontend and backend integration, API development, testing, reliability, and end-to-end application delivery.',
    file: '/resumes/shrihari-software-engineering-resume.pdf',
    tags: ['Python', 'TypeScript', 'React', 'FastAPI', 'Testing'],
  },
  {
    title: 'Backend Engineering',
    focus: 'Backend · APIs · Platform Engineering',
    description: 'Emphasizes API architecture, validation, asynchronous services, data persistence, workflow reliability, and backend testing.',
    file: '/resumes/shrihari-backend-engineering-resume.pdf',
    tags: ['Python', 'FastAPI', 'SQL', 'MongoDB', 'Pytest'],
  },
  {
    title: 'Generative AI Engineering',
    focus: 'GenAI · RAG · Agentic AI',
    description: 'Focuses on retrieval-augmented generation, hybrid search, reranking, tool-using workflows, structured outputs, and evaluation.',
    file: '/resumes/shrihari-generative-ai-resume.pdf',
    tags: ['RAG', 'LangGraph', 'Embeddings', 'LLMs', 'FastAPI'],
  },
  {
    title: 'AI / ML & Data Science',
    focus: 'Machine Learning · Deep Learning · Applied AI',
    description: 'Highlights computer vision, predictive modeling, dataset curation, model evaluation, calibration, explainability, and deployment workflows.',
    file: '/resumes/shrihari-ai-ml-data-science-resume.pdf',
    tags: ['PyTorch', 'Scikit-learn', 'OpenCV', 'XGBoost', 'MLflow'],
  },
];

export function Resumes() {
  return (
    <Section id="resumes" eyebrow="Resumes" title="Role-specific resumes">
      <p className="lede">Choose the version that best matches the role. Each PDF can be previewed in your browser or downloaded for later.</p>
      <div className="grid g2 resume-grid">
        {resumes.map((resume) => (
          <article className="card resume-card" key={resume.file}>
            <div className="resume-card-heading">
              <span className="resume-icon" aria-hidden="true"><FileText size={22} /></span>
              <div>
                <h3 className="h3">{resume.title}</h3>
                <p className="muted small">{resume.focus}</p>
              </div>
            </div>
            <p>{resume.description}</p>
            <div className="chips" aria-label={`${resume.title} skills`}>
              {resume.tags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
            </div>
            <div className="row wrap gap resume-actions">
              <a className="btn btn-primary" href={resume.file} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden /> View PDF</a>
              <a className="btn btn-ghost" href={resume.file} download><Download size={16} aria-hidden /> Download</a>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
