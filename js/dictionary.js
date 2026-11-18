export const DICTIONARY = [
  { en: "Space", zu: "Isikhala", af: "Ruimte" },
  { en: "Solar System", zu: "Uhlelo lwelanga", af: "Sonnestelsel" },
  { en: "Eclipse", zu: "Ukufiphala kwelanga", af: "Sonsverduistering" },
  { en: "Atmosphere", zu: "Umkhathi", af: "Atmosfeer" },
  { en: "Star", zu: "Inkanyezi", af: "Ster" },
  { en: "Moon", zu: "Inyanga", af: "Maan" },
  { en: "Planet", zu: "Iplanethi", af: "Planeet" },
  { en: "Sun", zu: "Ilanga", af: "Son" },
  { en: "Telescope", zu: "Isihlolamkhathi", af: "Teleskoop" },
];

const LANG_KEYS = { english: "en", isizulu: "zu", afrikaans: "af" };

function normalise(text) {
  return text.trim().toLowerCase();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function lookupTerm(term, from, to) {
  const f = LANG_KEYS[from], t = LANG_KEYS[to];
  const hit = DICTIONARY.find((e) => normalise(e[f]) === normalise(term));
  return hit ? hit[t] : null;
}

export function applyGlossary(text, from, to) {
  const f = LANG_KEYS[from], t = LANG_KEYS[to];
  const entries = [...DICTIONARY].sort((a, b) => b[f].length - a[f].length);
  return entries.reduce((out, e) => {
    const re = new RegExp(`\\b${escapeRegex(e[f])}\\b`, "gi");
    return out.replace(re, e[t]);
  }, text);
}

// ---- Dictionary table with live search ----
const body = document.getElementById("dict-body");
const search = document.getElementById("dict-search");
const emptyMsg = document.getElementById("dict-empty");

function renderTable(filter = "") {
  if (!body) return;
  const q = normalise(filter);
  const rows = DICTIONARY
    .filter((e) => !q || [e.en, e.zu, e.af].some((w) => normalise(w).includes(q)))
    .sort((a, b) => a.en.localeCompare(b.en));

  body.innerHTML = "";
    rows.forEach((e) => {
    const tr = document.createElement("tr");
    [e.en, e.zu, e.af, "⚠ Not yet reviewed"].forEach((word) => {
      const td = document.createElement("td");
      td.textContent = word;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  
  });
  if (emptyMsg) emptyMsg.hidden = rows.length > 0;
}

renderTable();
if (search) search.addEventListener("input", () => renderTable(search.value));

// ---- Single-term lookup ----
const dictForm = document.getElementById("dict-form");
if (dictForm) {
  dictForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const term = document.getElementById("dict-term").value;
    const from = document.getElementById("dict-from").value;
    const to = document.getElementById("dict-to").value;
    const result = document.getElementById("dict-result");

    if (from === to) {
      result.textContent = "Please choose two different languages.";
      return;
    }
    const hit = lookupTerm(term, from, to);
    result.textContent = hit ? `${term} → ${hit}` : "No match found in the dictionary.";
  });
}

// ---- Glossary: replace known terms in a block of text ----
const glossaryForm = document.getElementById("glossary-form");
if (glossaryForm) {
  glossaryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("glossary-input").value;
    const from = document.getElementById("glossary-from").value;
    const to = document.getElementById("glossary-to").value;
    const output = document.getElementById("glossary-output");

    if (from === to) {
      output.textContent = "Please choose two different languages.";
      return;
    }
    output.textContent = applyGlossary(text, from, to);
  });
}