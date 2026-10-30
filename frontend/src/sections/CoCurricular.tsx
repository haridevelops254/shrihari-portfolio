import { Mic2, Users, Music2, MessagesSquare } from 'lucide-react';
import { Section } from '../components/ui';

const activities = [
  { icon: Users, title: 'TEDx BIT Bangalore', detail: 'Networking, pitching, interpersonal communication, and event operations.' },
  { icon: Mic2, title: 'The Arts and Dramatic Society, BIT Bangalore', detail: 'Hosting, coordination and operations, reporting, documentation, and brainstorming.' },
  { icon: MessagesSquare, title: 'Academic and literary activities', detail: 'School- and college-level debates, elocution, declamation, quizzes, essay writing, and a National Mathematics Day presentation.' },
  { icon: Music2, title: 'Music and performance', detail: 'Carnatic music, light music, and flashmob dance.' },
];

export function CoCurricular() {
  return (
    <Section id="beyond-tech" eyebrow="Beyond technology" title="Communication, culture & collaboration" intro="Experiences that complement technical work: communicating ideas, coordinating with people, contributing creatively, and presenting with confidence.">
      <div className="grid g2 activity-grid">
        {activities.map(({ icon: Icon, title, detail }) => (
          <article className="card activity-card" key={title}>
            <span className="activity-icon"><Icon size={22} aria-hidden="true" /></span>
            <div><h3 className="h3">{title}</h3><p>{detail}</p></div>
          </article>
        ))}
      </div>
    </Section>
  );
}
