/**
 * exportUtils.js
 * PDF (jsPDF + jspdf-autotable) y Excel (SheetJS) para One-Click Recap.
 * Se importa dinámicamente desde ResultsDisplay para no inflar el bundle inicial.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ── Paleta hardcodeada (indep. del tema, para legibilidad en documentos) ──────
const C = {
  black:   [13, 13, 13],
  white:   [250, 250, 250],
  yellow:  [255, 222, 3],
  orange:  [255, 87, 34],
  purple:  [123, 47, 190],
  red:     [232, 0, 61],
  stripe:  [255, 249, 230],
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────────────────────
export function exportToPDF(processed, title = 'Reunión') {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(...C.black);
  doc.rect(0, 0, pageW, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...C.yellow);
  doc.text('ONE-CLICK RECAP', 14, 15);

  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  const dateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.text(dateStr, pageW - 14, 15, { align: 'right' });

  // ── Meeting title ────────────────────────────────────────────────────────────
  y = 32;
  doc.setTextColor(...C.black);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  // Wrap long titles (max 170 mm)
  const titleLines = doc.splitTextToSize(title.toUpperCase(), pageW - 28);
  doc.text(titleLines, 14, y);
  y += titleLines.length * 9 + 2;

  doc.setDrawColor(...C.black);
  doc.setLineWidth(1.5);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  // ── Helper: section header bar ───────────────────────────────────────────────
  const sectionHeader = (label, bgColor, textColor = C.white) => {
    if (y > 250) { doc.addPage(); y = 18; }
    doc.setFillColor(...bgColor);
    doc.rect(14, y, pageW - 28, 9, 'F');
    doc.setDrawColor(...C.black);
    doc.setLineWidth(0.8);
    doc.rect(14, y, pageW - 28, 9, 'S');
    doc.setTextColor(...textColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(label, 18, y + 6.2);
    y += 10;
  };

  // ── autoTable defaults ────────────────────────────────────────────────────────
  const tableDefaults = {
    theme: 'grid',
    headStyles: {
      fillColor: C.black, textColor: C.white,
      fontStyle: 'bold', fontSize: 9, lineWidth: 0.5,
    },
    bodyStyles: { fontSize: 8.5, textColor: C.black, lineWidth: 0.35, lineColor: C.black },
    alternateRowStyles: { fillColor: C.stripe },
    tableLineColor: C.black,
    tableLineWidth: 0.8,
    margin: { left: 14, right: 14 },
  };

  // ── TASKS ────────────────────────────────────────────────────────────────────
  if (processed.tasks?.length > 0) {
    sectionHeader(`📋  TAREAS DETECTADAS  (${processed.tasks.length})`, C.black, C.yellow);

    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['#', 'TAREA / ACCIÓN', 'RESPONSABLE', 'FECHA LÍMITE', 'CONF.']],
      body: processed.tasks.map((t, i) => [
        i + 1,
        t.action,
        t.responsible,
        t.deadline,
        t.confidence === 'high' ? '★ ALTA' : 'Media',
      ]),
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        2: { cellWidth: 34 },
        3: { cellWidth: 30 },
        4: { cellWidth: 18, halign: 'center' },
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── AGREEMENTS ───────────────────────────────────────────────────────────────
  if (processed.agreements?.length > 0) {
    sectionHeader(`🤝  ACUERDOS  (${processed.agreements.length})`, C.orange, C.white);

    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['#', 'ACUERDO / DECISIÓN', 'CONFIRMADO']],
      body: processed.agreements.map((a, i) => [
        i + 1,
        a.agreement,
        a.confidence === 'high' ? '✓ Sí' : '—',
      ]),
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        2: { cellWidth: 26, halign: 'center' },
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── NEXT MEETING ─────────────────────────────────────────────────────────────
  if (processed.nextMeeting) {
    sectionHeader('📅  PRÓXIMA REUNIÓN', C.purple, C.white);

    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['DESCRIPCIÓN', 'FECHA']],
      body: [[processed.nextMeeting.text, processed.nextMeeting.date ?? '—']],
      columnStyles: { 1: { cellWidth: 40 } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── RAW TRANSCRIPT (optional, compact) ───────────────────────────────────────
  if (processed.rawText) {
    if (y > 230) { doc.addPage(); y = 18; }
    sectionHeader('📝  TRANSCRIPCIÓN COMPLETA', C.black, C.yellow);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.black);
    const lines = doc.splitTextToSize(processed.rawText, pageW - 28);
    // Limit to first 80 lines to avoid multi-page transcript spam
    const capped = lines.slice(0, 80);
    doc.text(capped, 14, y + 1);
    if (lines.length > 80) {
      doc.setFont('helvetica', 'italic');
      doc.text(`… [transcripción truncada — ${lines.length - 80} líneas adicionales]`, 14, y + capped.length * 3.8 + 3);
    }
  }

  // ── Footer on every page ─────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...C.black);
    doc.rect(0, pageH - 11, pageW, 11, 'F');
    doc.setTextColor(...C.yellow);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('© 2026 ONE-CLICK RECAP  —  DOSSIER CONFIDENCIAL', 14, pageH - 4);
    doc.text(`${p} / ${pageCount}`, pageW - 14, pageH - 4, { align: 'right' });
  }

  const safe = (title).replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ-]/g, '').trim() || 'reunion';
  doc.save(`${safe}_recap.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL
// ─────────────────────────────────────────────────────────────────────────────
export function exportToExcel(processed, title = 'Reunión') {
  const rows = [];

  for (const t of processed.tasks ?? []) {
    rows.push({
      Tipo:         'TAREA',
      Descripción:  t.action,
      Responsable:  t.responsible,
      Fecha:        t.deadline,
      Confianza:    t.confidence === 'high' ? 'Alta' : 'Media',
    });
  }

  for (const a of processed.agreements ?? []) {
    rows.push({
      Tipo:         'ACUERDO',
      Descripción:  a.agreement,
      Responsable:  '—',
      Fecha:        '—',
      Confianza:    a.confidence === 'high' ? 'Confirmado' : 'Normal',
    });
  }

  if (processed.nextMeeting) {
    rows.push({
      Tipo:         'CITA',
      Descripción:  processed.nextMeeting.text,
      Responsable:  '—',
      Fecha:        processed.nextMeeting.date ?? '—',
      Confianza:    '—',
    });
  }

  if (rows.length === 0) {
    rows.push({
      Tipo:        '—',
      Descripción: '(No se detectaron datos en esta reunión)',
      Responsable: '—',
      Fecha:       '—',
      Confianza:   '—',
    });
  }

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths (chars)
  ws['!cols'] = [
    { wch: 10 },
    { wch: 55 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen');

  // Second sheet: raw transcript
  if (processed.rawText) {
    const wsRaw = XLSX.utils.aoa_to_sheet([
      ['TRANSCRIPCIÓN COMPLETA'],
      [processed.rawText],
    ]);
    wsRaw['!cols'] = [{ wch: 120 }];
    XLSX.utils.book_append_sheet(wb, wsRaw, 'Transcripción');
  }

  const safe = title.replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ-]/g, '').trim() || 'reunion';
  XLSX.writeFile(wb, `${safe}_recap.xlsx`);
}
