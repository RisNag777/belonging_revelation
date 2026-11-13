const POLL_MS = 1000;

let data = null;
let error = "";
let filter = "all";
let timer = null;

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key === "disabled") el.disabled = Boolean(value);
      else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2).toLowerCase(), value);
      else el.setAttribute(key, value === true ? "" : String(value));
    }
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

function phaseClass(phase) {
  if (phase === "play") return "is-play";
  if (phase === "summary") return "is-summary";
  if (phase === "lobby") return "is-lobby";
  return "";
}

function statusClass(status) {
  const text = String(status || "").toLowerCase();
  if (text.includes("fallen")) return "bad";
  if (text.includes("finished") || text.includes("summary")) return "ok";
  if (text.includes("lobby")) return "muted";
  return "live";
}

function partyRows() {
  const parties = data?.parties || [];
  if (filter === "active") return parties.filter((row) => row.active);
  if (filter === "playing") return parties.filter((row) => row.phase === "play" || row.phase === "summary");
  return parties;
}

function studentRows() {
  const students = [...(data?.students || [])];
  students.sort((a, b) => a.party.localeCompare(b.party) || a.name.localeCompare(b.name));
  return students;
}

function renderTotals() {
  const totals = data?.totals || {};
  return h("div", { class: "admin-totals" },
    h("div", { class: "admin-stat" }, h("span", {}, "Students online"), h("strong", {}, String(totals.students || 0))),
    h("div", { class: "admin-stat" }, h("span", {}, "Parties with people"), h("strong", {}, String(totals.activeParties || 0))),
    h("div", { class: "admin-stat" }, h("span", {}, "Parties in play"), h("strong", {}, String(totals.playingParties || 0))),
    h("div", { class: "admin-stat" }, h("span", {}, "Empty party codes"), h("strong", {}, String(totals.emptyParties || 0))),
  );
}

function renderMvp() {
  const rows = data?.mvp || [];
  return h("section", { class: "admin-panel admin-mvp" },
    h("div", { class: "admin-panel-head" },
      h("h2", {}, "MVP by party"),
      h("p", {}, "One MVP per party — math, checks passed, HP, and progress"),
    ),
    rows.length
      ? h("div", { class: "admin-table-wrap" },
        h("table", { class: "admin-table" },
          h("thead", {},
            h("tr", {},
              h("th", {}, "Party"),
              h("th", {}, "MVP"),
              h("th", {}, "Score"),
              h("th", {}, "Why"),
              h("th", {}, "Status"),
            ),
          ),
          h("tbody", {}, rows.map((row) => h("tr", { class: "mvp-lead" },
            h("td", { class: "admin-code" },
              row.party,
              h("div", { class: "admin-members" }, `${row.partySize || "?"} players`),
            ),
            h("td", {},
              h("strong", {}, row.name),
              h("div", { class: "admin-members" }, row.roleLabel),
            ),
            h("td", {}, String(row.score)),
            h("td", {}, row.reason),
            h("td", { class: statusClass(row.status) }, row.status),
          ))),
        ),
      )
      : h("p", { class: "admin-empty" }, "Party MVPs appear once students join a party."),
  );
}

function renderStudents() {
  const rows = studentRows();
  if (!rows.length) {
    return h("p", { class: "admin-empty" }, "No students are in a party yet.");
  }
  return h("div", { class: "admin-table-wrap" },
    h("table", { class: "admin-table" },
      h("thead", {},
        h("tr", {},
          h("th", {}, "Student"),
          h("th", {}, "Class"),
          h("th", {}, "Party"),
          h("th", {}, "HP"),
          h("th", {}, "Math"),
          h("th", {}, "Checks"),
          h("th", {}, "Scene"),
          h("th", {}, "Status"),
        ),
      ),
      h("tbody", {}, rows.map((row) => h("tr", {},
        h("td", {},
          h("strong", {}, row.name),
          row.host ? h("span", { class: "admin-pill" }, "Host") : null,
        ),
        h("td", {}, row.roleLabel),
        h("td", { class: "admin-code" }, row.party),
        h("td", { class: row.hp <= 0 ? "bad" : (row.hp < row.maxHp ? "warn" : "") }, `${row.hp}/${row.maxHp}`),
        h("td", {}, row.mathAttempts ? `${row.mathCorrect}/${row.mathAttempts}` : "—"),
        h("td", {}, row.mathAttempts ? `${row.checksPassed}/${row.mathAttempts}` : "—"),
        h("td", {}, row.sceneIndex ? `${row.sceneIndex}/${row.sceneTotal} · ${row.scene}` : "—"),
        h("td", { class: statusClass(row.status) }, row.status),
      ))),
    ),
  );
}

function renderParties() {
  const rows = partyRows();
  if (!rows.length) {
    return h("p", { class: "admin-empty" }, "No parties match this filter.");
  }
  return h("div", { class: "admin-table-wrap" },
    h("table", { class: "admin-table" },
      h("thead", {},
        h("tr", {},
          h("th", {}, "Code"),
          h("th", {}, "Phase"),
          h("th", {}, "Players"),
          h("th", {}, "Progress"),
          h("th", {}, "Villagers"),
          h("th", {}, "Math"),
          h("th", {}, "Timer"),
        ),
      ),
      h("tbody", {}, rows.map((row) => h("tr", { class: row.active ? "" : "is-empty" },
        h("td", { class: "admin-code" }, row.code),
        h("td", {}, h("span", { class: `admin-phase ${phaseClass(row.phase)}` }, row.phase)),
        h("td", {},
          h("div", {}, `${row.joined}/${row.seats}`),
          row.members.length
            ? h("div", { class: "admin-members" }, row.members.map((member) =>
              `${member.name} (${member.roleLabel}${member.host ? ", host" : ""})`).join(" · "))
            : h("div", { class: "admin-members muted" }, "Empty"),
        ),
        h("td", {}, row.progress),
        h("td", {}, row.villagers == null ? "—" : `${row.villagers} left / ${row.villagersLost} lost`),
        h("td", {}, row.mathAttempts ? `${row.mathCorrect}/${row.mathAttempts} right · ${row.checksPassed} passed` : "—"),
        h("td", { class: row.timerMs != null && row.timerMs < 60_000 && row.phase === "play" ? "warn" : "" }, row.timer),
      ))),
    ),
  );
}

function render() {
  const root = document.getElementById("admin");
  if (!root) return;
  const updated = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString()
    : "—";
  root.replaceChildren(
    h("header", { class: "admin-top" },
      h("div", {},
        h("p", { class: "eyebrow" }, "Teacher view"),
        h("h1", {}, "Live classroom"),
        h("p", {}, "Students and parties update every second from the party server."),
      ),
      h("div", { class: "admin-top-meta" },
        h("p", { class: "admin-updated" }, error ? `Update failed: ${error}` : `Updated ${updated}`),
        h("a", { class: "ghost", href: "/" }, "Back to game"),
      ),
    ),
    renderTotals(),
    renderMvp(),
    h("section", { class: "admin-panel" },
      h("div", { class: "admin-panel-head" },
        h("h2", {}, "Students"),
        h("p", {}, `${studentRows().length} connected`),
      ),
      renderStudents(),
    ),
    h("section", { class: "admin-panel" },
      h("div", { class: "admin-panel-head" },
        h("h2", {}, "Parties"),
        h("div", { class: "admin-filters" },
          [["all", "All codes"], ["active", "Occupied"], ["playing", "In play"]].map(([value, label]) =>
            h("button", {
              type: "button",
              class: filter === value ? "primary" : "ghost",
              onclick: () => { filter = value; render(); },
            }, label),
          ),
        ),
      ),
      renderParties(),
    ),
  );
}

async function pull() {
  try {
    const response = await fetch("/api/admin", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
    error = "";
  } catch (err) {
    error = err?.message || "network error";
  }
  render();
}

function boot() {
  render();
  pull();
  timer = setInterval(pull, POLL_MS);
}

boot();
