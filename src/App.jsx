import { useMemo, useState } from "react";

const SAMPLE_FINDINGS = [
  {
    component: "Primary Navigation",
    element: "Header menu links",
    status: "pass",
    guideline: "WCAG 1.4.3 Contrast (Minimum)",
    note: "Estimated contrast ratio appears above 4.5:1 for normal text."
  },
  {
    component: "Hero CTA Button",
    element: "\"Try Free\" button",
    status: "warning",
    guideline: "WCAG 2.4.7 Focus Visible",
    note: "Focus style may be weak; confirm keyboard-visible focus indicator."
  },
  {
    component: "Form Field",
    element: "Email input",
    status: "fail",
    guideline: "WCAG 3.3.2 Labels or Instructions",
    note: "Input appears to rely on placeholder text without a persistent label."
  },
  {
    component: "Feature Cards",
    element: "Icon and descriptive text",
    status: "pass",
    guideline: "WCAG 1.1.1 Non-text Content",
    note: "Detected decorative icons likely non-essential; verify alt handling in markup."
  }
];

function App() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const summary = useMemo(() => {
    const passes = SAMPLE_FINDINGS.filter((i) => i.status === "pass").length;
    const warnings = SAMPLE_FINDINGS.filter((i) => i.status === "warning").length;
    const fails = SAMPLE_FINDINGS.filter((i) => i.status === "fail").length;

    return { passes, warnings, fails, total: SAMPLE_FINDINGS.length };
  }, []);

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileName(file.name);
    setHasAnalyzed(false);
    setIsPreviewOpen(false);
  }

  function runAnalysis() {
    if (!previewUrl) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 1400);
  }

  return (
    <main className="portal-shell">

      {/* Header */}
      <section className="hero-card">
        <p className="eyebrow">ContrastLab</p>
        <h1>Screenshot Accessibility Check</h1>
        <p className="hero-copy">
          Upload a web app screenshot to identify visible UI components and review likely WCAG compliance issues.
        </p>
      </section>

      {/* Two-column layout for Upload and WCAG Findings */}
      <div className="content-grid">
        {/* Upload Card */}
        <section className="panel upload-panel">

          {/* Upload */}
          <label htmlFor="shot-upload" className="upload-dropzone">
            <input
              id="shot-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleUpload}
            />
            <span className="upload-title">Drop screenshot here or click to browse</span>
            <span className="upload-subtitle">PNG, JPG, or WEBP</span>
          </label>

          {/* File name */}
          <p className="file-label">{fileName || "No file selected"}</p>

          {/* Preview */}
          <div className="preview-section">
            <h2>Preview</h2>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="preview"
                className="preview-image"
                onClick={() => setIsPreviewOpen(true)}
              />
            ) : (
              <p className="empty-state">
                Your uploaded screenshot will appear here.
              </p>
            )}
          </div>

          {/* Button at bottom */}
          <div className="analyze-btn-wrapper">
            <button
              type="button"
              onClick={runAnalysis}
              disabled={!previewUrl || isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Screenshot"}
            </button>
          </div>

        </section>

        {/* WCAG Findings Card - Side by side */}
        <section className="panel results-panel">
          <h2>WCAG Findings</h2>

          {hasAnalyzed ? (
            <>
              <div className="summary-row">
                <div className="chip pass">Pass {summary.passes}</div>
                <div className="chip warning">Warning {summary.warnings}</div>
                <div className="chip fail">Fail {summary.fails}</div>
                <div className="chip neutral">Total {summary.total}</div>
              </div>

              <ul className="finding-list">
                {SAMPLE_FINDINGS.map((f) => (
                  <li key={f.component + f.guideline}>
                    <div className={`status-dot ${f.status}`} />
                    <div>
                      <p className="finding-title">{f.component}</p>
                      <p className="finding-subtitle">{f.element}</p>
                      <p className="finding-guideline">{f.guideline}</p>
                      <p className="finding-note">{f.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="empty-state">
              Run analysis to view detected components and their guideline status.
            </p>
          )}
        </section>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && previewUrl && (
        <div className="preview-modal">
          <button
            className="preview-close"
            onClick={() => setIsPreviewOpen(false)}
          >
            Close
          </button>
          <img src={previewUrl} className="preview-modal-image" />
        </div>
      )}
    </main>
  );
}

export default App;
