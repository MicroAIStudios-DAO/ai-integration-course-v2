# Module 4 Practical Build: Small Business AI Helpdesk (FAQ + SOP Assistant)

Goal: build a small-biz assistant that answers questions **from your own business docs**, not vibes.

This is "tiny RAG":
- Retrieve relevant text from your /kb docs
- Then ask the model to answer using that context

---

## Slide 1 - Outcome

```
+---------------------------------------------------------------+
|   BUILD: Small Business Helpdesk (FAQ + SOP Assistant)          |
|                                                               |
|   Inputs: KB docs (markdown) + question                         |
|   Output: answer + sources (no made-up policies)                |
|                                                               |
|   Skill: reduce hallucinations by grounding in YOUR text        |
+---------------------------------------------------------------+
```

---

## Slide 2 - Architecture

```
Question -> Retrieve top KB passages (TF-IDF) -> OpenAI -> Answer + Sources
```

---

## Slide 3 - KB file examples

```
kb/
  business_overview.md
  policies.md
  faq.md
  sops.md
```

---

# Step 1 - Create your KB folder + sample docs

Create folder:

```bash
mkdir -p modules/module_4_small_business/kb
```

Create: `modules/module_4_small_business/kb/business_overview.md`

```md
# Business Overview

We are Nimbus Coffee.
We sell fresh-roasted beans delivered to customers.

Hours:
- Mon-Fri: 9am-5pm

Support:
- Email: support@nimbus.example
- Typical response time: 1 business day
```

Create: `modules/module_4_small_business/kb/policies.md`

```md
# Policies

## Shipping
Orders ship within 2 business days.

## Refunds
If your order arrives damaged, contact support within 7 days with a photo.
We will replace the item or refund the order.

## Cancellations
Subscriptions can be canceled anytime before the next billing date.
```

Create: `modules/module_4_small_business/kb/faq.md`

```md
# FAQ

## Do you offer decaf?
Yes. We offer a water-processed decaf.

## Do you ship internationally?
Not currently. We ship within the continental US.
```

---

# Step 2 - Create the app file

Create: `modules/module_4_small_business/app.py`

```py
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import streamlit as st
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from common.llm import generate_text


APP_TITLE = "Small Business AI Helpdesk (FAQ + SOP Assistant)"


@dataclass
class Chunk:
    source: str
    text: str


def chunk_markdown(text: str, *, source: str) -> list[Chunk]:
    """
    Simple chunking strategy:
    - split on blank lines
    - keep medium-sized paragraphs (merge short ones)
    """
    parts = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[Chunk] = []
    buf = []
    buf_len = 0
    for p in parts:
        if buf_len + len(p) < 900:
            buf.append(p)
            buf_len += len(p)
        else:
            chunks.append(Chunk(source=source, text="\n\n".join(buf)))
            buf = [p]
            buf_len = len(p)
    if buf:
        chunks.append(Chunk(source=source, text="\n\n".join(buf)))
    return chunks


@st.cache_data(show_spinner=False)
def load_kb(kb_dir: str) -> list[Chunk]:
    kb_path = Path(kb_dir)
    chunks: list[Chunk] = []
    for md in sorted(kb_path.glob("*.md")):
        chunks.extend(chunk_markdown(md.read_text(encoding="utf-8"), source=md.name))
    return chunks


@st.cache_data(show_spinner=False)
def build_index(chunks: list[Chunk]):
    texts = [c.text for c in chunks]
    vectorizer = TfidfVectorizer(stop_words="english")
    X = vectorizer.fit_transform(texts)
    return vectorizer, X


def retrieve(query: str, chunks: list[Chunk], vectorizer, X, k: int = 4) -> list[Chunk]:
    q = vectorizer.transform([query])
    sims = cosine_similarity(q, X).flatten()
    top = sims.argsort()[::-1][:k]
    return [chunks[i] for i in top]


def main() -> None:
    st.set_page_config(page_title=APP_TITLE, layout="wide")
    st.title(APP_TITLE)
    st.caption("Add your business info to /kb as Markdown. Ask questions; get answers with citations to your own docs.")

    kb_dir = st.text_input("Knowledge base folder", "modules/module_4_small_business/kb")

    chunks = load_kb(kb_dir)
    if not chunks:
        st.warning("No KB files found. Create markdown files in the folder above.")
        st.stop()

    vectorizer, X = build_index(chunks)

    question = st.text_input("Customer question / internal SOP question", "What is your refund policy?")
    tone = st.selectbox("Tone", ["Friendly", "Concise", "Professional", "Playful"], index=0)

    if st.button("Answer with AI", type="primary"):
        retrieved = retrieve(question, chunks, vectorizer, X, k=4)
        context = "\n\n---\n\n".join([f"[{c.source}]\n{c.text}" for c in retrieved])

        prompt = f"""
You are an assistant for a small business.

Answer the question using ONLY the context provided. If the context does not contain the answer, say:
"I don't have that information in the knowledge base yet."

Question:
{question}

Context:
{context}

Requirements:
- Output in Markdown.
- Include a short "Sources" section listing the KB filenames you used.
- If policy-related, suggest what to add to the KB if missing.
- Tone: {tone}
"""
        instructions = "Be accurate. Do not invent policies. Prefer quoting/paraphrasing the KB."

        with st.spinner("Thinking..."):
            answer = generate_text(prompt=prompt, instructions=instructions)

        st.subheader("Answer")
        st.markdown(answer)

        with st.expander("Retrieved context (debug)"):
            for c in retrieved:
                st.markdown(f"### {c.source}\n{c.text}")

    st.divider()
    st.markdown(
        """
### What to put in your /kb folder

Create 2-6 markdown files like:

- `business_overview.md` (what you do, who you serve, hours, contact)
- `policies.md` (refunds, returns, cancellations, privacy)
- `services.md` (what you sell + pricing bands)
- `faq.md` (real customer questions)
- `sops.md` (internal processes for staff)

This is "tiny RAG" (retrieval-augmented generation): we retrieve relevant text first, then ask the model to answer.
"""
    )


if __name__ == "__main__":
    main()
```

---

# Step 3 - Run it

```bash
streamlit run modules/module_4_small_business/app.py
```

---

# Step 4 - Commit checkpoint

```bash
git add modules/module_4_small_business
git commit -m "Module 4: small business helpdesk with tiny RAG"
git push
```

---

# Upgrade ideas (optional)

- Replace TF-IDF with embeddings + vector DB later (Pinecone, FAISS, etc.).
- Add a "KB editor" UI to create/update policies from the app.
- Add a "handoff to human" action button for edge cases.
