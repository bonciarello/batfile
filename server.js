const express = require('express');
const path = require('path');
const { generateNames, parsePattern } = require('./lib/generator');

const app = express();
const PORT = process.env.PORT || 4600;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// API: Parsing del pattern (anteprima)
// ---------------------------------------------------------------------------
app.post('/api/parse-pattern', (req, res) => {
  const { pattern } = req.body;
  if (!pattern || !pattern.trim()) {
    return res.status(400).json({ error: 'Il pattern è richiesto.' });
  }
  try {
    const slots = parsePattern(pattern.trim());
    res.json({ slots });
  } catch (err) {
    res.status(422).json({ error: `Pattern non valido: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// API: Generazione nomi
// ---------------------------------------------------------------------------
app.post('/api/generate', (req, res) => {
  const { pattern, names } = req.body;

  if (!pattern || !pattern.trim()) {
    return res.status(400).json({ error: 'Il pattern è richiesto.' });
  }
  if (!names || !Array.isArray(names) || names.length === 0) {
    return res.status(400).json({ error: 'Inserisci almeno un nome grezzo.' });
  }

  try {
    const { slots, results } = generateNames(pattern.trim(), names);
    res.json({ slots, results });
  } catch (err) {
    res.status(422).json({ error: `Errore di generazione: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// API: Esportazione CSV
// ---------------------------------------------------------------------------
app.post('/api/export-csv', (req, res) => {
  const { results } = req.body;

  if (!results || !Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: 'Nessun risultato da esportare.' });
  }

  const BOM = '\uFEFF';
  const header = 'Originale,Generato';
  const rows = results.map(
    r => `"${(r.original || '').replace(/"/g, '""')}","${(r.generated || '').replace(/"/g, '""')}"`
  );
  const csv = BOM + [header, ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="nomi_generati.csv"');
  res.send(csv);
});

// ---------------------------------------------------------------------------
// Fallback: serve index.html per qualsiasi rotta sconosciuta
// ---------------------------------------------------------------------------
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------------------------------------------------------------------
// Avvio
// ---------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Archivio — Generatore nomi file attivo su http://0.0.0.0:${PORT}`);
});
