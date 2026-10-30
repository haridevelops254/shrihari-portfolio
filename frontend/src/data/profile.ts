export const profile = {
  name: 'Shrihari M V',
  degree: 'B.E. CSE (Data Science)',
  institution: 'Bangalore Institute of Technology',
  email: 'shrihariv16@gmail.com',
  linkedin: 'https://www.linkedin.com/in/shrihari-athreyas',
  github: 'https://github.com/haridevelops559',
};

export const education = [
  { id: 'bit', level: 'Undergraduate', school: 'Bangalore Institute of Technology',
    title: 'Bachelor of Engineering in Computer Science and Engineering (Data Science)', years: '2022–2026',
    score: '8.6', scoreLabel: 'CGPA / 10',
    notes: ['Programming', 'Algorithms', 'Databases', 'Operating systems', 'Networks', 'Mathematics and statistics',
      'Machine learning', 'Deep learning', 'Generative AI', 'Data analytics', 'Data warehousing', 'Software engineering'] },
  { id: 'puc', level: 'Pre-University', school: "Sri Kumaran's PU College",
    title: 'Second Year Pre-University Course (PUC)', years: '2022', score: '94.83%', scoreLabel: 'Final result',
    notes: ['PCMB: Physics, Chemistry, Mathematics, Biology'] },
  { id: 'icse', level: 'Secondary', school: 'RV Public School', title: 'ICSE', years: '2020', score: '96.4%', scoreLabel: 'Final result', notes: [] },
];

export const achievements = [
  { id: 'screen', place: 'First Place', name: 'Screen Supremacy', context: 'CSE-DS department competition', project: 'screen-supremacy',
    evidence: ['200+ participants surveyed', '21 features', '12 focused Power BI dashboards', 'Python, Pandas, BigQuery, Power BI'] },
  { id: 'akshara', place: 'Third Place', name: 'AksharaVision', context: 'Deep-learning department exhibition/competition, among 12+ teams', project: 'aksharavision',
    evidence: ['Kannada handwritten-character recognition', 'Approximately 56,500 images', '113 classes', 'Reported Macro-F1 of 0.9989'] },
];

export const internships = [
  {
    id: 'wisewit', role: 'Software Engineering & Computer Vision Intern', org: 'Wisewit Solutions', period: 'August–November 2026',
    points: [
      'Worked with remote GPU-server workflows through VS Code for computer-vision experimentation.',
      'Prepared image annotations using Roboflow and SAM/DINO-assisted annotation workflows.',
      'Worked with YOLO and Mask2Former model workflows for visual recognition and segmentation tasks.',
      'Handled image resizing and preprocessing to keep dataset inputs consistent.',
      'Reviewed validation metrics to assess model performance and compare experiments.',
    ],
  },
  {
    id: 'mindmatrixed', role: 'Generative AI Intern', org: 'MindMatrixEd', period: 'February–May 2026',
    points: ['Explored AI-assisted Android workflows.', 'Used Google AI Studio and Android Studio.', 'Worked with Kotlin.', 'Focused on feature prototyping and user-centric product design.'],
  },
];

export const exploration = [
  { area: 'Frontend', items: 'React, TypeScript, Next.js', label: 'Implemented in AttriShield and StudyMentor' },
  { area: 'Backend', items: 'FastAPI, Pydantic, API design', label: 'Implemented across several projects' },
  { area: 'Validation', items: 'Zod and typed request/response contracts', label: 'Implemented' },
  { area: 'Databases', items: 'MongoDB, MySQL, PostgreSQL, SQL concepts', label: 'MongoDB implemented; SQL databases explored / foundational' },
  { area: 'ML', items: 'Model comparison, evaluation, calibration, data quality', label: 'Implemented in AttriShield' },
  { area: 'Computer vision', items: 'Preprocessing, augmentation, robustness', label: 'Implemented in AksharaVision' },
  { area: 'RAG', items: 'Hybrid retrieval, RRF, reranking, evaluation', label: 'Implemented; RAGAS evaluation in progress' },
  { area: 'Agentic AI', items: 'Tool calling, routing, state, retries, checkpointing', label: 'Implemented in StudyMentor' },
  { area: 'Analytics', items: 'BigQuery, Power BI, data transformation', label: 'Implemented in Screen Supremacy' },
  { area: 'Deployment', items: 'Git, GitHub, CI, Railway', label: 'Implemented (GitHub Actions, Railway)' },
];

export const approach = [
  { h: 'Data before models', p: 'Data quality, dataset structure, class balance, feature redundancy, leakage prevention and evaluation validity come first.' },
  { h: 'Experimentation before assumptions', p: 'Baselines, model comparisons, metrics, error analysis and informed trade-offs.' },
  { h: 'Models inside systems', p: 'APIs, schemas, storage, frontend integration, validation, observability and deployment.' },
  { h: 'Alternatives and limitations', p: 'Understanding why an approach fits, when alternatives are preferable, and what remains untested.' },
  { h: 'Practical engineering', p: 'Modularity, typed interfaces, reproducibility, automated tests, debugging and documentation.' },
];
