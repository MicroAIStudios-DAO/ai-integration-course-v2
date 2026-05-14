# Founders Lesson: The Informed Architect (Adding Real-Time Search)

This is Day 2 of the Pioneer beta track.

Yesterday you built a content engine. Today you give it a set of eyes.

Static LLMs have a knowledge cutoff. If you want a post, memo, or workflow to sound current in March 2026, you need a research step before the writing step. In this lesson, you will build a Search Agent that pulls live web context and then uses that context to write.

## The Objective

Build an "Informed Architect" script that:

1. researches a topic with live search
2. extracts the most relevant snippets
3. writes content grounded in fresh data instead of stale model memory

## Step 1: Get Your Search Power

We use Serper because it is fast, inexpensive, and practical for developers.

1. Go to `https://serper.dev`.
2. Create an account.
3. Copy your API key.

## Step 2: Environment Update

You already configured your Gemini key in Day 1. Today you are adding a second key for search.

### Windows

Open PowerShell and set your key for the current session:

```powershell
$env:SERPER_API_KEY = "PASTE_YOUR_SERPER_KEY_HERE"
```

### macOS

Open Terminal and set your key:

```bash
export SERPER_API_KEY="PASTE_YOUR_SERPER_KEY_HERE"
```

## Step 3: Install The Missing Package

If you do not already have `requests` installed, add it now.

### Windows

```powershell
pip install requests litellm
```

### macOS

```bash
pip3 install requests litellm
```

## Step 4: Build The Informed Architect

Create a new file named `pioneer_search_engine.py` and paste in the following:

```python
import os
import requests
import json
from litellm import completion

# 1. API Keys
SERPER_KEY = os.getenv("SERPER_API_KEY")


def google_search(query):
    print(f"Searching Google for: {query}...")
    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query})
    headers = {"X-API-KEY": SERPER_KEY, "Content-Type": "application/json"}

    response = requests.request("POST", url, headers=headers, data=payload)
    results = response.json()

    # Extract the snippets from the search results
    snippets = [item["snippet"] for item in results.get("organic", [])[:3]]
    return " ".join(snippets)


def run_informed_architect(topic):
    # STEP 1: Research Phase
    search_data = google_search(topic)

    # STEP 2: Writing Phase (Using the Research)
    print("Architecting content based on live data...")
    response = completion(
        model="gemini/gemini-1.5-pro",
        messages=[
            {
                "role": "user",
                "content": f"""
                Act as an AI Research Journalist.
                Use the following LIVE SEARCH DATA to write a high-authority
                LinkedIn post about '{topic}'.

                Include at least one specific fact or trend found in the search data.

                SEARCH DATA: {search_data}
                """,
            }
        ],
    )

    return response.choices[0].message.content


# --- TEST IT HERE ---
print(run_informed_architect("AI Agent trends March 2026"))
```

## Step 5: Execute

### Windows

```powershell
python pioneer_search_engine.py
```

### macOS

```bash
python3 pioneer_search_engine.py
```

## What You Should Notice

This is the first time your script is not relying on model memory alone.

It is:

- researching first
- writing second
- grounding output in current signals

That pattern is the beginning of real agent design.

## Pioneer Challenge 2

Test the script with all three prompts below:

1. `AI Agent trends March 2026`
2. `Gemini 2026 enterprise adoption`
3. `best AI workflow automation examples 2026`

Then compare the outputs.

Ask:

- Which result sounded most current?
- Which result used the most specific facts?
- Which result would be safest to turn into a public post?

## What Is Next

In the next build, we move beyond search snippets and start shaping reusable research workflows so your agent can gather signal before it writes, decides, or recommends.
