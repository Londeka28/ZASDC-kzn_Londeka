// RFP Reader: seven language layouts, text or TXT/PDF/DOCX upload.
const MODES = {
  "en":    ["english"],
  "zu":    ["zulu"],
  "af":    ["afrikaans"],
  "en-zu": ["english", "zulu"],
  "en-af": ["english", "afrikaans"],
  "zu-af": ["zulu", "afrikaans"],
  "all":   ["english", "zulu", "afrikaans"],
};
const LABELS = { english: "English (original)", zulu: "isiZulu", afrikaans: "Afrikaans" };
const API_MODE = { zulu: "en-zu", afrikaans: "en-af" };
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const form = document.getElementById("translate-form");

if (form) {
  const modeEl = document.getElementById("language-mode");
  const sourceEl = document.getElementById("source-text");
  const fileInput = document.getElementById("file-input");
  const errorEl = document.getElementById("translate-error");
  const resultsEl = document.getElementById("results");
  const btn = document.getElementById("translate-btn");

  function friendly(err) {
    return err.message === "Failed to fetch"
      ? "Cannot reach the translation service. Make sure the backend is running."
      : err.message;
  }

  async function extractFile(file) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`${API_BASE}/api/extract`, { method: "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not read the file.");
    return data.extracted_text;
  }

  async function translate(text, language) {
    const res = await fetch(`${API_BASE}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language_mode: API_MODE[language] }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Translation failed.");
    return data.translated_text;
  }

  function card(label, text, isError) {
    const section = document.createElement("section");
    section.className = "card";
    const h = document.createElement("h2");
    h.textContent = label;
    const p = document.createElement("p");
    p.className = isError ? "output error" : "output";
    p.textContent = text;
    section.append(h, p);
    return section;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.textContent = "";
    resultsEl.replaceChildren();

    const show = MODES[modeEl.value];
    const file = fileInput.files[0];
    let text = sourceEl.value.trim();

    btn.disabled = true;
    btn.textContent = "Working...";
    try {
      if (file) {
        if (!/\.(txt|pdf|docx)$/i.test(file.name)) {
          throw new Error("Please upload a TXT, PDF or DOCX file.");
        }
        if (file.size > MAX_FILE_BYTES) {
          throw new Error("The file is too large. The maximum size is 5 MB.");
        }
        text = (await extractFile(file)).trim();
        sourceEl.value = text;   // show what was extracted
        fileInput.value = "";    // later runs use the text box
      }
      if (!text) throw new Error("Please paste some text or upload a file first.");

      const targets = show.filter((l) => l !== "english");
      const translations = await Promise.all(
        targets.map(async (lang) => {
          try {
            return [lang, await translate(text, lang), false];
          } catch (err) {
            return [lang, friendly(err), true];
          }
        })
      );
      const byLang = Object.fromEntries(translations.map(([l, t, e]) => [l, { t, e }]));

      const grid = document.createElement("div");
      grid.className = "columns";
      show.forEach((lang) => {
        if (lang === "english") grid.appendChild(card(LABELS.english, text, false));
        else grid.appendChild(card(LABELS[lang], byLang[lang].t, byLang[lang].e));
      });
      resultsEl.appendChild(grid);

      // Original English stays easy to reach in single-language layouts.
      if (!show.includes("english")) {
        const d = document.createElement("details");
        const s = document.createElement("summary");
        s.textContent = "Show original English";
        const p = document.createElement("p");
        p.className = "output";
        p.textContent = text;
        d.append(s, p);
        resultsEl.appendChild(d);
      }
    } catch (err) {
      errorEl.textContent = friendly(err);
    } finally {
      btn.disabled = false;
      btn.textContent = "Translate";
    }
  });
}