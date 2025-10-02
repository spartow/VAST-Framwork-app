# VAST Framework - Quick Start Guide

Get your VAST framework demo running in 5 minutes!

---

## Installation (One-Time Setup)

```bash
# Navigate to the project directory
cd c:\Users\Soraya\Downloads\exported-assets\vast-demo

# Install all dependencies
npm install
```

This will install React, Chart.js, and all required packages (~2 minutes).

---

## Running the Demo

```bash
# Start the development server
npm start
```

The application will automatically open at **http://localhost:3000**

---

## First Time Using the Demo

### Step 1: Load Healthcare Scenario (30 seconds)
1. Click **"📋 Scenarios"** tab (should be active by default)
2. Find the **Healthcare Crisis** card
3. Click **"Load Scenario"** button
4. ✅ All beliefs are automatically created

### Step 2: Make a Decision (15 seconds)
1. Click **"⚡ Make Decision"** button in the navigation
2. ✅ View the selected action and utility calculations
3. See detailed breakdown of:
   - Base utility
   - Moral weighting
   - Cascade penalties
   - Expected utility for each action

### Step 3: View VAST Gauges (20 seconds)
1. Click **"📊 Gauges"** tab
2. ✅ See all four alignment metrics:
   - **Calibration**: How well confidence matches accuracy
   - **Normative Alignment**: Moral principle consistency
   - **Coherence**: Internal belief consistency
   - **Reasoning**: Justification quality
3. Check the **Overall VAST Score** (center circle)

### Step 4: Review Audit Trail (15 seconds)
1. Click **"📝 Audit Trail"** tab
2. Click any decision entry to expand full details
3. Click **"📥 Export JSON"** to download complete audit log

### Step 5: Compare with Other Frameworks (10 seconds)
1. Click **"📈 Compare"** tab
2. See how VAST (0.76) outperforms:
   - Traditional AI (0.58)
   - Constitutional AI (0.61)
   - Value Learning (0.64)

**Total Time: ~90 seconds for complete demo tour!**

---

## Demo Flow for Presentations

### 10-Minute Academic Presentation

**Minutes 0-2: Introduction**
- Show homepage, explain VAST acronym
- Point out structured belief representation B(x) = (π, κ, J)

**Minutes 2-4: Scenario Loading**
- Load Healthcare Crisis scenario
- Explain the ethical dilemma (Patient A vs Patient B)
- Show pre-loaded beliefs for each action

**Minutes 4-6: Decision Making**
- Click "Make Decision"
- Walk through EEU-CC calculation
- Explain why "allocate_to_younger" was selected
- Show utility breakdown

**Minutes 6-8: VAST Gauges**
- Display all four gauges
- Explain what each measures
- Highlight 0.76 overall score (above 0.75 threshold)

**Minutes 8-9: Transparency & Audit**
- Open Audit Trail
- Expand a decision entry
- Show complete reasoning chain
- Demonstrate JSON export

**Minutes 9-10: Comparison**
- Show framework comparison chart
- Emphasize VAST's advantages:
  - Higher score
  - Complete transparency
  - Structured beliefs
  - Real-time monitoring

---

## Advanced Demo: JWMC Revision

**Demonstrate Belief Adaptation (2 minutes)**

1. Go to **Scenarios** tab
2. Click **"JWMC Demo"** button on Healthcare scenario
3. Watch as:
   - New evidence is applied
   - Belief is revised with moral weighting
   - Gauges update in real-time
4. Notification shows moral weight calculation

This demonstrates VAST's **adaptability** while maintaining **moral stability**.

---

## Creating Custom Scenarios

### Quick Custom Belief

1. Go to **🧠 Beliefs** tab
2. Scroll to **Create VAST Belief** form
3. Fill in:
   - Proposition: `my_custom_action`
   - Credence: Adjust sliders (must sum to 1.0)
   - Confidence: Set evidence strength
   - Facts, Rules, Moral Principles (one per line)
4. Click **"Create Belief"**

### Loading Your Own Scenario

Edit `src/data/scenarios.js` and add your scenario following the template in `CUSTOMIZATION_GUIDE.md`.

---

## Keyboard Shortcuts

- **1**: Scenarios tab
- **2**: Beliefs tab
- **3**: Make Decision
- **4**: Gauges tab
- **5**: Audit Trail tab
- **6**: Compare tab

*(Note: These work when focused on navigation buttons)*

---

## Troubleshooting

### Port 3000 Already in Use
```bash
# Use a different port
set PORT=3001 && npm start
```

### Charts Not Displaying
- Refresh the page (F5)
- Charts render after component mount

### Credence Sum Error
- Use the **"Normalize to 1.0"** button
- Ensure all values are between 0 and 1

### npm install Fails
- Check Node.js version: `node --version` (need v14+)
- Try: `npm cache clean --force`
- Then: `npm install` again

---

## Building for Deployment

```bash
# Create production build
npm run build

# Files will be in /build folder
# Deploy to any static hosting (Netlify, Vercel, GitHub Pages)
```

---

## Tips for Thesis Defense

### Emphasize These Points:

1. **Structured Beliefs (π, κ, J)**
   - Not just probabilities
   - Explicit confidence
   - Complete justification chains

2. **JWMC Revision**
   - Moral stability preservation
   - Weighted evidence combination
   - Adaptable yet consistent

3. **EEU-CC Decision**
   - Hierarchical moral constraints
   - Cascading penalties
   - Transparent utility calculation

4. **Four-Gauge Monitoring**
   - Real-time alignment assessment
   - Multi-dimensional evaluation
   - Proactive problem detection

5. **Complete Auditability**
   - Every decision fully traceable
   - Exportable for analysis
   - Regulatory compliance ready

### Handle Common Questions:

**Q: How does VAST compare to Constitutional AI?**
A: *Show Compare tab* - VAST scores 0.76 vs 0.61, provides structured beliefs vs static rules, and offers real-time monitoring.

**Q: Can VAST handle conflicting moral principles?**
A: *Demo JWMC* - Yes, through moral weighting and stability factors. Show how revision handles conflicts.

**Q: Is this scalable to production systems?**
A: *Show performance metrics in Audit Trail* - Sub-second decisions, handles 50+ beliefs, complete audit trail generation.

**Q: How do you validate the moral reasoning?**
A: *Show Gauges* - Four independent metrics provide comprehensive validation. Normative alignment specifically tracks moral consistency.

---

## Next Steps

1. **Customize scenarios** for your specific use cases
2. **Adjust moral hierarchy** to match your ethical framework
3. **Add new gauges** for domain-specific metrics
4. **Integrate with backend** for real-world data
5. **Deploy to web** for broader accessibility

Refer to **CUSTOMIZATION_GUIDE.md** for detailed instructions.

---

## Support

For questions about:
- **Technical issues**: Check troubleshooting section
- **Customization**: See CUSTOMIZATION_GUIDE.md
- **Algorithm details**: Review inline comments in VASTFramework.js
- **Research context**: See vast_literature_expansion.md

---

**Your PhD thesis demo is ready!** 🎉

Open http://localhost:3000 and start exploring VAST.
