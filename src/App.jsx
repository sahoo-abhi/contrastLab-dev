import { useMemo, useState } from "react";
import { analyzeFontSizes } from "./utils/fontSizeAnalyzer";

function App() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [findings, setFindings] = useState([]);
  const [analysisError, setAnalysisError] = useState(null);

  const summary = useMemo(() => {
    const safeFindings = Array.isArray(findings) ? findings : [];
    const passes = safeFindings.filter((i) => i.status === "pass").length;
    const warnings = safeFindings.filter((i) => i.status === "warning").length;
    const fails = safeFindings.filter((i) => i.status === "fail").length;

    return { passes, warnings, fails, total: safeFindings.length };
  }, [findings]);

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileName(file.name);
    setHasAnalyzed(false);
    setIsPreviewOpen(false);
    setFindings([]);
    setAnalysisError(null);
  }

  async function runAnalysis() {
    if (!previewUrl) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setFindings([]);

    try {
      const result = await analyzeFontSizes(previewUrl);
      
      // Validate result structure
      if (!result) {
        setAnalysisError("Analysis returned no result");
        setFindings([]);
      } else if (result.error) {
        // Error occurred during analysis
        setAnalysisError(result.error);
        setFindings(result.findings || []);
      } else if (Array.isArray(result.findings) && result.findings.length > 0) {
        // Success - findings available
        setFindings(result.findings);
        setAnalysisError(null);
      } else {
        // No findings but no error either
        setAnalysisError("Could not analyze image. Please try another image.");
        setFindings([]);
      }
      
      setHasAnalyzed(true);
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisError(error.message || "Analysis failed. Please try again.");
      setFindings([]);
      setHasAnalyzed(true);
    } finally {
      setIsAnalyzing(false);
    }
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

          {analysisError && (
            <div className="error-message">
              <p>⚠️ {analysisError}</p>
            </div>
          )}

          {hasAnalyzed ? (
            <>
              <div className="summary-row">
                <div className="chip pass">Pass {summary.passes}</div>
                <div className="chip warning">Warning {summary.warnings}</div>
                <div className="chip fail">Fail {summary.fails}</div>
                <div className="chip neutral">Total {summary.total}</div>
              </div>

              <ul className="finding-list">
                {Array.isArray(findings) && findings.length > 0 ? (
                  findings.map((f) => (
                    <li key={f.component + f.guideline}>
                      <div className={`status-dot ${f.status}`} />
                      <div>
                        <p className="finding-title">{f.component}</p>
                        <p className="finding-guideline">{f.guideline}</p>
                        <p className="finding-subtitle">{f.element}</p>
                        <p className="finding-note">{f.note}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li style={{ padding: "1rem", color: "#656a63" }}>
                    No findings to display
                  </li>
                )}
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
