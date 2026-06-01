import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import type { AppState } from "../App";
import { resetAppState } from "../lib/api";
import type { ResetAppStateResult } from "../types";

function Settings({ state }: { state: AppState }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<ResetAppStateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canReset = confirmation === "RESETAR" && !resetting;

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
      setError(typeof resetError === "string" ? resetError : "Não foi possível resetar o aplicativo.");
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
          <p className="eyebrow">Configurações</p>
          <h1>Resetar aplicativo</h1>
          <p>Remova contas locais, configurações globais do Git e perfis salvos pelo app.</p>
        </div>
      </header>

      <section className="panel resetPanel">
        <div className="resetPanelCopy">
          <AlertTriangle size={20} />
          <div>
            <h2>Reset total</h2>
            <p>Esta ação remove autenticações locais do GitHub CLI, limpa user.name/user.email globais e apaga os perfis salvos no Git Identity Manager.</p>
          </div>
        </div>

        <ul className="resetList">
          <li>Remove contas locais listadas pelo GitHub CLI.</li>
          <li>Executa limpeza global de user.name e user.email no Git.</li>
          <li>Apaga perfis locais e arquivos .gitconfig-gim-*.</li>
        </ul>

        <button className="dangerAction resetButton" type="button" onClick={() => setConfirmOpen(true)}>
          <RotateCcw size={16} />
          Resetar tudo
        </button>
      </section>

      {result && (
        <section className="panel resetResult">
          <h2>Aplicativo resetado.</h2>
          <div className="resetStats">
            <span>Contas removidas: {result.loggedOutAccounts}</span>
            <span>Config Git limpa: {result.clearedGitConfig ? "Sim" : "Não"}</span>
            <span>Perfis removidos: {result.removedProfiles ? "Sim" : "Não"}</span>
            <span>Arquivos removidos: {result.removedManagedFiles}</span>
          </div>
          {result.warnings.length > 0 && (
            <div className="warningList">
              <strong>Avisos</strong>
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
                <h2 id="reset-title">Confirmar reset</h2>
                <p>Digite RESETAR para confirmar a remoção das contas locais, perfis e configurações globais do Git.</p>
              </div>
              <button className="iconButton" type="button" onClick={closeModal} title="Fechar" disabled={resetting}>
                <X size={18} />
              </button>
            </div>

            <label className="confirmField">
              Confirmação
              <span className="inputShell">
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="RESETAR"
                  disabled={resetting}
                />
              </span>
            </label>

            {error && <p className="errorText">{error}</p>}

            <div className="editorActions">
              <button className="dangerAction" type="button" onClick={runReset} disabled={!canReset}>
                {resetting && <span className="buttonSpinner" aria-hidden="true" />}
                {resetting ? "Resetando" : "Resetar tudo"}
              </button>
              <button className="secondaryAction" type="button" onClick={closeModal} disabled={resetting}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Settings;
