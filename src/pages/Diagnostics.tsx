import { FolderOpen, Github, Play, Settings, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppState } from "../App";
import { runRepoDiagnostic } from "../lib/api";
import type { RepoDiagnostic } from "../types";

function statusLabel(installed?: boolean) {
  return installed ? "Instalado" : "Pendente";
}

function Diagnostics({ state }: { state: AppState }) {
  const [path, setPath] = useState("");
  const [diagnostic, setDiagnostic] = useState<RepoDiagnostic | null>(null);

  async function chooseFolder() {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected === "string") setPath(selected);
  }

  async function run() {
    const result = await runRepoDiagnostic(path);
    setDiagnostic(result);
  }

  return (
    <div className="page diagnosticsPage">
      <header className="pageHeader">
        <div>
          <p className="eyebrow">Diagnóstico</p>
          <h1>Confira autor, remote e conta ativa</h1>
        </div>
      </header>

      <section className="diagnosticStatusGrid">
        <article className="statusCard">
          <div className="cardHeader">
            <Settings size={18} />
            <span>Git</span>
          </div>
          <strong>{statusLabel(state.dependencies?.git.installed)}</strong>
          <p>{state.dependencies?.git.version ?? state.dependencies?.git.error ?? "Verificando..."}</p>
        </article>

        <article className="statusCard">
          <div className="cardHeader">
            <Github size={18} />
            <span>GitHub CLI</span>
          </div>
          <strong>{statusLabel(state.dependencies?.gh.installed)}</strong>
          <p>{state.dependencies?.gh.version ?? state.dependencies?.gh.error ?? "Verificando..."}</p>
        </article>
      </section>

      <section className="panel">
        <div className="repoPicker">
          <input placeholder="C:\\dev\\personal\\repo" value={path} onChange={(event) => setPath(event.target.value)} />
          <button className="secondaryAction iconOnly" type="button" onClick={chooseFolder} title="Selecionar pasta">
            <FolderOpen size={18} />
          </button>
          <button className="primaryAction compactAction" type="button" onClick={run} disabled={!path}>
            <Play size={16} />
            Testar repo
          </button>
        </div>
      </section>

      {diagnostic && (
        <section className="diagnosticGrid">
          <article className="panel">
            <h2>Resultado</h2>
            <dl className="details">
              <dt>É repositório Git</dt>
              <dd>{diagnostic.isRepo ? "Sim" : "Não"}</dd>
              <dt>Remote origin</dt>
              <dd>{diagnostic.remote ?? "Não encontrado"}</dd>
              <dt>user.name efetivo</dt>
              <dd>{diagnostic.userName ?? "Não configurado"}</dd>
              <dt>user.email efetivo</dt>
              <dd>{diagnostic.userEmail ?? "Não configurado"}</dd>
              <dt>Conta ativa no gh</dt>
              <dd>{diagnostic.activeGhUser ?? state.auth?.activeUser ?? "Não detectada"}</dd>
              <dt>Perfil ativo esperado</dt>
              <dd>{diagnostic.matchedProfile?.profileName ?? "Nenhum"}</dd>
            </dl>
          </article>

          <article className="panel">
            <h2>Avisos</h2>
            <div className="list">
              {diagnostic.warnings.map((warning) => (
                <div className="warningRow" key={warning}>
                  <TriangleAlert size={16} />
                  <span>{warning}</span>
                </div>
              ))}
              {diagnostic.warnings.length === 0 && <p className="success">Nenhum conflito detectado.</p>}
            </div>
          </article>

          <article className="panel wide">
            <h2>Origem da configuração</h2>
            <div className="configOrigins">
              {diagnostic.configOrigins.map((item) => (
                <div key={`${item.origin}-${item.key}-${item.value}`}>
                  <code>{item.origin}</code>
                  <strong>{item.key}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
              {diagnostic.configOrigins.length === 0 && <p className="muted">Sem dados de origem.</p>}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

export default Diagnostics;
