"use client";

import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { ResumeData, SectionId } from "@/lib/types";
import { SECTION_LABELS } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: "#1c1917",
    lineHeight: 1.35,
  },
  row: { flexDirection: "row" },
  sidebar: {
    width: 160,
    paddingRight: 16,
    marginRight: 16,
    borderRightWidth: 1,
    borderRightColor: "#d6d3d1",
  },
  main: { flex: 1 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  title: { fontSize: 11, color: "#44403c", marginBottom: 6 },
  contact: { fontSize: 9, color: "#57534e", marginBottom: 12 },
  heading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 4,
    paddingBottom: 2,
    borderBottomWidth: 0.6,
    borderBottomColor: "#a8a29e",
  },
  itemTitle: { fontFamily: "Helvetica-Bold" },
  meta: { fontSize: 9, color: "#57534e", marginBottom: 2 },
  body: { marginBottom: 6 },
  skill: { fontSize: 10, marginBottom: 2 },
});

function Contact({ data }: { data: ResumeData }) {
  const line = [data.email, data.phone, data.location].filter(Boolean).join("  ·  ");
  return <Text style={styles.contact}>{line}</Text>;
}

function SectionBlock({ data, id }: { data: ResumeData; id: SectionId }) {
  if (id === "summary") {
    if (!data.summary.trim()) return null;
    return (
      <View>
        <Text style={styles.heading}>{SECTION_LABELS.summary}</Text>
        <Text style={styles.body}>{data.summary}</Text>
      </View>
    );
  }
  if (id === "experience") {
    if (data.experience.length === 0) return null;
    return (
      <View>
        <Text style={styles.heading}>{SECTION_LABELS.experience}</Text>
        {data.experience.map((item) => (
          <View key={item.id} style={styles.body}>
            <Text style={styles.itemTitle}>
              {[item.jobTitle, item.employer].filter(Boolean).join(", ") || "Role"}
            </Text>
            <Text style={styles.meta}>
              {[item.location, [item.start, item.end].filter(Boolean).join(" – ")].filter(Boolean).join("  ·  ")}
            </Text>
            {item.summary ? <Text>{item.summary}</Text> : null}
          </View>
        ))}
      </View>
    );
  }
  if (id === "education") {
    if (data.education.length === 0) return null;
    return (
      <View>
        <Text style={styles.heading}>{SECTION_LABELS.education}</Text>
        {data.education.map((item) => (
          <View key={item.id} style={styles.body}>
            <Text style={styles.itemTitle}>{item.degree || "Degree"}</Text>
            <Text style={styles.meta}>
              {[item.school, item.location, [item.start, item.end].filter(Boolean).join(" – ")]
                .filter(Boolean)
                .join("  ·  ")}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  if (data.skills.length === 0) return null;
  return (
    <View>
      <Text style={styles.heading}>{SECTION_LABELS.skills}</Text>
      {data.skills.map((skill) => (
        <Text key={skill} style={styles.skill}>
          {skill}
        </Text>
      ))}
    </View>
  );
}

function ResumePdf({ data }: { data: ResumeData }) {
  const blocks = data.sectionOrder.map((id) => <SectionBlock key={id} data={data} id={id} />);
  const header = (
    <View>
      <Text style={styles.name}>{data.fullName || "Your name"}</Text>
      {data.jobTitle ? <Text style={styles.title}>{data.jobTitle}</Text> : null}
    </View>
  );

  if (data.template === "sidebar") {
    const mainOrder = data.sectionOrder.filter((id) => id !== "skills");
    return (
      <Document title={data.fullName || "Resume"} author="re-fc">
        <Page size="LETTER" style={styles.page}>
          <View style={styles.row}>
            <View style={styles.sidebar}>
              {header}
              <Contact data={data} />
              <SectionBlock data={data} id="skills" />
            </View>
            <View style={styles.main}>
              {mainOrder.map((id) => (
                <SectionBlock key={id} data={data} id={id} />
              ))}
            </View>
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document title={data.fullName || "Resume"} author="re-fc">
      <Page size="LETTER" style={styles.page}>
        {header}
        <Contact data={data} />
        {blocks}
      </Page>
    </Document>
  );
}

export async function downloadResume(data: ResumeData) {
  const blob = await pdf(<ResumePdf data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const slug = (data.fullName || "resume").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `${slug || "resume"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
