# Module 7 Practical Build: Creative Brief + Shot List Generator

Goal: generate a **creative brief**, multiple **concept directions**, then a **production-ready beat sheet + shot list**.

---

## Slide 1 - Outcome

```
+--------------------------------------------------------------+
|   BUILD: Creative Brief + Shot List Generator                 |
|                                                              |
|   Inputs: audience, message, tone, constraints                |
|   Outputs: brief + concepts + beats + shots + checklist       |
|                                                              |
|   Skill: faster pre-production, clearer creative direction    |
+--------------------------------------------------------------+
```

---

## Slide 2 - Architecture

```
Creative inputs -> prompt template -> OpenAI -> creative packet (Markdown)
```

---

## Slide 3 - Why it's powerful

```
You stop staring at the void.
You start editing a draft.
Drafts are easy. Void is hard.
```

---

# Step 1 - Create the file

Create: `modules/module_7_creative/app.py`

```py
from __future__ import annotations

import streamlit as st

from common.llm import generate_text


APP_TITLE = "Creative Brief + Shot List Generator"


def main() -> None:
    st.set_page_config(page_title=APP_TITLE, layout="wide")
    st.title(APP_TITLE)
    st.caption("For creators, marketers, and studios: generate a brief, storyboard beats, and production-ready shot list.")

    col1, col2 = st.columns(2)

    with col1:
        project_type = st.selectbox("Project type", ["Ad / promo", "Music video", "Short film", "Social content batch"], index=0)
        brand = st.text_input("Brand / client", "Nimbus Coffee")
        audience = st.text_input("Target audience", "Busy professionals who want high-quality coffee at home")
        message = st.text_area("Core message", "Great coffee without the fuss. Delivered fresh.", height=90)

    with col2:
        tone = st.text_input("Tone / vibe", "Warm, energetic, a little nerdy")
        duration = st.text_input("Runtime / deliverables", "30s hero + 3x 10s cutdowns")
        constraints = st.text_area("Constraints (budget, location, talent, do-not-say)", "One location. Two actors. No medical claims.", height=90)

    references = st.text_area(
        "Reference vibes (optional)",
        "Think: clean product macro shots + cozy morning light + kinetic typography.",
        height=80,
    )

    if st.button("Generate creative packet", type="primary"):
        prompt = f"""
Create a creative packet in Markdown.

Project type: {project_type}
Brand/client: {brand}
Audience: {audience}
Core message: {message}
Tone/vibe: {tone}
Deliverables: {duration}
Constraints: {constraints}
References: {references}

Deliverables:
1) Creative brief (objective, audience insight, single-minded proposition, RTBs, tone, mandatories).
2) 3 concept directions (each: title + logline + why it works).
3) Pick the strongest direction and create:
   - beat sheet (6-10 beats)
   - shot list (12-20 shots) with camera notes + audio notes
   - on-screen text suggestions
4) A "production checklist" (prep, shoot, post).
5) Optional: 8 image-generation prompts for a moodboard (no copyrighted characters).

Rules:
- Keep it practical for a small crew.
- Avoid unsafe or prohibited content.
- Do not reference real copyrighted IP.
"""
        instructions = "You are a creative director who is also a producer. Be vivid but executable."

        with st.spinner("Generating..."):
            out = generate_text(prompt=prompt, instructions=instructions)

        st.subheader("Creative packet")
        st.markdown(out)


if __name__ == "__main__":
    main()
```

---

# Step 2 - Run it

```bash
streamlit run modules/module_7_creative/app.py
```

---

# Step 3 - Commit checkpoint

```bash
git add modules/module_7_creative/app.py
git commit -m "Module 7: creative brief + shot list generator"
git push
```

---

# Upgrade ideas (optional)

- Add a "brand voice" KB (like Module 4) so tone stays consistent.
- Add an "edit pass" button: "tighten for 15 seconds" or "make it more premium."
- Export a shot list as CSV for producers.
