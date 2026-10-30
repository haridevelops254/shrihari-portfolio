import { useEffect } from 'react';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Projects } from '../sections/Projects';
import { Stories } from '../sections/Stories';
import { Domains } from '../sections/Domains';
import { Pipelines } from '../sections/Pipelines';
import { Skills } from '../sections/Skills';
import { Education } from '../sections/Education';
import { Coursework } from '../sections/Coursework';
import { Achievements } from '../sections/Achievements';
import { Resumes } from '../sections/Resumes';
import { Contact } from '../sections/Contact';
import { CoCurricular } from '../sections/CoCurricular';

export default function Home() {
  useEffect(() => { document.title = 'Shrihari M V — Engineering Portfolio'; }, []);
  return (<><Hero /><About /><Projects /><Stories /><Domains /><Pipelines /><Skills /><Education /><Coursework /><Achievements /><CoCurricular /><Resumes /><Contact /></>);
}
