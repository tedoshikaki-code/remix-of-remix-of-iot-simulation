import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ---------------------------------- types --------------------------------- */

export type Difficulty = "Easy" | "Medium" | "Hard";

export type Problem = {
  id: string;
  no: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  points: number;
  emoji: string;
  summary: string;
  statement: string[];
  requirements: string[];
  logic: { range: string; result: string }[];
  components: { name: string; spec: string; qty: number }[];
  constraints: string[];
  io: { input: string; output: string }[];
  publicTests: number;
  hiddenTests: number;
};

export type Team = {
  teamName: string;
  teamId: string;
  teamSize: string;
  college: string;
  department: string;
  email: string;
  phone: string;
  password: string;
  members: { name: string; role: string; email: string }[];
  about: string;
  motto: string;
  registeredAt: string;
};

export type Attempt = {
  id: string;
  problemId: string;
  startedAt: string;
  status: "In Progress" | "Completed";
  testsPassed: number;
  testsTotal: number;
  score: number;
};

export type Simulation = {
  id: string;
  name: string;
  problemId: string;
  status: "Draft" | "In Progress" | "Completed";
  updatedAt: string;
  runs: number;
  components: string[];
  logs: string[];
  readings: { level: number; temp: number; humidity: number };
  wires?: Wire[];
  code?: string;
};

export type PinRef = { comp: number; pin: string };
export type Wire = { id: string; from: PinRef; to: PinRef };

export type Submission = {
  id: string;
  problemId: string;
  submittedAt: string;
  notes: string;
  score: number;
  testsPassed: number;
  testsTotal: number;
  status: "Evaluated";
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  date: string;
  kind: "release" | "deadline" | "leaderboard";
};

export type ActivityItem = { id: string; text: string; link?: string; when: string };

export type AppState = {
  team: Team | null;
  attempts: Attempt[];
  simulations: Simulation[];
  submissions: Submission[];
  activity: ActivityItem[];
  contactMessages: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    at: string;
  }[];
};

/* -------------------------------- problems -------------------------------- */

const c = (name: string, spec: string, qty = 1) => ({ name, spec, qty });

export const PROBLEMS: Problem[] = [
  {
    id: "smart-agriculture",
    no: "01",
    title: "Smart Agriculture",
    category: "Environment",
    difficulty: "Easy",
    points: 100,
    emoji: "🌱",
    summary:
      "Monitor soil moisture, temperature and humidity to help optimize irrigation for better crop yield.",
    statement: [
      "Design an IoT based system that continuously monitors soil moisture, air temperature and humidity in a farm field.",
      "The system should automatically switch the irrigation pump when soil moisture drops below the configured threshold and log every reading for analysis.",
    ],
    requirements: [
      "Read soil moisture using an analog moisture sensor.",
      "Read temperature and humidity using DHT22.",
      "Display current readings on the LCD.",
      "Control the irrigation pump using a relay.",
      "Indicate dry / normal / wet states using LEDs.",
      "Log data for the dashboard (optional).",
    ],
    logic: [
      { range: "0 – 30 %", result: "DRY (Pump ON)" },
      { range: "30 – 70 %", result: "NORMAL (Pump OFF)" },
      { range: "70 – 100 %", result: "WET (Pump OFF + alert)" },
    ],
    components: [
      c("Soil Moisture Sensor", "Analog"),
      c("DHT22 Sensor", "Temp + Humidity"),
      c("Relay Module", "5V, 1 Channel"),
      c("LCD Display", "16x2 I2C"),
      c("LED", "Red / Green / Blue", 3),
    ],
    constraints: [
      "Use only the provided components.",
      "Sampling interval must not be lower than 1 second.",
      "Pump must never run for more than 60 continuous seconds.",
    ],
    io: [
      { input: "Moisture 18 %, Temp 31 °C", output: "DRY, Pump ON" },
      { input: "Moisture 55 %, Temp 28 °C", output: "NORMAL, Pump OFF" },
    ],
    publicTests: 5,
    hiddenTests: 10,
  },
  {
    id: "smart-water-management",
    no: "02",
    title: "Smart Water Management",
    category: "Water",
    difficulty: "Easy",
    points: 100,
    emoji: "🚰",
    summary:
      "Detect water level in the tank and automatically control the pump to prevent overflow and dry run.",
    statement: [
      "Design an IoT based system that monitors the water level in an overhead tank using an ultrasonic sensor and automatically controls the water pump.",
      "The system should start the pump when the water level is low and stop it when the tank is full. It should also prevent dry run and overflow conditions.",
    ],
    requirements: [
      "Measure water level using ultrasonic sensor.",
      "Display water level status on LCD.",
      "Automatically control pump using relay.",
      "Indicate status using LEDs (Low, Medium, Full).",
      "Send data to cloud/dashboard (optional).",
      "Prevent dry run and overflow.",
    ],
    logic: [
      { range: "0 – 30 %", result: "LOW (Pump ON)" },
      { range: "30 – 70 %", result: "MEDIUM (Pump ON)" },
      { range: "70 – 100 %", result: "FULL (Pump OFF)" },
    ],
    components: [
      c("Ultrasonic Sensor", "HC-SR04"),
      c("Water Pump", "DC Submersible"),
      c("Relay Module", "5V, 1 Channel"),
      c("LCD Display", "16x2 I2C"),
      c("LED", "Red / Yellow / Green", 3),
    ],
    constraints: [
      "Pump must switch off within 1 second of FULL state.",
      "Dry run protection is mandatory.",
      "No third-party simulators allowed.",
    ],
    io: [
      { input: "Distance 90 cm (level 12 %)", output: "LOW, Pump ON" },
      { input: "Distance 10 cm (level 88 %)", output: "FULL, Pump OFF" },
    ],
    publicTests: 5,
    hiddenTests: 10,
  },
  {
    id: "fire-detection-system",
    no: "03",
    title: "Fire Detection System",
    category: "Safety",
    difficulty: "Medium",
    points: 100,
    emoji: "🔥",
    summary: "Detect fire or high temperature and trigger alarm with immediate notification.",
    statement: [
      "Build a fire detection node that fuses flame, smoke and temperature signals to raise a reliable alarm with minimal false positives.",
      "On detection the buzzer must sound, the red LED must blink and an alert must be pushed to the dashboard.",
    ],
    requirements: [
      "Read flame sensor and MQ-2 smoke sensor.",
      "Read ambient temperature using DHT22.",
      "Trigger buzzer and red LED on detection.",
      "Show alert message on LCD.",
      "Debounce sensor spikes to avoid false alarms.",
    ],
    logic: [
      { range: "Temp < 45 °C, no flame", result: "SAFE" },
      { range: "Smoke high OR temp > 45 °C", result: "WARNING" },
      { range: "Flame detected", result: "FIRE (Alarm ON)" },
    ],
    components: [
      c("Flame Sensor", "IR"),
      c("Gas Sensor", "MQ-2"),
      c("DHT22 Sensor", "Temp + Humidity"),
      c("Buzzer", "5V Active"),
      c("LCD Display", "16x2 I2C"),
    ],
    constraints: [
      "Alarm latency must be under 2 seconds.",
      "At least two signals must agree before FIRE state.",
    ],
    io: [
      { input: "Flame = 1, Temp 62 °C", output: "FIRE, Buzzer ON" },
      { input: "Smoke 420 ppm, Temp 30 °C", output: "WARNING" },
    ],
    publicTests: 5,
    hiddenTests: 10,
  },
  {
    id: "air-quality-monitoring",
    no: "04",
    title: "Air Quality Monitoring",
    category: "Environment",
    difficulty: "Medium",
    points: 100,
    emoji: "🌫️",
    summary:
      "Monitor air quality using gas sensors and alert when pollutant levels exceed the threshold.",
    statement: [
      "Create an air quality node that samples gas and dust concentration, computes an AQI band and alerts when the air becomes unhealthy.",
      "Readings must be plotted over time so trends are visible on the dashboard.",
    ],
    requirements: [
      "Read MQ-135 gas sensor values.",
      "Compute a simple AQI band from the readings.",
      "Display AQI and band on LCD.",
      "Blink warning LED when unhealthy.",
      "Publish a rolling average every 10 seconds.",
    ],
    logic: [
      { range: "AQI 0 – 100", result: "GOOD" },
      { range: "AQI 101 – 200", result: "MODERATE" },
      { range: "AQI > 200", result: "UNHEALTHY (Alert)" },
    ],
    components: [
      c("Gas Sensor", "MQ-135"),
      c("DHT22 Sensor", "Temp + Humidity"),
      c("LCD Display", "16x2 I2C"),
      c("LED", "Green / Yellow / Red", 3),
    ],
    constraints: ["Use a rolling average of at least 5 samples.", "No hard-coded AQI values."],
    io: [
      { input: "MQ-135 = 180", output: "MODERATE" },
      { input: "MQ-135 = 310", output: "UNHEALTHY, Alert" },
    ],
    publicTests: 5,
    hiddenTests: 10,
  },
  {
    id: "smart-kitchen-safety",
    no: "05",
    title: "Smart Kitchen Safety",
    category: "Home Automation",
    difficulty: "Medium",
    points: 100,
    emoji: "🍳",
    summary: "Detect gas leakage and smoke, automatically turn on exhaust fan and trigger buzzer.",
    statement: [
      "Design a kitchen safety node that detects LPG leakage and smoke, ventilates the room and warns occupants.",
      "The exhaust fan must run until the gas concentration falls back to a safe level.",
    ],
    requirements: [
      "Read MQ-2 gas sensor.",
      "Turn exhaust fan ON via relay when gas is detected.",
      "Sound buzzer and show alert on LCD.",
      "Auto reset once air is safe.",
    ],
    logic: [
      { range: "Gas < 200 ppm", result: "SAFE" },
      { range: "200 – 400 ppm", result: "LEAK (Fan ON)" },
      { range: "> 400 ppm", result: "CRITICAL (Fan + Buzzer)" },
    ],
    components: [
      c("Gas Sensor", "MQ-2"),
      c("Relay Module", "5V, 2 Channel"),
      c("DC Fan", "5V Exhaust"),
      c("Buzzer", "5V Active"),
      c("LCD Display", "16x2 I2C"),
    ],
    constraints: ["Fan must run at least 20 seconds after a leak.", "Buzzer only above 400 ppm."],
    io: [
      { input: "Gas 260 ppm", output: "LEAK, Fan ON" },
      { input: "Gas 520 ppm", output: "CRITICAL, Fan + Buzzer" },
    ],
    publicTests: 5,
    hiddenTests: 10,
  },
  {
    id: "smart-waste-management",
    no: "06",
    title: "Smart Waste Management",
    category: "Urban IoT",
    difficulty: "Hard",
    points: 100,
    emoji: "🗑️",
    summary: "Monitor bin fill level and send alert when the bin is full for efficient collection.",
    statement: [
      "Build a smart bin that measures fill level, detects foul gas and reports collection requests to a municipal dashboard.",
      "Bins should be prioritised by fill percentage and time since last collection.",
    ],
    requirements: [
      "Measure fill level using ultrasonic sensor.",
      "Detect odour using gas sensor.",
      "Show fill percentage on LCD.",
      "Raise a collection request above 80 % fill.",
      "Maintain a local log of collection events.",
    ],
    logic: [
      { range: "0 – 50 %", result: "OK" },
      { range: "50 – 80 %", result: "FILLING" },
      { range: "> 80 %", result: "FULL (Request pickup)" },
    ],
    components: [
      c("Ultrasonic Sensor", "HC-SR04"),
      c("Gas Sensor", "MQ-135"),
      c("Servo Motor", "SG90 lid"),
      c("LCD Display", "16x2 I2C"),
      c("LED", "Status", 2),
    ],
    constraints: [
      "Lid servo must not move while measuring.",
      "Pickup request only once per fill cycle.",
    ],
    io: [
      { input: "Fill 62 %", output: "FILLING" },
      { input: "Fill 91 %", output: "FULL, Request sent" },
    ],
    publicTests: 5,
    hiddenTests: 10,
  },
  {
    id: "smart-storage-monitoring",
    no: "07",
    title: "Smart Storage Monitoring",
    category: "Industrial IoT",
    difficulty: "Hard",
    points: 100,
    emoji: "📦",
    summary: "Monitor temperature, humidity and object weight in storage for safety and quality.",
    statement: [
      "Design a warehouse monitoring node that tracks temperature, humidity and load weight of stored goods.",
      "The system must raise a spoilage warning when conditions drift outside the safe band for more than 30 seconds.",
    ],
    requirements: [
      "Read DHT22 for temperature and humidity.",
      "Read load cell (HX711) for weight.",
      "Show all three values on LCD.",
      "Warn on sustained out-of-band conditions.",
      "Log min / max values per session.",
    ],
    logic: [
      { range: "Temp 2 – 8 °C, RH < 60 %", result: "SAFE" },
      { range: "Out of band < 30 s", result: "WATCH" },
      { range: "Out of band > 30 s", result: "SPOILAGE RISK" },
    ],
    components: [
      c("DHT22 Sensor", "Temp + Humidity"),
      c("Load Cell", "HX711 + 5kg"),
      c("LCD Display", "16x2 I2C"),
      c("Buzzer", "5V Active"),
    ],
    constraints: ["Weight must be averaged over 10 samples.", "No blocking delays over 100 ms."],
    io: [
      { input: "Temp 5 °C, RH 48 %, 3.2 kg", output: "SAFE" },
      { input: "Temp 14 °C for 40 s", output: "SPOILAGE RISK" },
    ],
    publicTests: 5,
    hiddenTests: 10,
  },
  {
    id: "smart-home-automation",
    no: "08",
    title: "Smart Home Automation",
    category: "Home Automation",
    difficulty: "Hard",
    points: 100,
    emoji: "🏠",
    summary:
      "Automate lights, fans and appliances using sensors for energy efficiency and comfort.",
    statement: [
      "Build a home automation controller that uses motion, light and temperature sensors to control lights and fans automatically.",
      "Manual override from the dashboard must always take priority over automation.",
    ],
    requirements: [
      "Read PIR motion sensor and LDR.",
      "Read temperature using DHT22.",
      "Control light and fan through relays.",
      "Support manual override mode.",
      "Show active mode on LCD.",
    ],
    logic: [
      { range: "Motion + dark", result: "Light ON" },
      { range: "Temp > 30 °C", result: "Fan ON" },
      { range: "No motion 60 s", result: "All OFF" },
    ],
    components: [
      c("PIR Sensor", "HC-SR501"),
      c("LDR Module", "Analog"),
      c("DHT22 Sensor", "Temp + Humidity"),
      c("Relay Module", "5V, 4 Channel"),
      c("LCD Display", "16x2 I2C"),
    ],
    constraints: ["Override must persist until cleared.", "Relay switching debounced to 500 ms."],
    io: [
      { input: "Motion = 1, LDR dark", output: "Light ON" },
      { input: "Temp 33 °C", output: "Fan ON" },
    ],
    publicTests: 5,
    hiddenTests: 10,
  },
];

export const problemById = (id: string) => PROBLEMS.find((p) => p.id === id);

export const COMPONENT_LIBRARY = [
  "ESP32 Dev Board",
  "Arduino UNO",
  "LCD 16x2 I2C",
  "Ultrasonic Sensor",
  "DHT22 Sensor",
  "Relay Module",
  "Water Pump (DC)",
  "DC Exhaust Fan",
  "Buzzer",
  "LED",
  "Resistor",
  "Soil Moisture Sensor",
  "Gas Sensor (MQ-2)",
  "Flame Sensor (IR)",
  "LDR Light Sensor",
  "Load Cell (HX711)",
  "PIR Sensor",
  "Servo Motor",
];

/* ------------------------------ pins / wiring ----------------------------- */

export const BOARD_PINS = [
  "3V3",
  "5V",
  "GND",
  "D2",
  "D4",
  "D5",
  "D13",
  "D18",
  "D19",
  "D21",
  "D22",
  "D23",
  "A0/34",
  "A1/35",
];

export const COMPONENT_PINS: Record<string, string[]> = {
  "ESP32 Dev Board": ["3V3", "5V", "GND", "D4", "D5", "D18", "D21", "D22", "A0/34"],
  "Arduino UNO": ["5V", "GND", "D2", "D7", "D9", "A0", "A1", "SDA", "SCL"],
  "LCD 16x2 I2C": ["VCC", "GND", "SDA", "SCL"],
  "Ultrasonic Sensor": ["VCC", "GND", "TRIG", "ECHO"],
  "DHT22 Sensor": ["VCC", "GND", "DATA"],
  "Relay Module": ["VCC", "GND", "IN", "COM", "NO"],
  "Water Pump (DC)": ["V+", "V-"],
  Buzzer: ["VCC", "GND", "SIG"],
  LED: ["Anode (+)", "Cathode (-)"],
  Resistor: ["Leg A", "Leg B"],
  "Soil Moisture Sensor": ["VCC", "GND", "AOUT", "DOUT"],
  "Gas Sensor (MQ-2)": ["VCC", "GND", "AOUT", "DOUT"],
  "PIR Sensor": ["VCC", "GND", "OUT"],
  "Servo Motor": ["VCC (Red)", "GND (Brown)", "PWM (Orange)"],
};

export const pinsFor = (name: string) => COMPONENT_PINS[name] ?? ["VCC", "GND", "SIG"];


export function defaultSketch(problem: Problem) {
  const bands = problem.logic.length ? problem.logic : [{ range: "0 - 100", result: "NORMAL" }];
  const branches = bands
    .map((band, i) => {
      // Same equal-slice normalisation the test suite uses, so the generated
      // sketch and the runner agree regardless of logic-table units.
      const span: [number, number] = [
        (i * 100) / bands.length,
        ((i + 1) * 100) / bands.length,
      ];
      const drive = /\bON\b/i.test(band.result) ? "HIGH" : "LOW";
      const head =
        i === bands.length - 1 ? "  } else {" : `  } else if (value <= ${Math.round(span[1])}) {`;
      const open = i === 0 ? `  if (value <= ${Math.round(span[1])}) {` : head;
      return `${open}\n    digitalWrite(ACTUATOR_PIN, ${drive});\n    Serial.println("state = ${band.result}");`;
    })
    .join("\n");
  return `// ${problem.title} — ESP32 sketch
#define SENSOR_PIN 34
#define ACTUATOR_PIN 5

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN, INPUT);
  pinMode(ACTUATOR_PIN, OUTPUT);
  Serial.println("System init OK");
}

void loop() {
  int raw = analogRead(SENSOR_PIN);
  int value = map(raw, 0, 1023, 0, 100);
  Serial.print("reading = ");
  Serial.println(value);

${branches}
  }
  delay(1000);
}
`;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1",
    title: "Problem Set 05 Released!",
    body: "New problem set is now available. Check it out!",
    date: "10 May 2025",
    kind: "release",
  },
  {
    id: "a2",
    title: "Submission Deadline Extended",
    body: "The final submission deadline has been extended by 12 hours.",
    date: "09 May 2025",
    kind: "deadline",
  },
  {
    id: "a3",
    title: "Leaderboard Update",
    body: "Check your rank and compete with other teams!",
    date: "08 May 2025",
    kind: "leaderboard",
  },
  {
    id: "a4",
    title: "Simulation Lab Maintenance",
    body: "The simulation lab will be briefly unavailable on 07 May, 2:00 AM - 3:00 AM.",
    date: "06 May 2025",
    kind: "release",
  },
];

export const BASE_LEADERBOARD = [
  { team: "Team Innovators", score: 92.4, solved: 7 },
  { team: "Code Warriors", score: 89.1, solved: 7 },
  { team: "Tech Titans", score: 85.6, solved: 6 },
  { team: "Circuit Breakers", score: 82.3, solved: 6 },
  { team: "Nova Makers", score: 74.2, solved: 5 },
  { team: "Byte Force", score: 71.8, solved: 5 },
  { team: "Sensor Squad", score: 68.4, solved: 4 },
  { team: "Logic Loop", score: 63.9, solved: 4 },
];

export const EVENT_END = "2026-12-31T23:59:59";

/* -------------------------------- database -------------------------------- */

const EMPTY: AppState = {
  team: null,
  attempts: [],
  simulations: [],
  submissions: [],
  activity: [],
  contactMessages: [],
};

export const uid = () => Math.random().toString(36).slice(2, 10);

type Progress = Pick<AppState, "attempts" | "simulations" | "submissions" | "activity">;

let cache: AppState = EMPTY;
let loading: Promise<AppState> | null = null;
const listeners = new Set<(s: AppState) => void>();

const emit = () => {
  for (const l of listeners) l(cache);
};

function rowToTeam(row: Record<string, unknown>): Team {
  return {
    teamName: String(row["team_name"] ?? ""),
    teamId: String(row["team_id"] ?? ""),
    teamSize: String(row["team_size"] ?? "1"),
    college: String(row["college"] ?? ""),
    department: String(row["department"] ?? ""),
    email: String(row["email"] ?? ""),
    phone: String(row["phone"] ?? ""),
    password: "",
    members: (row["members"] as Team["members"]) ?? [],
    about: String(row["about"] ?? ""),
    motto: String(row["motto"] ?? ""),
    registeredAt: String(row["registered_at"] ?? new Date().toISOString()),
  };
}

function teamToRow(userId: string, team: Team) {
  return {
    user_id: userId,
    team_name: team.teamName,
    team_id: team.teamId,
    team_size: team.teamSize,
    college: team.college,
    department: team.department,
    email: team.email,
    phone: team.phone,
    members: team.members,
    about: team.about,
    motto: team.motto,
    registered_at: team.registeredAt,
    updated_at: new Date().toISOString(),
  };
}

/** Loads the signed-in participant's profile and progress from the database. */
async function loadFromDb(): Promise<AppState> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return EMPTY;

  const [profileRes, stateRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("participant_state").select("data").eq("user_id", user.id).maybeSingle(),
  ]);

  let profile = profileRes.data as Record<string, unknown> | null;

  // First sign-in through a social provider: create a starter profile.
  if (!profile) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const name = String(meta["full_name"] ?? meta["name"] ?? user.email?.split("@")[0] ?? "Participant");
    const seed: Team = {
      teamName: name,
      teamId: makeTeamId(name),
      teamSize: "1",
      college: "",
      department: "",
      email: user.email ?? "",
      phone: "",
      password: "",
      members: [{ name, role: "Participant", email: user.email ?? "" }],
      about: "",
      motto: "",
      registeredAt: new Date().toISOString(),
    };
    const inserted = await supabase
      .from("profiles")
      .upsert(teamToRow(user.id, seed))
      .select("*")
      .maybeSingle();
    profile = (inserted.data as Record<string, unknown> | null) ?? teamToRow(user.id, seed);
  }

  const progress = ((stateRes.data?.data ?? {}) as Partial<Progress>) || {};

  return {
    team: rowToTeam(profile),
    attempts: progress.attempts ?? [],
    simulations: progress.simulations ?? [],
    submissions: progress.submissions ?? [],
    activity: progress.activity ?? [],
    contactMessages: [],
  };
}

async function persist(state: AppState) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return;

  const tasks = [
    supabase.from("participant_state").upsert({
      user_id: user.id,
      data: {
        attempts: state.attempts,
        simulations: state.simulations,
        submissions: state.submissions,
        activity: state.activity,
      } as never,
      updated_at: new Date().toISOString(),
    }),
  ];
  if (state.team) tasks.push(supabase.from("profiles").upsert(teamToRow(user.id, state.team)));
  await Promise.all(tasks);
}

/** Reloads everything from the database and notifies all mounted components. */
export async function refreshStore() {
  loading = loadFromDb();
  cache = await loading;
  emit();
  return cache;
}

/** Saves a contact message to the database. */
export async function sendContactMessage(msg: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("contact_messages").insert({
    user_id: auth.user?.id ?? null,
    name: msg.name,
    email: msg.email,
    subject: msg.subject,
    message: msg.message,
  });
  if (error) throw error;
}

export function useStore() {
  const [state, setState] = useState<AppState>(cache);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const sync = (s: AppState) => {
      if (active) setState(s);
    };
    listeners.add(sync);

    void (loading ?? refreshStore()).then((s) => {
      if (!active) return;
      setState(s);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void refreshStore();
      }
    });

    return () => {
      active = false;
      listeners.delete(sync);
      sub.subscription.unsubscribe();
    };
  }, []);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    const next = fn(cache);
    cache = next;
    emit();
    void persist(next);
  }, []);

  const logActivity = useCallback(
    (text: string) =>
      update((s) => ({
        ...s,
        activity: [{ id: uid(), text, when: new Date().toISOString() }, ...s.activity].slice(0, 20),
      })),
    [update],
  );

  return { state, ready, update, logActivity };
}

/** Clears the in-memory copy after sign-out. */
export async function signOutParticipant() {
  await supabase.auth.signOut();
  cache = EMPTY;
  loading = Promise.resolve(EMPTY);
  emit();
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

export function makeTeamId(name: string) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return `${initials || "TM"}2025-${Math.floor(100 + Math.random() * 899)}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function computeStats(state: AppState) {
  const attempted = new Set(state.attempts.map((a) => a.problemId)).size;
  const submitted = state.submissions.length;
  const simsRun = state.simulations.reduce((n, s) => n + s.runs, 0);
  const testsPassed = state.submissions.reduce((n, s) => n + s.testsPassed, 0);
  const testsTotal = state.submissions.reduce((n, s) => n + s.testsTotal, 0);
  const score = submitted ? state.submissions.reduce((n, s) => n + s.score, 0) / submitted : 0;
  return {
    attempted,
    submitted,
    simsRun,
    testsPassed,
    testsTotal,
    score: Math.round(score * 10) / 10,
    solved: state.submissions.filter((s) => s.score >= 60).length,
    completion: Math.round((attempted / PROBLEMS.length) * 100),
  };
}
