# Home page layout logic (for confirmation)

## Your requirements (summary)

1. **Quote poster/card** — Do **not** change size. Leave as is (current aspect-ratio and max-height).
2. **Tips card** and **Clock & calendar** card — Match the **width** of the poster card and the weather card; make them the **size of the pomodoro (Focus timer) card**; keep them **half–half** (50% / 50%).
3. When pomodoro size increases, we can **slightly** increase the quote card if needed.

---

## Visual tabular view

| Row | Column A | Column B | Notes |
|-----|----------|----------|--------|
| **Row 1** | **Tips** (Refresh) | **Weather** | Tips card: same **width** as Column A below (poster column). Weather: same **width** as Column B below (pomodoro column). |
| | **Clock & calendar** | | Calendar card: same width as Tips; sits in Column A. So Column A = **Tips \| Calendar** (stacked or side-by-side half–half). |
| **Row 2** | **Quote poster** | **Focus timer (Pomodoro)** | Quote = **unchanged** size. Pomodoro = reference size for “card size” of Tips and Calendar. |
| | ↑ same width as Tips + Calendar area | ↑ same width as Weather | Row 1 Column A width = Row 2 Quote width. Row 1 Column B width = Row 2 Pomodoro width. |

### Half–half meaning

- **Tips** and **Calendar** share the same total width as the **Quote poster** (one column).
- Within that column: **Tips** takes ~50% width, **Calendar** takes ~50% width (side by side).
- Each card (Tips, Calendar) has a **size** (height/min-height) similar to the **Pomodoro** card so they feel substantial, not tiny.

### Size reference

- **Pomodoro card** = Focus timer panel (one of the two big cards in Row 2). Tips and Calendar cards should feel like “half” of that in height if we keep them compact, or same “card size” if we want them prominent — you said “make it like the size of the pomodoro card”, so we treat them as same “card size” as pomodoro (similar min-height / padding).

---

## Implementation summary

- **Quote panel**: no change to `.home-quote-panel` (aspect-ratio, max-height).
- **Row 1 grid**: two columns: `[Tips | Calendar]` (50% | 50%) and `[Weather]`. So first column width = Quote column width, second column width = Pomodoro column width. Tips and Calendar get classes so they have similar padding/height as the Focus timer card (same “card size” feel).
- **Send to chatbot / Prep**: “Prep for interview” and “Copy for ChatGPT” open the **assistant panel on-the-fly** (like Dictionary). When opened with a prep message, the message is **auto-sent** so the chat responds immediately without opening a new page.

If this matches your intent, we keep this layout. If you want Tips and Calendar stacked vertically instead of side-by-side, or a different split, say how you’d like it.
