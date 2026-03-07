// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Action Labels
// Maps model output indices to human-readable action labels.
// Covers all disciplines supported by Aura Arena.
// ═══════════════════════════════════════════════════════════════════════════════

export interface ActionLabel {
  id: number;
  name: string;
  discipline: string;
  description: string;
}

export const ACTION_LABELS: ActionLabel[] = [
  // ── Boxing & MMA ──
  {
    id: 0,
    name: "Jab",
    discipline: "boxing",
    description: "Lead hand straight punch",
  },
  {
    id: 1,
    name: "Cross",
    discipline: "boxing",
    description: "Rear hand straight punch",
  },
  {
    id: 2,
    name: "Hook",
    discipline: "boxing",
    description: "Circular punch targeting the side",
  },
  {
    id: 3,
    name: "Uppercut",
    discipline: "boxing",
    description: "Upward punch from below",
  },
  {
    id: 4,
    name: "Guard Stance",
    discipline: "boxing",
    description: "Defensive guard position",
  },
  {
    id: 5,
    name: "Slip",
    discipline: "boxing",
    description: "Head movement to dodge",
  },
  {
    id: 6,
    name: "Takedown",
    discipline: "mma",
    description: "Grappling takedown",
  },
  {
    id: 7,
    name: "Ground Guard",
    discipline: "mma",
    description: "Ground defense position",
  },

  // ── Indian Classical Dance ──
  {
    id: 8,
    name: "Araimandi",
    discipline: "kuchipudi",
    description: "Half-sitting position",
  },
  {
    id: 9,
    name: "Natyarambham",
    discipline: "kuchipudi",
    description: "Starting pose",
  },
  {
    id: 10,
    name: "Tribhangi",
    discipline: "kuchipudi",
    description: "Three-bend body position",
  },
  {
    id: 11,
    name: "Talapushpaputa",
    discipline: "kuchipudi",
    description: "Cupped hand gesture",
  },
  {
    id: 12,
    name: "Aramandi",
    discipline: "bharatanatyam",
    description: "Diamond-shaped leg position",
  },
  {
    id: 13,
    name: "Nritta Adavu",
    discipline: "bharatanatyam",
    description: "Pure dance step",
  },
  {
    id: 14,
    name: "Tattu Adavu",
    discipline: "bharatanatyam",
    description: "Stamping step",
  },
  {
    id: 15,
    name: "Chakkars",
    discipline: "kathak",
    description: "Spinning turns",
  },
  {
    id: 16,
    name: "Toda",
    discipline: "kathak",
    description: "Rhythmic footwork sequence",
  },

  // ── Western Dance ──
  {
    id: 17,
    name: "Top Rock",
    discipline: "breakdance",
    description: "Standing dance moves",
  },
  {
    id: 18,
    name: "Six Step",
    discipline: "breakdance",
    description: "Foundational floor move",
  },
  {
    id: 19,
    name: "Freeze",
    discipline: "breakdance",
    description: "Static hold position",
  },
  {
    id: 20,
    name: "Body Wave",
    discipline: "hiphop",
    description: "Rolling wave through the body",
  },
  {
    id: 21,
    name: "Pop & Lock",
    discipline: "hiphop",
    description: "Sharp isolations",
  },
  {
    id: 22,
    name: "Salsa Basic",
    discipline: "salsa",
    description: "Forward-back basic step",
  },
  {
    id: 23,
    name: "Plié",
    discipline: "ballet",
    description: "Bending of the knees",
  },
  {
    id: 24,
    name: "Arabesque",
    discipline: "ballet",
    description: "Standing on one leg, other extended",
  },

  // ── Yoga ──
  {
    id: 25,
    name: "Warrior I",
    discipline: "yoga",
    description: "Virabhadrasana I",
  },
  {
    id: 26,
    name: "Warrior II",
    discipline: "yoga",
    description: "Virabhadrasana II",
  },
  { id: 27, name: "Tree Pose", discipline: "yoga", description: "Vrksasana" },
  {
    id: 28,
    name: "Downward Dog",
    discipline: "yoga",
    description: "Adho Mukha Svanasana",
  },
  { id: 29, name: "Chair Pose", discipline: "yoga", description: "Utkatasana" },

  // ── Fitness ──
  {
    id: 30,
    name: "Squat",
    discipline: "fitness",
    description: "Full body weight squat",
  },
  {
    id: 31,
    name: "Lunge",
    discipline: "fitness",
    description: "Forward lunge",
  },
  {
    id: 32,
    name: "Push-Up",
    discipline: "fitness",
    description: "Floor push-up",
  },
  {
    id: 33,
    name: "Jumping Jack",
    discipline: "fitness",
    description: "Full body cardio move",
  },
  {
    id: 34,
    name: "Deadlift",
    discipline: "fitness",
    description: "Hip-hinge lift",
  },

  // ── Martial Arts ──
  {
    id: 35,
    name: "Front Kick",
    discipline: "martialarts",
    description: "Linear kick forward",
  },
  {
    id: 36,
    name: "Roundhouse Kick",
    discipline: "martialarts",
    description: "Circular kick",
  },
  {
    id: 37,
    name: "Kata Stance",
    discipline: "martialarts",
    description: "Formal fighting stance",
  },
  {
    id: 38,
    name: "Side Kick",
    discipline: "martialarts",
    description: "Lateral kick",
  },

  // ── Gymnastics ──
  {
    id: 39,
    name: "Handstand",
    discipline: "gymnastics",
    description: "Inverted balance on hands",
  },
  {
    id: 40,
    name: "Cartwheel",
    discipline: "gymnastics",
    description: "Lateral rotation",
  },
  {
    id: 41,
    name: "Bridge",
    discipline: "gymnastics",
    description: "Backbend arch position",
  },

  // ── Idle / Unknown ──
  {
    id: 42,
    name: "Standing",
    discipline: "idle",
    description: "Standing still",
  },
  {
    id: 43,
    name: "Walking",
    discipline: "idle",
    description: "Walking movement",
  },
];

export const NUM_ACTIONS = ACTION_LABELS.length;

/** Get label by model output index */
export function getActionLabel(index: number): ActionLabel {
  return ACTION_LABELS[index] ?? ACTION_LABELS[42]; // default: Standing
}

/** Get all actions for a specific discipline */
export function getActionsForDiscipline(discipline: string): ActionLabel[] {
  return ACTION_LABELS.filter(
    (a) => a.discipline === discipline || a.discipline === "idle",
  );
}

/** Get discipline display name */
export function formatActionName(label: ActionLabel): string {
  return `${label.discipline.charAt(0).toUpperCase() + label.discipline.slice(1)} — ${label.name}`;
}
