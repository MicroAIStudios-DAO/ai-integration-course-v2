# Module 3 Practical Build: Startup Idea Validator + Experiment Planner

Goal: turn a raw idea into a **Lean Canvas + assumptions + cheap experiments + a 7-day plan**.

---

## Slide 1 - Outcome

```
+---------------------------------------------------------------+
|   BUILD: Startup Validator + Experiment Planner                |
|                                                               |
|   Inputs: idea, customer, problem, differentiation, constraints|
|   Outputs: lean canvas + experiments + interview script         |
|                                                               |
|   Skill: "AI for structure + speed", not "AI as truth"         |
+---------------------------------------------------------------+
```

---

## Slide 2 - Architecture

```
Founder inputs -> Streamlit -> Prompt template -> OpenAI -> Markdown packet
```

---

## Slide 3 - The rule of the game

```
AI generates drafts.
Reality does validation.
Your job: run the experiments.
```

---

# Step 1 - Create the file

Create: `modules/module_3_startups/app.py`

```py
from __future__ import annotations

import streamlit as st

from common.llm import generate_text


APP_TITLE = "Startup Idea Validator + Experiment Planner"


def main() -> None:
    st.set_page_config(page_title=APP_TITLE, layout="wide")
    st.title(APP_TITLE)
    st.caption("Educational planning tool. Validate in the real world; AI is a draft machine, not a truth oracle.")

    col1, col2 = st.columns(2)

    with col1:
        idea = st.text_area(
            "Startup idea (1-3 paragraphs)",
            "We help independent fitness trainers sell monthly memberships with automated scheduling and payments.",
            height=160,
        )
        target_customer = st.text_input("Target customer", "Independent fitness trainers")
        problem = st.text_area("Problem you solve (bullets are fine)", "Admin overhead, inconsistent income, churn.", height=90)

    with col2:
        differentiation = st.text_area(
            "Why you? (unfair advantage / differentiation)",
            "We have partnerships with local gyms and deep experience in payment systems.",
            height=110,
        )
        business_model = st.text_input("Business model", "SaaS subscription: $49/mo per trainer")
        constraints = st.text_area("Constraints (time, budget, skills, compliance)", "1 developer, 2 weeks, $300 tools budget.", height=90)

    risk_posture = st.selectbox("Risk posture", ["Bootstrap-friendly", "VC-scale", "Unknown / exploring"], index=0)

    if st.button("Generate Lean Canvas + Experiments", type="primary"):
        prompt = f"""
Create a practical startup validation packet in Markdown.

Startup idea:
{idea}

Target customer: {target_customer}
Problem: {problem}
Differentiation: {differentiation}
Business model: {business_model}
Constraints: {constraints}
Risk posture: {risk_posture}

Deliverables:
1) Lean Canvas (Problem, Customer Segments, UVP, Solution, Channels, Revenue Streams, Cost Structure, Key Metrics, Unfair Advantage).
2) Assumptions list (at least 12). Tag each as (market / product / channel / pricing / ops).
3) Experiment backlog: 8 experiments with:
   - hypothesis
   - cheapest test
   - success metric
   - time estimate (hours)
   - cost estimate
4) A 7-day plan (day-by-day) that fits the constraints.
5) Customer interview script (10 questions + opening + closing).
6) A 60-second pitch + 10 investor Q&A bullets (answer directions, not lies).

Rules:
- Be skeptical. If something is unknown, label it explicitly.
- Prefer small, measurable experiments.
- Avoid legal/financial claims.
"""
        instructions = "You are a startup mentor. Be specific, actionable, and honest."

        with st.spinner("Generating..."):
            out = generate_text(prompt=prompt, instructions=instructions)

        st.subheader("Your validation packet")
        st.markdown(out)

        st.divider()
        st.caption("Tip: copy this output into a doc, then run the experiments. Reality is the only investor that never lies.")


if __name__ == "__main__":
    main()
```

---

# Step 2 - Run it

```bash
streamlit run modules/module_3_startups/app.py
```

---

# Step 3 - Commit checkpoint

```bash
git add modules/module_3_startups/app.py
git commit -m "Module 3: startup validator + experiment planner"
git push
```

---

# Upgrade ideas (optional)

- Add "experiment scoring" (ICE or RICE) and sort backlog.
- Add a "landing page copy generator" and export as `landing_page.md`.
- Add a button that saves outputs to `outputs/` with timestamps.
