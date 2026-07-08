/**
 * Archivio — Frontend logic
 * Pattern input, generazione nomi, copia, esportazione CSV
 */

(function () {
  'use strict';

  // DOM references
  const patternInput = document.getElementById('pattern-input');
  const patternHint = document.getElementById('pattern-hint');
  const namesInput = document.getElementById('names-input');
  const namesHint = document.getElementById('names-hint');
  const generateBtn = document.getElementById('generate-btn');
  const clearBtn = document.getElementById('clear-btn');
  const resultsSection = document.getElementById('results-section');
  const resultsBody = document.getElementById('results-body');
  const resultsCount = document.getElementById('results-count');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const copyAllBtn = document.getElementById('copy-all-btn');
  const errorBanner = document.getElementById('error-banner');
  const errorText = document.getElementById('error-text');
  const toast = document.getElementById('toast');

  let lastResults = [];

  // -----------------------------------------------------------------------
  // Chip click → riempi pattern
  // -----------------------------------------------------------------------
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      patternInput.value = chip.dataset.pattern;
      patternInput.focus();
      updatePatternHint();
    });
  });

  // -----------------------------------------------------------------------
  // Pattern hint live
  // -----------------------------------------------------------------------
  patternInput.addEventListener('input', updatePatternHint);

  function updatePatternHint() {
    const val = patternInput.value.trim();
    if (!val) {
      patternHint.textContent = '';
      return;
    }
    // Conta i segmenti
    const segments = val.split('_').filter(Boolean);
    patternHint.textContent = `${segments.length} segmenti nel pattern`;
  }

  // -----------------------------------------------------------------------
  // Names hint live
  // -----------------------------------------------------------------------
  namesInput.addEventListener('input', () => {
    const lines = namesInput.value.split('\n').filter(l => l.trim());
    namesHint.textContent = lines.length
      ? `${lines.length} nomi da elaborare`
      : '';
  });

  // -----------------------------------------------------------------------
  // Genera
  // -----------------------------------------------------------------------
  generateBtn.addEventListener('click', generate);

  async function generate() {
    hideError();
    const pattern = patternInput.value.trim();
    const rawText = namesInput.value.trim();

    if (!pattern) {
      showError('Inserisci un pattern (es. cliente_progetto_AAAAMMGG).');
      patternInput.focus();
      return;
    }
    if (!rawText) {
      showError('Inserisci almeno un nome grezzo nella textarea.');
      namesInput.focus();
      return;
    }

    const names = rawText.split('\n').filter(l => l.trim());

    generateBtn.disabled = true;
    generateBtn.textContent = 'Generazione in corso…';

    try {
      const resp = await fetch('api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, names }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Errore sconosciuto');
      }

      lastResults = data.results;
      renderResults(data.results);
    } catch (err) {
      showError(err.message);
      resultsSection.hidden = true;
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg> Genera nomi`;
    }
  }

  // -----------------------------------------------------------------------
  // Render risultati
  // -----------------------------------------------------------------------
  function renderResults(results) {
    resultsBody.innerHTML = '';

    if (results.length === 0) {
      resultsBody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--color-text-muted);padding:var(--space-6)">Nessun risultato</td></tr>';
      resultsSection.hidden = false;
      resultsCount.textContent = '0 nomi';
      return;
    }

    results.forEach((row, idx) => {
      const tr = document.createElement('tr');

      // Colonna Originale
      const tdOrig = document.createElement('td');
      tdOrig.className = 'orig-col';
      tdOrig.textContent = row.original;
      tdOrig.title = row.original;
      tr.appendChild(tdOrig);

      // Colonna Generato
      const tdGen = document.createElement('td');
      tdGen.className = 'gen-col';
      tdGen.textContent = row.generated;
      tr.appendChild(tdGen);

      // Colonna Azione (copia)
      const tdAct = document.createElement('td');
      tdAct.className = 'col-action';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn-icon';
      copyBtn.setAttribute('aria-label', 'Copia ' + row.generated);
      copyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
      copyBtn.addEventListener('click', () => copySingle(row.generated, copyBtn));
      tdAct.appendChild(copyBtn);
      tr.appendChild(tdAct);

      resultsBody.appendChild(tr);
    });

    resultsCount.textContent = `${results.length} nomi`;
    resultsSection.hidden = false;

    // Scroll ai risultati
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // -----------------------------------------------------------------------
  // Copia singolo nome
  // -----------------------------------------------------------------------
  async function copySingle(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add('copied', 'stamp-anim');
      showToast('Copiato!');
      setTimeout(() => {
        btn.classList.remove('copied', 'stamp-anim');
      }, 1500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.classList.add('copied', 'stamp-anim');
      showToast('Copiato!');
      setTimeout(() => {
        btn.classList.remove('copied', 'stamp-anim');
      }, 1500);
    }
  }

  // -----------------------------------------------------------------------
  // Copia tutti i nomi generati
  // -----------------------------------------------------------------------
  copyAllBtn.addEventListener('click', async () => {
    if (lastResults.length === 0) return;
    const allNames = lastResults.map(r => r.generated).join('\n');
    try {
      await navigator.clipboard.writeText(allNames);
      showToast(`Copiati ${lastResults.length} nomi!`);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = allNames;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`Copiati ${lastResults.length} nomi!`);
    }
  });

  // -----------------------------------------------------------------------
  // Esporta CSV
  // -----------------------------------------------------------------------
  exportCsvBtn.addEventListener('click', async () => {
    if (lastResults.length === 0) return;

    try {
      const resp = await fetch('api/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: lastResults }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Errore esportazione');
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nomi_generati.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('CSV scaricato!');
    } catch (err) {
      showError(err.message);
    }
  });

  // -----------------------------------------------------------------------
  // Svuota
  // -----------------------------------------------------------------------
  clearBtn.addEventListener('click', () => {
    patternInput.value = '';
    namesInput.value = '';
    patternHint.textContent = '';
    namesHint.textContent = '';
    resultsSection.hidden = true;
    lastResults = [];
    hideError();
    patternInput.focus();
  });

  // -----------------------------------------------------------------------
  // Error banner
  // -----------------------------------------------------------------------
  function showError(msg) {
    errorText.textContent = msg;
    errorBanner.hidden = false;
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideError() {
    errorBanner.hidden = true;
    errorText.textContent = '';
  }

  document.querySelector('.error-close').addEventListener('click', hideError);

  // -----------------------------------------------------------------------
  // Toast
  // -----------------------------------------------------------------------
  let toastTimer;

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2000);
  }

  // -----------------------------------------------------------------------
  // Keyboard shortcut: Ctrl+Enter per generare
  // -----------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generate();
    }
  });

  // -----------------------------------------------------------------------
  // Carica esempio iniziale se vuoto
  // -----------------------------------------------------------------------
  if (!patternInput.value && !namesInput.value) {
    // Non precaricare per mantenere pulito, ma mostra i chip
    updatePatternHint();
  }
})();
