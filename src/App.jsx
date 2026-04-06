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
    const passes = SAMPLE_FINDINGS.filter((item) => item.status === "pass").length;
    const warnings = SAMPLE_FINDINGS.filter((item) => item.status === "warning").length;
    const fails = SAMPLE_FINDINGS.filter((item) => item.status === "fail").length;

    return { passes, warnings, fails, total: SAMPLE_FINDINGS.length };
  }, []);

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    setFileName(file.name);
    setHasAnalyzed(false);
    setIsPreviewOpen(false);
  }

  function runAnalysis() {
    if (!previewUrl) {
      return;
    }

    setIsAnalyzing(true);
    window.setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 1400);
  }

  return (
    <main className="portal-shell">
      <section className="hero-card">
        <p className="eyebrow">ContrastLab</p>
        <h1>Screenshot Accessibility Check</h1>
        <p className="hero-copy">
          Upload a web app screenshot to identify visible UI components and review likely
          WCAG compliance issues.
        </p>
      </section>

      <section className="panel upload-panel" aria-label="Upload area">
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

        <div className="upload-actions">
          <p className="file-label">{fileName || "No file selected"}</p>
          <button type="button" onClick={runAnalysis} disabled={!previewUrl || isAnalyzing}>
            {isAnalyzing ? "Analyzing..." : "Analyze Screenshot"}
          </button>
        </div>
      </section>

      <section className="grid-layout">
        <article className="panel preview-panel" aria-label="Screenshot preview">
          <h2>Preview</h2>
          {previewUrl ? (
            <button
              type="button"
              className="preview-image-btn"
              onClick={() => setIsPreviewOpen(true)}
              aria-label="Open image preview"
            >
              <img src={previewUrl} alt="Uploaded application screenshot preview" />
            </button>
          ) : (
            <p className="empty-state">Your uploaded screenshot will appear here.</p>
          )}
        </article>

        <article className="panel results-panel" aria-label="Accessibility findings">
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
                {SAMPLE_FINDINGS.map((finding) => (
                  <li key={finding.component + finding.guideline}>
                    <div className={`status-dot ${finding.status}`} aria-hidden="true" />
                    <div>
                      <p className="finding-title">{finding.component}</p>
                      <p className="finding-subtitle">{finding.element}</p>
                      <p className="finding-guideline">{finding.guideline}</p>
                      <p className="finding-note">{finding.note}</p>
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
        </article>
      </section>

      {isPreviewOpen && previewUrl ? (
        <div className="preview-modal" role="dialog" aria-modal="true" aria-label="Image preview">
          <button
            type="button"
            className="preview-close"
            onClick={() => setIsPreviewOpen(false)}
            aria-label="Close image preview"
          >
            Close
          </button>
          <img src={previewUrl} alt="Expanded screenshot preview" className="preview-modal-image" />
        </div>
      ) : null}
    </main>
  );
}

export default App;
