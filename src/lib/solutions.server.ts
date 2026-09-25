import { PROBLEMS, type Problem } from "@/lib/store";

export type Wire = { part: string; pin: string; board: string; note?: string };
export type Solution = {
  need: string[];
  outcome: string[];
  wiring: Wire[];
  steps: string[];
  code: string;
};

const NEED_OUTCOME: Record<string, { need: string[]; outcome: string[] }> = {
  "smart-agriculture": {
    need: [
      "Farmers often water crops by guesswork, wasting water or leaving plants stressed.",
      "Manual checking of soil and weather across a field is slow and inconsistent.",
    ],
    outcome: [
      "Pump switches ON automatically only when soil is dry, saving water.",
      "Live moisture, temperature and humidity shown on the LCD with dry/normal/wet LEDs.",
    ],
  },
  "smart-water-management": {
    need: [
      "Overhead tanks overflow or run dry because nobody watches the level.",
      "Wasted water and electricity from pumps left running.",
    ],
    outcome: [
      "Tank level measured continuously with an ultrasonic sensor.",
      "Pump starts when level is low and stops when full; buzzer alerts on overflow risk.",
    ],
  },
  "fire-detection-system": {
    need: [
      "Fires spread within minutes; late detection costs lives and property.",
      "Many small buildings have no automatic alarm.",
    ],
    outcome: [
      "Flame and heat detected instantly, triggering buzzer and red LED.",
      "Relay can cut power or start a sprinkler, and the state is shown on the LCD.",
    ],
  },
  "air-quality-monitoring": {
    need: [
      "Polluted indoor air causes headaches and breathing problems but is invisible.",
      "People need a simple indication of when to ventilate.",
    ],
    outcome: [
      "Gas level, temperature and humidity measured and graded GOOD / MODERATE / POOR.",
      "Fan switches on automatically when air quality is poor.",
    ],
  },
  "smart-kitchen-safety": {
    need: [
      "LPG leaks and unattended flames are a major cause of home accidents.",
      "A leak may go unnoticed until it is dangerous.",
    ],
    outcome: [
      "Gas leak or flame detected and alarm raised immediately.",
      "Exhaust fan switched ON and gas valve (servo) closed automatically.",
    ],
  },
  "smart-waste-management": {
    need: [
      "Bins overflow before collection, causing litter, smell and disease.",
      "Collection trucks waste fuel visiting half-empty bins.",
    ],
    outcome: [
      "Bin fill level measured and shown as EMPTY / HALF / FULL.",
      "Lid opens automatically when someone approaches; full bins raise an alert.",
    ],
  },
  "smart-storage-monitoring": {
    need: [
      "Grains and medicines spoil when temperature or humidity goes out of range.",
      "Stock levels are checked manually and late.",
    ],
    outcome: [
      "Temperature, humidity and stock weight monitored continuously.",
      "Fan/alarm turn on automatically when conditions become unsafe.",
    ],
  },
  "smart-home-automation": {
    need: [
      "Lights and fans are left on in empty rooms, wasting energy.",
      "Elderly or busy people benefit from automatic control.",
    ],
    outcome: [
      "Lights switch on only when motion is detected and it is dark.",
      "Fan controlled by temperature; all states displayed on the LCD.",
    ],
  },
};

const PIN_MAP: Record<string, Wire[]> = {
  "Soil Moisture Sensor": [{ part: "Soil Moisture Sensor", pin: "AO", board: "GPIO34" }],
  "DHT22 Sensor": [{ part: "DHT22", pin: "DATA", board: "GPIO4", note: "10k pull-up to 3V3" }],
  "Gas Sensor": [{ part: "Gas Sensor (MQ-2)", pin: "AO", board: "GPIO35" }],
  "Flame Sensor": [{ part: "Flame Sensor", pin: "DO", board: "GPIO27" }],
  "LDR Module": [{ part: "LDR Module", pin: "AO", board: "GPIO32" }],
  "Ultrasonic Sensor": [
    { part: "Ultrasonic HC-SR04", pin: "TRIG", board: "GPIO12" },
    { part: "Ultrasonic HC-SR04", pin: "ECHO", board: "GPIO14", note: "use voltage divider" },
  ],
  "PIR Sensor": [{ part: "PIR Sensor", pin: "OUT", board: "GPIO26" }],
  "Load Cell": [
    { part: "Load Cell (HX711)", pin: "DT", board: "GPIO16" },
    { part: "Load Cell (HX711)", pin: "SCK", board: "GPIO17" },
  ],
  "Relay Module": [{ part: "Relay Module", pin: "IN", board: "GPIO5" }],
  "Servo Motor": [{ part: "Servo Motor", pin: "SIG", board: "GPIO13" }],
  Buzzer: [{ part: "Buzzer", pin: "+", board: "GPIO25" }],
  "DC Fan": [{ part: "DC Fan", pin: "+", board: "GPIO33", note: "through transistor / relay" }],
  "Water Pump": [{ part: "Water Pump", pin: "+", board: "Relay NO", note: "external 5V supply via relay COM" }],
  "LCD Display": [
    { part: "LCD 16x2 I2C", pin: "SDA", board: "GPIO21" },
    { part: "LCD 16x2 I2C", pin: "SCL", board: "GPIO22" },
  ],
};

const SENSOR_READ: Record<string, { pin: string; read: string }> = {
  "Soil Moisture Sensor": { pin: "34", read: "map(analogRead(34), 0, 4095, 0, 100)" },
  "Gas Sensor": { pin: "35", read: "map(analogRead(35), 0, 4095, 0, 100)" },
  "LDR Module": { pin: "32", read: "map(analogRead(32), 0, 4095, 0, 100)" },
  "Ultrasonic Sensor": { pin: "12", read: "readLevelPercent()" },
  "Flame Sensor": { pin: "27", read: "digitalRead(27) == LOW ? 100 : 0" },
  "PIR Sensor": { pin: "26", read: "digitalRead(26) == HIGH ? 100 : 0" },
  "Load Cell": { pin: "16", read: "readWeightPercent()" },
  "DHT22 Sensor": { pin: "4", read: "(int)dht.readTemperature()" },
};

function buildWiring(p: Problem): Wire[] {
  const out: Wire[] = [];
  let ledPins = ["GPIO18", "GPIO19", "GPIO23"];
  const ledNames = ["Red", "Green", "Blue"];
  for (const comp of p.components) {
    if (comp.name === "LED") {
      for (let i = 0; i < Math.min(comp.qty, 3); i++)
        out.push({ part: `${ledNames[i]} LED`, pin: "Anode (+)", board: ledPins[i], note: "220Ω resistor" });
      ledPins = ledPins.slice(comp.qty);
      continue;
    }
    out.push(...(PIN_MAP[comp.name] ?? [{ part: comp.name, pin: "SIG", board: "GPIO15" }]));
  }
  out.push({ part: "All modules", pin: "VCC", board: "3V3 / 5V (VIN)" });
  out.push({ part: "All modules", pin: "GND", board: "GND" });
  return out;
}

function buildCode(p: Problem): string {
  const names = p.components.map((c) => c.name);
  const has = (n: string) => names.includes(n);
  const sensor = names.find((n) => SENSOR_READ[n] && n !== "DHT22 Sensor") ?? (has("DHT22 Sensor") ? "DHT22 Sensor" : undefined);
  const read = sensor ? SENSOR_READ[sensor].read : "map(analogRead(34), 0, 4095, 0, 100)";
  const bands = p.logic.length ? p.logic : [{ range: "0 - 100", result: "NORMAL" }];
  const ledCount = p.components.find((c) => c.name === "LED")?.qty ?? 0;
  const actuator = has("Relay Module") ? "RELAY_PIN" : has("DC Fan") ? "FAN_PIN" : has("Buzzer") ? "BUZZER_PIN" : "RELAY_PIN";

  const L: string[] = [];
  L.push(`// ${p.title} — reference solution (ESP32)`);
  if (has("LCD Display")) L.push("#include <Wire.h>", "#include <LiquidCrystal_I2C.h>");
  if (has("DHT22 Sensor")) L.push("#include <DHT.h>");
  if (has("Servo Motor")) L.push("#include <ESP32Servo.h>");
  L.push("");
  L.push("#define RELAY_PIN 5", "#define BUZZER_PIN 25", "#define FAN_PIN 33", "#define SERVO_PIN 13");
  L.push("#define TRIG_PIN 12", "#define ECHO_PIN 14");
  const leds = ["LED_RED 18", "LED_GREEN 19", "LED_BLUE 23"].slice(0, ledCount);
  leds.forEach((l) => L.push(`#define ${l}`));
  L.push("");
  if (has("LCD Display")) L.push("LiquidCrystal_I2C lcd(0x27, 16, 2);");
  if (has("DHT22 Sensor")) L.push("DHT dht(4, DHT22);");
  if (has("Servo Motor")) L.push("Servo servo;");
  L.push("unsigned long actuatorOnSince = 0;", "");
  if (has("Ultrasonic Sensor")) {
    L.push(
      "int readLevelPercent() {",
      "  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);",
      "  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);",
      "  digitalWrite(TRIG_PIN, LOW);",
      "  long us = pulseIn(ECHO_PIN, HIGH, 30000);",
      "  float cm = us * 0.0343 / 2.0;          // distance to surface",
      "  const float DEPTH_CM = 100.0;           // container depth",
      "  return constrain((int)((DEPTH_CM - cm) * 100 / DEPTH_CM), 0, 100);",
      "}",
      "",
    );
  }
  if (has("Load Cell")) {
    L.push("int readWeightPercent() {", "  // Replace with HX711 library reading, scaled to 0-100 % of capacity", "  return map(analogRead(16), 0, 4095, 0, 100);", "}", "");
  }
  L.push("void setup() {", "  Serial.begin(115200);");
  L.push("  pinMode(RELAY_PIN, OUTPUT); pinMode(BUZZER_PIN, OUTPUT); pinMode(FAN_PIN, OUTPUT);");
  if (has("Ultrasonic Sensor")) L.push("  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);");
  if (has("Flame Sensor")) L.push("  pinMode(27, INPUT);");
  if (has("PIR Sensor")) L.push("  pinMode(26, INPUT);");
  leds.forEach((l) => L.push(`  pinMode(${l.split(" ")[0]}, OUTPUT);`));
  if (has("DHT22 Sensor")) L.push("  dht.begin();");
  if (has("Servo Motor")) L.push("  servo.attach(SERVO_PIN);");
  if (has("LCD Display")) L.push("  lcd.init(); lcd.backlight();", `  lcd.print("${p.title.slice(0, 16)}");`);
  L.push('  Serial.println("System init OK");', "}", "");
  L.push("void loop() {", `  int value = ${read};`);
  if (has("DHT22 Sensor") && sensor !== "DHT22 Sensor")
    L.push("  float t = dht.readTemperature();", "  float h = dht.readHumidity();");
  L.push('  String state;', "  bool on = false;");
  bands.forEach((b, i) => {
    const hi = Math.round(((i + 1) * 100) / bands.length);
    const head = i === 0 ? `  if (value <= ${hi}) {` : i === bands.length - 1 ? "  } else {" : `  } else if (value <= ${hi}) {`;
    L.push(head, `    state = "${b.result}";`, `    on = ${/\bON\b/i.test(b.result) ? "true" : "false"};`);
    if (leds.length) {
      const led = leds[Math.min(i, leds.length - 1)].split(" ")[0];
      L.push(`    ${leds.map((l) => `digitalWrite(${l.split(" ")[0]}, ${l.split(" ")[0] === led ? "HIGH" : "LOW"});`).join(" ")}`);
    }
  });
  L.push("  }", "");
  L.push("  // Safety: never keep the actuator on for more than 60 s continuously");
  L.push("  if (on) {", "    if (actuatorOnSince == 0) actuatorOnSince = millis();", "    if (millis() - actuatorOnSince > 60000) on = false;", "  } else {", "    actuatorOnSince = 0;", "  }");
  L.push(`  digitalWrite(${actuator}, on ? HIGH : LOW);`);
  if (has("Buzzer") && actuator !== "BUZZER_PIN") L.push(`  digitalWrite(BUZZER_PIN, state.indexOf("ALERT") >= 0 || state.indexOf("ALARM") >= 0 ? HIGH : LOW);`);
  if (has("Servo Motor")) L.push("  servo.write(on ? 90 : 0);");
  if (has("LCD Display")) L.push("  lcd.setCursor(0, 1);", '  lcd.print(state + "  " + String(value) + "%   ");');
  L.push('  Serial.print("value = "); Serial.print(value);', '  Serial.print("  state = "); Serial.println(state);');
  L.push("  delay(1000);   // sampling interval >= 1 s", "}");
  return L.join("\n");
}

export function getSolution(problemId: string): Solution | null {
  const p = PROBLEMS.find((x) => x.id === problemId);
  if (!p) return null;
  const no = NEED_OUTCOME[p.id] ?? { need: p.statement, outcome: p.requirements };
  return {
    need: no.need,
    outcome: no.outcome,
    wiring: buildWiring(p),
    steps: [
      "Place the ESP32 and every listed component on the canvas.",
      "Wire each part exactly as in the pin table below (VCC and GND to every module).",
      "Paste the code into the editor and press Run.",
      "Change the scenario values and check the state changes match the logic table.",
    ],
    code: buildCode(p),
  };
}
