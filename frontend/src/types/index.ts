export type Tag = 'Implemented' | 'Experimented' | 'Conceptual' | 'Proposed';
export interface Item { t: string; s: Tag }
export interface Project {
  slug: string; name: string; tagline: string; categories: string[]; tools: string[];
  repo?: string; demo?: string; overview: string; problem: string; architecture: string[];
  implementation: Item[]; experiments: Item[]; results: { label: string; value: string }[]; resultsNote: string;
  failureModes: string[]; alternatives: Item[]; learned: string[]; future: Item[]; achievement?: string; noRepoNote?: string;
}
export type SkillLevel = 'Implemented' | 'Experimented' | 'Explored' | 'Foundational' | 'Future direction';
export interface Skill { name: string; level: SkillLevel; evidence: string; group: string }
export interface Story { id: string; title: string; label: Tag; projects: string[]; problem: string; constraints: string; alternatives: string; decision: string; experiment: string; result: string; limitations: string; next: string }
export interface Stream {
  id: string; name: string; overview: string; projects: string[]; tools: string[]; coursework: string[];
  evidence: string[]; experiments: string[]; pipeline: string; alternatives: string[]; tradeoffs: string[];
  failureModes: string[]; exploring: string[];
}
export interface PipelineStep { name: string; does: string; fail: string; evaluate: string; status: Tag }
export interface Pipeline { id: string; name: string; evidence: string; steps: PipelineStep[]; alternatives: { topic: string; options: string[]; note: string }[] }
export interface CourseGroup { id: string; title: string; courses: string[]; projects: string[]; streams: string[] }
