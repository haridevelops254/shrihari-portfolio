import type { CourseGroup } from '../types';
export const coursework: CourseGroup[] = [
  { id: 'prog', title: 'Programming and algorithms', projects: ['attrishield', 'studymentor'], streams: ['software', 'backend'],
    courses: ['Principles of Programming using C', 'Introduction to Python Programming', 'Object-Oriented Programming with Java', 'Data Structures and Applications', 'Data Structures Lab', 'Analysis and Design of Algorithms', 'Analysis and Design Algorithms Lab', 'Algorithm Applications', 'MERN'] },
  { id: 'math', title: 'Mathematics and quantitative foundations', projects: ['attrishield'], streams: ['ds', 'ml'],
    courses: ['Mathematics', 'Discrete Mathematical Structures', 'Mathematics for Computer Science', 'Statistical Machine Learning for Data Science', 'Operations Research'] },
  { id: 'db', title: 'Databases and analytics', projects: ['screen-supremacy'], streams: ['analytics', 'bi'],
    courses: ['Database Management Systems', 'Data Warehousing', 'Big Data Analytics', 'Exploratory Data Analysis', 'Data Analytics with Excel', 'Data Visualization Lab'] },
  { id: 'cs', title: 'Computer science and systems', projects: ['sleep-alert'], streams: ['software', 'backend'],
    courses: ['Operating Systems', 'Computer Networks', 'Theory of Computation', 'Digital Design and Computer Organization', 'Parallel Programming', 'Microcontrollers'] },
  { id: 'ai', title: 'AI and advanced computing', projects: ['attrishield', 'aksharavision', 'carnaticprep', 'studymentor'], streams: ['ml', 'cv', 'genai', 'agentic'],
    courses: ['Artificial Intelligence and Machine Learning', 'Machine Learning Lab', 'Deep Learning', 'Generative AI', 'Reinforcement Learning', 'Bioinformatics'] },
  { id: 'se', title: 'Software engineering and security', projects: ['studymentor', 'sleep-alert'], streams: ['software', 'backend'],
    courses: ['Software Engineering and Project Management', 'Cryptography', 'Network Security', 'Introduction to Internet of Things'] },
  { id: 'eng', title: 'Engineering and communication', projects: [], streams: ['solutions'],
    courses: ['Introduction to Electrical Engineering', 'Introduction to Electronics Communication', 'Computer-Aided Engineering Drawing', 'Applied Chemistry for CSE', 'Innovation and Design Thinking', 'Research Methodology', 'Methodology and IPR', 'Environment Studies and E-waste Management', 'Managing for Computer Engineers', 'Professional Writing Skills in English', 'Communicative English', 'Scientific Foundations of Health'] },
  { id: 'hum', title: 'Humanities and additional subjects', projects: [], streams: [],
    courses: ['Universal Human Values', 'Indian Constitution', 'Indian Knowledge Systems', 'Samskritika Karnataka', 'National Service Scheme', 'Social Connected Responsibility'] },
];
