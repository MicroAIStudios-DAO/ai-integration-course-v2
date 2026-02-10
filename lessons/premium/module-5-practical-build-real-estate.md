# Module 5 Practical Build: Real Estate Deal Underwriter + Listing Optimizer

Goal: compute basic underwriting metrics (NOI, cap rate, DSCR, cash-on-cash) and have AI produce a clear, cautious deal summary.

---

## Slide 1 - Outcome

```
+----------------------------------------------------------------+
|   BUILD: Real Estate Deal Underwriter + Listing Optimizer       |
|                                                                |
|   Inputs: rent, expenses, financing, notes                       |
|   Outputs: underwriting metrics + risks + questions + copy       |
|                                                                |
|   Skill: fast deal screening with honest AI narration            |
+----------------------------------------------------------------+
```

---

## Slide 2 - Architecture

```
Inputs -> Underwrite math -> OpenAI -> summary + checklist + scenarios
```

---

## Slide 3 - Guardrails (important)

```
No hype. No guarantees. No legal/tax advice.
If DSCR is weak, we say it's weak.
```

---

# Step 1 - Create the file

Create: `modules/module_5_real_estate/app.py`

```py
from __future__ import annotations

import math

import streamlit as st

from common.llm import generate_text


APP_TITLE = "Real Estate Deal Underwriter + Listing Optimizer"


def monthly_payment(principal: float, annual_rate: float, years: int) -> float:
    r = (annual_rate / 100.0) / 12.0
    n = years * 12
    if r == 0:
        return principal / n
    return principal * (r * (1 + r) ** n) / ((1 + r) ** n - 1)


def main() -> None:
    st.set_page_config(page_title=APP_TITLE, layout="wide")
    st.title(APP_TITLE)
    st.caption("Educational tool. Not legal, tax, or investment advice.")

    col1, col2, col3 = st.columns(3)

    with col1:
        address = st.text_input("Property (for your notes)", "123 Example St, Phoenix, AZ")
        property_type = st.selectbox("Type", ["Single family", "Multifamily", "Short-term rental", "Commercial"], index=0)
        purchase_price = st.number_input("Purchase price ($)", min_value=0.0, value=350000.0, step=5000.0)
        closing_costs = st.number_input("Closing costs ($)", min_value=0.0, value=9000.0, step=500.0)

    with col2:
        monthly_rent = st.number_input("Gross monthly rent ($)", min_value=0.0, value=2500.0, step=50.0)
        vacancy_rate = st.number_input("Vacancy rate (%)", min_value=0.0, max_value=50.0, value=6.0, step=0.5)
        monthly_expenses = st.number_input("Monthly operating expenses ($)", min_value=0.0, value=800.0, step=25.0)

    with col3:
        down_payment_pct = st.number_input("Down payment (%)", min_value=0.0, max_value=100.0, value=25.0, step=1.0)
        interest_rate = st.number_input("Interest rate (%)", min_value=0.0, max_value=20.0, value=6.5, step=0.1)
        loan_years = st.number_input("Loan term (years)", min_value=1, max_value=40, value=30, step=1)

    rehab_budget = st.number_input("Rehab / improvements budget ($)", min_value=0.0, value=0.0, step=500.0)

    notes = st.text_area(
        "Property notes (condition, neighborhood, comps, risks, unique features)",
        "3 bed / 2 bath. Near downtown. Older roof. Strong rental demand. 2 comps at $2,600 and $2,750.",
        height=120,
    )

    if st.button("Underwrite + Generate Summary", type="primary"):
        gsi = monthly_rent * 12
        egi = gsi * (1 - vacancy_rate / 100.0)
        opex = monthly_expenses * 12
        noi = egi - opex

        cap_rate = (noi / purchase_price) if purchase_price else 0.0

        down_payment = purchase_price * (down_payment_pct / 100.0)
        loan_amount = purchase_price - down_payment

        m_pay = monthly_payment(loan_amount, interest_rate, int(loan_years))
        debt_service = m_pay * 12

        dscr = (noi / debt_service) if debt_service else math.inf
        cash_flow = noi - debt_service

        cash_invested = down_payment + closing_costs + rehab_budget
        coc = (cash_flow / cash_invested) if cash_invested else 0.0

        st.subheader("Deal metrics (quick)")
        st.write(
            {
                "Gross scheduled income (annual)": round(gsi, 2),
                "Effective gross income (annual)": round(egi, 2),
                "Operating expenses (annual)": round(opex, 2),
                "NOI (annual)": round(noi, 2),
                "Cap rate": round(cap_rate * 100, 2),
                "Debt service (annual)": round(debt_service, 2),
                "DSCR": round(dscr, 2),
                "Cash flow (annual)": round(cash_flow, 2),
                "Cash invested": round(cash_invested, 2),
                "Cash-on-cash return": round(coc * 100, 2),
            }
        )

        prompt = f"""
You are helping a student learn real estate underwriting.

Property:
- Address/label: {address}
- Type: {property_type}

Inputs:
- Purchase price: ${purchase_price:,.0f}
- Monthly rent: ${monthly_rent:,.0f}
- Vacancy rate: {vacancy_rate:.1f}%
- Monthly operating expenses: ${monthly_expenses:,.0f}
- Down payment: {down_payment_pct:.0f}%
- Interest rate: {interest_rate:.2f}%
- Loan term: {int(loan_years)} years
- Closing costs: ${closing_costs:,.0f}
- Rehab budget: ${rehab_budget:,.0f}

Computed:
- NOI: ${noi:,.0f} / yr
- Cap rate: {cap_rate*100:.2f}%
- DSCR: {dscr:.2f}
- Cash flow: ${cash_flow:,.0f} / yr
- Cash-on-cash: {coc*100:.2f}%

Notes:
{notes}

Deliverables (Markdown):
1) A plain-English deal summary (what looks good, what looks risky).
2) A "questions to ask before you buy" checklist (10 items).
3) 3 scenario tweaks to stress-test (e.g., vacancy up, expenses up, rent down).
4) Optional: a short listing description optimized for renters or buyers (pick whichever fits the property type best).

Rules:
- Educational tone. No guarantees, no hype, no legal/tax advice.
- If a metric looks weak (e.g., DSCR), say so.
"""
        instructions = "You are a conservative real estate analyst. Be clear and candid."

        with st.spinner("Generating analysis..."):
            out = generate_text(prompt=prompt, instructions=instructions)

        st.subheader("AI-generated analysis")
        st.markdown(out)


if __name__ == "__main__":
    main()
```

---

# Step 2 - Run it

```bash
streamlit run modules/module_5_real_estate/app.py
```

---

# Step 3 - Commit checkpoint

```bash
git add modules/module_5_real_estate/app.py
git commit -m "Module 5: real estate underwriter + AI summary"
git push
```

---

# Upgrade ideas (optional)

- Add "rent roll" upload (CSV) for multifamily.
- Add a sensitivity table (rent +/-, expenses +/-, rate +/-).
- Add a "tenant persona" generator for listing optimization.
