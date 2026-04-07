const pptxgen = require("pptxgenjs");
const path = require("path");

const SCREENSHOTS = path.join(__dirname, "..", "demo-screenshots");
const OUTPUT = path.join(__dirname, "..", "demo-screenshots", "VAST_Thesis_Defense.pptx");

// Color palette - deep navy + teal for AI/tech/ethics theme
const C = {
  navy: "0F172A",
  darkBlue: "1E293B",
  blue: "0284C7",
  teal: "0891B2",
  cyan: "06B6D4",
  lightBg: "F8FAFC",
  cardBg: "F1F5F9",
  white: "FFFFFF",
  text: "1E293B",
  textMuted: "64748B",
  accent: "0EA5E9",
  green: "059669",
  purple: "7C3AED",
  orange: "D97706",
  red: "DC2626",
};

function img(name) {
  return path.join(SCREENSHOTS, name);
}

function makeShadow() {
  return { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.12 };
}

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Soraya Partow";
  pres.title = "From Belief to Behavior: Modeling and Tracking Moral Alignment in Autonomous Agents";

  // ============================================================
  // SLIDE 1: Title Slide
  // ============================================================
  let slide = pres.addSlide();
  slide.background = { color: C.navy };

  // Top accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.cyan },
  });

  slide.addText("From Belief to Behavior", {
    x: 0.8, y: 1.0, w: 8.4, h: 0.8,
    fontSize: 36, fontFace: "Georgia", color: C.white, bold: true, align: "left", margin: 0,
  });
  slide.addText("Modeling and Tracking Moral Alignment\nin Autonomous Agents", {
    x: 0.8, y: 1.8, w: 8.4, h: 1.0,
    fontSize: 22, fontFace: "Calibri", color: C.cyan, align: "left", margin: 0,
  });

  // Divider
  slide.addShape(pres.shapes.LINE, {
    x: 0.8, y: 3.1, w: 3.5, h: 0, line: { color: C.teal, width: 2 },
  });

  slide.addText("Soraya Partow", {
    x: 0.8, y: 3.4, w: 5, h: 0.5,
    fontSize: 18, fontFace: "Calibri", color: C.white, bold: true, margin: 0,
  });
  slide.addText("Master of Science in Computer Science", {
    x: 0.8, y: 3.85, w: 5, h: 0.4,
    fontSize: 14, fontFace: "Calibri", color: C.textMuted, margin: 0,
  });
  slide.addText("Thesis Advisor: Dr. Satyaki Nan", {
    x: 0.8, y: 4.2, w: 5, h: 0.4,
    fontSize: 14, fontFace: "Calibri", color: C.textMuted, margin: 0,
  });
  slide.addText("Georgia Southwestern State University  |  2026", {
    x: 0.8, y: 4.7, w: 5, h: 0.4,
    fontSize: 12, fontFace: "Calibri", color: C.textMuted, margin: 0,
  });

  // ============================================================
  // SLIDE 2: Problem Statement
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };

  slide.addText("The AI Alignment Challenge", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.7,
    fontSize: 32, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });

  const problems = [
    { title: "RLHF", issue: "Opaque reasoning", detail: "Black-box reward models offer no transparent justification for decisions", color: C.red },
    { title: "Constitutional AI", issue: "Rigid rules", detail: "Hard constraints create brittleness in edge cases and novel situations", color: C.orange },
    { title: "Value Learning", issue: "Value drift", detail: "Implicit value representations lack stability guarantees over time", color: C.purple },
  ];

  problems.forEach((p, i) => {
    const y = 1.4 + i * 1.3;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y, w: 8.4, h: 1.1, fill: { color: C.white }, shadow: makeShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y, w: 0.08, h: 1.1, fill: { color: p.color },
    });
    slide.addText(p.title, {
      x: 1.15, y, w: 2, h: 0.5,
      fontSize: 16, fontFace: "Calibri", color: p.color, bold: true, valign: "bottom", margin: 0,
    });
    slide.addText(p.issue, {
      x: 1.15, y: y + 0.45, w: 2, h: 0.5,
      fontSize: 12, fontFace: "Calibri", color: C.textMuted, valign: "top", margin: 0,
    });
    slide.addText(p.detail, {
      x: 3.3, y, w: 5.7, h: 1.1,
      fontSize: 13, fontFace: "Calibri", color: C.text, valign: "middle", margin: 0,
    });
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 5.05, w: 8.4, h: 0.04, fill: { color: C.cyan },
  });

  // ============================================================
  // SLIDE 3: VAST Framework Overview
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };

  slide.addText("The VAST Framework", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.7,
    fontSize: 32, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });
  slide.addText("Value-Aligned Structured Tracking", {
    x: 0.8, y: 0.9, w: 8.4, h: 0.4,
    fontSize: 14, fontFace: "Calibri", color: C.teal, margin: 0,
  });

  const components = [
    { label: "Belief Model", sub: "(pi, kappa, J)", desc: "Tripartite representation separating credence, confidence, and justification", col: C.blue },
    { label: "JWMC Revision", sub: "Belief Update", desc: "Justification-weighted moral consistency operator preserving value stability", col: C.teal },
    { label: "EEU-CC Decision", sub: "Action Selection", desc: "Ethical expected utility with cascading soft constraints for flexible reasoning", col: C.green },
    { label: "Four Gauges", sub: "Monitoring", desc: "Real-time calibration, normative alignment, coherence, and reasoning quality", col: C.purple },
  ];

  components.forEach((c, i) => {
    const x = 0.8 + i * 2.25;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.5, w: 2.05, h: 3.3, fill: { color: C.white }, shadow: makeShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.5, w: 2.05, h: 0.06, fill: { color: c.col },
    });
    slide.addText(c.label, {
      x, y: 1.7, w: 2.05, h: 0.5,
      fontSize: 14, fontFace: "Calibri", color: c.col, bold: true, align: "center", margin: 0,
    });
    slide.addText(c.sub, {
      x, y: 2.15, w: 2.05, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
    });
    slide.addText(c.desc, {
      x: x + 0.15, y: 2.6, w: 1.75, h: 2.0,
      fontSize: 11, fontFace: "Calibri", color: C.text, align: "left", margin: 0,
    });
    if (i < 3) {
      slide.addText("->", {
        x: x + 2.05, y: 2.8, w: 0.2, h: 0.5,
        fontSize: 16, color: C.textMuted, align: "center", margin: 0,
      });
    }
  });

  // ============================================================
  // SLIDE 4: Live Demo - Scenarios
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.navy };
  slide.addText("LIVE DEMO", {
    x: 0, y: 0.3, w: 10, h: 0.6,
    fontSize: 14, fontFace: "Calibri", color: C.cyan, align: "center", charSpacing: 6, margin: 0,
  });
  slide.addText("Scenario Selection", {
    x: 0, y: 0.8, w: 10, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: C.white, bold: true, align: "center", margin: 0,
  });
  slide.addImage({ path: img("02_scenarios.png"), x: 0.5, y: 1.6, w: 9.0, h: 3.8, shadow: makeShadow() });

  // ============================================================
  // SLIDE 5: Live Demo - Beliefs
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("Belief Structures (pi, kappa, J)", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });
  slide.addImage({ path: img("04_beliefs.png"), x: 0.3, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addImage({ path: img("05_beliefs_detail.png"), x: 5.2, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addText("Each action's epistemic state: credence distribution, confidence level, and moral justification", {
    x: 0.8, y: 4.2, w: 8.4, h: 0.5,
    fontSize: 12, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // SLIDE 6: Live Demo - Decision
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("EEU-CC Decision Making", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });
  slide.addImage({ path: img("07_decision_result.png"), x: 0.3, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addImage({ path: img("08_decision_utilities.png"), x: 5.2, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addText("Selected Action: allocate_to_patient_b  |  Expected Utility: 0.755148", {
    x: 0.8, y: 4.2, w: 8.4, h: 0.5,
    fontSize: 13, fontFace: "Calibri", color: C.green, bold: true, align: "center", margin: 0,
  });

  // ============================================================
  // SLIDE 7: Live Demo - Gauges
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("Four-Gauge Alignment Monitoring", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });
  slide.addImage({ path: img("09_gauges.png"), x: 0.3, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addImage({ path: img("10_gauges_detail.png"), x: 5.2, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addText("Calibration  |  Normative Alignment  |  Coherence  |  Reasoning Quality", {
    x: 0.8, y: 4.2, w: 8.4, h: 0.5,
    fontSize: 12, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // SLIDE 8: Live Demo - Audit Trail
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("Transparent Audit Trail", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });
  slide.addImage({ path: img("11_audit_trail.png"), x: 1.0, y: 1.1, w: 8.0, h: 4.0, shadow: makeShadow() });

  // ============================================================
  // SLIDE 9: VAST-Blockchain Section Title
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.navy };
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.purple },
  });
  slide.addText("VAST-Blockchain Extension", {
    x: 0.8, y: 1.5, w: 8.4, h: 0.9,
    fontSize: 36, fontFace: "Georgia", color: C.white, bold: true, align: "center", margin: 0,
  });
  slide.addText("Hybrid Ledger Anchoring for Verifiable\nGovernance and Auditability of Aligned AI", {
    x: 1.5, y: 2.5, w: 7.0, h: 0.8,
    fontSize: 18, fontFace: "Calibri", color: C.cyan, align: "center", margin: 0,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 3.6, w: 3.0, h: 0, line: { color: C.purple, width: 2 },
  });
  slide.addText("Accepted Paper #2", {
    x: 3.0, y: 3.8, w: 4.0, h: 0.5,
    fontSize: 14, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // SLIDE 10: Blockchain Architecture
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("Hybrid Off-Chain / On-Chain Architecture", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });
  slide.addImage({ path: img("25_present_blockchain.png"), x: 0.3, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addImage({ path: img("26_present_blockchain_scroll.png"), x: 5.2, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addText("VAST reasoning off-chain  |  Rules & commitments on-chain  |  Audits via verifiable proofs", {
    x: 0.8, y: 4.2, w: 8.4, h: 0.5,
    fontSize: 12, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // SLIDE 11: Blockchain Status + Keys
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("Blockchain Integration Status", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });
  slide.addImage({ path: img("12_blockchain.png"), x: 0.3, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addImage({ path: img("13_blockchain_detail.png"), x: 5.2, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addText("ECDSA P-256 agent keys  |  SHA-256 Merkle trees  |  Signed Tree Heads (STHs)", {
    x: 0.8, y: 4.2, w: 8.4, h: 0.5,
    fontSize: 12, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // SLIDE 12: Verification & Integrity
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("Verification & Threat Model", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });
  slide.addImage({ path: img("27_present_integrity.png"), x: 0.3, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addImage({ path: img("28_present_integrity_scroll.png"), x: 5.2, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addText("100% tampering detection  |  O(log n) verification  |  Byzantine fault tolerant governance", {
    x: 0.8, y: 4.2, w: 8.4, h: 0.5,
    fontSize: 12, fontFace: "Calibri", color: C.green, bold: true, align: "center", margin: 0,
  });

  // ============================================================
  // SLIDE 13: Rules & Evidence
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("Governance Rules & Evidence Verification", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });
  slide.addImage({ path: img("14_rules.png"), x: 0.3, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addImage({ path: img("15_evidence.png"), x: 5.2, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addText("On-chain rule registry with governance lifecycle  |  Independent evidence bundle verification", {
    x: 0.8, y: 4.2, w: 8.4, h: 0.5,
    fontSize: 12, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // SLIDE 14: Evaluation Results
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("Evaluation Results", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 32, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });

  // Key metrics
  const metrics = [
    { val: "0.77", label: "VAST Mean\nAlignment", col: C.blue },
    { val: "+29%", label: "vs RLHF\n(0.58)", col: C.green },
    { val: "+23%", label: "vs Const. AI\n(0.61)", col: C.teal },
    { val: "+21%", label: "vs Value Learn\n(0.63)", col: C.purple },
  ];

  metrics.forEach((m, i) => {
    const x = 0.8 + i * 2.25;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: 2.05, h: 1.8, fill: { color: C.white }, shadow: makeShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: 2.05, h: 0.06, fill: { color: m.col },
    });
    slide.addText(m.val, {
      x, y: 1.4, w: 2.05, h: 0.8,
      fontSize: 36, fontFace: "Georgia", color: m.col, bold: true, align: "center", margin: 0,
    });
    slide.addText(m.label, {
      x, y: 2.2, w: 2.05, h: 0.6,
      fontSize: 11, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
    });
  });

  // Blockchain results
  const bcMetrics = [
    { val: "100%", label: "Tampering\nDetected", col: C.green },
    { val: "100%", label: "External\nDetectability", col: C.teal },
    { val: "2.3-2.95s", label: "Total Latency\nPer Decision", col: C.blue },
    { val: "O(log n)", label: "Verification\nComplexity", col: C.purple },
  ];

  slide.addText("VAST-Blockchain Integrity", {
    x: 0.8, y: 3.3, w: 8.4, h: 0.4,
    fontSize: 14, fontFace: "Calibri", color: C.navy, bold: true, margin: 0,
  });

  bcMetrics.forEach((m, i) => {
    const x = 0.8 + i * 2.25;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 3.8, w: 2.05, h: 1.5, fill: { color: C.white }, shadow: makeShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 3.8, w: 2.05, h: 0.06, fill: { color: m.col },
    });
    slide.addText(m.val, {
      x, y: 3.95, w: 2.05, h: 0.6,
      fontSize: 24, fontFace: "Georgia", color: m.col, bold: true, align: "center", margin: 0,
    });
    slide.addText(m.label, {
      x, y: 4.55, w: 2.05, h: 0.6,
      fontSize: 11, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
    });
  });

  // ============================================================
  // SLIDE 15: Framework Comparison
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("Framework Comparison", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 28, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });
  slide.addImage({ path: img("16_compare.png"), x: 0.3, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addImage({ path: img("17_compare_charts.png"), x: 5.2, y: 1.1, w: 4.5, h: 2.8, shadow: makeShadow() });
  slide.addText("VAST achieves consistently higher alignment than RLHF, Constitutional AI, and Value Learning", {
    x: 0.8, y: 4.2, w: 8.4, h: 0.5,
    fontSize: 13, fontFace: "Calibri", color: C.text, align: "center", margin: 0,
  });

  // ============================================================
  // SLIDE 16: Contributions
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.lightBg };
  slide.addText("Key Contributions", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.6,
    fontSize: 32, fontFace: "Georgia", color: C.navy, bold: true, margin: 0,
  });

  const contribs = [
    { num: "1", title: "Tripartite Belief Model", desc: "Separates credence, confidence, and justification for transparent reasoning", col: C.blue },
    { num: "2", title: "JWMC Operator", desc: "Justification-weighted belief revision with proven value stability bounds", col: C.teal },
    { num: "3", title: "EEU-CC Decision Making", desc: "Soft cascading constraints balancing competing values without brittleness", col: C.green },
    { num: "4", title: "Four-Gauge Monitoring", desc: "Real-time multidimensional alignment tracking with actionable signals", col: C.purple },
    { num: "5", title: "Blockchain Integrity Layer", desc: "Hybrid anchoring with Merkle proofs, governed rules, and fraud detection", col: C.orange },
    { num: "6", title: "Working Implementation", desc: "Full-stack React app with 5 scenarios, blockchain integration, and presentation mode", col: C.red },
  ];

  contribs.forEach((c, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const x = 0.8 + col * 4.5;
    const y = 1.2 + row * 1.35;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.1, h: 1.15, fill: { color: C.white }, shadow: makeShadow(),
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: 1.15, fill: { color: c.col },
    });
    slide.addText(c.num, {
      x: x + 0.2, y, w: 0.5, h: 1.15,
      fontSize: 28, fontFace: "Georgia", color: c.col, bold: true, valign: "middle", margin: 0,
    });
    slide.addText(c.title, {
      x: x + 0.7, y, w: 3.2, h: 0.55,
      fontSize: 14, fontFace: "Calibri", color: C.text, bold: true, valign: "bottom", margin: 0,
    });
    slide.addText(c.desc, {
      x: x + 0.7, y: y + 0.55, w: 3.2, h: 0.5,
      fontSize: 11, fontFace: "Calibri", color: C.textMuted, valign: "top", margin: 0,
    });
  });

  // ============================================================
  // SLIDE 17: Conclusion
  // ============================================================
  slide = pres.addSlide();
  slide.background = { color: C.navy };
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.cyan },
  });

  slide.addText("Thank You", {
    x: 0, y: 1.2, w: 10, h: 0.9,
    fontSize: 44, fontFace: "Georgia", color: C.white, bold: true, align: "center", margin: 0,
  });
  slide.addText("Questions?", {
    x: 0, y: 2.2, w: 10, h: 0.6,
    fontSize: 24, fontFace: "Calibri", color: C.cyan, align: "center", margin: 0,
  });

  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 3.2, w: 3.0, h: 0, line: { color: C.teal, width: 1 },
  });

  slide.addText("Soraya Partow  |  spartow@radar.gsw.edu", {
    x: 0, y: 3.5, w: 10, h: 0.5,
    fontSize: 14, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });
  slide.addText("Dr. Satyaki Nan  |  Georgia Southwestern State University", {
    x: 0, y: 4.0, w: 10, h: 0.5,
    fontSize: 12, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });
  slide.addText("Two accepted papers: VAST Framework & VAST-Blockchain", {
    x: 0, y: 4.6, w: 10, h: 0.4,
    fontSize: 11, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // Write file
  // ============================================================
  await pres.writeFile({ fileName: OUTPUT });
  console.log("Presentation created: " + OUTPUT);
  console.log("Total slides: 17");
}

main().catch(console.error);
