export type SectionId = "summary" | "experience" | "education" | "skills";

export type TemplateId = "classic" | "sidebar";

export type Experience = {
  id: string;
  jobTitle: string;
  employer: string;
  location: string;
  start: string;
  end: string;
  summary: string;
};

export type Education = {
  id: string;
  degree: string;
  school: string;
  location: string;
  start: string;
  end: string;
};

export type ResumeData = {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  sectionOrder: SectionId[];
  template: TemplateId;
};

export const SECTION_LABELS: Record<SectionId, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
};
