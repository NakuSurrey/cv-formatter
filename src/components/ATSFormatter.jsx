import { useState, useRef } from "react";

const EMPTY_EXP = { title: "", company: "", location: "", startDate: "", endDate: "", bullets: [""] };
const EMPTY_PROJECT = { name: "", description: "", skills: "", githubLink: "", demoLink: "", bullets: [""] };

const C = {
  bg: "#0c0d12", surface: "#151722", surfaceAlt: "#1b1e2e", border: "#262a3d",
  accent: "#7c6aff", accentHover: "#6b58f0", accentSoft: "rgba(124,106,255,0.1)",
  text: "#e4e2ee", muted: "#7d7b8e", dim: "#4e4d5c",
  success: "#34d399", successBg: "rgba(52,211,153,0.08)",
  danger: "#f87171", white: "#fff",
  pt: "#fbbf24", ptBg: "rgba(251,191,36,0.08)", ptBorder: "rgba(251,191,36,0.25)",
  ft: "#7c6aff", ftBg: "rgba(124,106,255,0.08)", ftBorder: "rgba(124,106,255,0.25)",
};

export default function ATSFormatter() {
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(0);
  const [templateFile, setTemplateFile] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [profile, setProfile] = useState("");
  const [skills, setSkills] = useState("");
  const [experiences, setExperiences] = useState([{ ...EMPTY_EXP }]);
  const [projects, setProjects] = useState([{ ...EMPTY_PROJECT }]);
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f?.name.endsWith(".docx")) { setTemplateFile(f); setTemplateName(f.name); setError(""); }
    else setError("Please upload a .docx file");
  };

  // Experience helpers
  const addExp = () => setExperiences([...experiences, { ...EMPTY_EXP }]);
  const rmExp = (i) => setExperiences(experiences.filter((_, x) => x !== i));
  const updExp = (i, k, v) => { const c = [...experiences]; c[i] = { ...c[i], [k]: v }; setExperiences(c); };
  const addExpB = (i) => { const c = [...experiences]; c[i].bullets = [...c[i].bullets, ""]; setExperiences(c); };
  const updExpB = (i, b, v) => { const c = [...experiences]; c[i].bullets = [...c[i].bullets]; c[i].bullets[b] = v; setExperiences(c); };
  const rmExpB = (i, b) => { const c = [...experiences]; c[i].bullets = c[i].bullets.filter((_, x) => x !== b); setExperiences(c); };

  // Project helpers
  const addProj = () => setProjects([...projects, { ...EMPTY_PROJECT }]);
  const rmProj = (i) => setProjects(projects.filter((_, x) => x !== i));
  const updProj = (i, k, v) => { const c = [...projects]; c[i] = { ...c[i], [k]: v }; setProjects(c); };
  const addProjB = (i) => { const c = [...projects]; c[i].bullets = [...c[i].bullets, ""]; setProjects(c); };
  const updProjB = (i, b, v) => { const c = [...projects]; c[i].bullets = [...c[i].bullets]; c[i].bullets[b] = v; setProjects(c); };
  const rmProjB = (i, b) => { const c = [...projects]; c[i].bullets = c[i].bullets.filter((_, x) => x !== b); setProjects(c); };

  // ── XML helpers ──
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const rpr = (extra = "") => `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/>${extra}</w:rPr>`;

  const textRun = (text) => `<w:r>${rpr()}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
  const boldRun = (text) => `<w:r>${rpr("<w:b/><w:bCs/>")}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
  const italicRun = (text) => `<w:r>${rpr("<w:i/><w:iCs/>")}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
  const linkRun = (label, url) => `<w:r>${rpr('<w:color w:val="0563C1"/><w:u w:val="single"/>')}<w:t xml:space="preserve">${esc(label)}: ${esc(url)}</w:t></w:r>`;

  function buildExpXml() {
    let x = "";
    for (const e of experiences) {
      if (!e.title && !e.company) continue;
      // Title + dates
      x += `<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="9360"/></w:tabs><w:spacing w:after="20"/></w:pPr>`;
      x += boldRun(e.title);
      if (e.startDate || e.endDate) x += `<w:r>${rpr()}<w:tab/><w:t xml:space="preserve">${esc(e.startDate)}${e.endDate ? " \u2013 " + esc(e.endDate) : ""}</w:t></w:r>`;
      x += `</w:p>`;
      // Company
      x += `<w:p><w:pPr><w:spacing w:after="40"/></w:pPr>${italicRun(e.company + (e.location ? ", " + e.location : ""))}</w:p>`;
      // Bullets
      for (const b of e.bullets) {
        if (!b.trim()) continue;
        x += `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="20"/></w:pPr>${textRun(b)}</w:p>`;
      }
      x += `<w:p><w:pPr><w:spacing w:after="80"/></w:pPr></w:p>`;
    }
    return x;
  }

  function buildProjXml() {
    let x = "";
    for (const p of projects) {
      if (!p.name) continue;
      // Name (bold) | Skills (bold) | Links
      x += `<w:p><w:pPr><w:spacing w:after="20"/></w:pPr>`;
      x += boldRun(p.name);
      if (p.skills) { x += textRun(" | "); x += boldRun(p.skills); }
      if (p.githubLink || p.demoLink) {
        x += textRun(" | ");
        if (p.githubLink) x += linkRun("GitHub", p.githubLink);
        if (p.githubLink && p.demoLink) x += textRun(" | ");
        if (p.demoLink) x += linkRun("Demo", p.demoLink);
      }
      x += `</w:p>`;
      // Description
      if (p.description) x += `<w:p><w:pPr><w:spacing w:after="40"/></w:pPr>${textRun(p.description)}</w:p>`;
      // Bullets
      for (const b of p.bullets) {
        if (!b.trim()) continue;
        x += `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="20"/></w:pPr>${textRun(b)}</w:p>`;
      }
      x += `<w:p><w:pPr><w:spacing w:after="80"/></w:pPr></w:p>`;
    }
    return x;
  }

  // Replace placeholder — handles Word splitting text across runs
  function replacePH(xml, ph, replacement, isMultiPara = false) {
    // Try direct
    if (xml.includes(ph)) {
      if (isMultiPara) {
        const ePh = ph.replace(/[{}]/g, c => `\\${c}`);
        const re = new RegExp(`<w:p\\b[^>]*>(?:(?!<w:p\\b).)*?${ePh}(?:(?!<\\/w:p>).)*<\\/w:p>`, "s");
        const m = xml.match(re);
        if (m) return xml.replace(m[0], replacement);
      }
      return xml.replace(ph, `</w:t></w:r>${replacement}<w:r>${rpr()}<w:t xml:space="preserve">`);
    }
    // Handle split across runs
    const chars = ph.split("");
    let pat = chars.map(c => esc(c).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("(?:</w:t></w:r>.*?<w:r>.*?<w:t[^>]*>)?");
    const re = new RegExp(pat, "s");
    const m = xml.match(re);
    if (m) {
      if (isMultiPara) {
        const paraRe = new RegExp(`<w:p\\b[^>]*>(?:(?!<w:p\\b).)*?${m[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:(?!<\\/w:p>).)*<\\/w:p>`, "s");
        const pm = xml.match(paraRe);
        if (pm) return xml.replace(pm[0], replacement);
      }
      return xml.replace(m[0], `</w:t></w:r>${replacement}<w:r>${rpr()}<w:t xml:space="preserve">`);
    }
    return xml;
  }

  // Remove section heading + placeholder paragraph
  function removeSection(xml, ph, title) {
    let r = xml;
    const hRe = new RegExp(`<w:p\\b[^>]*>(?:(?!<w:p\\b).)*?${title}(?:(?!<\\/w:p>).)*<\\/w:p>`, "s");
    r = r.replace(hRe, "");
    const pEsc = ph.replace(/[{}]/g, c => `\\${c}`);
    const pRe = new RegExp(`<w:p\\b[^>]*>(?:(?!<w:p\\b).)*?${pEsc}(?:(?!<\\/w:p>).)*<\\/w:p>`, "s");
    r = r.replace(pRe, "");
    return r;
  }

  // ── GENERATE ──
  async function generate() {
    setGenerating(true); setError(""); setDownloadUrl(null);
    try {
      // Load JSZip dynamically
      if (!window.JSZip) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
          s.onload = res; s.onerror = () => rej(new Error("Failed to load JSZip"));
          document.head.appendChild(s);
        });
      }

      const buf = await templateFile.arrayBuffer();
      const zip = await window.JSZip.loadAsync(buf);
      let xml = await zip.file("word/document.xml").async("string");

      // Replace Profile
      xml = replacePH(xml, "{{PROFILE}}", textRun(profile));
      // Replace Skills (bold)
      xml = replacePH(xml, "{{SKILLS}}", boldRun(skills));

      if (mode === "part-time") {
        xml = replacePH(xml, "{{EXPERIENCE}}", buildExpXml(), true);
        xml = removeSection(xml, "{{PROJECTS}}", "PROJECTS");
      } else {
        xml = replacePH(xml, "{{PROJECTS}}", buildProjXml(), true);
        xml = removeSection(xml, "{{EXPERIENCE}}", "EXPERIENCE");
      }

      zip.file("word/document.xml", xml);
      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStep(3);
    } catch (e) {
      console.error(e);
      setError("Generation failed: " + e.message);
    }
    setGenerating(false);
  }

  const download = () => {
    if (!downloadUrl) return;
    const name = jobTitle.trim().replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase() || "resume";
    const a = document.createElement("a"); a.href = downloadUrl; a.download = `${name}-cv.docx`; a.click();
  };

  const reset = () => {
    setMode(null); setStep(0); setJobTitle(""); setProfile(""); setSkills("");
    setExperiences([{ ...EMPTY_EXP }]); setProjects([{ ...EMPTY_PROJECT }]);
    setDownloadUrl(null); setError("");
  };

  // ── STYLES ──
  const wrap = { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", padding: 0, margin: 0 };
  const card = { background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 22, marginBottom: 14 };
  const inp = { width: "100%", padding: "13px 15px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 11, color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const ta = { ...inp, minHeight: 90, resize: "vertical", lineHeight: 1.5 };
  const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6 };
  const btnP = { width: "100%", padding: 15, background: C.accent, color: C.white, border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" };
  const btnS = { padding: "11px 18px", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" };
  const btnD = { padding: "6px 12px", background: "transparent", color: C.danger, border: `1px solid rgba(248,113,113,0.25)`, borderRadius: 8, fontSize: 12, fontFamily: "inherit", cursor: "pointer" };
  const btnA = { padding: 11, background: C.accentSoft, color: C.accent, border: `1.5px dashed rgba(124,106,255,0.4)`, borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", width: "100%" };

  const hdr = (
    <div style={{ padding: "20px 20px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 3, textTransform: "uppercase", marginBottom: 2 }}>ATS CV</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 3px", color: C.white, letterSpacing: -0.5 }}>Resume Formatter</h1>
      {mode && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: C.muted }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: mode === "part-time" ? C.pt : C.ft, display: "inline-block" }} />
          {mode === "part-time" ? "Part-Time" : "Full-Time"} Mode
        </span>
      )}
    </div>
  );

  // ── STEP 0: MODE ──
  if (step === 0) return (
    <div style={wrap}>{hdr}
      <div style={{ padding: "20px 20px" }}>
        <div style={card}>
          <p style={{ fontSize: 14, color: C.muted, margin: "0 0 18px", lineHeight: 1.5 }}>
            Choose your application type. Each mode tailors different sections alongside your fixed CV content.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["part-time", C.pt, C.ptBg, C.ptBorder, "Part-Time", "Profile + Skills + Experience"],
              ["full-time", C.ft, C.ftBg, C.ftBorder, "Full-Time", "Profile + Skills + Projects (GitHub & Demo)"]
            ].map(([m, col, bg, bor, title, desc]) => (
              <button key={m} onClick={() => { setMode(m); setStep(1); }}
                style={{ padding: 18, background: bg, border: `2px solid ${bor}`, borderRadius: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: col, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.3 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── STEP 1: UPLOAD ──
  if (step === 1) return (
    <div style={wrap}>{hdr}
      <div style={{ padding: "20px" }}>
        <div style={card}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px", color: C.white }}>Upload Template</h2>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 18px", lineHeight: 1.4 }}>
            Your .docx with fixed details and {"{{PLACEHOLDERS}}"} for changing content.
          </p>
          <input ref={fileRef} type="file" accept=".docx" onChange={handleFile} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ width: "100%", padding: "36px 16px", background: templateFile ? C.successBg : C.accentSoft,
              border: `2px dashed ${templateFile ? C.success : "rgba(124,106,255,0.4)"}`, borderRadius: 14,
              cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 26 }}>{templateFile ? "✓" : "↑"}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: templateFile ? C.success : C.accent }}>
              {templateFile ? templateName : "Tap to upload .docx"}
            </span>
          </button>
          {error && <p style={{ color: C.danger, fontSize: 13, marginTop: 10 }}>{error}</p>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setStep(0); setMode(null); }} style={{ ...btnS, flex: 1 }}>Back</button>
          <button onClick={() => templateFile && setStep(2)} disabled={!templateFile}
            style={{ ...btnP, flex: 2, opacity: templateFile ? 1 : 0.35 }}>Continue</button>
        </div>
      </div>
    </div>
  );

  // ── STEP 3: DONE ──
  if (step === 3) {
    const name = jobTitle.trim().replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase() || "resume";
    return (
      <div style={wrap}>{hdr}
        <div style={{ padding: "20px" }}>
          <div style={{ ...card, textAlign: "center", padding: "36px 22px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px", color: C.success }}>CV Ready!</h2>
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 4px" }}>{name}-cv.docx</p>
            <p style={{ fontSize: 12, color: C.dim, margin: "0 0 22px", fontFamily: "monospace" }}>
              outputs/{name}/docx/
            </p>
            <button onClick={download} style={{ ...btnP, marginBottom: 10, background: C.success }}>Download .docx</button>
            <button onClick={() => { setStep(2); setDownloadUrl(null); }} style={{ ...btnS, width: "100%", marginBottom: 10 }}>Edit & Regenerate</button>
            <button onClick={reset} style={{ ...btnS, width: "100%", color: C.dim }}>Start New CV</button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: FILL FORM ──
  return (
    <div style={wrap}>{hdr}
      <div style={{ padding: "14px 20px 130px" }}>
        {/* Job Title */}
        <div style={card}>
          <label style={lbl}>Job Title / Role</label>
          <input style={inp} placeholder="e.g. Frontend Developer at Stripe" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
        </div>

        {/* Profile */}
        <div style={card}>
          <label style={lbl}>Profile / Summary</label>
          <textarea style={ta} placeholder="Tailored profile for this role..." value={profile} onChange={e => setProfile(e.target.value)} />
        </div>

        {/* Skills */}
        <div style={card}>
          <label style={lbl}>Skills (bold in CV)</label>
          <textarea style={{ ...ta, minHeight: 60 }} placeholder="React, Node.js, TypeScript, AWS..." value={skills} onChange={e => setSkills(e.target.value)} />
        </div>

        {/* EXPERIENCE — Part-Time */}
        {mode === "part-time" && <>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.pt, letterSpacing: 1.5, textTransform: "uppercase", margin: "20px 0 10px" }}>Experience</div>
          {experiences.map((exp, i) => (
            <div key={i} style={{ ...card, position: "relative" }}>
              {experiences.length > 1 && <button onClick={() => rmExp(i)} style={{ ...btnD, position: "absolute", top: 10, right: 10 }}>✕</button>}
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <div><label style={lbl}>Job Title</label><input style={inp} placeholder="Software Engineer" value={exp.title} onChange={e => updExp(i, "title", e.target.value)} /></div>
                <div><label style={lbl}>Company</label><input style={inp} placeholder="Company Name" value={exp.company} onChange={e => updExp(i, "company", e.target.value)} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                  <div><label style={lbl}>Start</label><input style={inp} placeholder="Jan 2023" value={exp.startDate} onChange={e => updExp(i, "startDate", e.target.value)} /></div>
                  <div><label style={lbl}>End</label><input style={inp} placeholder="Present" value={exp.endDate} onChange={e => updExp(i, "endDate", e.target.value)} /></div>
                </div>
                <div><label style={lbl}>Location</label><input style={inp} placeholder="City, Country" value={exp.location} onChange={e => updExp(i, "location", e.target.value)} /></div>
                <div>
                  <label style={lbl}>Bullet Points</label>
                  {exp.bullets.map((b, bi) => (
                    <div key={bi} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                      <input style={{ ...inp, flex: 1 }} placeholder="Achievement..." value={b} onChange={e => updExpB(i, bi, e.target.value)} />
                      {exp.bullets.length > 1 && <button onClick={() => rmExpB(i, bi)} style={{ ...btnD, padding: "10px 11px", fontSize: 15, borderRadius: 9 }}>−</button>}
                    </div>
                  ))}
                  <button onClick={() => addExpB(i)} style={{ ...btnA, fontSize: 12, padding: 7 }}>+ Bullet</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addExp} style={btnA}>+ Add Experience</button>
        </>}

        {/* PROJECTS — Full-Time */}
        {mode === "full-time" && <>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.ft, letterSpacing: 1.5, textTransform: "uppercase", margin: "20px 0 10px" }}>Projects</div>
          {projects.map((p, i) => (
            <div key={i} style={{ ...card, position: "relative" }}>
              {projects.length > 1 && <button onClick={() => rmProj(i)} style={{ ...btnD, position: "absolute", top: 10, right: 10 }}>✕</button>}
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <div><label style={lbl}>Project Name (bold)</label><input style={inp} placeholder="E-Commerce Platform" value={p.name} onChange={e => updProj(i, "name", e.target.value)} /></div>
                <div><label style={lbl}>Tech / Skills (bold)</label><input style={inp} placeholder="React, Node.js, MongoDB" value={p.skills} onChange={e => updProj(i, "skills", e.target.value)} /></div>
                <div><label style={lbl}>GitHub Link</label><input style={inp} placeholder="https://github.com/you/repo" value={p.githubLink} onChange={e => updProj(i, "githubLink", e.target.value)} /></div>
                <div><label style={lbl}>Demo Link</label><input style={inp} placeholder="https://project.live" value={p.demoLink} onChange={e => updProj(i, "demoLink", e.target.value)} /></div>
                <div><label style={lbl}>Description</label><textarea style={{ ...ta, minHeight: 55 }} placeholder="Brief description..." value={p.description} onChange={e => updProj(i, "description", e.target.value)} /></div>
                <div>
                  <label style={lbl}>Bullet Points</label>
                  {p.bullets.map((b, bi) => (
                    <div key={bi} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                      <input style={{ ...inp, flex: 1 }} placeholder="Key feature or result..." value={b} onChange={e => updProjB(i, bi, e.target.value)} />
                      {p.bullets.length > 1 && <button onClick={() => rmProjB(i, bi)} style={{ ...btnD, padding: "10px 11px", fontSize: 15, borderRadius: 9 }}>−</button>}
                    </div>
                  ))}
                  <button onClick={() => addProjB(i)} style={{ ...btnA, fontSize: 12, padding: 7 }}>+ Bullet</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addProj} style={btnA}>+ Add Project</button>
        </>}

        {error && <p style={{ color: C.danger, fontSize: 13, textAlign: "center", marginTop: 14 }}>{error}</p>}
      </div>

      {/* Bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", gap: 10, zIndex: 100 }}>
        <button onClick={() => setStep(1)} style={{ ...btnS, flex: 1 }}>Back</button>
        <button onClick={generate} disabled={generating || !jobTitle.trim()}
          style={{ ...btnP, flex: 2, opacity: (generating || !jobTitle.trim()) ? 0.35 : 1 }}>
          {generating ? "Generating..." : "Generate CV"}
        </button>
      </div>
    </div>
  );
}
