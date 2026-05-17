// Helper: Check 16px compliance
function check16pxCompliance(node) {
  const size = safeNumber(node.fontSize, 0);
  return size >= 16 ? "pass" : "fail";
}

// Safe number helper
function safeNumber(value, fallback) {
  if (typeof value === "number") return value;
  return fallback;
}

function isLargeText(node) {
  const size = safeNumber(node.fontSize, 0);
  const weight = safeNumber(node.fontWeight, 400);
  return size >= 18 || weight >= 700;
}

function getAllTextNodes(node, results) {
  if (!node) node = figma.currentPage;
  if (!results) results = [];

  if (node.type === "TEXT") {
    results.push(node);
  }

  if ('children' in node) {
    for (const child of node.children) {
      getAllTextNodes(child, results);
    }
  }

  return results;
}

function getFontWeightLabel(weight) {
  if (weight < 400) return "Light";
  if (weight === 400) return "Regular";
  if (weight >= 700) return "Bold";
  return "Medium";
}

function scanPage(appType = "web") {
  const nodes = getAllTextNodes(figma.currentPage, []);
  const results = [];

  for (const node of nodes) {
    const content = node.characters ? node.characters.trim() : "";
    if (!content) continue;

    const fontFamily = node.fontName && node.fontName.family ? node.fontName.family : "Mixed";
    const fillColor = node.fills && node.fills[0] && node.fills[0].color ? node.fills[0].color : null;
    const fontSize = safeNumber(node.fontSize, 0);
    const fontWeight = safeNumber(node.fontWeight, 400);

    const analysis = {
      id: node.id,
      name: node.name,
      text: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontWeightLabel: getFontWeightLabel(fontWeight),
      fontFamily: fontFamily,
      isLarge: isLargeText(node),
      status: check16pxCompliance(node),   // ✅ "pass" or "fail"
      fillColor: fillColor,
      appType: appType
    };

    results.push(analysis);
  }

  return results;
}

figma.ui.onmessage = function(msg) {
  if (msg.type === "SCAN_PAGE") {
    const appType = msg.appType; // "web" or "mobile"
    const results = scanPage(appType);
    figma.ui.postMessage({
      type: "SCAN_RESULTS",
      data: results,
      appType: appType,
      timestamp: new Date().toISOString()
    });
  }

  if (msg.type === "SELECT_NODE") {
    const node = figma.getNodeById(msg.nodeId);
    if (node) {
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
    }
  }

  if (msg.type === "CLOSE") {
    figma.closePlugin();
  }
};

figma.showUI(__html__, { width: 750, height: 700 });