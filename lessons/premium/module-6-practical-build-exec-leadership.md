# Module 6 Practical Build: Executive AI Strategy Brief Generator

Goal: turn leadership inputs into a **board-ready AI roadmap**, plus governance, risks, and KPIs.

---

## Slide 1 - Outcome

```
+--------------------------------------------------------------+
|   BUILD: Executive AI Strategy Brief Generator                |
|                                                              |
|   Inputs: current state + goals + constraints                 |
|   Outputs: roadmap + risk register + KPI suggestions          |
|                                                              |
|   Skill: strategic clarity without hype                       |
+--------------------------------------------------------------+
```

---

## Slide 2 - Architecture

```
Leader inputs -> structured prompt -> OpenAI -> strategy packet (Markdown)
```

---

## Slide 3 - The "no-regrets" pattern

```
Pick one small, high-value use case -> ship in weeks -> learn -> expand
```

---

# Step 1 - Create the file

Create: `modules/module_6_exec_leadership/app.py`

```py
from __future__ import annotations

import streamlit as st

from common.llm import generate_text


APP_TITLE = "Executive AI Strategy Brief Generator"


def main() -> None:
    st.set_page_config(page_title=APP_TITLE, layout="wide")
    st.title(APP_TITLE)
    st.caption("Turn messy leadership inputs into a crisp AI roadmap, risk register, and KPI set.")

    col1, col2 = st.columns(2)

    with col1:
        company = st.text_input("Company (or anonymized label)", "Acme Logistics")
        industry = st.text_input("Industry", "Logistics / supply chain")
        size = st.selectbox("Company size", ["1-10", "11-50", "51-200", "201-1000", "1000+"], index=2)
        current_state = st.text_area(
            "Current state (systems, data, bottlenecks)",
            "We use Excel + a legacy ERP. Customer support is email-heavy. Data lives in silos.",
            height=120,
        )

    with col2:
        goals = st.text_area(
            "Strategic goals (12-18 months)",
            "Reduce support costs 20%, improve on-time delivery, grow enterprise accounts.",
            height=90,
        )
        constraints = st.text_area(
            "Constraints (budget, headcount, regulation, risk appetite)",
            "No new headcount this quarter. Moderate risk appetite. Must protect customer data.",
            height=90,
        )
        stakeholders = st.text_input("Key stakeholders", "CEO, COO, Head of Support, IT lead")

    horizon = st.selectbox("Planning horizon", ["90 days", "6 months", "12 months"], index=0)
    tone = st.selectbox("Writing style", ["Board-ready", "Operator-friendly", "Technical"], index=0)

    if st.button("Generate strategy brief", type="primary"):
        prompt = f"""
Create an executive-ready AI strategy packet in Markdown.

Company: {company}
Industry: {industry}
Size: {size}
Stakeholders: {stakeholders}
Horizon: {horizon}
Style: {tone}

Current state:
{current_state}

Goals:
{goals}

Constraints:
{constraints}

Deliverables:
1) Executive summary (one page max).
2) Use-case portfolio: 8 AI opportunities, each with:
   - value (time/money/risk)
   - feasibility (data, tech, change mgmt)
   - first step
3) 90-day roadmap (weekly milestones).
4) Governance & risk: a risk register (10 items) + mitigations + owner roles.
5) KPI dashboard suggestions: 8 KPIs, with definitions and why they matter.
6) "First principles" note: what NOT to do (common traps).
7) Optional: an outline of 6 slides for a leadership presentation.

Rules:
- Assume we have limited data maturity unless stated otherwise.
- Prefer incremental wins + learning loops.
- Be honest about uncertainty.
- No vendor-specific claims.
"""
        instructions = "You are a pragmatic enterprise AI advisor. Be crisp, non-hyped, and structured."

        with st.spinner("Generating..."):
            out = generate_text(prompt=prompt, instructions=instructions)

        st.subheader("Strategy packet")
        st.markdown(out)

        st.divider()
        st.caption("Next move: pick the smallest high-value use case, ship in 2-4 weeks, then iterate.")


if __name__ == "__main__":
    main()
```

---

# Step 2 - Run it

```bash
streamlit run modules/module_6_exec_leadership/app.py
```

---

# Step 3 - Commit checkpoint

```bash
git add modules/module_6_exec_leadership/app.py
git commit -m "Module 6: executive AI strategy brief generator"
git push
```

---

# Upgrade ideas (optional)

- Add a "data maturity" scoring rubric and tailor recommendations.
- Add export buttons: save output to `outputs/strategy_packet.md`.
- Add a second pass: "red-team the plan" (risks, failure modes, mitigation).
