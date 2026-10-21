// Effets sonores synthétisés (aucun fichier tiers, aucune licence) : WAV 16 bits, 44,1 kHz, mono,
// écrits dans public/sfx. Relancer avec « npm run sfx -w @lokky/social » après une retouche.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44_100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sfx');

// Bruit déterministe : le même rendu à chaque génération.
let seed = 1337;
const noise = () => {
  seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
  return (seed / 0xffffffff) * 2 - 1;
};

const buffer = (seconds) => new Float32Array(Math.round(seconds * RATE));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Filtre biquad (RBJ), coefficients recalculables à chaque échantillon pour les balayages.
function biquad(type) {
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  return (x, freq, q = 0.707) => {
    const w = (2 * Math.PI * clamp(freq, 20, RATE / 2.2)) / RATE;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (type === 'low') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
    else if (type === 'high') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
    else [b0, b1, b2] = [alpha, 0, -alpha]; // passe-bande
    const a0 = 1 + alpha,
      a1 = -2 * cos,
      a2 = 1 - alpha;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

// Enveloppe attaque / déclin exponentiel.
const env = (t, attack, decay) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));

function normalize(data, peak = 0.89) {
  let max = 0;
  for (const v of data) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < data.length; i++) data[i] = (data[i] / max) * peak;
  return data;
}

// Fondu aux extrémités : pas de clic au début ni à la fin.
function fadeEdges(data, seconds = 0.004) {
  const n = Math.round(seconds * RATE);
  for (let i = 0; i < n && i < data.length; i++) {
    data[i] *= i / n;
    data[data.length - 1 - i] *= i / n;
  }
  return data;
}

// Boucle sans couture : fondu enchaîné entre la fin et le début.
function loopable(data, seconds = 0.5) {
  const n = Math.round(seconds * RATE);
  const out = data.slice(0, data.length - n);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    out[i] = out[i] * k + data[data.length - n + i] * (1 - k);
  }
  return out;
}

function writeWav(name, data) {
  const bytes = Buffer.alloc(44 + data.length * 2);
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(36 + data.length * 2, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20); // PCM
  bytes.writeUInt16LE(1, 22); // mono
  bytes.writeUInt32LE(RATE, 24);
  bytes.writeUInt32LE(RATE * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) => bytes.writeInt16LE(Math.round(clamp(v, -1, 1) * 32_767), 44 + i * 2));
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${name}.wav`), bytes);
  console.log(`sfx/${name}.wav  ${(data.length / RATE).toFixed(2)} s`);
}

const sounds = {
  // Notification : deux notes claires, une touche de carré pour le côté « 8 bits ».
  bip() {
    const d = buffer(0.42);
    const notes = [
      [0, 1046.5],
      [0.11, 1568],
    ];
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      for (const [start, f] of notes) {
        if (t < start) continue;
        const u = t - start;
        const ph = 2 * Math.PI * f * u;
        const tone = Math.sin(ph) * 0.8 + Math.sign(Math.sin(ph)) * 0.12;
        d[i] += tone * env(u, 0.004, 0.09);
      }
    }
    return fadeEdges(normalize(d, 0.7));
  },

  // Appui sur un bouton : petite goutte qui descend, avec un clic.
  pop() {
    const d = buffer(0.16);
    let ph = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      ph += (2 * Math.PI * (950 * Math.exp(-t * 28) + 220)) / RATE;
      d[i] = Math.sin(ph) * env(t, 0.002, 0.045) + noise() * env(t, 0.0005, 0.004) * 0.4;
    }
    return fadeEdges(normalize(d, 0.75));
  },

  // Carte qui se retourne : souffle bref filtré, puis un « tac ».
  flip() {
    const d = buffer(0.2);
    const bp = biquad('band');
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      const swish = bp(noise(), 1800 + 2600 * (t / 0.2), 1.2) * env(t, 0.02, 0.035);
      const tick = t > 0.07 ? noise() * env(t - 0.07, 0.0005, 0.006) * 0.5 : 0;
      d[i] = swish * 1.4 + tick;
    }
    return fadeEdges(normalize(d, 0.6));
  },

  // Passage rapide (transition) : bruit dont le filtre monte puis redescend.
  whoosh() {
    const len = 0.55;
    const d = buffer(len);
    const bp = biquad('band');
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      const k = t / len;
      const freq = 250 + 3200 * Math.sin(Math.PI * Math.pow(k, 0.8));
      const amp = Math.pow(Math.sin(Math.PI * Math.pow(k, 0.65)), 2);
      d[i] = bp(noise(), freq, 0.9) * amp;
    }
    return fadeEdges(normalize(d, 0.8));
  },

  // Impact grave (titres, logo) : chute de fréquence + attaque bruitée + grondement.
  impact() {
    const len = 1.1;
    const d = buffer(len);
    const lp = biquad('low');
    let ph = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      ph += (2 * Math.PI * (38 + 110 * Math.exp(-t * 9))) / RATE;
      const boom = Math.sin(ph) * env(t, 0.003, 0.32);
      const crack = noise() * env(t, 0.0008, 0.018) * 0.9;
      const rumble = lp(noise(), 160) * env(t, 0.01, 0.4) * 2.2;
      d[i] = boom + crack + rumble;
    }
    return fadeEdges(normalize(d, 0.92));
  },

  // Tampon (texte qui s'imprime) : choc plus sec, médium.
  stamp() {
    const d = buffer(0.4);
    const bp = biquad('band');
    let ph = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      ph += (2 * Math.PI * (70 + 180 * Math.exp(-t * 25))) / RATE;
      d[i] =
        Math.sin(ph) * env(t, 0.002, 0.09) + bp(noise(), 1200, 0.8) * env(t, 0.001, 0.03) * 1.6;
    }
    return fadeEdges(normalize(d, 0.85));
  },

  // Montée avant le logo.
  riser() {
    const len = 1.0;
    const d = buffer(len);
    const hp = biquad('high');
    let ph = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      const k = t / len;
      ph += (2 * Math.PI * (180 + 900 * k * k)) / RATE;
      const amp = Math.pow(k, 2.2);
      d[i] = (Math.sin(ph) * 0.35 + hp(noise(), 800 + 6000 * k) * 0.9) * amp;
    }
    return fadeEdges(normalize(d, 0.7));
  },

  // Scintillement : arpège aigu (logo, confettis).
  sparkle() {
    const d = buffer(0.9);
    const notes = [2093, 2637, 3136, 4186];
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      notes.forEach((f, n) => {
        const start = n * 0.06;
        if (t < start) return;
        const u = t - start;
        d[i] += Math.sin(2 * Math.PI * f * u) * env(u, 0.002, 0.16) * (1 - n * 0.12);
      });
    }
    return fadeEdges(normalize(d, 0.45));
  },

  // Tic d'horloge (accéléré du temps).
  tick() {
    const d = buffer(0.06);
    const bp = biquad('band');
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      d[i] = bp(noise(), 3500, 4) * env(t, 0.0005, 0.008);
    }
    return fadeEdges(normalize(d, 0.5));
  },

  // Vent : bruit filtré, rafales lentes. Boucle de 8 s.
  wind() {
    const len = 8.5;
    const d = buffer(len);
    const bp = biquad('band');
    const lp = biquad('low');
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      const gust = 0.55 + 0.45 * Math.sin(t * 0.9) * Math.sin(t * 0.37 + 1);
      d[i] = bp(noise(), 380 + 520 * gust, 0.6) * gust + lp(noise(), 200) * 0.6;
    }
    return normalize(loopable(d), 0.6);
  },

  // Vagues : grondement grave qui enfle et retombe. Boucle de 8 s.
  waves() {
    const len = 8.5;
    const d = buffer(len);
    const lp = biquad('low');
    const bp = biquad('band');
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      const swell = Math.pow(0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 4.2), 3);
      const foam = bp(noise(), 2400, 0.5) * Math.pow(swell, 2) * 0.35;
      d[i] = lp(noise(), 300 + 900 * swell) * (0.3 + swell) + foam;
    }
    return normalize(loopable(d), 0.65);
  },

  // Nuit en ville : souffle grave et grillons. Boucle de 8 s.
  night() {
    const len = 8.5;
    const d = buffer(len);
    const lp = biquad('low');
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      const hum = lp(noise(), 140) * 1.2;
      // Grillons : salves rapides de 4,6 kHz, deux fois par seconde.
      const burst = (t * 2.1) % 1 < 0.22 ? Math.abs(Math.sin(t * 2 * Math.PI * 30)) : 0;
      const cricket = Math.sin(2 * Math.PI * 4600 * t) * burst * 0.05;
      d[i] = hum + cricket;
    }
    return normalize(loopable(d), 0.4);
  },
};

for (const [name, make] of Object.entries(sounds)) writeWav(name, make());
