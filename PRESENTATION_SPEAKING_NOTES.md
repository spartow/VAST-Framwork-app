# VAST Framework Presentation - Speaking Notes
## Autonomous Vehicle Scenario Demo

### Preparation Before Starting
- Load **Scenario 2: Autonomous Vehicle Emergency Decision**
- Run through Beliefs → Decision → Gauges tabs to populate all data
- Enter Presentation Mode (📊 Present button)
- Have timer ready (it auto-starts)

---

## Slide 1: Title Slide (30 seconds)

### What You Say:
"Good [morning/afternoon]. Today I'm presenting my master's thesis on VAST - a transparent framework for AI moral alignment.

The challenge we face is: How can AI systems make ethical decisions when they're uncertain about outcomes? Current approaches like RLHF lack transparency, and Constitutional AI is too rigid.

VAST solves this through structured belief representation, moral consistency, and continuous monitoring. Let me show you how it works with a real-world scenario."

**Key Points:**
- Establish the problem: AI making ethical decisions under uncertainty
- Position VAST as a solution
- Signal you'll demonstrate with a concrete example

---

## Slide 2: Framework Overview (1-2 minutes)

### What You Say:
"VAST has four integrated components that work together:

**First, Belief Representation** - Every action is represented as a tuple: credence (probability distribution), confidence (how certain we are), and justification (the moral grounding).

In our autonomous vehicle scenario, you can see a real example here [point to example box]. For the 'brake hard' option, the system has 70% credence that only minor injury occurs, a confidence of 0.82, and justifies this with principles like 'preserve life' and 'minimize harm.'

**Second, JWMC - Justified Weighted Moral Consistency** - This prevents value drift. When new evidence comes in, updates are weighted by moral coherence. You can see the key parameters here: lambda controls how much we prioritize consistency over adaptation.

**Third, EEU-CC Decision Making** - This uses cascading constraints. Instead of hard rules that break, we have soft hierarchical priorities. The top constraint - 'minimize harm to pedestrians' - has the highest penalty if violated, but the system can still balance multiple considerations.

**Fourth, Four Gauges** - These monitor alignment in real-time. We track calibration, normative alignment, coherence, and reasoning quality. [If decision made] You can see our current scores here - 84% overall VAST score shows strong alignment.

The key innovation is transparency at every step. We can audit exactly why the system made each decision."

**Key Points:**
- Walk through each component sequentially
- Point to the actual data examples shown on screen
- Emphasize **transparency** and **auditability**
- Connect to your thesis contribution

---

## Slide 3: Scenario Description (1 minute)

### What You Say:
"Let me show you the scenario we're analyzing - this is Scenario 2 from my thesis, Section 6.2.

We have a self-driving vehicle on a city street. Suddenly, a pedestrian steps into the road, and an accident is unavoidable. The vehicle has 0.3 seconds to decide between three options:

**Option A: Brake Hard** - 30% chance of minor passenger whiplash, pedestrian is safe. This is the safest overall outcome.

**Option B: Swerve Right** - Protects the passenger completely, but 85% chance of seriously injuring the pedestrian.

**Option C: Continue** - No action. This results in a 95% chance of serious passenger injury.

This is classified as a **high difficulty** scenario because:
- We have life-or-death stakes
- Time pressure is extreme - 0.3 seconds
- It's a modern version of the trolley problem
- There's no perfect solution

The ethical tension is clear: should the vehicle prioritize protecting its passenger, or the pedestrian who made the mistake? And under such uncertainty and time pressure, how can the AI justify its decision?

Our cascading constraints show the value hierarchy: Priority 1 is minimizing harm to pedestrians - they're the most vulnerable. Priority 2 is ensuring passenger safety. Priority 3 is following traffic law."

**Key Points:**
- Paint the scenario vividly - make it real
- Emphasize the **moral dilemma** (passenger vs pedestrian)
- Highlight **high difficulty** and **time pressure**
- Show the cascading priorities

---

## Slide 4: Beliefs (45 seconds)

### What You Say:
"Before making any decision, VAST forms structured beliefs about each option.

For **Option A - Brake Hard**, the system has:
- **Credence**: 70% no injury, 30% minor injury
- **Confidence**: 0.82 - we're fairly certain about braking physics
- **Justification**: This is grounded in moral principles like 'preserve life' and 'protect vulnerable road users', supported by facts like 'stopping is possible' and rules like 'emergency protocols'

Each of the three options has this same structured representation. Notice the confidence varies - we're less confident about the swerve option (0.75) because pedestrian movement is harder to predict.

This is much more transparent than a black-box neural network. We can see exactly what the system believes and why."

**Key Points:**
- Explain the (π, κ, J) tuple clearly
- Show how **confidence varies** based on uncertainty
- Emphasize **transparency** over black-box approaches

---

## Slide 5: Decision Process (1 minute)

### What You Say:
"Now VAST makes the decision using EEU-CC - Expected Epistemic Utility with Cascading Constraints.

The system calculated utilities for all three options and selected **Brake Hard** with an expected utility of [read the number from screen, e.g., 0.5721].

You can see the comparison here [point to utility bars]. Brake Hard has the highest utility because:
1. It best satisfies our top priority constraint - protecting the pedestrian
2. It has high confidence (0.82) so we trust this outcome
3. The penalty from our cascading constraints is lowest

The other options receive penalties: Swerve Right violates our top priority (harm to pedestrian) and gets heavily penalized. Continue harms the passenger, violating priority 2.

This is the key advantage over Constitutional AI - instead of hard rules that would completely block 'Swerve Right', we use soft penalties. If the situation were different - say, multiple pedestrians vs one passenger - the penalties could shift and allow a different choice. That's the flexibility we need for real-world ethics."

**Key Points:**
- Explain how EEU-CC works: utilities + penalties
- Show why Brake Hard wins (satisfies top constraint)
- Contrast with rigid rule-based systems
- Emphasize **flexibility** and **context-sensitivity**

---

## Slide 6: Results - Four Gauges (1-1.5 minutes)

### What You Say:
"After making the decision, we immediately evaluate alignment quality with our Four Gauges.

[Point to Overall VAST Score circle]
We achieved an **84% overall VAST score** - this indicates strong alignment with our ethical framework.

Let me break down the four components:

**Calibration (92%)** - This measures whether our probability estimates are accurate. 92% means the system's confidence levels match real-world frequencies well. When it says '70% chance of no injury', that's reliable.

**Normative Alignment (88%)** - This checks whether our decision respects our value hierarchy. 88% shows we strongly honored our constraint priorities - protecting the pedestrian came first.

**Coherence (79%)** - This detects contradictions in our reasoning. 79% is solid - there are no major logical inconsistencies, though there's always room for refinement.

**Reasoning Quality (78%)** - This evaluates the justification structure. 78% means our moral grounding is well-supported by facts, rules, and principles. Not perfect, but transparent and auditable.

The beauty of this system is **real-time monitoring**. If any gauge drops below threshold - say Coherence falls to 40% - we get an alert. We can immediately investigate: Did new evidence create a contradiction? Is value drift happening?

This continuous auditing is impossible with RLHF or other black-box approaches."

**Key Points:**
- Walk through each gauge clearly
- Explain what each percentage **means** in practical terms
- Emphasize **real-time monitoring** and **alerts**
- Contrast with black-box systems

---

## Slide 7: Framework Comparison (1-1.5 minutes)

### What You Say:
"Finally, let's see how VAST compares to state-of-the-art alignment methods. This data comes from Chapter 7 of my thesis.

[Point to each card while speaking]

**RLHF (55%)** - Reinforcement Learning from Human Feedback is the current industry standard, used by OpenAI and Anthropic. But it's a black box - we can't see why it makes decisions. Transparency: Low. Our evaluation shows 55% alignment.

**Constitutional AI (61%)** - This uses hard-coded rules. Better transparency, but rigid. When a rule is violated, the system breaks. It can't handle nuanced trade-offs. 61% alignment.

**Value Learning (56%)** - This tries to infer values from behavior. But values can drift over time without detection. Low transparency, 56% alignment.

**VAST (84%)** - Our framework achieves 84% alignment. Why?
- **High transparency** - Full audit trail at every step
- **Structured beliefs** - The (π, κ, J) tuple is interpretable
- **Flexible constraints** - Soft penalties, not hard rules
- **Continuous monitoring** - Four gauges detect failures in real-time

[Point to key findings]
We see **+29% improvement over RLHF**, the current industry baseline. In human evaluations, VAST received a 4.2 out of 5.0 for ethical acceptability.

The real advantage is under high uncertainty scenarios like our autonomous vehicle case. When stakes are life-or-death and time is critical, VAST's structured approach outperforms black-box methods."

**Key Points:**
- Compare methodically, don't just bash competitors
- Emphasize VAST's **unique advantages** (transparency, flexibility, monitoring)
- Cite **specific numbers** from your thesis (+29%, 4.2/5.0)
- Conclude with why this matters: **high-stakes, uncertain scenarios**

---

## Closing (30 seconds)

### What You Say:
"To summarize: VAST provides transparent, auditable AI moral alignment even under epistemic uncertainty. 

Through structured belief representation, justified moral consistency, cascading constraints, and continuous gauge monitoring, we achieved 84% alignment - significantly outperforming existing methods.

The autonomous vehicle scenario demonstrates that when AI systems face life-or-death decisions in milliseconds, we need more than black boxes or rigid rules. We need transparency, flexibility, and real-time auditing.

Thank you. I'm happy to answer questions."

---

## Tips for Delivery

### Pacing:
- Total time: **7-9 minutes** for all slides
- Don't rush the framework slide - it's your core contribution
- Use the **Next →** button or **arrow keys** to advance
- The timer in the top-right shows elapsed time

### Body Language:
- **Point to the screen** when referencing specific data
- Use hand gestures to show the "flow" down the framework diagram
- Make eye contact with your audience, not just reading slides

### Handling Questions:

**Q: "Why cascading constraints instead of hard rules?"**
A: "Hard rules break when constraints conflict. In the autonomous vehicle case, we can't absolutely prohibit all harm - someone will get hurt. Cascading constraints let us balance priorities with penalties. It's more realistic for real-world ethics."

**Q: "How did you validate the 84% score?"**
A: "Chapter 7 of my thesis details the evaluation. We used 5 diverse scenarios, compared against ground truth from ethics experts, and ran statistical tests. We also did human evaluations - participants rated VAST decisions 4.2/5.0 for ethical acceptability."

**Q: "Can VAST scale to more complex scenarios?"**
A: "Yes. The TypeScript modules I built - BeliefManager, JWMC, EEUCC, GaugeMonitor - are designed for scalability. The computational complexity is O(n) in the number of actions, which is feasible even for large action spaces."

**Q: "What about value learning - can VAST learn new values?"**
A: "VAST focuses on transparency and stability, not value learning. But JWMC does allow belief updates when new evidence arrives - the λ parameter controls how much we adapt vs. stay consistent. Future work could integrate active value learning."

---

## Technical Backup (If Asked)

### JWMC Formula:
"The update rule is: π' = π + w_moral × w_evidence × (π_e - π), where w_moral = 1 - λ × incoherence. This weights updates by how morally coherent the new evidence is."

### EEU-CC Formula:
"EEU(a) = Σ π(s) × U(s) - Σ σ^priority × violation. The cascading penalty increases exponentially with priority, so violating 'preserve life' costs much more than violating 'follow traffic law'."

### Gauge Calculation:
"Each gauge is 0-1 normalized. Calibration uses Brier score. Normative uses constraint satisfaction degree. Coherence detects logical contradictions. Reasoning evaluates justification completeness."

---

## Confidence Boosters

- **You built this.** The demo is running your actual code.
- **Point to real data.** Don't just describe - show them the numbers on screen.
- **It's okay to say "I don't know."** Follow with "That's an excellent question for future work."
- **Believe in your contribution.** 84% is a real achievement. +29% over RLHF matters.

---

## Emergency Troubleshooting

**If no decision data shows:**
"Let me quickly run the scenario - this will take just 10 seconds." 
→ Exit presentation, go to Decision tab, click "Run EEU-CC Decision", return to Present.

**If timer stops:**
Click the ▶ button in the top-right to restart it.

**If you lose your place:**
The navigation dots at the top show which slide you're on. Home/End keys jump to first/last slide.

---

## Final Checklist Before Presenting

- ✅ Scenario 2 (Autonomous Vehicle) loaded
- ✅ Decision has been run (so gauges show data)
- ✅ Build is up to date (`npm run build`)
- ✅ Presentation mode opened
- ✅ Water nearby
- ✅ Deep breath - you've got this! 🎓

---

**Good luck with your thesis defense! You've built something impressive.**
