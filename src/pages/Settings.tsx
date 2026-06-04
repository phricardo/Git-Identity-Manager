import { AlertTriangle, Languages, RotateCcw, X } from "lucide-react";
import { ChangeEvent, useState } from "react";
import type { AppState } from "../App";
import { useI18n } from "../i18n";
import { resetAppState } from "../lib/api";
import type { LanguagePreference, ResetAppStateResult } from "../types";

const resetConfirmation = "RESET";

function Settings({ state }: { state: AppState }) {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<ResetAppStateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canReset = confirmation === resetConfirmation && !resetting;

  async function changeLanguage(event: ChangeEvent<HTMLSelectElement>) {
    await state.setLanguagePreference(event.target.value as LanguagePreference);
  }

  async function runReset() {
    if (!canReset) return;
    setResetting(true);
    setError(null);
    setResult(null);
    try {
      const nextResult = await resetAppState();
      setResult(nextResult);
      setConfirmOpen(false);
      setConfirmation("");
      await state.refresh();
    } catch (resetError) {
      setError(typeof resetError === "string" ? resetError : t("settings.resetFallbackError"));
    } finally {
      setResetting(false);
    }
  }

  function closeModal() {
    if (resetting) return;
    setConfirmOpen(false);
    setConfirmation("");
    setError(null);
  }

  return (
    <div className="page settingsPage">
      <header className="pageHeader">
        <div>
          <p className="eyebrow">{t("settings.eyebrow")}</p>
          <h1>{t("settings.title")}</h1>
          <p>{t("settings.subtitle")}</p>
        </div>
      </header>

      <section className="panel resetPanel">
        <div className="resetPanelCopy">
          <Languages size={20} />
          <div>
            <h2>{t("settings.languageTitle")}</h2>
            <p>{t("settings.languageDescription")}</p>
          </div>
        </div>

        <label className="confirmField">
          {t("settings.languageTitle")}
          <span className="inputShell">
            <select value={state.settings.languagePreference} onChange={changeLanguage}>
              <option value="system">{t("settings.languageSystem")}</option>
              <option value="en">{t("settings.languageEnglish")}</option>
              <option value="pt-BR">{t("settings.languagePortuguese")}</option>
            </select>
          </span>
        </label>
      </section>

      <section className="panel resetPanel">
        <div className="resetPanelCopy">
          <AlertTriangle size={20} />
          <div>
            <h2>{t("settings.resetTotal")}</h2>
            <p>{t("settings.resetDescription")}</p>
          </div>
        </div>

        <ul className="resetList">
          <li>{t("settings.resetItemAccounts")}</li>
          <li>{t("settings.resetItemGit")}</li>
          <li>{t("settings.resetItemProfiles")}</li>
        </ul>

        <button className="dangerAction resetButton" type="button" onClick={() => setConfirmOpen(true)}>
          <RotateCcw size={16} />
          {t("settings.resetAll")}
        </button>
      </section>

      {result && (
        <section className="panel resetResult">
          <h2>{t("settings.resetDone")}</h2>
          <div className="resetStats">
            <span>{t("settings.accountsRemoved", { count: result.loggedOutAccounts })}</span>
            <span>{t("settings.gitConfigClean", { value: result.clearedGitConfig ? t("common.yes") : t("common.no") })}</span>
            <span>{t("settings.profilesRemoved", { value: result.removedProfiles ? t("common.yes") : t("common.no") })}</span>
            <span>{t("settings.filesRemoved", { count: result.removedManagedFiles })}</span>
          </div>
          {result.warnings.length > 0 && (
            <div className="warningList">
              <strong>{t("settings.warnings")}</strong>
              {result.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}
        </section>
      )}

      {error && <p className="errorText">{error}</p>}

      {confirmOpen && (
        <div className="modalOverlay" role="presentation">
          <section className="modalPanel" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <div className="modalHeader">
              <div>
                <h2 id="reset-title">{t("settings.confirmTitle")}</h2>
                <p>{t("settings.confirmDescription")}</p>
              </div>
              <button className="iconButton" type="button" onClick={closeModal} title={t("common.close")} disabled={resetting}>
                <X size={18} />
              </button>
            </div>

            <label className="confirmField">
              {t("settings.confirmation")}
              <span className="inputShell">
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder={resetConfirmation}
                  disabled={resetting}
                />
              </span>
            </label>

            {error && <p className="errorText">{error}</p>}

            <div className="editorActions">
              <button className="dangerAction" type="button" onClick={runReset} disabled={!canReset}>
                {resetting && <span className="buttonSpinner" aria-hidden="true" />}
                {resetting ? t("settings.resetting") : t("settings.resetAll")}
              </button>
              <button className="secondaryAction" type="button" onClick={closeModal} disabled={resetting}>
                {t("common.cancel")}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Settings;
