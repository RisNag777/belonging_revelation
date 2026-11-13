import { gradeAnswer, makeAftermathProblem, makeProblem, selfTestMath, START_VILLAGERS, MAX_STAGE_LOSS } from "./math.js";
import { CREDIT, INTRO, ROLES, SCENES } from "./story.js";

const DURATION_MS = 6 * 60 * 1000;
const MAX_HERO_HP = 4;
const DEFAULT_FAIL_HP_LOSS = 1;
const CRIT_FAIL_HP_LOSS = 2;

const PARTY_KEY = "palace-party";
const SOLO = document.body.dataset.portal === "test";

let ended = false;
let beat = "home";
let state = freshState();
let party = freshParty();
let gate = freshGate();
let pollTimer = null;
let boardTimer = null;
let board = [];
let boardKey = "";
let applyingRemote = false;

function freshParty() {
  return { code: "", revision: 0, phase: "", hostId: "", members: [], me: null };
}

function freshGate() {
  return { name: "", role: "soldier", code: "", error: "", notice: "", preview: null };
}

function freshState() {
  return {
    selected: SOLO ? ["soldier"] : ["soldier", "physician", "assassin"],
    names: {},
    hp: {},
    step: 0,
    memberTurn: 0,
    log: [],
    seen: new Set(),
    deadline: null,
    timerId: null,
    leftAtEnd: DURATION_MS,
    endReason: null,
    pending: null,
    villagers: START_VILLAGERS,
    aftermathLog: [],
    obituary: null,
  };
}

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

function activeRoles() {
  const chosen = ROLES.filter((role) => state.selected.includes(role.id));
  if (SOLO) return chosen[0] ? [chosen[0]] : ROLES.slice(0, 1);
  return chosen.length >= 2 ? chosen : ROLES.slice(0, 2);
}

function roleLabel(id) {
  return ROLES.find((role) => role.id === id)?.label || id;
}

function heroName(id) {
  return state.names[id] || roleLabel(id);
}

function heroHp(id) {
  const value = state.hp[id];
  return Number.isFinite(value) ? value : MAX_HERO_HP;
}

function withHero(text, hero) {
  return String(text || "").split("{hero}").join(hero);
}

function handoffFor(step, memberIdx) {
  if (memberIdx <= 0) return null;
  const scene = SCENES[step];
  const prevRole = activeRoles()[memberIdx - 1]?.id;
  if (!scene || !prevRole) return null;
  const rows = state.log.filter((row) => row.sceneId === scene.id && row.role === prevRole);
  return rows[rows.length - 1] || null;
}

function adjustedDc(base, handoff) {
  if (!handoff) return base;
  return Math.min(18, Math.max(5, base + (handoff.success ? -2 : 2)));
}

function sceneAt(step, memberIdx = state.memberTurn) {
  const scene = SCENES[step];
  if (!scene) return null;
  const list = activeRoles();
  const role = list[Math.min(Math.max(0, memberIdx), list.length - 1)].id;
  const outcome = scene.roleOutcomes[role];
  const prior = handoffFor(step, memberIdx);
  return {
    ...scene,
    role,
    stake: scene.roleActions[role] || scene.stake,
    success: outcome.success,
    fail: outcome.fail,
    wound: outcome.wound,
    dc: adjustedDc(scene.dc, prior),
    prior,
  };
}

function currentScene() {
  return sceneAt(state.step, state.memberTurn);
}

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function rollD20() {
  return 1 + Math.floor(Math.random() * 20);
}

function dieFace(roll) {
  const value = Math.min(20, Math.max(1, Math.round(Number(roll) || 1)));
  return h("img", { class: "die-face", src: `/dice/d${value}.png`, alt: `Rolled ${value}` });
}

function startTimer() {
  state.deadline = Date.now() + DURATION_MS;
  state.timerId = setInterval(() => {
    const left = state.deadline - Date.now();
    paintClock(left);
    if (left <= 0) finish("time");
  }, 250);
}

function clockMs() {
  if (beat === "setup" || !state.deadline) return DURATION_MS;
  if (ended) return state.endReason === "time" ? 0 : state.leftAtEnd;
  return Math.max(0, state.deadline - Date.now());
}

function paintClock(ms) {
  const clock = document.getElementById("clock");
  if (!clock) return;
  clock.textContent = formatClock(ms);
  clock.classList.toggle("low", ms < 60 * 1000);
}

function paintHeader() {
  const slot = document.getElementById("clock-slot");
  if (!slot) return;
  const parts = [h("div", { id: "clock", class: "clock" }, formatClock(clockMs()))];
  if (beat !== "home") {
    const label = state.deadline && !ended ? "Stop and return to menu" : "Return to menu";
    parts.push(h("button", { class: "menu-btn", type: "button", onclick: playAgain }, label));
  }
  slot.replaceChildren(...parts);
  paintClock(clockMs());
}

function snapshotNames() {
  for (const role of ROLES) {
    const field = document.getElementById(`name-${role.id}`);
    if (field) state.names[role.id] = field.value;
  }
}

function toggleRole(id) {
  if (beat !== "setup" && !(SOLO && beat === "home")) return;
  snapshotNames();
  if (SOLO) {
    state.selected = [id];
    render();
    return;
  }
  const idx = state.selected.indexOf(id);
  if (idx >= 0) {
    if (state.selected.length > 2) state.selected.splice(idx, 1);
  } else if (state.selected.length < 3) {
    state.selected.push(id);
  }
  render();
}

function onBegin(event) {
  event.preventDefault();
  if (beat !== "setup" && !(SOLO && beat === "home")) return;
  for (const role of activeRoles()) {
    const field = document.getElementById(`name-${role.id}`);
    const raw = String(field?.value || "").replace(/\s+/g, " ").trim().slice(0, 18);
    state.names[role.id] = raw || role.label;
    state.hp[role.id] = MAX_HERO_HP;
  }
  state.villagers = START_VILLAGERS;
  state.aftermathLog = [];
  state.obituary = null;
  beat = "scene";
  startTimer();
  render();
  publishParty("play");
}

function stoneEpitaph(roleId) {
  const lines = {
    assassin: "Cut a dark path so others lived",
    titan: "Held the way open with raw strength",
    minstrel: "Sang danger away to the last",
    physician: "Healed one more before falling",
    soldier: "Held the line so others escaped",
  };
  return lines[roleId] || "Fell so others could escape";
}

function heroicDeath(scene, hero, roleId) {
  return stoneEpitaph(roleId);
}

function graveNameClass(name) {
  const n = String(name || "").trim().length;
  if (n <= 7) return "grave-name";
  if (n <= 11) return "grave-name grave-name-md";
  return "grave-name grave-name-sm";
}

function recordCheck({ scene, roll, success, correct, hpLoss, crit, problem, given, final }) {
  const hero = heroName(scene.role);
  if (hpLoss > 0) state.hp[scene.role] = Math.max(0, heroHp(scene.role) - hpLoss);
  const dead = heroHp(scene.role) <= 0;
  const wound = success ? "" : withHero(scene.wound, hero);
  let resultText = withHero(success ? scene.success : scene.fail, hero);
  if (crit === "fail") resultText = `Critical miss. ${resultText}`;
  if (crit === "success") resultText = `Critical hit. ${resultText} The math check is skipped.`;
  const total = Number.isFinite(final) ? final : roll;
  state.log.push({
    sceneId: scene.id,
    title: scene.title,
    role: scene.role,
    hero,
    dc: scene.dc,
    roll,
    final: String(total),
    detail: crit === "success"
      ? "Critical hit: no math needed"
      : (crit === "fail" ? "Critical miss: no math" : (problem?.work || "")),
    correct: Boolean(correct),
    given: given || "",
    answer: problem?.display || String(roll),
    outcome: problem?.outcome || (success ? `the check clears on a ${total}` : `the check fails on a ${total}`),
    problem: problem?.text || "",
    success,
    hpLoss,
    wound,
    resultText,
    crit: crit || "",
    bonus: crit ? 0 : (correct ? 2 : 0),
    halved: Boolean(!crit && !correct && problem),
    priorHero: scene.prior?.hero || "",
    priorSuccess: scene.prior ? scene.prior.success : null,
    finale: Boolean(scene.finale),
  });
  if (dead) {
    state.obituary = {
      name: hero,
      role: scene.role,
      label: roleLabel(scene.role),
      scene: scene.title,
      wound,
      stone: stoneEpitaph(scene.role),
      epitaph: heroicDeath(scene, hero, scene.role),
    };
    beat = "obituary";
  } else {
    beat = "result";
  }
  render();
  publishParty("play");
}

function onRoll() {
  const scene = currentScene();
  if (!scene || beat !== "scene" || ended || !mineToAct()) return;
  const roll = rollD20();
  if (roll === 1) {
    state.pending = { roll, crit: "fail" };
    recordCheck({
      scene,
      roll,
      success: false,
      correct: false,
      hpLoss: CRIT_FAIL_HP_LOSS,
      crit: "fail",
      final: roll,
    });
    return;
  }
  if (roll === 20) {
    state.pending = { roll, crit: "success" };
    recordCheck({
      scene,
      roll,
      success: true,
      correct: true,
      hpLoss: 0,
      crit: "success",
      final: roll,
    });
    return;
  }
  state.pending = {
    roll,
    problem: makeProblem(scene.id, state.step, Math.random, state.seen, roll, scene.role),
  };
  beat = "problem";
  render();
  document.getElementById("answer")?.focus();
  publishParty("play");
}

function onAnswer(event) {
  event.preventDefault();
  if (beat !== "problem" || ended || !mineToAct()) return;
  const given = document.getElementById("answer").value.trim();
  const error = document.getElementById("answer-error");
  const scene = currentScene();
  const problem = state.pending.problem;
  const graded = gradeAnswer(given, problem);
  if (!graded.valid) {
    error.textContent = problem.percent
      ? "Enter the percent as a number. 25 and 25% both count."
      : "Enter a number, decimal, or fraction.";
    return;
  }
  const correct = graded.ok;
  const roll = state.pending.roll;
  const final = correct ? roll + 2 : Math.floor(roll * 0.5);
  const success = final >= scene.dc;
  const hpLoss = success ? 0 : (Number.isFinite(scene.failHpLoss) ? scene.failHpLoss : DEFAULT_FAIL_HP_LOSS);
  recordCheck({
    scene,
    roll,
    success,
    correct,
    hpLoss,
    problem,
    given,
    final,
  });
}

function onRetry() {
  if (ended || beat !== "result" || !mineToAct()) return;
  const last = state.log[state.log.length - 1];
  if (!last || last.success || heroHp(last.role) <= 0) return;
  state.pending = null;
  beat = "scene";
  render();
  publishParty("play");
}

function sceneScore(sceneId) {
  const latest = new Map();
  state.log.filter((row) => row.sceneId === sceneId && !row.aftermath).forEach((row) => latest.set(row.role, row));
  const rows = [...latest.values()];
  return {
    wins: rows.filter((row) => row.success).length,
    attempts: Math.max(1, rows.length),
    rows,
  };
}

function mineAftermath() {
  if (!party.code) return true;
  return Boolean(party.me?.host);
}

function startAftermath() {
  const scene = SCENES[state.step];
  const score = sceneScore(scene.id);
  state.pending = {
    aftermath: true,
    problem: makeAftermathProblem(scene.id, score.wins, score.attempts, state.villagers, Math.random),
  };
  beat = "aftermath";
  render();
  if (mineAftermath()) document.getElementById("answer")?.focus();
  publishParty("play");
}

function onAftermathAnswer(event) {
  event.preventDefault();
  if (beat !== "aftermath" || ended || !mineAftermath()) return;
  const given = document.getElementById("answer").value.trim();
  const error = document.getElementById("answer-error");
  const problem = state.pending.problem;
  const graded = gradeAnswer(given, problem);
  if (!graded.valid) {
    error.textContent = problem.percent
      ? "Enter the percent as a number. 25 and 25% both count."
      : "Enter a number, decimal, or fraction.";
    return;
  }
  const correct = graded.ok;
  const before = problem.before;
  let lost = problem.lost;
  let left = problem.left;
  if (!correct) {
    lost = Math.min(before, Math.max(lost, problem.penaltyLoss || MAX_STAGE_LOSS));
    left = before - lost;
  }
  state.villagers = left;
  const row = {
    sceneId: SCENES[state.step].id,
    title: SCENES[state.step].title,
    aftermath: true,
    correct,
    given,
    answer: problem.display,
    detail: problem.work,
    before,
    lost,
    left,
    resultText: correct
      ? `${problem.outcome}.`
      : `Wrong count. ${lost} villagers are lost this stage. ${left} remain.`,
    finale: Boolean(SCENES[state.step].finale),
  };
  state.aftermathLog.push(row);
  state.log.push(row);
  beat = "aftermath-result";
  render();
  publishParty("play");
}

function onAftermathContinue() {
  if (ended || beat !== "aftermath-result" || !mineAftermath()) return;
  const scene = SCENES[state.step];
  state.pending = null;
  if (scene.finale || state.step >= SCENES.length - 1) {
    finish("complete");
    return;
  }
  state.step += 1;
  state.memberTurn = 0;
  beat = "scene";
  render();
  publishParty("play");
}

function onObituaryContinue() {
  if (ended || beat !== "obituary" || !mineToAct()) return;
  finish("defeat");
}

function onContinue() {
  if (ended || beat !== "result" || !mineToAct()) return;
  if (state.memberTurn < activeRoles().length - 1) {
    state.memberTurn += 1;
    state.pending = null;
    beat = "scene";
    render();
    publishParty("play");
    return;
  }
  startAftermath();
}

function finish(reason) {
  if (ended) return;
  ended = true;
  clearInterval(state.timerId);
  state.endReason = reason;
  state.leftAtEnd = state.deadline ? Math.max(0, state.deadline - Date.now()) : 0;
  beat = "summary";
  render();
  paintClock(reason === "time" ? 0 : state.leftAtEnd);
  publishParty("summary");
}

function playAgain() {
  const code = party.code;
  const memberId = party.me?.id;
  clearInterval(state.timerId);
  stopPoll();
  if (code && memberId) {
    fetch(`/api/parties/${code}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    }).catch(() => {});
  }
  sessionStorage.removeItem(PARTY_KEY);
  party = freshParty();
  gate = freshGate();
  ended = false;
  beat = "home";
  state = freshState();
  render();
  paintClock(DURATION_MS);
}

function rememberGate() {
  const name = document.getElementById("party-name");
  const code = document.getElementById("party-code");
  if (name) gate.name = name.value;
  if (code) gate.code = code.value.toUpperCase();
}

function saveSeat() {
  sessionStorage.setItem(PARTY_KEY, JSON.stringify({ code: party.code, memberId: party.me.id }));
}

function adoptParty(data) {
  party.code = data.code;
  party.revision = data.revision;
  party.phase = data.phase;
  party.hostId = data.hostId;
  party.members = data.members;
  const me = data.members.find((member) => member.id === data.memberId) || party.me;
  if (data.memberId) party.me = me;
  saveSeat();
}

async function api(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function snapshot() {
  return {
    selected: state.selected,
    names: state.names,
    hp: state.hp,
    step: state.step,
    memberTurn: state.memberTurn,
    log: state.log,
    seen: [...state.seen],
    deadline: state.deadline,
    leftAtEnd: state.leftAtEnd,
    endReason: state.endReason,
    pending: state.pending,
    villagers: state.villagers,
    aftermathLog: state.aftermathLog,
    obituary: state.obituary,
    beat,
    ended,
  };
}

function sameMoment(game) {
  if (!game) return false;
  return game.beat === beat
    && game.step === state.step
    && game.memberTurn === state.memberTurn
    && (game.log?.length || 0) === state.log.length
    && Boolean(game.pending) === Boolean(state.pending)
    && game.ended === ended;
}

function ensureTimer() {
  if (state.timerId || ended || !state.deadline) return;
  state.timerId = setInterval(() => {
    const left = state.deadline - Date.now();
    paintClock(left);
    if (left <= 0) {
      clearInterval(state.timerId);
      state.timerId = null;
      if (!party.code || party.me?.host) finish("time");
    }
  }, 250);
}

function applySnapshot(game) {
  if (sameMoment(game)) return;
  applyingRemote = true;
  clearInterval(state.timerId);
  state.timerId = null;
  state.selected = game.selected || [];
  state.names = game.names || {};
  state.hp = game.hp || {};
  state.step = game.step || 0;
  state.memberTurn = game.memberTurn || 0;
  state.log = game.log || [];
  state.seen = new Set(game.seen || []);
  state.deadline = game.deadline;
  state.leftAtEnd = game.leftAtEnd ?? DURATION_MS;
  state.endReason = game.endReason;
  state.pending = game.pending;
  state.villagers = Number.isFinite(game.villagers) ? game.villagers : START_VILLAGERS;
  state.aftermathLog = game.aftermathLog || [];
  state.obituary = game.obituary || null;
  beat = game.beat || "scene";
  ended = Boolean(game.ended);
  applyingRemote = false;
  if (!ended) ensureTimer();
  render();
  if (beat === "problem" && mineToAct()) document.getElementById("answer")?.focus();
  if (beat === "aftermath" && mineAftermath()) document.getElementById("answer")?.focus();
}

function mineToAct() {
  if (!party.code) return true;
  return activeRoles()[state.memberTurn]?.id === party.me?.role;
}

async function publishParty(phase) {
  if (!party.code || !party.me || applyingRemote) return;
  const sent = party.revision;
  try {
    const { ok, data } = await api(`/api/parties/${party.code}/state`, {
      memberId: party.me.id,
      revision: sent,
      phase,
      game: snapshot(),
    });
    if (data.revision) party.revision = data.revision;
    if (!ok && data.game) applySnapshot(data.game);
  } catch {
    gate.error = "";
  }
}

function stopPoll() {
  clearInterval(pollTimer);
  pollTimer = null;
}

function startPoll() {
  stopPoll();
  pollTimer = setInterval(pullParty, 1000);
  pullParty();
}

async function pullParty() {
  if (!party.code) return;
  let response;
  try {
    response = await fetch(`/api/parties/${party.code}`);
  } catch {
    return;
  }
  if (response.status === 404) {
    closeParty("That party ended.");
    return;
  }
  const data = await response.json();
  if (party.me && !data.members.some((member) => member.id === party.me.id)) {
    closeParty("That party ended.");
    return;
  }
  const changed = data.revision !== party.revision;
  const localPhase = party.phase;
  party.revision = data.revision;
  party.phase = data.phase;
  party.hostId = data.hostId;
  party.members = data.members;
  if (party.me) party.me = data.members.find((member) => member.id === party.me.id) || party.me;
  if (data.phase === "lobby") {
    if (localPhase === "play") return;
    beat = "lobby";
    if (changed) render();
    return;
  }
  if ((data.phase === "play" || data.phase === "summary") && data.game && changed) applySnapshot(data.game);
}

async function onCreateParty(event) {
  event.preventDefault();
  rememberGate();
  gate.error = "";
  try {
    const { ok, data } = await api("/api/parties", { name: gate.name, role: gate.role });
    if (!ok) {
      gate.error = data.error || "The party could not be created.";
      render();
      return;
    }
    adoptParty(data);
    beat = "lobby";
    startPoll();
    render();
  } catch {
    gate.error = "The party table is not reachable. Play on this screen, or start the classroom server.";
    render();
  }
}

async function onLookupParty(event) {
  event.preventDefault();
  rememberGate();
  gate.error = "";
  const code = gate.code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  gate.code = code;
  if (code.length !== 4) {
    gate.error = "Enter the 4-character party code.";
    render();
    return;
  }
  try {
    const response = await fetch(`/api/parties/${code}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      gate.error = data.error || "No party uses that code.";
      gate.preview = null;
      render();
      return;
    }
    if (data.phase !== "lobby") {
      gate.error = "That party has already started.";
      gate.preview = null;
      render();
      return;
    }
    if (data.members.length >= 3) {
      gate.error = "That party is already full.";
      gate.preview = null;
      render();
      return;
    }
    gate.preview = data;
    const open = ROLES.find((role) => !data.members.some((member) => member.role === role.id));
    if (open) gate.role = open.id;
    render();
  } catch {
    gate.error = "The party table is not reachable. Play on this screen, or start the classroom server.";
    render();
  }
}

async function onJoinParty(event) {
  event.preventDefault();
  rememberGate();
  gate.error = "";
  try {
    const { ok, data } = await api(`/api/parties/${gate.code}/join`, { name: gate.name, role: gate.role });
    if (!ok) {
      gate.error = data.error || "You could not join that party.";
      render();
      return;
    }
    adoptParty(data);
    gate.preview = null;
    beat = "lobby";
    startPoll();
    render();
  } catch {
    gate.error = "The party table is not reachable.";
    render();
  }
}

async function backToLobby() {
  if (!party.me?.host) {
    playAgain();
    return;
  }
  clearInterval(state.timerId);
  state.timerId = null;
  ended = false;
  beat = "lobby";
  state = freshState();
  render();
  try {
    const { ok, data } = await api(`/api/parties/${party.code}/state`, {
      memberId: party.me.id,
      revision: party.revision,
      phase: "lobby",
      game: {},
    });
    if (ok) {
      party.revision = data.revision;
      party.phase = "lobby";
      return;
    }
    gate.error = data.error || "The party could not be reset.";
    render();
  } catch {
    gate.error = "The party table is not reachable.";
    render();
  }
}

async function beginParty() {
  if (!party.me?.host || party.members.length < 2) return;
  state.selected = party.members.map((member) => member.role);
  state.names = {};
  state.hp = {};
  for (const member of party.members) {
    state.names[member.role] = member.name;
    state.hp[member.role] = MAX_HERO_HP;
  }
  state.step = 0;
  state.memberTurn = 0;
  state.log = [];
  state.seen = new Set();
  state.pending = null;
  state.villagers = START_VILLAGERS;
  state.aftermathLog = [];
  state.obituary = null;
  state.endReason = null;
  ended = false;
  party.phase = "play";
  beat = "scene";
  startTimer();
  render();
  try {
    const { ok, data } = await api(`/api/parties/${party.code}/start`, {
      memberId: party.me.id,
      game: snapshot(),
    });
    if (!ok) {
      clearInterval(state.timerId);
      state.timerId = null;
      party.phase = "lobby";
      beat = "lobby";
      gate.error = data.error || "The party could not begin.";
      render();
      return;
    }
    party.revision = data.revision;
    party.phase = "play";
  } catch {
    gate.error = "The party table is not reachable.";
    render();
  }
}

function partyCards(activeId) {
  return h("div", {},
    h("p", { class: "kicker" }, `Villagers left: ${state.villagers}`),
    h("div", { class: "party" }, activeRoles().map((role) => {
      const hp = heroHp(role.id);
      const rows = state.log.filter((row) => row.role === role.id && !row.aftermath);
      const correct = rows.filter((row) => row.correct).length;
      return h("article", { class: `hero${role.id === activeId ? " active" : ""}${hp < MAX_HERO_HP ? " hurt" : ""}` },
        h("strong", {}, heroName(role.id)),
        h("span", { class: "mini" }, role.label),
        h("span", { class: `mini${hp < MAX_HERO_HP ? " hurt" : ""}` }, `${hp}/${MAX_HERO_HP} HP`),
        h("span", { class: "mini" }, rows.length ? `Checks ${correct}/${rows.length}` : "Ready"),
      );
    })),
  );
}

function rolePicker(takenIds) {
  return h("div", { class: "roles" }, ROLES.map((role) => {
    const taken = takenIds.includes(role.id);
    const on = gate.role === role.id && !taken;
    return h("button", {
      type: "button",
      class: `role${on ? " selected" : ""}`,
      disabled: taken,
      onclick: () => {
        if (taken) return;
        rememberGate();
        gate.role = role.id;
        render();
      },
    },
      h("h3", {}, role.label),
      h("p", {}, taken ? "Already in the party." : role.blurb),
    );
  }));
}

function closeParty(notice) {
  stopPoll();
  sessionStorage.removeItem(PARTY_KEY);
  clearInterval(state.timerId);
  party = freshParty();
  gate = freshGate();
  gate.notice = notice;
  ended = false;
  beat = "home";
  state = freshState();
  render();
  paintClock(DURATION_MS);
}

function stopBoard() {
  clearInterval(boardTimer);
  boardTimer = null;
}

function syncBoard() {
  if (SOLO || beat !== "home") {
    stopBoard();
    return;
  }
  if (boardTimer) return;
  pullBoard();
  boardTimer = setInterval(pullBoard, 1000);
}

async function pullBoard() {
  if (beat !== "home") return;
  let response;
  try {
    response = await fetch("/api/parties");
  } catch {
    return;
  }
  if (!response.ok) return;
  const data = await response.json();
  const next = data.parties || [];
  const key = next.map((item) => `${item.code}:${item.joined}:${item.phase}`).join("|");
  board = next;
  if (key === boardKey) return;
  boardKey = key;
  if (beat === "home") render();
}

function chooseCode(code) {
  const listed = board.find((item) => item.code === code);
  if (!listed || listed.joined >= listed.seats || listed.phase !== "lobby") return;
  gate.code = code;
  gate.error = "";
  gate.notice = "";
  gate.preview = null;
  beat = "join";
  render();
  onLookupParty({ preventDefault() {} });
}

function renderHome() {
  return h("section", {},
    INTRO.map((paragraph) => h("p", {}, paragraph)),
    h("p", {}, "Pick a party code. Each party can have 2-3 people."),
    gate.notice ? h("p", { class: "banner miss" }, gate.notice) : null,
    board.length
      ? h("div", { class: "code-board" }, board.map((item) => {
        const open = item.phase === "lobby" && item.joined < item.seats;
        return h("button", {
          type: "button",
          class: "code-card",
          disabled: !open,
          onclick: () => chooseCode(item.code),
        },
          h("strong", {}, item.code),
          h("span", {}, `${item.joined}/${item.seats}`),
          item.phase !== "lobby" ? h("span", { class: "mini" }, "Playing") : null,
        );
      }))
      : h("p", {}, "Loading party codes."),
    h("p", { class: "actions" },
      h("button", { class: "ghost", type: "button", onclick: () => { beat = "setup"; render(); } }, "Play on this screen"),
      h("a", { class: "ghost", href: "/test" }, "One-person test"),
      h("a", { class: "ghost", href: "/admin" }, "Teacher admin"),
    ),
  );
}

function renderCreate() {
  return h("form", { onsubmit: onCreateParty },
    h("h2", {}, "Create a party"),
    h("p", {}, "Choose your name and role. You will get a code for the others."),
    gate.error ? h("p", { class: "error" }, gate.error) : null,
    h("p", {}, h("input", { id: "party-name", value: gate.name, placeholder: "Your name", maxlength: "18", required: true })),
    rolePicker([]),
    h("div", { class: "actions" },
      h("button", { class: "primary", type: "submit" }, "Create party"),
    ),
  );
}

function renderJoin() {
  const preview = gate.preview;
  const taken = preview ? preview.members.map((member) => member.role) : [];
  return h("form", { onsubmit: preview ? onJoinParty : onLookupParty },
    h("h2", {}, "Join a party"),
    h("p", {}, preview ? "Add your name and choose an open role." : "Enter a party code."),
    gate.error ? h("p", { class: "error" }, gate.error) : null,
    h("p", {}, h("input", { id: "party-code", value: gate.code, placeholder: "Code", maxlength: "4", autocapitalize: "characters" })),
    preview ? h("div", {},
      h("p", {}, `Party ${preview.code}`),
      h("ul", { class: "map" }, preview.members.map((member) => h("li", {},
        h("span", {}, `${member.name} the ${roleLabel(member.role)}`),
        h("strong", {}, member.host ? "Host" : "Joined"),
      ))),
      h("p", {}, h("input", { id: "party-name", value: gate.name, placeholder: "Your name", maxlength: "18", required: true })),
      rolePicker(taken),
    ) : null,
    h("div", { class: "actions" },
      h("button", { class: "primary", type: "submit" }, preview ? "Join party" : "Find party"),
    ),
  );
}

function renderLobby() {
  const mine = party.me;
  const host = Boolean(mine?.host);
  return h("section", {},
    h("p", { class: "kicker" }, host ? "You are the host" : "You joined the party"),
    h("h2", {}, "Party"),
    h("p", { class: "code-banner" }, party.code),
    h("p", {}, "Share the code. You need 2 or 3 people before you can start."),
    gate.error ? h("p", { class: "error" }, gate.error) : null,
    h("ul", { class: "map" }, party.members.map((member) => h("li", {},
      h("span", {}, `${member.name} the ${roleLabel(member.role)}`),
      h("strong", {}, member.host ? "Host" : "Joined"),
    ))),
    host
      ? party.members.length >= 2
        ? h("button", { class: "primary", type: "button", onclick: beginParty }, "Begin")
        : h("p", {}, "Waiting for at least one more person.")
      : h("p", {}, "Waiting for the host to begin."),
  );
}

function renderSolo() {
  return h("form", { onsubmit: onBegin },
    INTRO.map((paragraph) => h("p", {}, paragraph)),
    h("p", {}, "This page is for one player. Pick a role, add a name, and run the escape alone."),
    h("div", { class: "roles" }, ROLES.map((role) => {
      const on = state.selected[0] === role.id;
      return h("div", { class: `role${on ? " selected" : ""}` },
        h("label", {},
          h("input", { type: "radio", name: "solo-role", checked: on, onchange: () => toggleRole(role.id) }),
          h("h3", {}, role.label),
        ),
        h("p", {}, role.blurb),
        on ? h("input", { id: `name-${role.id}`, value: state.names[role.id] || "", placeholder: "Name", maxlength: "18", oninput: snapshotNames }) : null,
      );
    })),
    h("p", {}, h("button", { class: "primary", type: "submit" }, "Begin")),
  );
}

function renderSetup() {
  return h("form", { onsubmit: onBegin },
    INTRO.map((paragraph) => h("p", {}, paragraph)),
    h("p", {}, "Pick 2 or 3 people. They take each scene in order, one after another."),
    h("div", { class: "roles" }, ROLES.map((role) => {
      const on = state.selected.includes(role.id);
      return h("div", { class: `role${on ? " selected" : ""}` },
        h("label", {},
          h("input", { type: "checkbox", checked: on, onchange: () => toggleRole(role.id) }),
          h("h3", {}, role.label),
        ),
        h("p", {}, role.blurb),
        on ? h("input", { id: `name-${role.id}`, value: state.names[role.id] || "", placeholder: "Name", maxlength: "18", oninput: snapshotNames }) : null,
      );
    })),
    h("p", {}, h("button", { class: "primary", type: "submit" }, "Begin")),
  );
}

function renderObituary() {
  const notice = state.obituary;
  const name = notice?.name || "A hero";
  const epitaph = notice?.stone || notice?.epitaph || stoneEpitaph(notice?.role);
  return h("section", { class: "obituary" },
    partyCards(notice?.role || null),
    h("p", { class: "kicker" }, "Fallen in Ctesiphon"),
    h("div", { class: "grave" },
      h("img", { class: "grave-photo", src: "/assets/gravestone.jpg", alt: `Gravestone for ${name}` }),
      h("div", { class: "grave-face", "aria-label": "Inscription" },
        h("p", { class: "grave-here" }, "HERE LIES"),
        h("h2", { class: graveNameClass(name), title: name }, name),
        h("p", { class: "grave-class" }, `the ${notice?.label || "hero"}`),
        h("p", { class: "grave-rule" }, "✦"),
        h("p", { class: "grave-epitaph" }, epitaph),
        notice?.scene ? h("p", { class: "grave-place" }, notice.scene) : null,
      ),
    ),
    notice?.wound ? h("p", { class: "banner miss" }, `How they fell: ${notice.wound}.`) : null,
    mineToAct()
      ? h("button", { class: "primary", type: "button", onclick: onObituaryContinue }, "Read the summary")
      : h("p", { class: "banner" }, `Waiting for ${name}.`),
  );
}

function renderPlay() {
  const scene = currentScene();
  if (beat === "obituary") return renderObituary();
  if (beat === "aftermath" || beat === "aftermath-result") return renderAftermath(scene);
  const name = heroName(scene.role);
  const parts = [
    partyCards(scene.role),
    h("p", { class: "kicker" }, `Scene ${state.step + 1} of ${SCENES.length} · ${name} the ${roleLabel(scene.role)}`),
    h("h2", {}, scene.title),
  ];
  if (state.memberTurn === 0 && beat === "scene") scene.narrative.forEach((line) => parts.push(h("p", {}, line)));
  parts.push(h("p", {}, scene.stake));
  if (scene.prior) {
    parts.push(h("p", { class: scene.prior.success ? "banner good" : "banner miss" },
      scene.prior.success
        ? `${scene.prior.hero} cleared the way, so your challenge is 2 easier.`
        : `${scene.prior.hero} stumbled, so your challenge is 2 harder.`));
  }
  if (!mineToAct() && beat !== "result") {
    parts.push(h("p", { class: "banner" }, `Waiting on ${name}.`));
    if (beat === "problem" && state.pending?.problem) {
      parts.push(dieFace(state.pending.roll));
      parts.push(h("p", {}, state.pending.problem.text));
    }
  } else if (beat === "scene") {
    parts.push(h("p", {}, "Beat a ", h("strong", {}, String(scene.dc)), " on the dice total. Correct math: +2 to the roll. Wrong math: × 0.5."));
    parts.push(h("div", { class: "roll-row" },
      h("img", { class: "roll-die", src: "/dice/button.png", alt: "" }),
      h("button", { class: "primary", type: "button", onclick: onRoll }, "Roll dice"),
    ));
  } else if (beat === "problem") {
    const roll = state.pending.roll;
    parts.push(dieFace(roll));
    parts.push(h("p", { class: "banner" }, `Rolled ${roll}. Need `, h("strong", {}, String(scene.dc)), `. Right answer: ${roll} + 2. Wrong answer: ${roll} × 0.5.`));
    parts.push(h("p", { class: "kicker" }, problemLabel(state.pending.problem.skill)));
    parts.push(h("p", {}, state.pending.problem.text));
    parts.push(h("form", { onsubmit: onAnswer },
      h("div", { class: "answer-row" },
        h("input", { id: "answer", inputmode: "text", autocomplete: "off" }),
        h("button", { class: "primary", type: "submit" }, "Confirm"),
      ),
      h("p", { id: "answer-error", class: "error" }),
    ));
  } else {
    const row = state.log[state.log.length - 1];
    const totalLine = row.bonus
      ? `${row.roll} + 2 = ${row.final}`
      : (row.halved ? `${row.roll} × 0.5 = ${row.final}` : row.final);
    const mathLine = row.crit === "success" || row.crit === "fail"
      ? row.detail
      : `${row.correct ? "Right (+2)" : "Wrong (× 0.5)"}: ${row.detail}`;
    parts.push(dieFace(row.roll));
    parts.push(h("p", {}, row.resultText));
    parts.push(h("div", { class: "score" },
      line("Die", row.roll),
      line("Math", mathLine),
      line("Total", totalLine),
      line("Need", row.dc),
      line("Check", row.success ? "Passed" : "Failed"),
    ));
    if (row.crit === "success") {
      parts.push(h("p", { class: "banner good" }, "Natural 20. The math check is skipped, and the attempt succeeds."));
    } else if (row.crit === "fail") {
      parts.push(h("p", { class: "banner miss" }, "Natural 1. Critical miss. No math — you lose 2 HP."));
    } else if (row.correct) {
      parts.push(h("p", {}, row.success
        ? `${row.outcome}. Correct math added 2, so the dice total cleared ${row.dc}.`
        : `${row.outcome}. Correct math added 2, but ${row.final} still fell short of ${row.dc}.`));
    } else {
      parts.push(h("p", {}, row.success
        ? `You put ${row.given}. The right answer was ${row.outcome}. Wrong math halved the roll, but ${row.final} still met ${row.dc}.`
        : `You put ${row.given}. The right answer was ${row.outcome}. Wrong math halved the roll to ${row.final}, which misses ${row.dc}.`));
    }
    if (row.hpLoss > 0) {
      parts.push(h("p", { class: "banner miss" }, `${row.hero} loses ${row.hpLoss} HP. ${row.wound}. ${heroHp(row.role)}/${MAX_HERO_HP} left.`));
    }
    if (state.memberTurn < activeRoles().length - 1 && heroHp(row.role) > 0) {
      parts.push(h("p", { class: row.success ? "banner good" : "banner miss" },
        row.success
          ? `${row.hero} softens the next challenge by 2.`
          : `${row.hero} makes the next challenge 2 harder.`));
    }
    parts.push(mineToAct()
      ? h("div", { class: "actions" },
        !row.success && heroHp(row.role) > 0 && row.crit !== "success"
          ? h("button", { class: "ghost", type: "button", onclick: onRetry }, "Try again")
          : null,
        h("button", { class: "primary", type: "button", onclick: onContinue }, nextLabel(scene, row)),
      )
      : h("p", { class: "banner" }, `Waiting on ${name}.`));
  }
  return h("section", {}, parts);
}

function renderAftermath(scene) {
  const score = sceneScore(scene.id);
  const problem = state.pending?.problem;
  const parts = [
    partyCards(null),
    h("p", { class: "kicker" }, `Scene ${state.step + 1} of ${SCENES.length} · Villagers`),
    h("h2", {}, scene.title),
    h("p", {}, `Your party passed ${score.wins} of ${score.attempts} checks here.`),
  ];
  if (beat === "aftermath") {
    parts.push(h("p", { class: "kicker" }, problemLabel(problem.skill)));
    parts.push(h("p", {}, problem.text));
    if (mineAftermath()) {
      parts.push(h("form", { onsubmit: onAftermathAnswer },
        h("div", { class: "answer-row" },
          h("input", { id: "answer", inputmode: "text", autocomplete: "off" }),
          h("button", { class: "primary", type: "submit" }, "Confirm"),
        ),
        h("p", { id: "answer-error", class: "error" }),
      ));
    } else {
      parts.push(h("p", { class: "banner" }, "Waiting for the host to answer."));
    }
  } else {
    const row = state.aftermathLog[state.aftermathLog.length - 1];
    parts.push(h("div", { class: "score" },
      line("Checks", `${score.wins}/${score.attempts}`),
      line("Math", `${row.correct ? "Right" : "Wrong"}: ${row.detail}`),
      line("Lost", row.lost),
      line("Still with you", row.left),
    ));
    if (!row.correct) {
      parts.push(h("p", {}, `You put ${row.given}. The right answer was ${row.answer}.`));
      parts.push(h("p", { class: "banner miss" }, row.resultText));
    } else {
      parts.push(h("p", { class: "banner good" }, row.resultText));
      if (row.lost > 0) parts.push(h("p", { class: "banner miss" }, `${row.lost} villagers are gone. ${row.left} remain.`));
      else parts.push(h("p", { class: "banner good" }, `No one lost this stage. ${row.left} villagers remain.`));
    }
    parts.push(mineAftermath()
      ? h("button", { class: "primary", type: "button", onclick: onAftermathContinue }, aftermathNextLabel(scene))
      : h("p", { class: "banner" }, "Waiting for the host."));
  }
  return h("section", {}, parts);
}

function problemLabel(skill) {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}

function line(label, value) {
  return h("div", { class: "statline" }, h("span", {}, label), h("strong", {}, String(value)));
}

function nextLabel(scene, row) {
  if (state.memberTurn < activeRoles().length - 1) {
    const next = activeRoles()[state.memberTurn + 1];
    return `Next: ${heroName(next.id)}`;
  }
  return "Count the villagers";
}

function aftermathNextLabel(scene) {
  if (scene.finale || state.step >= SCENES.length - 1) return "Read the summary";
  return `Next: ${SCENES[state.step + 1].title}`;
}

function renderSummary() {
  const heroRows = state.log.filter((row) => !row.aftermath);
  const attempted = heroRows.length;
  const correct = heroRows.filter((row) => row.correct).length;
  const won = heroRows.filter((row) => row.success).length;
  const lost = START_VILLAGERS - state.villagers;
  const gate = heroRows.filter((row) => row.finale);
  const gateLatest = new Map();
  gate.forEach((row) => gateLatest.set(row.role, row));
  const escaped = state.endReason === "complete" && [...gateLatest.values()].some((row) => row.success);
  const kicker = state.endReason === "time"
    ? "Time ran out"
    : state.endReason === "defeat"
      ? (state.obituary ? `${state.obituary.name} fell in Ctesiphon` : "Someone fell before the gate")
      : escaped
        ? "You made it out of Ctesiphon"
        : "You reached the gate, but not everyone made it";
  return h("section", {},
    h("p", { class: "kicker" }, kicker),
    h("h2", {}, "How the escape went"),
    state.obituary
      ? h("p", {}, `${state.obituary.name} the ${state.obituary.label}: ${state.obituary.epitaph}`)
      : null,
    h("p", {}, attempted
      ? `You got ${correct} of ${attempted} math checks right and passed ${won} of them. ${state.villagers} villagers are still with you. ${lost} were lost along the way.`
      : "The clock ran out before the first roll."),
    h("div", { class: "stats" },
      activeRoles().map((role) => h("div", { class: "stat" }, h("span", {}, `${heroName(role.id)} HP`), h("strong", {}, `${heroHp(role.id)}/${MAX_HERO_HP}`))),
      h("div", { class: "stat" }, h("span", {}, "Hero checks"), h("strong", {}, `${correct}/${attempted}`)),
      h("div", { class: "stat" }, h("span", {}, "Villagers left"), h("strong", {}, String(state.villagers))),
      h("div", { class: "stat" }, h("span", {}, "Villagers lost"), h("strong", {}, String(lost))),
    ),
    h("ul", { class: "map" }, SCENES.map((scene) => {
      const rows = state.log.filter((row) => row.sceneId === scene.id && !row.aftermath);
      const latest = new Map();
      rows.forEach((row) => latest.set(row.role, row));
      const finals = [...latest.values()];
      const passed = finals.some((row) => row.success);
      const after = state.aftermathLog.find((row) => row.sceneId === scene.id);
      return h("li", { class: rows.length ? (passed ? "did-win" : "did-miss") : "" },
        h("span", {}, scene.title),
        h("strong", {}, rows.length
          ? (after ? `${after.lost} lost / ${after.left} left` : (passed ? "Got through" : "Fell short"))
          : "Not reached"),
      );
    })),
    h("button", { class: "primary", type: "button", onclick: party.code && party.me?.host ? backToLobby : playAgain }, party.code && !party.me?.host ? "Return to menu" : "Play again"),
  );
}

function render() {
  const stage = document.getElementById("stage");
  if (!stage) return;
  const view = SOLO && beat === "home" ? renderSolo()
    : beat === "home" ? renderHome()
    : beat === "create" ? renderCreate()
    : beat === "join" ? renderJoin()
    : beat === "lobby" ? renderLobby()
    : beat === "setup" ? renderSetup()
    : beat === "summary" ? renderSummary()
    : renderPlay();
  stage.replaceChildren(view);
  paintHeader();
  syncBoard();
}

function boot() {
  selfTestMath();
  document.getElementById("app").replaceChildren(
    h("header", { class: "top" },
      h("div", {},
        h("p", { class: "eyebrow" }, SOLO ? "One-person test" : "A 6-minute escape"),
        h("h1", {}, "The Palace Isn't Safe"),
      ),
      h("div", { id: "clock-slot", class: "clock-slot" },
        h("div", { id: "clock", class: "clock" }, formatClock(DURATION_MS)),
      ),
    ),
    h("main", { id: "stage", class: "stage" }),
    h("p", { id: "live", class: "sr", "aria-live": "polite" }),
    h("p", { class: "credit" }, CREDIT),
  );
  render();
  if (SOLO) return;
  const saved = sessionStorage.getItem(PARTY_KEY);
  if (!saved) return;
  try {
    const seat = JSON.parse(saved);
    if (!seat.code || !seat.memberId) return;
    party.code = seat.code;
    party.me = { id: seat.memberId };
    startPoll();
  } catch {
    sessionStorage.removeItem(PARTY_KEY);
  }
}

boot();
