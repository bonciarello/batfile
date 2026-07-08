/**
 * Generatore di nomi file — core logic.
 * Interpreta pattern descrittivi in italiano e genera nomi standardizzati.
 */

// ---------------------------------------------------------------------------
// Dizionari
// ---------------------------------------------------------------------------

const MESI = {
  gennaio: '01', febbraio: '02', marzo: '03', aprile: '04',
  maggio: '05', giugno: '06', luglio: '07', agosto: '08',
  settembre: '09', ottobre: '10', novembre: '11', dicembre: '12',
};

const CONNETTORI = new Set([
  'di', 'da', 'a', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'e', 'ed', 'o', 'il', 'la', 'lo', 'i', 'gli', 'le',
  'un', 'una', 'del', 'della', 'dei', 'degli', 'delle',
  'al', 'alla', 'allo', 'ai', 'agli', 'alle',
  'dal', 'dalla', 'dai', 'dagli', 'dalle',
  'nel', 'nella', 'nei', 'negli', 'nelle',
  'sul', 'sulla', 'sui', 'sugli', 'sulle',
  'col', 'coi', 'de', 'd', 'l',
]);

// Nomi propri italiani comuni — aiutano a rilevare i confini dei nomi di persona
const NOMI_PROPRI = new Set([
  'Mario', 'Giuseppe', 'Luigi', 'Giovanni', 'Antonio', 'Francesco', 'Angelo',
  'Anna', 'Maria', 'Rosa', 'Angela', 'Giuseppina', 'Teresa', 'Lucia',
  'Marco', 'Luca', 'Paolo', 'Andrea', 'Alessandro', 'Roberto', 'Stefano',
  'Laura', 'Francesca', 'Elena', 'Sara', 'Chiara', 'Valentina', 'Federica',
  'Carlo', 'Franco', 'Pietro', 'Giorgio', 'Alberto', 'Enrico', 'Sergio',
  'Claudia', 'Silvia', 'Monica', 'Paola', 'Daniela', 'Barbara', 'Simona',
  'Riccardo', 'Fabio', 'Davide', 'Matteo', 'Simone', 'Federico', 'Daniele',
  'Alessandra', 'Giulia', 'Martina', 'Elisa', 'Alice', 'Veronica', 'Cristina',
  'Leonardo', 'Lorenzo', 'Tommaso', 'Gabriele', 'Filippo', 'Samuele', 'Edoardo',
  'Sofia', 'Aurora', 'Giorgia', 'Greta', 'Beatrice', 'Noemi', 'Rebecca',
  'Michele', 'Nicola', 'Massimo', 'Vincenzo', 'Salvatore', 'Domenico', 'Raffaele',
  'Patrizia', 'Antonella', 'Gabriella', 'Rita', 'Giovanna', 'Carmela', 'Concetta',
  'Gianni', 'Gianluca', 'Giancarlo', 'Pier', 'Pierluigi', 'Pierpaolo',
  'Donato', 'Cosimo', 'Rocco', 'Vito', 'Pasquale', 'Gennaro', 'Ciro',
  'Dario', 'Fabrizio', 'Maurizio', 'Sandro', 'Renato', 'Franco', 'Umberto',
  'Letizia', 'Mara', 'Daria', 'Nadia', 'Gina', 'Pina', 'Tiziana',
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo',
  'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'Costa', 'Mancini',
  'Barbieri', 'Fontana', 'Rinaldi', 'Caruso', 'Moretti', 'Verdi', 'Neri',
  'Gatti', 'Coppola', 'Leone', 'Guerra', 'Serra', 'Farina', 'Ferri',
  'Rossetti', 'Galli', 'Palumbo', 'Vitale', 'Gentile', 'Sorrentino',
  'Basile', 'Fiore', 'Grassi', 'Lombardi', 'Mariani', 'Martino', 'Moro',
  'Pace', 'Parisi', 'Piazza', 'Pugliese', 'Rizzo', 'Sala', 'Sanna',
  'Silvestri', 'Testa', 'Valente', 'Vitali', 'Zanetti', 'Brambilla',
]);

// ---------------------------------------------------------------------------
// Parsing del pattern
// ---------------------------------------------------------------------------

/**
 * Converte un pattern testuale italiano in una lista di slot.
 *
 * Esempi:
 *   "cliente_progetto_AAAAMMGG" → [text, text, date]
 *   "tipo_documento_AAAAMMGG_progressivo_3_cifre" → [text, date, progressive(3)]
 */
function parsePattern(patternStr) {
  const parts = patternStr.split('_');
  const slots = [];
  let i = 0;

  while (i < parts.length) {
    const part = parts[i];

    // --- Progressivo: progressivo_N, contatore_N, num_N, n_N, prog_N ---
    if (/^(progressivo|contatore|num|n|prog)$/i.test(part)) {
      if (i + 1 < parts.length && /^\d+$/.test(parts[i + 1])) {
        const digits = parseInt(parts[i + 1], 10);
        i += 2;
        if (i < parts.length && /^cifr[ae]$/i.test(parts[i])) i++;
        slots.push({ type: 'progressive', digits });
        continue;
      }
      slots.push({ type: 'literal', value: part });
      i++;
      continue;
    }

    // --- Date compatte ---
    if (/^A{4}M{2}G{2}$/.test(part)) {
      slots.push({ type: 'date', format: 'YYYYMMDD' });
      i++; continue;
    }
    if (/^A{4}M{2}$/.test(part)) {
      slots.push({ type: 'date', format: 'YYYYMM' });
      i++; continue;
    }
    if (/^A{4}$/.test(part)) {
      slots.push({ type: 'date', format: 'YYYY' });
      i++; continue;
    }
    if (/^A{2}$/.test(part)) {
      slots.push({ type: 'date', format: 'YY' });
      i++; continue;
    }
    if (/^M{2}$/.test(part)) {
      slots.push({ type: 'date', format: 'MM' });
      i++; continue;
    }
    if (/^G{2}$/.test(part)) {
      slots.push({ type: 'date', format: 'DD' });
      i++; continue;
    }

    // --- Slot semantici ---
    if (/^cliente$/i.test(part)) {
      slots.push({ type: 'text', label: 'cliente' });
      i++; continue;
    }
    if (/^progetto$/i.test(part)) {
      slots.push({ type: 'text', label: 'progetto' });
      i++; continue;
    }
    if (/^tipo$/i.test(part)) {
      // "tipo_documento" spezzato dall'underscore → salta "documento"
      if (i + 1 < parts.length && /^documento$/i.test(parts[i + 1])) {
        i++;
      }
      slots.push({ type: 'text', label: 'tipo' });
      i++; continue;
    }
    if (/^tipodocumento$/i.test(part)) {
      slots.push({ type: 'text', label: 'tipo' });
      i++; continue;
    }
    if (/^oggetto$/i.test(part)) {
      slots.push({ type: 'text', label: 'oggetto' });
      i++; continue;
    }
    if (/^categoria$/i.test(part)) {
      slots.push({ type: 'text', label: 'categoria' });
      i++; continue;
    }
    if (/^anno$/i.test(part)) {
      slots.push({ type: 'date', format: 'YYYY' });
      i++; continue;
    }
    if (/^mese$/i.test(part)) {
      slots.push({ type: 'date', format: 'MM' });
      i++; continue;
    }
    if (/^giorno$/i.test(part)) {
      slots.push({ type: 'date', format: 'DD' });
      i++; continue;
    }
    if (/^autore$/i.test(part) || /^firmatario$/i.test(part)) {
      slots.push({ type: 'text', label: 'autore' });
      i++; continue;
    }
    if (/^destinatario$/i.test(part)) {
      slots.push({ type: 'text', label: 'destinatario' });
      i++; continue;
    }
    if (/^versione$/i.test(part) || /^ver$/i.test(part) || /^rev$/i.test(part)) {
      slots.push({ type: 'text', label: 'versione' });
      i++; continue;
    }

    // --- Letterale ---
    slots.push({ type: 'literal', value: part });
    i++;
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Estrazione data
// ---------------------------------------------------------------------------

function extractDate(text) {
  // ISO / americano: anno a 4 cifre all'inizio  (YYYY-MM-DD, YYYY/MM/DD)
  let m = text.match(/\b(\d{4})[-/.]?(\d{1,2})[-/.]?(\d{1,2})\b/);
  if (m) {
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      return { year: m[1], month: m[2].padStart(2, '0'), day: m[3].padStart(2, '0'), matched: m[0] };
    }
  }

  // Italiano: anno a 4 cifre alla fine  (DD/MM/YYYY, DD-MM-YYYY)
  m = text.match(/\b(\d{1,2})[-/.]?(\d{1,2})[-/.]?(\d{4})\b/);
  if (m) {
    const d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      return { year: m[3], month: m[2].padStart(2, '0'), day: m[1].padStart(2, '0'), matched: m[0] };
    }
  }

  // Mese scritto + anno: "marzo 2025" / "15 marzo 2025"
  for (const [nome, num] of Object.entries(MESI)) {
    const reFull = new RegExp(`(\\d{1,2})\\s+${nome}\\s+(\\d{4})`, 'i');
    m = text.match(reFull);
    if (m) {
      return { year: m[2], month: num, day: m[1].padStart(2, '0'), matched: m[0] };
    }
    const reMY = new RegExp(`${nome}\\s+(\\d{4})`, 'i');
    m = text.match(reMY);
    if (m) {
      return { year: m[1], month: num, day: null, matched: m[0] };
    }
  }

  // Anno isolato (19xx o 20xx), ma solo se non già parte di una data completa
  if (!text.match(/\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/)) {
    m = text.match(/\b((?:19|20)\d{2})\b/);
    if (m) {
      return { year: m[1], month: null, day: null, matched: m[1] };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Suddivisione in componenti
// ---------------------------------------------------------------------------

function splitComponents(text) {
  if (!text || !text.trim()) return [];

  const words = text.trim().split(/\s+/);
  if (words.length <= 1) return words.length ? [words[0]] : [];

  const groups = [];
  let current = [];
  let inNameGroup = false;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const isCap = /^[A-ZÀ-Ü]/.test(w);
    const lookup = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    const isName = NOMI_PROPRI.has(lookup);
    const isConn = CONNETTORI.has(w.toLowerCase());

    if (i === 0) {
      current.push(w);
      continue;
    }

    if (isName && !inNameGroup) {
      // Inizia un nuovo gruppo "nome di persona"
      groups.push(current.join(' '));
      current = [w];
      inNameGroup = true;
    } else if (inNameGroup && isCap) {
      // Continua il gruppo nome (cognome, secondo nome)
      current.push(w);
    } else {
      // Parola minuscola, connettore, o maiuscola fuori dal gruppo nome
      current.push(w);
      if (!isCap || isConn) {
        inNameGroup = false;
      }
    }
  }

  if (current.length > 0) groups.push(current.join(' '));
  return groups;
}

// ---------------------------------------------------------------------------
// Formattazione data
// ---------------------------------------------------------------------------

function formatDate(dateInfo, format) {
  if (!dateInfo) return '';

  switch (format) {
    case 'YYYYMMDD': return `${dateInfo.year}${dateInfo.month || '00'}${dateInfo.day || '00'}`;
    case 'YYYYMM':   return `${dateInfo.year}${dateInfo.month || '00'}`;
    case 'YYYY':     return dateInfo.year;
    case 'YY':       return dateInfo.year.slice(2);
    case 'MM':       return dateInfo.month || '00';
    case 'DD':       return dateInfo.day || '00';
    default:         return `${dateInfo.year}${dateInfo.month || '00'}${dateInfo.day || '00'}`;
  }
}

// ---------------------------------------------------------------------------
// Sanitizzazione
// ---------------------------------------------------------------------------

function sanitizeFilename(str) {
  return str
    .trim()
    .replace(/\s+/g, '_')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// ---------------------------------------------------------------------------
// Generazione principale
// ---------------------------------------------------------------------------

/**
 * Genera nomi standardizzati a partire da un pattern e una lista di nomi grezzi.
 */
function generateNames(patternStr, rawNames) {
  const slots = parsePattern(patternStr);
  const results = [];
  let counter = 1;

  const textIdx = [];
  const dateIdx = [];
  const progIdx = [];

  for (let i = 0; i < slots.length; i++) {
    const t = slots[i].type;
    if (t === 'text') textIdx.push(i);
    else if (t === 'date') dateIdx.push(i);
    else if (t === 'progressive') progIdx.push(i);
  }

  for (const raw of rawNames) {
    const trimmed = raw.trim();
    if (!trimmed) {
      results.push({ original: raw, generated: '' });
      continue;
    }

    // Estrai data
    const dateInfo = extractDate(trimmed);

    // Testo rimanente
    let remaining = trimmed;
    if (dateInfo && dateInfo.matched) {
      remaining = trimmed.replace(dateInfo.matched, '').replace(/\s+/g, ' ').trim();
    }

    // Componenti dal testo rimanente
    const components = splitComponents(remaining);

    // Riempi slot
    const filled = new Array(slots.length).fill('');

    // Date
    for (const idx of dateIdx) {
      filled[idx] = formatDate(dateInfo, slots[idx].format);
    }

    // Progressivo
    for (const idx of progIdx) {
      filled[idx] = String(counter).padStart(slots[idx].digits, '0');
      counter++;
    }

    // Testuali
    let compIdx = 0;
    for (const idx of textIdx) {
      if (compIdx < components.length) {
        filled[idx] = sanitizeFilename(components[compIdx]);
        compIdx++;
      } else {
        filled[idx] = slots[idx].label;
      }
    }

    // Letterali
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].type === 'literal') {
        filled[i] = slots[i].value;
      }
    }

    // Se ci sono componenti in eccesso, accodali all'ultimo slot testo
    if (compIdx < components.length && textIdx.length > 0) {
      const lastTextIdx = textIdx[textIdx.length - 1];
      const extra = components.slice(compIdx).map(sanitizeFilename).join('_');
      if (filled[lastTextIdx] && filled[lastTextIdx] !== slots[lastTextIdx].label) {
        filled[lastTextIdx] += '_' + extra;
      } else {
        filled[lastTextIdx] = extra;
      }
    }

    // Unisci
    const generated = filled.filter(s => s !== '').join('_');

    results.push({
      original: trimmed,
      generated: generated || sanitizeFilename(trimmed),
    });
  }

  return { slots, results };
}

module.exports = {
  parsePattern,
  extractDate,
  splitComponents,
  formatDate,
  sanitizeFilename,
  generateNames,
};
