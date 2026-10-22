"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sampleResume } from "./sample";
import type { Education, Experience, ResumeData, SectionId, TemplateId } from "./types";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

type ResumeStore = ResumeData & {
  setPersonal: (patch: Partial<Pick<ResumeData, "fullName" | "jobTitle" | "email" | "phone" | "location">>) => void;
  setSummary: (summary: string) => void;
  updateExperience: (id: string, patch: Partial<Experience>) => void;
  addExperience: () => void;
  removeExperience: (id: string) => void;
  updateEducation: (id: string, patch: Partial<Education>) => void;
  addEducation: () => void;
  removeEducation: (id: string) => void;
  setSkills: (skills: string[]) => void;
  reorderSections: (activeId: string, overId: string) => void;
  setTemplate: (template: TemplateId) => void;
  reset: () => void;
};

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      ...sampleResume,
      setPersonal: (patch) => set(patch),
      setSummary: (summary) => set({ summary }),
      updateExperience: (id, patch) =>
        set((state) => ({
          experience: state.experience.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addExperience: () =>
        set((state) => ({
          experience: [
            ...state.experience,
            {
              id: uid("exp"),
              jobTitle: "",
              employer: "",
              location: "",
              start: "",
              end: "",
              summary: "",
            },
          ],
        })),
      removeExperience: (id) =>
        set((state) => ({ experience: state.experience.filter((item) => item.id !== id) })),
      updateEducation: (id, patch) =>
        set((state) => ({
          education: state.education.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addEducation: () =>
        set((state) => ({
          education: [
            ...state.education,
            { id: uid("edu"), degree: "", school: "", location: "", start: "", end: "" },
          ],
        })),
      removeEducation: (id) =>
        set((state) => ({ education: state.education.filter((item) => item.id !== id) })),
      setSkills: (skills) => set({ skills }),
      reorderSections: (activeId, overId) =>
        set((state) => {
          const order = [...state.sectionOrder];
          const from = order.indexOf(activeId as SectionId);
          const to = order.indexOf(overId as SectionId);
          if (from < 0 || to < 0 || from === to) return state;
          const [moved] = order.splice(from, 1);
          order.splice(to, 0, moved);
          return { sectionOrder: order };
        }),
      setTemplate: (template) => set({ template }),
      reset: () => set({ ...sampleResume }),
    }),
    { name: "re-fc-resume" },
  ),
);

export function selectResume(state: ResumeStore): ResumeData {
  return {
    fullName: state.fullName,
    jobTitle: state.jobTitle,
    email: state.email,
    phone: state.phone,
    location: state.location,
    summary: state.summary,
    experience: state.experience,
    education: state.education,
    skills: state.skills,
    sectionOrder: state.sectionOrder,
    template: state.template,
  };
}
