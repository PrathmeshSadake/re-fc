import type { ResumeData } from "./types";

export const sampleResume: ResumeData = {
  fullName: "Jordan Lee",
  jobTitle: "Product Engineer",
  email: "jordan.lee@example.com",
  phone: "+1 555 0148",
  location: "Austin, TX",
  summary:
    "Product engineer who ships small, readable tools. Six years across interface work and the APIs behind them.",
  experience: [
    {
      id: "exp-1",
      jobTitle: "Product Engineer",
      employer: "Northwind Labs",
      location: "Austin, TX",
      start: "2022",
      end: "Present",
      summary:
        "Led the editor for an internal document tool. Cut publish time by keeping preview and export on one data model.",
    },
    {
      id: "exp-2",
      jobTitle: "Software Engineer",
      employer: "Harbor & Co.",
      location: "Remote",
      start: "2019",
      end: "2022",
      summary:
        "Built customer-facing dashboards and the export pipeline behind them.",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.S. Computer Science",
      school: "State University",
      location: "Austin, TX",
      start: "2015",
      end: "2019",
    },
  ],
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Accessibility"],
  sectionOrder: ["summary", "experience", "education", "skills"],
  template: "classic",
};
