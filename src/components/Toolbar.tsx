/**
 * ULWILA Color Score Editor - Toolbar Component
 *
 * Main toolbar providing score metadata controls and action buttons.
 */

import React, { useRef } from "react";
import { useScore, useScoreDispatch } from "../store/ScoreContext";
import type { Clef } from "../models/types";
import { exportPdf } from "../export/pdfExport";
import { exportPng, exportSvg } from "../export/imageExport";
import { saveScore, loadScore } from "../export/jsonPersistence";
import { useTranslation, SUPPORTED_LANGUAGES } from "../i18n";
import type { SupportedLanguage } from "../i18n";
import styles from "./Toolbar.module.css";

const TIME_SIGNATURE_OPTIONS = [
  { label: "2/4", beats: 2, beatValue: 4 },
  { label: "3/4", beats: 3, beatValue: 4 },
  { label: "4/4", beats: 4, beatValue: 4 },
  { label: "6/8", beats: 6, beatValue: 8 },
] as const;

/**
 * Find the SVG element inside the score canvas.
 * Returns null if no SVG is found (e.g. no notes rendered).
 */
function findScoreSvg(): SVGSVGElement | null {
  const canvas = document.querySelector('[data-testid="score-canvas"]');
  if (!canvas) return null;
  return canvas.querySelector("svg");
}

export function Toolbar() {
  const score = useScore();
  const dispatch = useScoreDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, lang, setLang } = useTranslation();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_TITLE", payload: e.target.value });
  };

  const handleTimeSignatureChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const [beatsStr, beatValueStr] = e.target.value.split("/");
    const beats = parseInt(beatsStr, 10);
    const beatValue = parseInt(beatValueStr, 10);
    dispatch({
      type: "SET_TIME_SIGNATURE",
      payload: { beats, beatValue },
    });
  };

  const handleClefChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: "SET_CLEF", payload: e.target.value as Clef });
  };

  const handleExportPdf = async () => {
    const svg = findScoreSvg();
    if (!svg) return;
    await exportPdf(svg, score.title);
  };

  const handleExportPng = async () => {
    const svg = findScoreSvg();
    if (!svg) return;
    await exportPng(svg, score.title);
  };

  const handleExportSvg = () => {
    const svg = findScoreSvg();
    if (!svg) return;
    exportSvg(svg, score.title);
  };

  const handleSave = () => {
    saveScore(score);
  };

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const loaded = await loadScore(file);
      dispatch({ type: "LOAD_SCORE", payload: loaded });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load score:", err);
    }
    // Reset input so the same file can be loaded again
    e.target.value = "";
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value as SupportedLanguage);
  };

  const currentTimeSigValue = `${score.timeSignature.beats}/${score.timeSignature.beatValue}`;

  return (
    <div className={styles.toolbar}>
      <div className={styles.titleSection}>
        <input
          type="text"
          value={score.title}
          onChange={handleTitleChange}
          placeholder={t.toolbar.untitledScore}
          aria-label={t.toolbar.scoreTitle}
          className={styles.titleInput}
        />
      </div>

      <div className={styles.controlsSection}>
        <select
          value={currentTimeSigValue}
          onChange={handleTimeSignatureChange}
          aria-label={t.toolbar.timeSignature}
          className={styles.selectControl}
        >
          {TIME_SIGNATURE_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.label}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={score.clef}
          onChange={handleClefChange}
          aria-label={t.toolbar.clef}
          className={styles.selectControl}
        >
          <option value="treble">{t.toolbar.treble}</option>
          <option value="bass">{t.toolbar.bass}</option>
        </select>
        <div className={styles.modeToggle} role="group" aria-label={t.toolbar.renderingMode}>
          <button
            className={`${styles.modeButton} ${score.renderingMode === 'staff' ? styles.modeButtonActive : ''}`}
            onClick={() => dispatch({ type: 'SET_RENDERING_MODE', payload: 'staff' })}
            aria-label={t.toolbar.staffMode}
            aria-pressed={score.renderingMode === 'staff'}
          >
            {t.toolbar.staff}
          </button>
          <button
            className={`${styles.modeButton} ${score.renderingMode === 'circles' ? styles.modeButtonActive : ''}`}
            onClick={() => dispatch({ type: 'SET_RENDERING_MODE', payload: 'circles' })}
            aria-label={t.toolbar.circlesMode}
            aria-pressed={score.renderingMode === 'circles'}
          >
            {t.toolbar.circles}
          </button>
        </div>
        <select
          value={lang}
          onChange={handleLanguageChange}
          aria-label={t.toolbar.language}
          className={styles.selectControl}
          data-testid="language-selector"
        >
          {SUPPORTED_LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.actionsSection}>
        <button
          onClick={handleExportPdf}
          aria-label={t.toolbar.exportPdf}
          className={styles.actionButton}
        >
          PDF
        </button>
        <button
          onClick={handleExportPng}
          aria-label={t.toolbar.exportPng}
          className={styles.actionButton}
        >
          PNG
        </button>
        <button
          onClick={handleExportSvg}
          aria-label={t.toolbar.exportSvg}
          className={styles.actionButton}
        >
          SVG
        </button>
        <button
          onClick={handleSave}
          aria-label={t.toolbar.saveScore}
          className={styles.actionButton}
        >
          {t.toolbar.save}
        </button>
        <button
          onClick={handleLoad}
          aria-label={t.toolbar.loadScore}
          className={styles.actionButton}
        >
          {t.toolbar.load}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className={styles.hiddenFileInput}
          aria-label={t.toolbar.loadScoreFile}
          data-testid="load-file-input"
        />
      </div>
    </div>
  );
}
