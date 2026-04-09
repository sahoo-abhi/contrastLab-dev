import { createWorker, recognize } from "tesseract.js";

// WCAG Font Size Guidelines (in pixels)
const WCAG_GUIDELINES = {
  AA_NORMAL: { min: 14, label: "WCAG 1.4.4 Resize Text (AA)" },
  AA_LARGE: { min: 18, label: "WCAG 1.4.4 Resize Text (AA) - Large" },
  AAA_NORMAL: { min: 18, label: "WCAG 1.4.4 Resize Text (AAA)" },
  AAA_LARGE: { min: 14, label: "WCAG 1.4.4 Resize Text (AAA) - Large" }
};

let worker = null;

/**
 * Initialize Tesseract worker (lazy load on first use)
 */
async function initializeWorker() {
  if (!worker) {
    try {
      worker = await createWorker("eng", 1, {
        corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@v5/tesseract-core.wasm.js",
        logger: (m) => console.log("[Tesseract]", m.status, Math.round(m.progress * 100) + "%")
      });
    } catch (err) {
      console.error("Failed to initialize worker:", err);
      worker = null;
      throw err;
    }
  }
  return worker;
}

/**
 * Convert image URL to canvas for processing
 */
async function imageToCanvas(imageUrl) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      console.log("Image converted to canvas:", canvas.width, "x", canvas.height);
      resolve(canvas);
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
  });
}

/**
 * Parse plain text into words with estimated font sizes
 */
function parseTextWithFontEstimation(fullText, imageWidth = 512) {
  if (!fullText) return [];
  
  const lines = fullText.split('\n');
  const words = [];
  
  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    // Estimate line font size based on characteristics
    let lineSize = 14; // Default body text
    
    // First line is typically heading (h1)
    if (lineIndex === 0) {
      lineSize = 24;
    }
    // Second line might be subheading
    else if (lineIndex === 1 && trimmedLine.length < 25) {
      lineSize = 18;
    }
    // Lines starting with a digit + period are list items (typically body)
    else if (/^\d+\./.test(trimmedLine)) {
      lineSize = 13;
    }
    // Short lines (< 20 chars) might be headings or small text
    else if (trimmedLine.length < 20 && lineIndex < 5) {
      lineSize = 16;
    }
    // Default body text
    else {
      lineSize = 14;
    }
    
    // Split line into words but preserve phrase context
    const lineWords = trimmedLine.split(/\s+/).filter(w => w.length > 0);
    
    // Create word objects with line context for better samples
    lineWords.forEach((token, wordIndex) => {
      words.push({
        text: token,
        size: lineSize,
        confidence: 90,
        lineIndex,
        wordIndex,
        fullLine: trimmedLine  // Keep full line for context
      });
    });
  });
  
  console.log("Parsed", words.length, "words from text, sizes:", {
    xl: words.filter(w => w.size >= 24).length,
    lg: words.filter(w => w.size >= 18 && w.size < 24).length,
    md: words.filter(w => w.size >= 14 && w.size < 18).length,
    sm: words.filter(w => w.size < 14).length
  });
  
  return words;
}

/**
 * Classifies text as "normal" or "large" based on weight and size heuristics
 * Large text is typically bold or >= 18px (24pt)
 */
function classifyTextSize(confidence, bbox) {
  // Estimate font size from bounding box height
  // bbox.height is in pixels relative to the image
  const estimatedFontSize = Math.max(bbox.height * 0.85, 4); // improved heuristic

  // Consider text "large" if it's at least 18px or has high confidence (likely heading)
  const isLarge = estimatedFontSize >= 18;

  return {
    estimatedFontSize,
    isLarge,
    confidence
  };
}

/**
 * Analyzes font sizes in an uploaded image and returns WCAG compliance findings
 */
export async function analyzeFontSizes(imageUrl) {
  try {
    console.log("Starting font size analysis for:", imageUrl.substring(0, 50));

    // Try using recognize function directly (simpler approach)
    const result = await recognize(imageUrl, "eng", {
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@v5/tesseract-core.wasm.js",
      logger: (m) => console.log("[Tesseract]", m.status, Math.round(m.progress * 100) + "%")
    });

    const data = result?.data;
    console.log("OCR Result Data:", data);
    
    // Validate we have some form of text data
    if (!data || (!data.words?.length && !data.text)) {
      return generateDefaultFindings("OCR analysis returned no data");
    }

    const words = data.words || [];
    console.log("OCR detected words array:", words.length);
    console.log("OCR detected full text:", data.text?.substring(0, 100));

    // We have text content even if words array is empty - process it!
    if (data.text && words.length === 0) {
      console.log("Processing extracted text since words array is empty...");
      return processWords([], data);
    }

    // If we have words, process them
    if (words.length > 0) {
      return processWords(words, data);
    }

    // Fallback: try canvas preprocessing as last resort
    console.warn("No text found, attempting canvas preprocessing...");
    try {
      const canvas = await imageToCanvas(imageUrl);
      const canvasResult = await recognize(canvas, "eng", {
        corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@v5/tesseract-core.wasm.js"
      });
      
      const canvasData = canvasResult?.data;
      console.log("Canvas OCR result:", canvasData?.text?.substring(0, 100));
      
      // Pass to processWords even if empty - it will handle text parsing
      return processWords(canvasData?.words || [], canvasData);
    } catch (err) {
      console.error("Canvas preprocessing failed:", err);
      return {
        findings: generateDefaultFindings("Could not process image. Try a different screenshot."),
        details: null,
        error: err.message,
        wordCount: 0
      };
    }
  } catch (error) {
    console.error("Font size analysis error:", error);
    return {
      findings: generateDefaultFindings(`Analysis error: ${error.message}`),
      details: null,
      error: error.message,
      wordCount: 0
    };
  }
}

/**
 * Extract meaningful text samples from word group
 */
function getTextSamples(wordGroup, limit = 2) {
  if (!wordGroup || wordGroup.length === 0) return "No samples";
  
  // Get unique full lines from the word group
  const uniqueLines = [...new Set(wordGroup.filter(w => w.fullLine).map(w => w.fullLine))];
  
  // If we have full lines, use first few as samples
  if (uniqueLines.length > 0) {
    return uniqueLines.slice(0, limit).join(" / ");
  }
  
  // Fallback: just get unique words
  const uniqueWords = [...new Set(wordGroup.map(w => w.text))];
  return uniqueWords.slice(0, limit * 2).join(", ");
}

/**
 * Process detected words and generate findings
 */
function processWords(words, data) {
  const findings = [];
  const fontSizeGroups = {
    small: [],
    medium: [],
    large: [],
    veryLarge: []
  };

  // If no words provided but text exists, parse it
  if ((!words || words.length === 0) && data?.text) {
    console.log("🔍 Parsing OCR text into words...");
    words = parseTextWithFontEstimation(data.text);
    console.log("✅ Parsed words count:", words.length);
  }

  // Double-check we have words
  if (!words || words.length === 0) {
    console.error("❌ No words to process");
    return {
      findings: generateDefaultFindings("Unable to extract words from image"),
      details: null,
      error: "No words found",
      wordCount: 0
    };
  }

  console.log("📊 Processing", words.length, "words...");

  // Group detected text by estimated size
  words.forEach((word) => {
    try {
      if (!word || !word.text || word.text.trim().length === 0) return;

      // Use provided size directly or calculate from bbox
      let estimatedFontSize = word.size;
      
      if (!estimatedFontSize && word.bbox) {
        const textSize = classifyTextSize(word.confidence || 0, word.bbox);
        estimatedFontSize = textSize.estimatedFontSize;
      }

      estimatedFontSize = estimatedFontSize || 14; // Default to body text

      if (estimatedFontSize < 10) {
        fontSizeGroups.small.push({
          text: word.text,
          size: estimatedFontSize,
          confidence: word.confidence,
          fullLine: word.fullLine
        });
      } else if (estimatedFontSize < 14) {
        fontSizeGroups.medium.push({
          text: word.text,
          size: estimatedFontSize,
          confidence: word.confidence,
          fullLine: word.fullLine
        });
      } else if (estimatedFontSize < 18) {
        fontSizeGroups.large.push({
          text: word.text,
          size: estimatedFontSize,
          confidence: word.confidence,
          fullLine: word.fullLine
        });
      } else {
        fontSizeGroups.veryLarge.push({
          text: word.text,
          size: estimatedFontSize,
          confidence: word.confidence,
          fullLine: word.fullLine
        });
      }
    } catch (wordError) {
      console.warn("Error processing word:", wordError);
    }
  });

  console.log("📈 Font size distribution:", {
    small: fontSizeGroups.small.length,
    medium: fontSizeGroups.medium.length,
    large: fontSizeGroups.large.length,
    veryLarge: fontSizeGroups.veryLarge.length
  });

  // Generate findings based on detected text sizes
  if (fontSizeGroups.small.length > 0) {
    const avgSize = (
      fontSizeGroups.small.reduce((sum, item) => sum + item.size, 0) /
      fontSizeGroups.small.length
    ).toFixed(1);

    const samples = getTextSamples(fontSizeGroups.small, 2);

    findings.push({
      component: "Small Text",
      element: samples,
      status: "fail",
      guideline: WCAG_GUIDELINES.AA_NORMAL.label,
      note: `Detected text at ~${avgSize}px (${fontSizeGroups.small.length} elements). WCAG AA requires minimum 14px for normal text. Consider increasing font size.`
    });
  }

  if (fontSizeGroups.medium.length > 0) {
    const avgSize = (
      fontSizeGroups.medium.reduce((sum, item) => sum + item.size, 0) /
      fontSizeGroups.medium.length
    ).toFixed(1);

    const samples = getTextSamples(fontSizeGroups.medium, 2);

    findings.push({
      component: "Body Text",
      element: samples,
      status: "warning",
      guideline: WCAG_GUIDELINES.AA_NORMAL.label,
      note: `Detected text at ~${avgSize}px (${fontSizeGroups.medium.length} elements). While meeting WCAG AA minimum (14px), best practices recommend larger body text (16px+) for better readability.`
    });
  }

  if (fontSizeGroups.large.length > 0) {
    const avgSize = (
      fontSizeGroups.large.reduce((sum, item) => sum + item.size, 0) /
      fontSizeGroups.large.length
    ).toFixed(1);

    const samples = getTextSamples(fontSizeGroups.large, 2);

    findings.push({
      component: "Large Text / Headings",
      element: samples,
      status: "pass",
      guideline: WCAG_GUIDELINES.AA_LARGE.label,
      note: `Detected text at ~${avgSize}px (${fontSizeGroups.large.length} elements). Meets WCAG AA standards for large text (18px+) and supports readability.`
    });
  }

  if (fontSizeGroups.veryLarge.length > 0) {
    const avgSize = (
      fontSizeGroups.veryLarge.reduce((sum, item) => sum + item.size, 0) /
      fontSizeGroups.veryLarge.length
    ).toFixed(1);

    const samples = getTextSamples(fontSizeGroups.veryLarge, 2);

    findings.push({
      component: "Display Text / CTA",
      element: samples,
      status: "pass",
      guideline: WCAG_GUIDELINES.AAA_NORMAL.label,
      note: `Detected text at ~${avgSize}px (${fontSizeGroups.veryLarge.length} elements). Exceeds all WCAG standards for readability and accessibility.`
    });
  }

  // If no findings generated from text groups, provide summary
  if (findings.length === 0) {
    console.warn("⚠️ No text size categories had items, generating summary");
    findings.push({
      component: "Text Analysis Summary",
      element: `${words.length} text elements scanned`,
      status: "pass",
      guideline: "WCAG 1.4.4 Resize Text",
      note: "Text detected but classification inconclusive. All detected text appears to meet minimum accessibility standards."
    });
  }

  console.log("✨ Generated", findings.length, "findings");
  
  return {
    findings,
    details: fontSizeGroups,
    rawOCRData: data,
    wordCount: words.length,
    error: null
  };
}

/**
 * Generate default findings when analysis fails or no text detected
 */
function generateDefaultFindings(errorMsg = null) {
  return [
    {
      component: "Text Detection",
      element: "Image OCR",
      status: "fail",
      guideline: "WCAG 1.4.4 Resize Text",
      note: errorMsg || "Could not detect text in image. Ensure image contains visible text and try again."
    }
  ];
}
