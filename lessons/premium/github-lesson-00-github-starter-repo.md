# Practical Build Framework: GitHub + Starter Repo (Do This Once)

You're going to create a single GitHub repo that holds all course builds (Modules 2-7).
Each module becomes its own little folder + app you can run locally.

---

## Slide 1 - What you're building

```
+------------------------------------------------------------------+
|                 AI INTEGRATION COURSE - BUILDS REPO              |
|                                                                  |
|  One repo. Six mini-apps. Each module gets a practical build.     |
|                                                                  |
|  Modules:                                                        |
|   - M2 Finance: risk snapshot + memo                              |
|   - M3 Startups: lean canvas + experiments                        |
|   - M4 Small Biz: FAQ/SOP assistant (tiny RAG)                    |
|   - M5 Real Estate: underwriting + listing optimizer              |
|   - M6 Exec Leadership: strategy brief generator                  |
|   - M7 Creative: creative brief + shot list generator             |
+------------------------------------------------------------------+
```

---

## Slide 2 - Repo layout

```
ai-integration-builds/
  common/                 # shared utilities (LLM wrapper)
  modules/
    module_2_finance/
    module_3_startups/
    module_4_small_business/
    module_5_real_estate/
    module_6_exec_leadership/
    module_7_creative/
  .env.example
  requirements.txt
  hello_ai.py             # sanity test (LLM call)
  hello_app.py            # sanity test (Streamlit UI)
```

---

## Slide 3 - Git workflow (the "muscle memory")

```
+-------------------+     +------------------+     +------------------+
| edit files locally | --> | git commit       | --> | git push          |
| (code + markdown)  |     | (checkpoint)     |     | (backup + share)  |
+-------------------+     +------------------+     +------------------+
```

---

# Part A - Create a GitHub account (first-timers)

1. Go to GitHub and create an account.
2. Verify your email.
3. (Optional but smart) Turn on 2FA (Two-Factor Authentication).

---

# Part B - Create your course repo on GitHub

1. In GitHub: **New repository**
2. Name it: `ai-integration-builds`
3. Set visibility: Public or Private (your choice)
4. Check **Add a README** (recommended)
5. Create repository

---

# Part C - Clone the repo to your computer

## Option 1 (recommended): Git + terminal

```bash
cd ~/Desktop
git clone https://github.com/YOUR_USERNAME/ai-integration-builds.git
cd ai-integration-builds
```

## Option 2: GitHub Desktop (GUI)
- Install GitHub Desktop
- "Clone repository"
- Choose your new repo

---

# Part D - Create a Python environment (clean + repeatable)

From the repo root:

```bash
python -m venv .venv
```

Activate it:

**macOS/Linux**
```bash
source .venv/bin/activate
```

**Windows PowerShell**
```powershell
.\.venv\Scripts\Activate.ps1
```

---

# Part E - Add the starter files (copy/paste)

Create folders:

```bash
mkdir -p common modules
mkdir -p modules/module_2_finance modules/module_3_startups modules/module_4_small_business
mkdir -p modules/module_5_real_estate modules/module_6_exec_leadership modules/module_7_creative
```

## 1) `.gitignore`

Create `.gitignore`:

```gitignore
# secrets
.env

# python
__pycache__/
*.pyc
*.pyo
*.pyd
.venv/

# OS
.DS_Store
Thumbs.db

# streamlit
.streamlit/

# local outputs
outputs/
```

## 2) `.env.example`

Create `.env.example`:

```env
# Copy this file to .env and fill in values.
OPENAI_API_KEY="YOUR_KEY_HERE"

# Optional: choose a model your account has access to
OPENAI_MODEL="gpt-5.2"
```

Important:
- Create your real `.env` locally (never commit it).
- Your code reads `OPENAI_API_KEY` from the environment. This matches OpenAI's current quickstart pattern.

## 3) `requirements.txt`

Create `requirements.txt`:

```txt
openai
python-dotenv
streamlit
pandas
numpy
yfinance
scikit-learn
tabulate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## 4) `common/__init__.py`

Create an empty file:

```py
# common package
```

## 5) `common/llm.py` (shared OpenAI wrapper)

Create `common/llm.py`:

```py
from __future__ import annotations

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.2")


def _require_api_key() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError(
            "Missing OPENAI_API_KEY. Copy .env.example to .env and set your key."
        )


def client() -> OpenAI:
    _require_api_key()
    return OpenAI()


def generate_text(*, prompt: str, instructions: str = "", model: str = DEFAULT_MODEL) -> str:
    """
    Minimal wrapper around the OpenAI Responses API.

    - prompt: user input / task
    - instructions: higher-priority system/developer instruction (optional)
    - model: defaults to env OPENAI_MODEL or 'gpt-5.2'
    """
    c = client()
    kwargs = {}
    if instructions:
        kwargs["instructions"] = instructions

    resp = c.responses.create(
        model=model,
        input=prompt,
        **kwargs,
    )
    return resp.output_text
```

## 6) `hello_ai.py` (sanity test)

Create `hello_ai.py`:

```py
from common.llm import generate_text

print(
    generate_text(
        prompt="Write a 1-sentence bedtime story about a unicorn who learns Git.",
        instructions="Be whimsical but short."
    )
)
```

Run it:

```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY
python hello_ai.py
```

## 7) `hello_app.py` (Streamlit sanity test)

Create `hello_app.py`:

```py
import streamlit as st
from common.llm import generate_text

st.set_page_config(page_title="Hello AI", layout="centered")
st.title("Hello AI (Repo sanity test)")

prompt = st.text_area("Prompt", "Give me a 5-bullet cheat sheet for Git commits.")
if st.button("Generate", type="primary"):
    out = generate_text(prompt=prompt, instructions="Be practical and concise.")
    st.markdown(out)
```

Run it:

```bash
streamlit run hello_app.py
```

---

# Part F - Your first commit + push (checkpoint)

```bash
git status
git add .
git commit -m "Add starter repo scaffold + OpenAI wrapper"
git push origin main
```

---

# You're done. Now build modules 2-7

Next practical builds:
- Module 2: `module-2-practical-build-finance.md`
- Module 3: `module-3-practical-build-startups.md`
- Module 4: `module-4-practical-build-small-business.md`
- Module 5: `module-5-practical-build-real-estate.md`
- Module 6: `module-6-practical-build-exec-leadership.md`
- Module 7: `module-7-practical-build-creative-industries.md`
