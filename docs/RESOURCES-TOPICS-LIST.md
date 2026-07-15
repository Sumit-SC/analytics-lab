# Resources — Complete topic list and where they live

This doc is the single reference for all **Learn by topic** entries. The source of truth is **`assets/resources.json`** (each top-level key is a topic). The flyout, sidebars, and fallback links should stay in sync with this list.

---

## 1. Full list from `resources.json` (43 topics)

| Category | Topic key | Label |
|----------|-----------|--------|
| **Programming** | `python` | Python |
| | `sql` | SQL |
| | `git` | Git |
| | `stats` | Statistics |
| | `math` | Mathematics |
| | `oops` | OOP |
| | `prompting` | Prompting |
| | `editors-ides` | Editors & IDEs |
| **Data Analytics** | `data-analytics` | Data Analytics |
| | `pandas` | Pandas |
| | `numpy` | NumPy |
| | `data-visualization` | Data Visualization |
| | `matplotlib` | Visualization (Python) |
| | `product-analytics` | Product Analytics |
| | `ab-testing` | A/B Testing |
| | `time-series` | Time Series |
| **Data Science & ML** | `data-science` | Data Science |
| | `machine-learning` | Machine Learning |
| | `deep-learning` | Deep Learning |
| | `llms` | LLMs & Gen AI |
| | `nlp` | NLP |
| | `computer-vision` | Computer Vision |
| | `opencv` | OpenCV |
| | `reinforcement-learning` | Reinforcement Learning |
| | `feature-engineering` | Feature Engineering |
| **Data Engineering** | `data-engineering` | Data Engineering |
| | `spark` | Apache Spark |
| | `streaming` | Streaming Data |
| | `data-warehousing` | Data Warehousing |
| | `databases` | Databases |
| | `cloud-data` | Cloud Platforms |
| | `airflow` | Airflow |
| | `dbt` | dbt |
| | `mlops` | MLOps |
| | `devops` | DevOps |
| **Programming Languages** | `r` | R Programming |
| **Business Intelligence** | `business-analytics` | Business Analytics |
| | `excel` | Excel |
| | `power-bi` | Power BI |
| | `tableau` | Tableau |
| **Tools & Career** | `productivity-tools` | Productivity Tools |
| | `communication` | Communication Skills |
| | `resume-interview` | Resume & Interview Prep |

*(Note: `editors-ides` is under Programming in the flyout; in jobs/playground sidebars it can be grouped under “Tools & Career” for consistency with jobs.)*

---

## 2. Where each topic is used

| File | What it does | In sync? |
|------|----------------|----------|
| **assets/resources.json** | Source of truth: one key per topic; each has `title`, `summary`, `courses`, `books`, `youtube`, etc. | ✅ Master list |
| **assets/js/resources-flyout.js** | Global “Resources” flyout: “Learn by topic” groups and links. | ✅ In sync (includes Tools & Career with productivity-tools) |
| **assets/js/resources.js** | Resources page: fetches JSON, builds topic dropdown and content. Fallback “Try:” links (short list when fetch fails). | ✅ Uses JSON keys; fallback is a short list by design |
| **pages/resources.html** | Resources page shell; no topic list (all from JS + JSON). | ✅ |
| **pages/playground.html** | Sidebar “Learn by topic” (Programming → BI → Tools & Career). | ✅ In sync (Tools & Career added) |
| **pages/jobs.html** | Sidebar “Learn by topic” including “Tools & Career”. | ✅ Full list |
| **pages/trends.html** | Sidebar “Learn by topic” (short subset). | ✅ Intentional subset |
| **assets/js/nav-data.js** | Main nav links only (Home, Playground, Trends, Resources, etc.). | ✅ No topic list |
| **assets/js/homepage.js** | “Continue learning” card uses `resources_last_topic` from localStorage; link is `pages/resources.html?topic=…`. | ✅ Topic comes from last visit |

---

## 3. Gaps (resolved)

1. **resources-flyout.js** — Added `productivity-tools` and grouped “Editors & IDEs”, “Productivity Tools”, “Communication Skills”, “Resume & Interview Prep” under **Tools & Career** (matches jobs sidebar).
2. **playground.html** — Added “Tools & Career” section to the sidebar with the same four links.
3. **resources.js fallback** — Still shows only 6 topic links when fetch fails; optional to add more.
4. **trends.html** — Keeps a subset by design; no change.

---

## 4. Adding a new topic

1. Add a new key to **assets/resources.json** with `title`, `summary`, and at least one of `courses`, `books`, `blogs`, `youtube`, `github`, `reddit`, `roadmapUrl`, etc.
2. Add the topic to **assets/js/resources-flyout.js** in the right group (same `topic` key and a `label`).
3. Add the same link to **pages/playground.html** and **pages/jobs.html** sidebars in the matching group.
4. Optionally add to **pages/trends.html** sidebar and/or **resources.js** fallback list if you want it there.

No HTML or JS change is needed for the Resources page itself; the dropdown is built from the JSON keys.
