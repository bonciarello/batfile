/**
 * Test suite — Generatore nomi file
 * Esegui con: node test/test.js
 */

const {
  parsePattern,
  extractDate,
  splitComponents,
  formatDate,
  sanitizeFilename,
  generateNames,
} = require('../lib/generator');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg || `expected "${expected}", got "${actual}"`);
  }
}

function assertDeepEqual(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(msg || `expected ${b}, got ${a}`);
  }
}

console.log('\n📋 Test: parsePattern\n');

test('pattern semplice con cliente e progetto', () => {
  const slots = parsePattern('cliente_progetto_AAAAMMGG');
  assertEqual(slots.length, 3);
  assertEqual(slots[0].type, 'text');
  assertEqual(slots[0].label, 'cliente');
  assertEqual(slots[1].type, 'text');
  assertEqual(slots[1].label, 'progetto');
  assertEqual(slots[2].type, 'date');
  assertEqual(slots[2].format, 'YYYYMMDD');
});

test('pattern con progressivo', () => {
  const slots = parsePattern('tipo_progressivo_3_cifre');
  assertEqual(slots.length, 2);
  assertEqual(slots[0].type, 'text');
  assertEqual(slots[1].type, 'progressive');
  assertEqual(slots[1].digits, 3);
});

test('pattern con progressivo senza cifre', () => {
  const slots = parsePattern('doc_progressivo_5');
  assertEqual(slots.length, 2);
  assertEqual(slots[1].type, 'progressive');
  assertEqual(slots[1].digits, 5);
});

test('pattern con contatore', () => {
  const slots = parsePattern('doc_contatore_4');
  assertEqual(slots.length, 2);
  assertEqual(slots[1].type, 'progressive');
  assertEqual(slots[1].digits, 4);
});

test('pattern con date compatte multiple', () => {
  const slots = parsePattern('AAAA_MM_GG_cliente');
  assertEqual(slots.length, 4);
  assertEqual(slots[0].type, 'date');
  assertEqual(slots[0].format, 'YYYY');
  assertEqual(slots[1].type, 'date');
  assertEqual(slots[1].format, 'MM');
  assertEqual(slots[2].type, 'date');
  assertEqual(slots[2].format, 'DD');
  assertEqual(slots[3].type, 'text');
});

test('pattern con anno e mese', () => {
  const slots = parsePattern('report_AAAAMM');
  assertEqual(slots.length, 2);
  assertEqual(slots[0].type, 'literal');
  assertEqual(slots[1].type, 'date');
  assertEqual(slots[1].format, 'YYYYMM');
});

test('pattern con anno a 2 cifre', () => {
  const slots = parsePattern('doc_AA');
  assertEqual(slots.length, 2);
  assertEqual(slots[1].type, 'date');
  assertEqual(slots[1].format, 'YY');
});

test('pattern con tipo_documento', () => {
  const slots = parsePattern('tipo_documento_cliente_AAAAMMGG');
  assertEqual(slots.length, 3);
  assertEqual(slots[0].type, 'text');
  assertEqual(slots[0].label, 'tipo');
});

test('pattern con oggetto e categoria', () => {
  const slots = parsePattern('categoria_oggetto_AAAA');
  assertEqual(slots.length, 3);
  assertEqual(slots[0].type, 'text');
  assertEqual(slots[0].label, 'categoria');
  assertEqual(slots[1].type, 'text');
  assertEqual(slots[1].label, 'oggetto');
});

test('pattern con autore e destinatario', () => {
  const slots = parsePattern('autore_destinatario_AAAAMMGG');
  assertEqual(slots.length, 3);
  assertEqual(slots[0].label, 'autore');
  assertEqual(slots[1].label, 'destinatario');
});

test('pattern con versione', () => {
  const slots = parsePattern('doc_ver_AAAA');
  assertEqual(slots.length, 3);
  assertEqual(slots[1].type, 'text');
  assertEqual(slots[1].label, 'versione');
});

test('parti letterali', () => {
  const slots = parsePattern('report_finale_AAAAMMGG');
  assertEqual(slots.length, 3);
  assertEqual(slots[0].type, 'literal');
  assertEqual(slots[0].value, 'report');
  assertEqual(slots[1].type, 'literal');
  assertEqual(slots[1].value, 'finale');
});

console.log('\n📋 Test: extractDate\n');

test('data ISO YYYY-MM-DD', () => {
  const d = extractDate('Fattura 2025-03-15 Mario');
  assert(d !== null);
  assertEqual(d.year, '2025');
  assertEqual(d.month, '03');
  assertEqual(d.day, '15');
});

test('data ISO YYYY/MM/DD', () => {
  const d = extractDate('Doc 2024/12/01');
  assertEqual(d.year, '2024');
  assertEqual(d.month, '12');
  assertEqual(d.day, '01');
});

test('data italiana DD/MM/YYYY', () => {
  const d = extractDate('Contratto 15/03/2025 Rossi');
  assertEqual(d.year, '2025');
  assertEqual(d.month, '03');
  assertEqual(d.day, '15');
});

test('data italiana DD-MM-YYYY', () => {
  const d = extractDate('Doc 01-12-2024 Verdi');
  assertEqual(d.year, '2024');
  assertEqual(d.month, '12');
  assertEqual(d.day, '01');
});

test('data scritta giorno mese anno', () => {
  const d = extractDate('Fattura 15 marzo 2025 Mario Rossi');
  assert(d !== null);
  assertEqual(d.year, '2025');
  assertEqual(d.month, '03');
  assertEqual(d.day, '15');
});

test('data scritta mese anno', () => {
  const d = extractDate('Report marzo 2025');
  assert(d !== null);
  assertEqual(d.year, '2025');
  assertEqual(d.month, '03');
  assertEqual(d.day, null);
});

test('data scritta gennaio', () => {
  const d = extractDate('1 gennaio 2024');
  assertEqual(d.year, '2024');
  assertEqual(d.month, '01');
  assertEqual(d.day, '01');
});

test('data scritta dicembre', () => {
  const d = extractDate('31 dicembre 2023');
  assertEqual(d.year, '2023');
  assertEqual(d.month, '12');
  assertEqual(d.day, '31');
});

test('nessuna data', () => {
  const d = extractDate('Fattura Mario Rossi');
  assertEqual(d, null);
});

test('anno isolato', () => {
  const d = extractDate('Report 2025 finale');
  assert(d !== null);
  assertEqual(d.year, '2025');
});

console.log('\n📋 Test: splitComponents\n');

test('due componenti: descrizione + nome', () => {
  const comps = splitComponents('Fattura Mario Rossi');
  assertEqual(comps.length, 2);
  assertEqual(comps[0], 'Fattura');
  assertEqual(comps[1], 'Mario Rossi');
});

test('tre componenti', () => {
  const comps = splitComponents('Contratto Locazione Giuseppe Verdi');
  assertEqual(comps.length, 2);
  assertEqual(comps[0], 'Contratto Locazione');
  assertEqual(comps[1], 'Giuseppe Verdi');
});

test('con preposizioni', () => {
  const comps = splitComponents('Contratto di locazione Giuseppe Verdi');
  // "di" e "locazione" lowercase → restano nel primo gruppo
  assertEqual(comps.length, 2);
});

test('singola parola', () => {
  const comps = splitComponents('Fattura');
  assertEqual(comps.length, 1);
  assertEqual(comps[0], 'Fattura');
});

test('vuoto', () => {
  const comps = splitComponents('');
  assertEqual(comps.length, 0);
});

console.log('\n📋 Test: formatDate\n');

test('YYYYMMDD', () => {
  const d = { year: '2025', month: '03', day: '15' };
  assertEqual(formatDate(d, 'YYYYMMDD'), '20250315');
});

test('YYYYMM', () => {
  const d = { year: '2025', month: '03' };
  assertEqual(formatDate(d, 'YYYYMM'), '202503');
});

test('YYYY', () => {
  assertEqual(formatDate({ year: '2025' }, 'YYYY'), '2025');
});

test('YY', () => {
  assertEqual(formatDate({ year: '2025' }, 'YY'), '25');
});

test('MM', () => {
  assertEqual(formatDate({ month: '03' }, 'MM'), '03');
});

test('DD', () => {
  assertEqual(formatDate({ day: '15' }, 'DD'), '15');
});

test('null', () => {
  assertEqual(formatDate(null, 'YYYYMMDD'), '');
});

console.log('\n📋 Test: sanitizeFilename\n');

test('spazi diventano underscore', () => {
  assertEqual(sanitizeFilename('Mario Rossi'), 'Mario_Rossi');
});

test('rimuove caratteri speciali', () => {
  assertEqual(sanitizeFilename('Fattura #123!'), 'Fattura_123');
});

test('accorpa underscore multipli', () => {
  assertEqual(sanitizeFilename('a  b   c'), 'a_b_c');
});

console.log('\n📋 Test: generateNames\n');

test('caso base: cliente_progetto_AAAAMMGG con Fattura Mario Rossi 2025-03-15', () => {
  const { results } = generateNames(
    'cliente_progetto_AAAAMMGG',
    ['Fattura Mario Rossi 2025-03-15']
  );
  assertEqual(results.length, 1);
  assertEqual(results[0].original, 'Fattura Mario Rossi 2025-03-15');
  // Il primo componente è "Fattura" → cliente, il secondo "Mario Rossi" → progetto
  assertEqual(results[0].generated, 'Fattura_Mario_Rossi_20250315');
});

test('caso con data in formato italiano', () => {
  const { results } = generateNames(
    'cliente_progetto_AAAAMMGG',
    ['Contratto Giuseppe Verdi 15/03/2025']
  );
  assertEqual(results[0].generated, 'Contratto_Giuseppe_Verdi_20250315');
});

test('caso con data scritta in italiano', () => {
  const { results } = generateNames(
    'cliente_progetto_AAAAMMGG',
    ['Preventivo Anna Bianchi 10 gennaio 2025']
  );
  assertEqual(results[0].generated, 'Preventivo_Anna_Bianchi_20250110');
});

test('progressivo incrementa', () => {
  const { results } = generateNames(
    'tipo_progressivo_3_cifre',
    ['Fattura Mario Rossi 2025-03-15', 'Contratto Verdi 2024-12-01', 'Preventivo Bianchi']
  );
  assertEqual(results.length, 3);
  assert(results[0].generated.includes('001'));
  assert(results[1].generated.includes('002'));
  assert(results[2].generated.includes('003'));
});

test('pattern con solo data', () => {
  const { results } = generateNames(
    'AAAAMMGG',
    ['Fattura Mario Rossi 2025-03-15']
  );
  assertEqual(results[0].generated, '20250315');
});

test('pattern con data a componenti separati', () => {
  const { results } = generateNames(
    'AAAA_MM_GG_cliente',
    ['Fattura Mario Rossi 2025-03-15']
  );
  // I componenti extra vengono accodati all'ultimo slot testo
  assert(results[0].generated.startsWith('2025_03_15_Fattura'));
});

test('pattern con testo letterale', () => {
  const { results } = generateNames(
    'doc_cliente_AAAAMMGG',
    ['Fattura Mario Rossi 2025-03-15']
  );
  assert(results[0].generated.startsWith('doc_Fattura'));
  assert(results[0].generated.endsWith('_20250315'));
});

test('nome senza data', () => {
  const { results } = generateNames(
    'cliente_progetto_AAAAMMGG',
    ['Fattura Mario Rossi']
  );
  // Nessuna data → lo slot data ritorna stringa vuota
  assert(results[0].generated.includes('Fattura'));
  assert(results[0].generated.includes('Mario_Rossi'));
});

test('nome vuoto nella lista', () => {
  const { results } = generateNames(
    'cliente_AAAAMMGG',
    ['', 'Fattura Mario Rossi 2025-03-15']
  );
  assertEqual(results.length, 2);
  assertEqual(results[0].generated, '');
  assert(results[1].generated.length > 0);
});

test('nome con singola parola', () => {
  const { results } = generateNames(
    'tipo_AAAAMMGG',
    ['Fattura 2025-03-15']
  );
  assertEqual(results[0].generated, 'Fattura_20250315');
});

test('nome con anno nel futuro', () => {
  const { results } = generateNames(
    'cliente_AAAA',
    ['Mario Rossi 2030']
  );
  assert(results[0].generated.includes('2030'));
});

console.log('\n' + '='.repeat(50));
console.log(`Risultati: ${passed} passati, ${failed} falliti su ${passed + failed} test`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
