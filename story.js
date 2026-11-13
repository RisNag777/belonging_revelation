export const ROLES = [
  {
    id: "assassin",
    label: "Assassin",
    blurb: "Quiet and fast. Good at staying out of sight and getting past people without a fight.",
  },
  {
    id: "titan",
    label: "Titan",
    blurb: "A towering powerhouse, built like a battering ram. They can perform unbelievably strong feats with bare hands.",
  },
  {
    id: "minstrel",
    label: "Minstrel",
    blurb: "A musician who can draw a crowd, distract people, or inspire allies.",
  },
  {
    id: "physician",
    label: "Physician",
    blurb: "A healer. Can treat wounds, get injured people moving, and heal broken bones.",
  },
  {
    id: "soldier",
    label: "Soldier",
    blurb: "Trained to fight in close quarters.",
  },
];

export const CREDIT = "Adapted from The Palace Isn't Safe! by Joana Almeida (2023), CC BY 4.0. https://iohanna.itch.io/the-palace-isnt-safe";

export const INTRO = [
  "The year is 198 AD. The Roman emperor Evilus has defeated the  army outside Crete. King Christos has fled, and the Romans are invading the capital.",
  "You are still in the city with about 100 villagers. If you do not get out, the Romans will kill you.",
  "You have 6 minutes. A success makes the next person's challenge easier. A miss makes it harder.",
  "Roll a 20-sided die. That sets up a math question about what is happening. The check uses your dice roll, not the math answer. However, a correct answer adds 2 to the roll, and a wrong answer halves it (× 0.5). If that total is greater than or equal to the challenge number, you succeed.",
  "A miss costs HP. Rolling a 1 is a critical miss: no math, and you lose 2 HP. A 20 is a critical hit: you succeed and skip the math.",
];

export const SCENES = [
  {
    id: "palace",
    dc: 9,
    title: "The Royal Palace",
    narrative: [
      "You are inside the palace when you hear screaming in the courtyard. The Romans are in the streets outside. The main doors are bolted but will not hold for long.",
      "You need to get people out before the soldiers reach this hall.",
    ],
    stake: "Get out of the palace before the Romans reach the hall.",
    roleActions: {
      soldier: "Hold the doors so the others can leave.",
      physician: "Heal the injured and guide them toward the exit.",
      assassin: "Slip out through a backdoor and make sure the coast is clear.",
      titan: "Bend the bar on the side door so it opens.",
      minstrel: "Sing a song that draws people toward the exit.",
    },
    roleOutcomes: {
      soldier: {
        success: "{hero} holds the doors until the hall is clear.",
        fail: "The doors break open. A shield hits {hero}, and Romans push into the hall.",
        wound: "A Roman shield hits {hero}",
      },
      physician: {
        success: "{hero} heals the injured and guides them out of the hall.",
        fail: "The smoke is too thick. {hero} starts coughing, and some of the injured stay behind.",
        wound: "Smoke makes {hero} cough and choke",
      },
      assassin: {
        success: "{hero} gets through the backdoor and makes sure the coast is clear.",
        fail: "A guard spots {hero} and attacks.",
        wound: "A palace guard attacks {hero}",
      },
      titan: {
        success: "{hero} bends the bar, and the side door opens.",
        fail: "The bar will not bend. It snaps back and hits {hero}, and the door stays shut.",
        wound: "The iron bar snaps back into {hero}",
      },
      minstrel: {
        success: "{hero}'s song gets the crowd moving toward the exit, and the hall clears.",
        fail: "Nobody can hear the song over the screaming. A stray arrow hits {hero}.",
        wound: "A stray arrow hits {hero}",
      },
    },
    failHpLoss: 1,
  },
  {
    id: "bazaar",
    dc: 10,
    title: "The Burning Bazaar",
    narrative: [
      "The market on the way out of the city is on fire. Stalls are falling in. People are running in every direction.",
      "You have to get across before the path is completely blocked.",
    ],
    stake: "Cross the burning bazaar.",
    roleActions: {
      soldier: "Hold off the Romans and let the people pass safely.",
      physician: "Cast a clean air spell so people do not collapse in the smoke.",
      assassin: "Cross on the roofs, look for a lane that is still open, and lead the group through.",
      titan: "Drag a burning beam out of the way and toss it at the Romans.",
      minstrel: "Sing a song to summon rain to put out the fires.",
    },
    roleOutcomes: {
      soldier: {
        success: "{hero} distracts the Romans, and the crowd makes their way across the market.",
        fail: "The Romans strike {hero} down and chase the crowd",
        wound: "A Roman soldier hits {hero}",
      },
      physician: {
        success: "{hero} casts a clean air spell, so everyone can breathe again.",
        fail: "{hero} chokes and goes down. Some of the crowd also collapse in the smoke.",
        wound: "Smoke chokes {hero}",
      },
      assassin: {
        success: "{hero} finds an open lane from the roofs and leads the group through.",
        fail: "A stall collapses under {hero}. The path over the roofs is gone.",
        wound: "A stall collapses under {hero} and he falls to the street.",
      },
      titan: {
        success: "{hero} pulls the beam clear, and the path opens. He hurls it at the Romans and they scatter.",
        fail: "The beam slips and burns {hero}. The path stays blocked.",
        wound: "The burning beam slips onto {hero}",
      },
      minstrel: {
        success: "{hero} summons rain to put out the fires and the crowd makes their way across the market.",
        fail: "The rain does not come. The market continues to burn. In their panic, the crowd accidentally pushes {hero} toward the fire.",
        wound: "The crowd shoves {hero} toward the fire",
      },
    },
    failHpLoss: 1,
  },
  {
    id: "legion",
    dc: 11,
    title: "The Legion in the Street",
    narrative: [
      "Past the market, Roman soldiers have blocked the street. Shields up. Spears out. They are sealing it off.",
      "You cannot go back. The fire is behind you.",
    ],
    stake: "Get past the legion without getting caught.",
    roleActions: {
      soldier: "Battle the soldiers and break a gap in the shield wall.",
      physician: "Heal broken bones of people who were caught in the stampede.",
      assassin: "Slip along the wall behind the shields and backstab the soldiers.",
      titan: "Yank a shield out of the line and toss it at the soldiers, making another path for the people to pass through.",
      minstrel: "Distract the soldiers with some music that conjures up the visage of a dragon.",
    },
    roleOutcomes: {
      soldier: {
        success: "{hero} knocks a shield aside and opens a gap.",
        fail: "The soldiers stand firm against {hero} and throw him back.",
        wound: "The Roman soldiers throw {hero} back.",
      },
      physician: {
        success: "{hero} heals broken bones of people who were caught in the stampede.",
        fail: "The crowd knocks {hero} over. The stampede continues.",
        wound: "The crowd knocks {hero} down",
      },
      assassin: {
        success: "{hero} slips past the shields and takes down a few soldiers.",
        fail: "A Roman soldier catches {hero} and pins them down.",
        wound: "A Roman soldier pins {hero} down",
      },
      titan: {
        success: "{hero} rips a shield out of the line and tosses it at the soldiers, making a path for the people to pass through.",
        fail: "The shield will not move. A spear hits {hero}, and they fall back.",
        wound: "A spear hits {hero}",
      },
      minstrel: {
        success: "{hero}'s music-formed dragon distracts the soldiers. Some of them flee and the crowd passes through.",
        fail: "The soldiers are not distracted. A spear grazes {hero}, and the Romans hold firm.",
        wound: "A spear grazes {hero}",
      },
    },
    failHpLoss: 1,
  },
  {
    id: "gate",
    dc: 13,
    finale: true,
    title: "The City Gate",
    narrative: [
      "The wall is ahead. Romans are on the wall. The bars of the gate are halfway down. This is the way out of Ctesiphon.",
      "If you miss this, you stay in the city.",
    ],
    stake: "Get through the city gate.",
    roleActions: {
      soldier: "Pick up a bow and arrow and shoot the Roman soldiers on the wall.",
      physician: "Cast shielding magic to protect the people from the arrows.",
      assassin: "Climb the gatehouse and jam the winch so the gate cannot fall.",
      titan: "Hold the gate open so the people can pass through.",
      minstrel: "Sing a song to inspire the people to rush faster through the gate.",
    },
    roleOutcomes: {
      soldier: {
        success: "{hero} shoots all the Roman soldiers on the wall. They have no choice but to let the people pass through.",
        fail: "{hero} misses a few shote and the Roman soldiers fire back. {hero} is hit by an arrow.",
        wound: "A Roman soldier hits {hero}",
      },
      physician: {
        success: "{hero} casts shielding magic to protect the people from the arrows.",
        fail: "There are too many arrows and {hero} cannot block them all. He gets hit by an arrow.",
        wound: "An arrow hits {hero}",
      },
      assassin: {
        success: "{hero} jams the winch from the gatehouse, so the gate cannot fall.",
        fail: "The winch slips and smashes {hero}'s hands. The gate continues to drop.",
        wound: "The winch smashes {hero}'s hands",
      },
      titan: {
        success: "{hero} holds the gate open so the people can pass through.",
        fail: "The gate is too heavy. {hero} cannot hold it open. The gate continues to drop.",
        wound: "{hero} is not able to hold the gate open and he falls to the ground.",
      },
      minstrel: {
        success: "{hero} sings a song to inspire the people to rush faster through the gate.",
        fail: "The song fails to inspire the people. An arrow hits {hero}, and they slow down.",
        wound: "An arrow hits {hero}",
      },
    },
    failHpLoss: 1,
  },
];
