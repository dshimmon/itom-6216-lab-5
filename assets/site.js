"use strict";

// One set of sample terms powers the full comparison and the chat answers.
const usd = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const names = ["Quote A (Prairie Ledger)", "Quote B (Oakline Mutual)"];
const terms = [
  { key: "premium", label: "Annual premium", values: [3480, 4280], match: /premium|annual cost|cheaper|less expensive|price|per year|annual rate|afford/,
    note: "Quote A costs $800 less per year. Weigh those annual savings against the larger wind and hail deductible." },
  { key: "building", label: "Building limit", values: [750000, 750000], match: /building|structure|storefront/,
    note: "The building limit is the same. Ask whether the amount reflects what it would cost to rebuild." },
  { key: "contents", label: "Business contents limit", values: [150000, 200000], match: /contents|presses|stock|equipment limit|inventory|personal property/,
    note: "Quote B offers $50,000 more for items such as presses and stock. Compare both limits with an updated inventory." },
  { key: "income", label: "Business income limit", values: [75000, 125000], match: /income|interruption|revenue|clos(e|ure|ed)|lost sales|downtime/,
    note: "Quote B offers $50,000 more if a covered shutdown interrupts sales. Ask how long coverage lasts and when it starts." },
  { key: "deductible", label: "Base property deductible", values: [2500, 2500], match: /base|standard|regular|property deductible|all other/,
    note: "Both quotes show the same amount for covered property losses that use the base deductible." },
  { key: "wind", label: "Wind and hail deductible", values: [15000, 5000], match: /wind|hail|storm deductible/,
    note: "Quote A has the higher wind and hail deductible. For a covered loss large enough to use the full deductible, the shop could pay $10,000 more out of pocket with Quote A." },
  { key: "flood", label: "Flood exclusion", values: ["Excluded", "Excluded"], match: /flood/,
    note: "Both sample quotes exclude flood. Ask whether separate flood coverage is available." },
  { key: "roof", label: "Cosmetic roof damage", values: ["Excluded", "No cosmetic exclusion listed"], match: /cosmetic|roof|dent/,
    note: "Quote A excludes damage that only changes the roof’s appearance. Quote B does not list this exclusion; the summary alone does not confirm coverage." }
];
const display = value => typeof value === "number" ? usd(value) : value;
const unknown = "The sample quotes don’t give enough information to answer that. Ask your broker for the relevant policy wording or a worked example. I can compare the listed premiums, limits, deductibles, and exclusions.";

function describe(term, choice) {
  const value = i => display(term.values[i]);
  const figure = choice === -1 ? names.map((name, i) => name + ": " + value(i)).join("; ") : names[choice] + ": " + value(choice);
  return term.label + " — " + figure + ". " + term.note;
}

function answer(question) {
  const q = question.toLowerCase().replace(/[^a-z0-9’' -]/g, " ").replace(/\s+/g, " ").trim();
  const choice = /\b(?:quote a|prairie(?: ledger)?|option a)\b/.test(q) && !/\b(?:quote b|oakline|option b)\b/.test(q) ? 0 :
    /\b(?:quote b|oakline|option b)\b/.test(q) && !/\b(?:quote a|prairie|option a)\b/.test(q) ? 1 : -1;
  if (/\b(earthquake|sewer|water backup|endorsement copy|mold|theft|fire|waiting period|coinsurance|carrier rating|am best|roof age|replacement cost|actual cash value|policy number|claim payout|liability|workers comp|terrorism|vacancy|monthly|installments?|tax|fees|equipment breakdown)\b/.test(q)) return unknown;
  if (/\b(?:my business|my shop|my property|my roof|my policy)\b/.test(q) || /\b(?:will|would) (?:it|they|quote [ab]) (?:pay|cover)\b/.test(q)) return unknown;
  if (/exclu|not cover|what isn.t covered/.test(q) && !/deductible|premium/.test(q)) {
    if (/broker|ask|what should/.test(q)) return "Ask your broker: (1) Can we buy separate flood coverage? Both quotes exclude flood. (2) How does Quote A define cosmetic roof damage? (3) Can you show me how Quote B’s actual policy treats roof dents that don’t cause leaks? Its quote summary doesn’t establish coverage.";
    const specific = terms.slice(-2).filter(t => t.match.test(q));
    return (specific.length ? specific : terms.slice(-2)).map(t => describe(t, choice)).join("\n\n");
  }
  if (/\b(broker|questions to ask)\b/.test(q)) return "Ask for a worked hail claim under each quote, the waiting period and time limit for business income coverage, and the exact flood and cosmetic roof wording.";
  const matches = terms.filter(t => t.match.test(q));
  if (matches.length) return matches.map(t => describe(t, choice)).join("\n\n");
  if (/deductibl/.test(q)) return terms.filter(t => ["deductible", "wind"].includes(t.key)).map(t => describe(t, choice)).join("\n\n");
  if (/\b(limits?|coverage amounts?)\b/.test(q)) return terms.filter(t => ["building", "contents", "income"].includes(t.key)).map(t => describe(t, choice)).join("\n\n");
  if (/better|recommend|which.*(pick|buy|choose)|savings|trade.?off|main difference|compare|summari[sz]e/.test(q)) {
    return "The two quotes trade annual cost for potential claim costs. Quote A is $800 less per year, but its wind and hail deductible is $10,000 higher. Quote B also offers higher contents and income limits. Ask your broker to model a hail loss and a shutdown before deciding.";
  }
  if (/business name|fictional business|trinity|print shop|location|where is/.test(q)) return "Trinity Print House is a fictional Dallas business that owns its storefront and keeps printing presses and stock there. Both sample quotes cover the same location.";
  return unknown;
}

function node(tag, content, className) {
  const element = document.createElement(tag);
  if (content) element.textContent = content;
  if (className) element.className = className;
  return element;
}

const rows = document.querySelector("#quote-rows");
if (rows) {
  for (const term of terms) {
    const changed = term.values[0] !== term.values[1];
    const row = node("tr", "", changed ? "changed" : "same");
    const label = node("th", term.label);
    label.scope = "row";
    row.append(label, ...term.values.map(v => node("td", display(v))));
    rows.append(row);
    const noteRow = node("tr", "", changed ? "note changed" : "note same");
    const note = node("td");
    note.colSpan = 3;
    note.append(node("strong", changed ? "What it means" : "Same in both"), document.createTextNode(" · " + term.note));
    noteRow.append(note);
    rows.append(noteRow);
  }
  const toggle = document.querySelector("#diff-toggle");
  function applyFilter() {
    for (const row of rows.querySelectorAll(".same")) row.hidden = toggle.checked;
    const differences = terms.filter(t => t.values[0] !== t.values[1]).length;
    document.querySelector("#row-status").textContent = toggle.checked
      ? differences + " differences · " + (terms.length - differences) + " matching terms hidden"
      : terms.length + " terms · Fictional annual quotes";
  }
  toggle.addEventListener("change", applyFilter);
  applyFilter();
  rows.closest("table").hidden = false;
  toggle.closest("label").hidden = false;
}

const video = document.querySelector("#demo-video");
if (video) {
  const control = document.querySelector("#video-control");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function respectMotion() {
    video.autoplay = !reduced.matches;
    if (reduced.matches) video.pause();
    else video.play().catch(() => {});
  }
  function showState() { control.textContent = video.paused ? "Play video" : "Pause video"; }
  respectMotion();
  reduced.addEventListener("change", respectMotion);
  for (const event of ["play", "pause", "loadeddata"]) video.addEventListener(event, showState);
  video.addEventListener("error", () => { control.hidden = true; }, true);
  control.addEventListener("click", () => {
    if (video.paused) video.play().catch(showState);
    else video.pause();
  });
  control.hidden = Boolean(video.error);
  showState();
}

const chat = document.querySelector("#quote-chat");
if (chat) {
  chat.innerHTML = `
    <button class="button chat-launch" type="button" aria-label="Ask about quotes" aria-expanded="false" aria-controls="chat-panel">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v12H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>
      Ask about quotes
    </button>
    <section class="chat-panel" id="chat-panel" hidden aria-labelledby="chat-title">
      <header class="chat-top"><h2 id="chat-title">Quote assistant</h2><button type="button" class="quiet close-chat" aria-label="Close quote assistant">×</button></header>
      <div class="chat-stream" role="log" aria-label="Conversation" aria-live="polite" tabindex="0">
        <p class="assistant"><strong>Quote assistant</strong><span>Ask me about the two fictional quotes for Trinity Print House. I can explain the terms shown here and suggest questions for your broker.</span></p>
      </div>
      <div class="suggestions" aria-label="Suggested questions"></div>
      <form class="chat-form">
        <label for="chat-question" class="visually-hidden">Your question about the sample quotes</label>
        <input id="chat-question" type="text" placeholder="Ask about the sample quotes" maxlength="250" required autocomplete="off">
        <button type="submit" class="button primary">Send</button>
      </form>
    </section>`;
  const launch = chat.querySelector(".chat-launch");
  const panel = chat.querySelector(".chat-panel");
  const stream = chat.querySelector(".chat-stream");
  const input = chat.querySelector("#chat-question");
  function show(open) {
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", String(open));
    (open ? chat.querySelector(".close-chat") : launch).focus();
  }
  function send(question) {
    if (!question.trim()) return;
    const message = (sender, content, role) => {
      const entry = node("p", "", role);
      entry.append(node("strong", sender), node("span", content));
      stream.append(entry);
    };
    message("You", question.trim(), "visitor");
    message("Quote assistant", answer(question), "assistant");
    stream.scrollTop = stream.scrollHeight;
    input.value = "";
  }
  const prompts = [
    "Which quote has the higher wind and hail deductible?",
    "What should I ask my broker about the exclusions?"
  ];
  for (const prompt of prompts) {
    const button = node("button", prompt, "suggestion");
    button.type = "button";
    button.addEventListener("click", () => send(prompt));
    chat.querySelector(".suggestions").append(button);
  }
  launch.addEventListener("click", () => show(panel.hidden));
  chat.querySelector(".close-chat").addEventListener("click", () => show(false));
  chat.querySelector("form").addEventListener("submit", event => { event.preventDefault(); send(input.value); });
  chat.addEventListener("keydown", event => { if (event.key === "Escape" && !panel.hidden) show(false); });
}
