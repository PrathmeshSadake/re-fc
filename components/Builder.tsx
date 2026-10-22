"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Preview } from "@/components/Preview";
import { selectResume, useResumeStore } from "@/lib/store";
import { SECTION_LABELS, type SectionId } from "@/lib/types";

function Field({
  label,
  value,
  onChange,
  name,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
}) {
  return (
    <label>
      {label}
      <input name={name} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SortableSection({ id, children }: { id: SectionId; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <section
      ref={setNodeRef}
      className={isDragging ? "card dragging" : "card"}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <header className="card-head">
        <button type="button" className="handle" aria-label={`Reorder ${SECTION_LABELS[id]}`} {...attributes} {...listeners}>
          ⋮⋮
        </button>
        <h2>{SECTION_LABELS[id]}</h2>
      </header>
      {children}
    </section>
  );
}

export default function Builder() {
  const resume = useResumeStore(selectResume);
  const setPersonal = useResumeStore((state) => state.setPersonal);
  const setSummary = useResumeStore((state) => state.setSummary);
  const updateExperience = useResumeStore((state) => state.updateExperience);
  const addExperience = useResumeStore((state) => state.addExperience);
  const removeExperience = useResumeStore((state) => state.removeExperience);
  const updateEducation = useResumeStore((state) => state.updateEducation);
  const addEducation = useResumeStore((state) => state.addEducation);
  const removeEducation = useResumeStore((state) => state.removeEducation);
  const setSkills = useResumeStore((state) => state.setSkills);
  const reorderSections = useResumeStore((state) => state.reorderSections);
  const setTemplate = useResumeStore((state) => state.setTemplate);
  const reset = useResumeStore((state) => state.reset);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderSections(String(active.id), String(over.id));
  }

  async function onDownload() {
    setBusy(true);
    setError("");
    try {
      const { downloadResume } = await import("@/components/pdf");
      await downloadResume(useResumeStore.getState());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not build the PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">re-fc</p>
          <h1>Resume builder</h1>
        </div>
        <div className="toolbar">
          <div className="segmented" role="group" aria-label="Template">
            <button
              type="button"
              aria-pressed={resume.template === "classic"}
              onClick={() => setTemplate("classic")}
            >
              Classic
            </button>
            <button
              type="button"
              aria-pressed={resume.template === "sidebar"}
              onClick={() => setTemplate("sidebar")}
            >
              Sidebar
            </button>
          </div>
          <button type="button" className="ghost" onClick={reset}>
            Reset sample
          </button>
          <button type="button" className="primary" onClick={onDownload} disabled={busy}>
            {busy ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>
      </header>
      {error ? <p className="error">{error}</p> : null}
      <div className="workspace">
        <form
          className="editor"
          onSubmit={(event) => event.preventDefault()}
        >
          <section className="card">
            <h2>Personal info</h2>
            <div className="grid">
              <Field label="Full name" name="fullName" value={resume.fullName} onChange={(fullName) => setPersonal({ fullName })} />
              <Field label="Title" name="jobTitle" value={resume.jobTitle} onChange={(jobTitle) => setPersonal({ jobTitle })} />
              <Field label="Email" name="email" value={resume.email} onChange={(email) => setPersonal({ email })} />
              <Field label="Phone" name="phone" value={resume.phone} onChange={(phone) => setPersonal({ phone })} />
              <Field label="Location" name="location" value={resume.location} onChange={(location) => setPersonal({ location })} />
            </div>
          </section>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={resume.sectionOrder} strategy={verticalListSortingStrategy}>
              {resume.sectionOrder.map((id) => (
                <SortableSection key={id} id={id}>
                  {id === "summary" ? (
                    <label>
                      Summary
                      <textarea value={resume.summary} onChange={(event) => setSummary(event.target.value)} rows={4} />
                    </label>
                  ) : null}
                  {id === "experience" ? (
                    <div className="stack">
                      {resume.experience.map((item) => (
                        <fieldset key={item.id}>
                          <legend>{item.jobTitle || "New role"}</legend>
                          <div className="grid">
                            <Field label="Job title" name={`job-${item.id}`} value={item.jobTitle} onChange={(jobTitle) => updateExperience(item.id, { jobTitle })} />
                            <Field label="Employer" name={`employer-${item.id}`} value={item.employer} onChange={(employer) => updateExperience(item.id, { employer })} />
                            <Field label="Location" name={`loc-${item.id}`} value={item.location} onChange={(location) => updateExperience(item.id, { location })} />
                            <Field label="Start" name={`start-${item.id}`} value={item.start} onChange={(start) => updateExperience(item.id, { start })} />
                            <Field label="End" name={`end-${item.id}`} value={item.end} onChange={(end) => updateExperience(item.id, { end })} />
                          </div>
                          <label>
                            Description
                            <textarea value={item.summary} rows={3} onChange={(event) => updateExperience(item.id, { summary: event.target.value })} />
                          </label>
                          <button type="button" className="text" onClick={() => removeExperience(item.id)}>
                            Remove role
                          </button>
                        </fieldset>
                      ))}
                      <button type="button" onClick={addExperience}>
                        Add experience
                      </button>
                    </div>
                  ) : null}
                  {id === "education" ? (
                    <div className="stack">
                      {resume.education.map((item) => (
                        <fieldset key={item.id}>
                          <legend>{item.school || "New school"}</legend>
                          <div className="grid">
                            <Field label="Degree" name={`degree-${item.id}`} value={item.degree} onChange={(degree) => updateEducation(item.id, { degree })} />
                            <Field label="School" name={`school-${item.id}`} value={item.school} onChange={(school) => updateEducation(item.id, { school })} />
                            <Field label="Location" name={`edu-loc-${item.id}`} value={item.location} onChange={(location) => updateEducation(item.id, { location })} />
                            <Field label="Start" name={`edu-start-${item.id}`} value={item.start} onChange={(start) => updateEducation(item.id, { start })} />
                            <Field label="End" name={`edu-end-${item.id}`} value={item.end} onChange={(end) => updateEducation(item.id, { end })} />
                          </div>
                          <button type="button" className="text" onClick={() => removeEducation(item.id)}>
                            Remove school
                          </button>
                        </fieldset>
                      ))}
                      <button type="button" onClick={addEducation}>
                        Add education
                      </button>
                    </div>
                  ) : null}
                  {id === "skills" ? (
                    <label>
                      One skill per line
                      <textarea
                        value={resume.skills.join("\n")}
                        rows={5}
                        onChange={(event) =>
                          setSkills(
                            event.target.value
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                    </label>
                  ) : null}
                </SortableSection>
              ))}
            </SortableContext>
          </DndContext>
        </form>
        <div className="stage">
          <p className="stage-label">Live preview · US Letter</p>
          <div className="stage-scroll">
            <Preview data={resume} />
          </div>
        </div>
      </div>
    </div>
  );
}
