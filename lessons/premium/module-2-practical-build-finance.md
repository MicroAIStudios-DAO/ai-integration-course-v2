# Module 2 Practical Build: AI Portfolio Risk Snapshot + Investment Memo

Goal: take tickers + a date range -> compute basic risk metrics -> have AI explain what they mean in plain English.

---

## Slide 1 - Outcome

```
+--------------------------------------------------------------+
|   BUILD: Portfolio Risk Snapshot + AI Investment Memo         |
|                                                              |
|   Inputs: tickers, date range, risk tolerance                 |
|   Outputs: charts + metrics + plain-English interpretation    |
|                                                              |
|   Skill: "Numbers -> narrative" (without hallucinating facts)  |
+--------------------------------------------------------------+
```

---

## Slide 2 - Architecture

```
User -> Streamlit UI -> Price Data (yfinance) -> Metrics (pandas/numpy)
                                   |
                             OpenAI (memo)
                                   |
                         Memo + Next steps
```

---

## Slide 3 - Build steps

```
1) Create module folder
2) Paste app.py
3) Run streamlit
4) Commit checkpoint
```

---

# Step 1 - Create the file

Create: `modules/module_2_finance/app.py`

```py
from __future__ import annotations

import math
from datetime import date, timedelta

import numpy as np
import pandas as pd
import streamlit as st
import yfinance as yf

from common.llm import generate_text


APP_TITLE = "AI Portfolio Risk Snapshot + Investment Memo"


def _as_dataframe(prices) -> pd.DataFrame:
    """
    yfinance returns:
      - DataFrame for multiple tickers
      - Series for single ticker

    Normalize to DataFrame with columns as tickers.
    """
    if isinstance(prices, pd.Series):
        return prices.to_frame()
    return prices


def compute_metrics(adj_close: pd.DataFrame) -> dict:
    adj_close = adj_close.dropna(how="all")
    returns = adj_close.pct_change().dropna(how="all")

    # Annualization factor (trading days)
    ann = 252

    ann_return = returns.mean() * ann
    ann_vol = returns.std() * math.sqrt(ann)
    sharpe = ann_return / ann_vol.replace(0, np.nan)

    cum = (1 + returns).cumprod()
    peak = cum.cummax()
    drawdown = (cum / peak) - 1
    max_dd = drawdown.min()

    corr = returns.corr()

    summary = pd.DataFrame(
        {
            "annual_return": ann_return,
            "annual_volatility": ann_vol,
            "sharpe_0_rf": sharpe,
            "max_drawdown": max_dd,
        }
    ).sort_index()

    return {
        "returns": returns,
        "summary": summary,
        "correlation": corr,
        "drawdown": drawdown,
    }


def build_memo_prompt(
    *,
    tickers: list[str],
    start: date,
    end: date,
    risk_tolerance: str,
    summary: pd.DataFrame,
    corr: pd.DataFrame,
) -> str:
    summary_csv = summary.round(6).reset_index().to_csv(index=False)
    corr_csv = corr.round(6).reset_index().to_csv(index=False)

    return f"""
You are helping a student interpret basic portfolio risk metrics.

Context:
- This is educational content only, not financial advice.
- Tickers: {", ".join(tickers)}
- Date range: {start.isoformat()} to {end.isoformat()}
- Risk tolerance: {risk_tolerance}

Metrics (CSV):
{summary_csv}

Correlation matrix (CSV):
{corr_csv}

Write:
1) A plain-English explanation of what these metrics mean.
2) 3 key risks observed (volatility, concentration, correlation, drawdown).
3) 3 risk-management ideas appropriate for the stated risk tolerance.
4) A short "learning next steps" checklist.

Format as clean Markdown with headings and bullet points.
"""


def main() -> None:
    st.set_page_config(page_title=APP_TITLE, layout="wide")
    st.title(APP_TITLE)
    st.caption("Educational tool. Not financial, investment, or tax advice.")

    colA, colB, colC = st.columns([2, 1, 1])
    with colA:
        tickers_raw = st.text_input("Tickers (comma-separated)", "AAPL, MSFT, SPY")
    with colB:
        end = st.date_input("End date", value=date.today())
    with colC:
        start = st.date_input("Start date", value=date.today() - timedelta(days=365))

    risk_tolerance = st.selectbox(
        "Risk tolerance",
        ["Conservative", "Moderate", "Aggressive"],
        index=1,
    )

    tickers = [t.strip().upper() for t in tickers_raw.split(",") if t.strip()]
    if not tickers:
        st.warning("Enter at least one ticker.")
        return

    if start >= end:
        st.warning("Start date must be before end date.")
        return

    run = st.button("Run analysis", type="primary")

    if run:
        with st.spinner("Downloading price data..."):
            data = yf.download(tickers, start=start, end=end, auto_adjust=False, progress=False)

        if data.empty:
            st.error("No data returned. Check tickers and dates.")
            return

        # yfinance returns multiindex columns when multiple tickers
        if isinstance(data.columns, pd.MultiIndex):
            adj_close = data["Adj Close"]
        else:
            adj_close = data["Adj Close"]

        adj_close = _as_dataframe(adj_close)

        metrics = compute_metrics(adj_close)
        summary = metrics["summary"]
        corr = metrics["correlation"]
        drawdown = metrics["drawdown"]

        left, right = st.columns([1.1, 0.9])
        with left:
            st.subheader("Price history")
            st.line_chart(adj_close)

            st.subheader("Drawdown")
            st.line_chart(drawdown)

        with right:
            st.subheader("Summary metrics")
            st.dataframe(summary.style.format("{:.2%}"), use_container_width=True)

            st.subheader("Correlation")
            st.dataframe(corr.style.format("{:.2f}"), use_container_width=True)

        st.divider()

        prompt = build_memo_prompt(
            tickers=tickers,
            start=start,
            end=end,
            risk_tolerance=risk_tolerance,
            summary=summary,
            corr=corr,
        )

        instructions = "Be clear, concise, and honest. Use the provided metrics; do not invent numbers."
        with st.spinner("Writing memo with AI..."):
            memo = generate_text(prompt=prompt, instructions=instructions)

        st.subheader("AI-generated interpretation")
        st.markdown(memo)


if __name__ == "__main__":
    main()
```

---

# Step 2 - Run it

From repo root:

```bash
streamlit run modules/module_2_finance/app.py
```

---

# Step 3 - Commit checkpoint

```bash
git add modules/module_2_finance/app.py
git commit -m "Module 2: portfolio risk snapshot + AI memo"
git push
```

---

# Upgrade ideas (optional)

- Add portfolio weights (CSV upload) + compute weighted risk.
- Add a "policy guardrail" prompt: "don't recommend specific trades."
- Add stress scenarios (2008-like drawdown, rate shock, etc.) with synthetic shocks.
