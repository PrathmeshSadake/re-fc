"use client";

import type { ResumeData, SectionId } from "@/lib/types";
import { SECTION_LABELS } from "@/lib/types";

function SectionView({ data, id }: { data: ResumeData; id: SectionId }) {
  if (id === "summary") {
    if (!data.summary.trim()) return null;
    return (
      <section>
        <h3>{SECTION_LABELS.summary}</h3>
        <p>{data.summary}</p>
      </section>
    );
  }
  if (id === "experience") {
    if (data.experience.length === 0) return null;
    return (
      <section>
        <h3>{SECTION_LABELS.experience}</h3>
        {data.experience.map((item) => (
          <article key={item.id}>
            <header>
              <strong>{[item.jobTitle, item.employer].filter(Boolean).join(", ") || "Role"}</strong>
              <span>
                {[item.location, [item.start, item.end].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}
              </span>
            </header>
            {item.summary ? <p>{item.summary}</p> : null}
          </article>
        ))}
      </section>
    );
  }
  if (id === "education") {
    if (data.education.length === 0) return null;
    return (
      <section>
        <h3>{SECTION_LABELS.education}</h3>
        {data.education.map((item) => (
          <article key={item.id}>
            <header>
              <strong>{item.degree || "Degree"}</strong>
              <span>
                {[item.school, item.location, [item.start, item.end].filter(Boolean).join(" – ")]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </header>
          </article>
        ))}
      </section>
    );
  }
  if (data.skills.length === 0) return null;
  return (
    <section>
      <h3>{SECTION_LABELS.skills}</h3>
      <ul className="skills">
        {data.skills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </section>
  );
}

export function Preview({ data }: { data: ResumeData }) {
  const header = (
    <header className="sheet-head">
      <h2>{data.fullName || "Your name"}</h2>
      {data.jobTitle ? <p className="role">{data.jobTitle}</p> : null}
      <p className="contact">{[data.email, data.phone, data.location].filter(Boolean).join("  ·  ")}</p>
    </header>
  );

  if (data.template === "sidebar") {
    const main = data.sectionOrder.filter((id) => id !== "skills");
    return (
      <article className="sheet sidebar" id="resume-preview" aria-label="Resume preview">
        <aside>
          {header}
          <SectionView data={data} id="skills" />
        </aside>
        <div>
          {main.map((id) => (
            <SectionView key={id} data={data} id={id} />
          ))}
        </div>
      </article>
    );
  }

  return (
    <article className="sheet" id="resume-preview" aria-label="Resume preview">
      {header}
      {data.sectionOrder.map((id) => (
        <SectionView key={id} data={data} id={id} />
      ))}
    </article>
  );
}
