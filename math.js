const SKILLS = ["fractions", "decimals", "proportionality", "linear equations", "percents"];

export const START_VILLAGERS = 100;
export const MAX_STAGE_LOSS = 25;

const FLAVOR = {
  palace: {
    assassin: {
      setup: (total) => `The side passage has ${total} steps.`,
      active: (part) => `${part} of them are dark enough to hide on.`,
      rate: (num, den) => `For every ${den} steps, ${num} are dark enough to hide on.`,
      leaveOne: "1 of those dark steps is lit from the courtyard.",
      leaveMany: (k) => `${k} of those dark steps are lit from the courtyard.`,
      ask: "How many steps stay dark enough to hide on?",
      outcome: (n) => (n === 1 ? "1 step stays dark enough to hide on" : `${n} steps stay dark enough to hide on`),
    },
    titan: {
      setup: (total) => `The side-door bar has ${total} bolts.`,
      active: (part) => `${part} of them are loose enough to bend.`,
      rate: (num, den) => `For every ${den} bolts, ${num} are loose enough to bend.`,
      leaveOne: "1 of those loose bolts snaps tight again.",
      leaveMany: (k) => `${k} of those loose bolts snap tight again.`,
      ask: "How many bolts give way?",
      outcome: (n) => (n === 1 ? "1 bolt gives way" : `${n} bolts give way`),
    },
    minstrel: {
      setup: (total) => `There are ${total} people in the hall.`,
      active: (part) => `${part} of them can hear the song.`,
      rate: (num, den) => `For every ${den} people, ${num} can hear the song.`,
      leaveOne: "1 of them covers their ears and stays put.",
      leaveMany: (k) => `${k} of them cover their ears and stay put.`,
      ask: "How many people follow the song out?",
      outcome: (n) => (n === 1 ? "1 person follows the song out" : `${n} people follow the song out`),
    },
    physician: {
      setup: (total) => `There are ${total} injured people in the hall.`,
      active: (part) => `${part} of them can still walk.`,
      rate: (num, den) => `For every ${den} injured people, ${num} can still walk.`,
      leaveOne: "1 of them collapses again.",
      leaveMany: (k) => `${k} of them collapse again.`,
      ask: "How many injured people get out?",
      outcome: (n) => (n === 1 ? "1 injured person gets out" : `${n} injured people get out`),
    },
    soldier: {
      setup: (total) => `The front lines of the Roman army have ${total} soldiers.`,
      active: (part) => `${part} of them are trying to push through the doors.`,
      rate: (num, den) => `For every ${den} soldiers, ${num} are trying to push through the doors.`,
      leaveOne: "1 of them gives up and goes around.",
      leaveMany: (k) => `${k} of them give up and go around.`,
      ask: "How many Romans are held at the doors?",
      outcome: (n) => (n === 1 ? "1 Roman is held at the doors" : `${n} Romans are held at the doors`),
    },
  },
  bazaar: {
    assassin: {
      setup: (total) => `There are ${total} roofs above the burning lanes.`,
      active: (part) => `${part} of them look empty enough to cross.`,
      rate: (num, den) => `For every ${den} roofs, ${num} look empty enough to cross.`,
      leaveOne: "1 of those empty roofs caves in.",
      leaveMany: (k) => `${k} of those empty roofs cave in.`,
      ask: "How many roofs can you cross?",
      outcome: (n) => (n === 1 ? "1 roof can be crossed" : `${n} roofs can be crossed`),
    },
    titan: {
      setup: (total) => `There are ${total} beams blocking the lane.`,
      active: (part) => `${part} of them are light enough to drag.`,
      rate: (num, den) => `For every ${den} beams, ${num} are light enough to drag.`,
      leaveOne: "1 of those beams catches fire too hard to touch.",
      leaveMany: (k) => `${k} of those beams catch fire too hard to touch.`,
      ask: "How many beams get hauled clear?",
      outcome: (n) => (n === 1 ? "1 beam gets hauled clear" : `${n} beams get hauled clear`),
    },
    minstrel: {
      setup: (total) => `There are ${total} people stuck in the burning market.`,
      active: (part) => `${part} of them follow when the rain starts.`,
      rate: (num, den) => `For every ${den} people, ${num} follow when the rain starts.`,
      leaveOne: "1 of them panics and runs the wrong way.",
      leaveMany: (k) => `${k} of them panic and run the wrong way.`,
      ask: "How many people make it across with the rain?",
      outcome: (n) => (n === 1 ? "1 person makes it across with the rain" : `${n} people make it across with the rain`),
    },
    physician: {
      setup: (total) => `There are ${total} people in the smoke.`,
      active: (part) => `${part} of them can still breathe well enough to walk.`,
      rate: (num, den) => `For every ${den} people, ${num} can still breathe well enough to walk.`,
      leaveOne: "1 of them drops from the smoke.",
      leaveMany: (k) => `${k} of them drop from the smoke.`,
      ask: "How many people keep moving?",
      outcome: (n) => (n === 1 ? "1 person keeps moving" : `${n} people keep moving`),
    },
    soldier: {
      setup: (total) => `There are ${total} Romans in the market lane.`,
      active: (part) => `${part} of them are closing in on the crowd.`,
      rate: (num, den) => `For every ${den} Romans, ${num} are closing in on the crowd.`,
      leaveOne: "1 of them is driven back and peels off.",
      leaveMany: (k) => `${k} of them are driven back and peel off.`,
      ask: "How many Romans are still held off in the lane?",
      outcome: (n) => (n === 1 ? "1 Roman is still held off in the lane" : `${n} Romans are still held off in the lane`),
    },
  },
  legion: {
    assassin: {
      setup: (total) => `There are ${total} shields along the wall.`,
      active: (part) => `${part} of them overlap enough to slip behind.`,
      rate: (num, den) => `For every ${den} shields, ${num} overlap enough to slip behind.`,
      leaveOne: "1 of those gaps closes when a soldier shifts.",
      leaveMany: (k) => `${k} of those gaps close when soldiers shift.`,
      ask: "How many shields let you slip behind?",
      outcome: (n) => (n === 1 ? "1 shield lets you slip behind" : `${n} shields let you slip behind`),
    },
    titan: {
      setup: (total) => `There are ${total} shields in the line.`,
      active: (part) => `${part} of them have a rim you can grip.`,
      rate: (num, den) => `For every ${den} shields, ${num} have a rim you can grip.`,
      leaveOne: "1 of those shields is locked too tight.",
      leaveMany: (k) => `${k} of those shields are locked too tight.`,
      ask: "How many shields get wrenched out?",
      outcome: (n) => (n === 1 ? "1 shield gets wrenched out" : `${n} shields get wrenched out`),
    },
    minstrel: {
      setup: (total) => `There are ${total} legionaries in the street.`,
      active: (part) => `${part} of them turn when they hear the noise.`,
      rate: (num, den) => `For every ${den} legionaries, ${num} turn when they hear the noise.`,
      leaveOne: "1 of them ignores it and holds the line.",
      leaveMany: (k) => `${k} of them ignore it and hold the line.`,
      ask: "How many legionaries turn toward the noise?",
      outcome: (n) => (n === 1 ? "1 legionary turns toward the noise" : `${n} legionaries turn toward the noise`),
    },
    physician: {
      setup: (total) => `There are ${total} injured people by the shields.`,
      active: (part) => `${part} of them are close enough to reach.`,
      rate: (num, den) => `For every ${den} injured people, ${num} are close enough to reach.`,
      leaveOne: "1 of them is pulled back into the crush.",
      leaveMany: (k) => `${k} of them are pulled back into the crush.`,
      ask: "How many injured people get pulled clear?",
      outcome: (n) => (n === 1 ? "1 injured person gets pulled clear" : `${n} injured people get pulled clear`),
    },
    soldier: {
      setup: (total) => `There are ${total} shields in the line.`,
      active: (part) => `${part} of them can be knocked aside.`,
      rate: (num, den) => `For every ${den} shields, ${num} can be knocked aside.`,
      leaveOne: "1 of those shields braces and holds.",
      leaveMany: (k) => `${k} of those shields brace and hold.`,
      ask: "How many shields get knocked aside?",
      outcome: (n) => (n === 1 ? "1 shield gets knocked aside" : `${n} shields get knocked aside`),
    },
  },
  gate: {
    assassin: {
      setup: (total) => `The gatehouse ladder has ${total} rungs.`,
      active: (part) => `${part} of them are close enough to climb.`,
      rate: (num, den) => `For every ${den} rungs, ${num} are close enough to climb.`,
      leaveOne: "1 of those rungs is broken.",
      leaveMany: (k) => `${k} of those rungs are broken.`,
      ask: "How many rungs can you climb?",
      outcome: (n) => (n === 1 ? "1 rung can be climbed" : `${n} rungs can be climbed`),
    },
    titan: {
      setup: (total) => `The gate bar has ${total} pins.`,
      active: (part) => `${part} of them are soft enough to bend.`,
      rate: (num, den) => `For every ${den} pins, ${num} are soft enough to bend.`,
      leaveOne: "1 of those pins is too hard.",
      leaveMany: (k) => `${k} of those pins are too hard.`,
      ask: "How many pins bend out of place?",
      outcome: (n) => (n === 1 ? "1 pin bends out of place" : `${n} pins bend out of place`),
    },
    minstrel: {
      setup: (total) => `There are ${total} watchers on the wall above the gate.`,
      active: (part) => `${part} of them turn toward the song.`,
      rate: (num, den) => `For every ${den} watchers, ${num} turn toward the song.`,
      leaveOne: "1 of them stays on the gate.",
      leaveMany: (k) => `${k} of them stay on the gate.`,
      ask: "How many watchers turn toward the song?",
      outcome: (n) => (n === 1 ? "1 watcher turns toward the song" : `${n} watchers turn toward the song`),
    },
    physician: {
      setup: (total) => `There are ${total} wounded people at the gate.`,
      active: (part) => `${part} of them can still stand.`,
      rate: (num, den) => `For every ${den} wounded people, ${num} can still stand.`,
      leaveOne: "1 of them drops again.",
      leaveMany: (k) => `${k} of them drop again.`,
      ask: "How many wounded people stay on their feet?",
      outcome: (n) => (n === 1 ? "1 wounded person stays on their feet" : `${n} wounded people stay on their feet`),
    },
    soldier: {
      setup: (total) => `There are ${total} Romans on the gate bar.`,
      active: (part) => `${part} of them are holding it down.`,
      rate: (num, den) => `For every ${den} Romans, ${num} are holding the bar down.`,
      leaveOne: "1 of them loses grip and lets go.",
      leaveMany: (k) => `${k} of them lose grip and let go.`,
      ask: "How many Romans are still holding the bar?",
      outcome: (n) => (n === 1 ? "1 Roman is still holding the bar" : `${n} Romans are still holding the bar`),
    },
  },
};

const RATIOS = [
  { num: 1, den: 4, label: "1/4", decimal: "0.25", percent: "25%" },
  { num: 3, den: 4, label: "3/4", decimal: "0.75", percent: "75%" },
  { num: 1, den: 5, label: "1/5", decimal: "0.2", percent: "20%" },
  { num: 2, den: 5, label: "2/5", decimal: "0.4", percent: "40%" },
  { num: 3, den: 5, label: "3/5", decimal: "0.6", percent: "60%" },
  { num: 4, den: 5, label: "4/5", decimal: "0.8", percent: "80%" },
];

function sceneFlavor(sceneId, role) {
  const scene = FLAVOR[sceneId] || FLAVOR.palace;
  return scene[role] || scene.soldier;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function rat(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) return null;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function sameRat(a, b) {
  return Boolean(a && b && a.n === b.n && a.d === b.d);
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function formatDecimal(value) {
  if (value.d === 1) return String(value.n);
  return (value.n / value.d).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function show(answer) {
  return formatDecimal(answer);
}

function finish(text, answer, skill, hint, work, outcome) {
  return {
    text,
    answer,
    display: show(answer),
    skill,
    hint,
    style: "whole",
    percent: false,
    work,
    outcome,
  };
}

function baseCount(roll, jitter) {
  const even = roll % 2 === 0;
  return even ? roll / 2 + (5 + jitter) : (roll + 1) / 2 + (4 + jitter);
}

function chooseShape(roll, tier, random) {
  const jitter = pick(random, [-1, 0, 1]);
  const count = baseCount(roll, jitter);
  let leave = 3 + ((jitter + 1) % 3);
  if (leave >= count) leave = Math.max(1, count - 1);
  const engaged = count + leave;
  const usable = RATIOS.filter((ratio) => (engaged * ratio.den) % ratio.num === 0);
  const preferHard = tier >= 2;
  const pool = usable.length
    ? (preferHard ? usable.filter((ratio) => ratio.den === 5).concat(usable) : usable)
    : RATIOS.filter((ratio) => ratio.num === 1);
  const ratio = pick(random, pool);
  const total = (engaged * ratio.den) / ratio.num;
  return { ...ratio, leave, count, engaged, total };
}

function chooseHardShape(roll, random) {
  const jitter = pick(random, [-1, 0, 1]);
  const count = baseCount(roll, jitter);
  let leave1 = 2 + ((jitter + 1) % 3);
  let leave2 = 2 + (Math.abs(jitter) % 2);
  if (leave1 + leave2 >= count) {
    leave1 = Math.max(1, Math.min(2, count - 2));
    leave2 = 1;
  }
  const engaged = count + leave1 + leave2;
  const fifths = RATIOS.filter((ratio) => ratio.den === 5 && (engaged * ratio.den) % ratio.num === 0);
  const usable = RATIOS.filter((ratio) => (engaged * ratio.den) % ratio.num === 0);
  const pool = fifths.length ? fifths : (usable.length ? usable : RATIOS.filter((ratio) => ratio.num === 1));
  const ratio = pick(random, pool);
  const total = (engaged * ratio.den) / ratio.num;
  return {
    ...ratio,
    leave: leave1 + leave2,
    leave1,
    leave2,
    count,
    engaged,
    total,
    hard: true,
  };
}

function leaveLine(scene, leave) {
  if (!leave) return "";
  return leave === 1 ? scene.leaveOne : scene.leaveMany(leave);
}

function buildProblem(skill, roll, scene, shape) {
  const { num, den, label, decimal, percent, leave, leave1, leave2, count, engaged, total, hard } = shape;
  if (!Number.isInteger(total) || total <= 0 || count <= 0) return null;
  const answer = rat(count, 1);
  const outcome = scene.outcome(count);
  const setup = scene.setup(total);
  const twoStep = Boolean(hard && leave1 && leave2);
  const secondLeave = leave2 === 1 ? scene.leaveOne : scene.leaveMany(leave2);
  const leaveBlock = twoStep
    ? `${leaveLine(scene, leave1)} Then ${secondLeave.charAt(0).toLowerCase()}${secondLeave.slice(1)}`
    : leaveLine(scene, leave);
  const work = twoStep
    ? `${label} of ${total} = ${engaged}, then − ${leave1} − ${leave2} = ${count}`
    : (leave ? `${label} of ${total} − ${leave} = ${count}` : `${label} of ${total} = ${count}`);

  if (skill === "fractions") {
    return finish(
      `${setup} ${scene.active(label)}${leaveBlock ? ` ${leaveBlock}` : ""} ${scene.ask}`,
      answer,
      skill,
      twoStep
        ? `Take ${label} of ${total}, subtract ${leave1}, then subtract ${leave2}.`
        : (leave ? `Take ${label} of ${total}, then subtract ${leave}.` : `Take ${label} of ${total}.`),
      work,
      outcome,
    );
  }
  if (skill === "decimals") {
    return finish(
      `${setup} ${scene.active(decimal)}${leaveBlock ? ` ${leaveBlock}` : ""} ${scene.ask}`,
      answer,
      skill,
      twoStep
        ? `Multiply ${total} by ${decimal}, subtract ${leave1}, then subtract ${leave2}.`
        : (leave ? `Multiply ${total} by ${decimal}, then subtract ${leave}.` : `Multiply ${total} by ${decimal}.`),
      work,
      outcome,
    );
  }
  if (skill === "percents") {
    return finish(
      `${setup} ${scene.active(percent)}${leaveBlock ? ` ${leaveBlock}` : ""} ${scene.ask}`,
      answer,
      skill,
      twoStep
        ? `Take ${percent} of ${total}, subtract ${leave1}, then subtract ${leave2}.`
        : (leave ? `Take ${percent} of ${total}, then subtract ${leave}.` : `Take ${percent} of ${total}.`),
      work,
      outcome,
    );
  }
  if (skill === "proportionality") {
    return finish(
      `${setup} ${scene.rate(num, den)}${leaveBlock ? ` ${leaveBlock}` : ""} ${scene.ask}`,
      answer,
      skill,
      twoStep
        ? `Use the rate, subtract ${leave1}, then subtract ${leave2}.`
        : (leave ? `Use the rate, then subtract ${leave}.` : "Use the rate on the whole group."),
      twoStep
        ? `${total} ÷ ${den} × ${num} − ${leave1} − ${leave2} = ${count}`
        : (leave ? `${total} ÷ ${den} × ${num} − ${leave} = ${count}` : `${total} ÷ ${den} × ${num} = ${count}`),
      outcome,
    );
  }
  return finish(
    twoStep
      ? `${setup} Let y be the answer. Then y + ${leave1} + ${leave2} = (${label}) × ${total}. ${scene.ask}`
      : `${setup} Let y be the answer. Then y + ${leave} = (${label}) × ${total}. ${scene.ask}`,
    answer,
    skill,
    twoStep
      ? `Compute ${label} of ${total}, subtract ${leave1}, then subtract ${leave2}.`
      : `Compute ${label} of ${total}, then subtract ${leave}.`,
    twoStep
      ? `y + ${leave1} + ${leave2} = ${engaged}, y = ${count}`
      : `y + ${leave} = ${engaged}, y = ${count}`,
    outcome,
  );
}

function decimalToRat(compact) {
  const negative = compact.startsWith("-");
  const body = compact.replace(/^[+-]/, "");
  if (!body.includes(".")) {
    const whole = Number(body);
    if (!Number.isInteger(whole)) return null;
    return rat(negative ? -whole : whole, 1);
  }
  const [whole, frac] = body.split(".");
  if (!frac) return null;
  const num = Number((whole || "0") + frac);
  if (!Number.isInteger(num)) return null;
  return rat(negative ? -num : num, 10 ** frac.length);
}

export function parseStudentAnswer(raw, allowPercent = false) {
  let text = String(raw ?? "").trim();
  if (!text) return null;
  if (text.endsWith("%")) {
    if (!allowPercent) return null;
    text = text.slice(0, -1).trim();
  }
  const mixed = text.match(/^(-?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const sign = mixed[1] === "-" ? -1 : 1;
    const whole = Number(mixed[2]);
    const numerator = Number(mixed[3]);
    const denominator = Number(mixed[4]);
    if (denominator === 0) return null;
    return rat(sign * (whole * denominator + numerator), denominator);
  }
  const compact = text.replace(/\s+/g, "");
  const fraction = compact.match(/^(-?\d+)\/(-?\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return rat(Number(fraction[1]), denominator);
  }
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(compact)) return null;
  return decimalToRat(compact);
}

export function gradeAnswer(raw, problem) {
  const parsed = parseStudentAnswer(raw, Boolean(problem.percent));
  if (!parsed) return { ok: false, valid: false };
  return { ok: sameRat(parsed, problem.answer), valid: true };
}

export function meetsChallenge(answer, dc) {
  return Boolean(answer) && answer.n >= dc * answer.d;
}

const STAGE_AFTERMATH = {
  palace: {
    danger: "are still in the palace crush",
    askLost: "How many villagers are lost here?",
    askLeft: "How many villagers are still with you?",
  },
  bazaar: {
    danger: "are caught in the burning market",
    askLost: "How many villagers are lost here?",
    askLeft: "How many villagers are still with you?",
  },
  legion: {
    danger: "are trapped against the shield wall",
    askLost: "How many villagers are lost here?",
    askLeft: "How many villagers are still with you?",
  },
  gate: {
    danger: "are waiting under the gate",
    askLost: "How many villagers are lost here?",
    askLeft: "How many villagers are still with you?",
  },
};

function lossForScore(wins, attempts) {
  const n = Math.max(1, attempts);
  const w = Math.min(n, Math.max(0, wins));
  return Math.min(MAX_STAGE_LOSS, Math.round(((n - w) / n) * MAX_STAGE_LOSS));
}

function cleanLosses() {
  const values = new Set([0]);
  for (const ratio of RATIOS) {
    if ((MAX_STAGE_LOSS * ratio.num) % ratio.den === 0) {
      values.add((MAX_STAGE_LOSS * ratio.num) / ratio.den);
    }
  }
  return [...values].sort((a, b) => a - b);
}

function snapLoss(intended) {
  const list = cleanLosses();
  return list.reduce((best, value) => (Math.abs(value - intended) < Math.abs(best - intended) ? value : best), list[0]);
}

function ratioForLoss(loss, random) {
  const options = [];
  for (const ratio of RATIOS) {
    if ((MAX_STAGE_LOSS * ratio.num) % ratio.den !== 0) continue;
    const value = (MAX_STAGE_LOSS * ratio.num) / ratio.den;
    if (value === loss) options.push({ ...ratio, mode: "lost", value });
  }
  if (options.length) return pick(random, options);
  return { num: 1, den: 5, label: "1/5", decimal: "0.2", percent: "20%", mode: "lost", value: loss };
}

export function makeAftermathProblem(sceneId, wins, attempts, villagers = START_VILLAGERS, random = Math.random) {
  const flavor = STAGE_AFTERMATH[sceneId] || STAGE_AFTERMATH.palace;
  const before = Math.max(0, Math.round(Number(villagers) || 0));
  const lost = Math.min(before, snapLoss(lossForScore(wins, attempts)));
  const left = before - lost;
  const askLost = lost === 0 || random() < 0.5;
  const answerValue = askLost ? lost : left;
  const answer = rat(answerValue, 1);
  let forms;
  if (lost === 0) {
    forms = [{
      skill: "fractions",
      text: `You have ${before} villagers. This stage was a success! All of the villagers came through unscathed. ${flavor.askLost}`,
      work: `0 of ${MAX_STAGE_LOSS} = 0`,
    }];
  } else {
    const ratio = ratioForLoss(lost, random);
    forms = [
      {
        skill: "fractions",
        text: `You have ${before} villagers. ${MAX_STAGE_LOSS} of them ${flavor.danger}. ${ratio.label} of those ${MAX_STAGE_LOSS} are lost. ${askLost ? flavor.askLost : flavor.askLeft}`,
        work: askLost ? `${ratio.label} of ${MAX_STAGE_LOSS} = ${lost}` : `${before} − ${lost} = ${left}`,
      },
      {
        skill: "decimals",
        text: `You have ${before} villagers. ${MAX_STAGE_LOSS} of them ${flavor.danger}. ${ratio.decimal} of those ${MAX_STAGE_LOSS} are lost. ${askLost ? flavor.askLost : flavor.askLeft}`,
        work: askLost ? `${ratio.decimal} × ${MAX_STAGE_LOSS} = ${lost}` : `${before} − ${lost} = ${left}`,
      },
      {
        skill: "percents",
        text: `You have ${before} villagers. ${MAX_STAGE_LOSS} of them ${flavor.danger}. ${ratio.percent} of those ${MAX_STAGE_LOSS} are lost. ${askLost ? flavor.askLost : flavor.askLeft}`,
        work: askLost ? `${ratio.percent} of ${MAX_STAGE_LOSS} = ${lost}` : `${before} − ${lost} = ${left}`,
        percent: true,
      },
      {
        skill: "proportionality",
        text: `You have ${before} villagers. ${MAX_STAGE_LOSS} of them ${flavor.danger}. For every ${ratio.den} of those ${MAX_STAGE_LOSS}, ${ratio.num} are lost. ${askLost ? flavor.askLost : flavor.askLeft}`,
        work: askLost ? `${MAX_STAGE_LOSS} ÷ ${ratio.den} × ${ratio.num} = ${lost}` : `${before} − ${lost} = ${left}`,
      },
    ];
  }
  const form = forms[Math.floor(random() * forms.length)] || forms[0];
  return {
    ...finish(form.text, answer, form.skill, "Use the fraction of the 25 villagers in danger.", form.work, askLost ? `${lost} villagers are lost` : `${left} villagers are still with you`),
    percent: Boolean(form.percent),
    aftermath: true,
    before,
    lost,
    left,
    maxLoss: MAX_STAGE_LOSS,
    penaltyLoss: Math.min(before, MAX_STAGE_LOSS),
    askLost,
  };
}

const HARD_SKILLS = ["linear equations", "proportionality", "percents", "decimals", "fractions"];

export function makeProblem(sceneId, tier, random = Math.random, seen = new Set(), roll = 10, role = "soldier") {
  const scene = sceneFlavor(sceneId, role);
  const face = Math.min(20, Math.max(1, Math.round(Number(roll) || 10)));
  const hard = face === 1;
  const skills = hard ? HARD_SKILLS : SKILLS;
  const start = seen.size % skills.length;
  for (let skillOffset = 0; skillOffset < skills.length; skillOffset += 1) {
    const skill = skills[(start + skillOffset) % skills.length];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const shape = hard ? chooseHardShape(face, random) : chooseShape(face, tier, random);
      const problem = buildProblem(skill, face, scene, shape);
      if (!problem || problem.answer.d !== 1 || problem.answer.n <= 0) continue;
      if (/\b0\.5\b|\b1\/2\b|\bHalf\b|\b50%/i.test(problem.text)) continue;
      if (hard && !/then subtract|− \d+ − \d+|Then /i.test(`${problem.text} ${problem.hint} ${problem.work}`)) continue;
      const key = `${sceneId}:${role}:${problem.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      problem.hard = hard;
      return problem;
    }
  }
  const fallbackShape = hard ? chooseHardShape(face, () => 0) : chooseShape(face, 0, () => 0.5);
  const fallback = buildProblem(skills[0], face, scene, fallbackShape);
  fallback.hard = hard;
  seen.add(`${sceneId}:${role}:${fallback.text}`);
  return fallback;
}

function legalCount(roll, count) {
  if (roll % 2 === 0) return [4, 5, 6].includes(count - roll / 2);
  return [3, 4, 5].includes(count - (roll + 1) / 2);
}

export function selfTestMath() {
  const seen = new Set();
  const found = new Set();
  const roles = ["assassin", "titan", "minstrel", "physician", "soldier"];
  const sceneIds = Object.keys(FLAVOR);
  for (let roll = 1; roll <= 20; roll += 1) {
    for (let n = 0; n < 6; n += 1) {
      const id = sceneIds[n % sceneIds.length];
      const role = roles[n % roles.length];
      const problem = makeProblem(id, n % 4, Math.random, seen, roll, role);
      found.add(problem.skill);
      if (!problem.text.includes("How many")) throw new Error(`question missing: ${problem.text}`);
      if (/\b0\.5\b|\b1\/2\b|\bHalf of them\b|\b50%/i.test(problem.text)) throw new Error(`half leaked: ${problem.text}`);
      if (!legalCount(roll, problem.answer.n) || problem.answer.d !== 1) {
        throw new Error(`count drifted for roll ${roll}: ${problem.display}`);
      }
      if (!gradeAnswer(problem.display, problem).ok) throw new Error(`display rejected: ${problem.text}`);
      if (!problem.outcome.startsWith(`${problem.display} `)) throw new Error(`outcome mismatch: ${problem.outcome}`);
      if (role === "assassin" && /defeat|killed|slain|assassinat|see you|sees you/i.test(`${problem.text} ${problem.outcome}`)) {
        throw new Error(`assassin problem left the escape: ${problem.text}`);
      }
      if (!problem.text.endsWith(sceneFlavor(id, role).ask)) throw new Error(`question drifted from the role: ${problem.text}`);
    }
  }
  for (const skill of SKILLS) {
    if (!found.has(skill)) throw new Error(`missing skill ${skill}`);
  }
  const sample = makeProblem("palace", 0, () => 0, new Set(), 1);
  if (meetsChallenge(sample.answer, 9)) throw new Error("a roll of 1 should not clear challenge 9");
  const high = makeProblem("gate", 3, () => 0.99, new Set(), 20);
  if (!meetsChallenge(high.answer, 13)) throw new Error("a roll of 20 should clear challenge 13");
  const after = makeAftermathProblem("palace", 2, 3, START_VILLAGERS, () => 0);
  if (after.lost > MAX_STAGE_LOSS) throw new Error("stage loss exceeded the cap");
  if (after.before !== START_VILLAGERS) throw new Error("aftermath should start from current villagers");
  if (!gradeAnswer(after.display, after).ok) throw new Error("aftermath answer rejected");
  const crit = makeProblem("palace", 0, () => 0, new Set(), 1, "soldier");
  if (!crit.hard) throw new Error("natural 1 should build a harder problem");
  if (!/Then |then subtract|− \d+ − \d+/i.test(`${crit.text} ${crit.hint} ${crit.work}`)) {
    throw new Error(`natural 1 should be multi-step: ${crit.text}`);
  }
}
