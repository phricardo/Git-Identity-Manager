import { FolderOpen, Github, Play, Settings, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppState } from "../App";
import { useI18n } from "../i18n";
import { runRepoDiagnostic } from "../lib/api";
import type { RepoDiagnostic } from "../types";

function Diagnostics({ state }: { state: AppState }) {
  const { t } = useI18n();
  const [path, setPath] = useState("");
  const [diagnostic, setDiagnostic] = useState<RepoDiagnostic | null>(null);

  function statusLabel(installed?: boolean) {
    return installed ? t("diagnostics.installed") : t("diagnostics.pending");
  }

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
          <p className="eyebrow">{t("diagnostics.eyebrow")}</p>
          <h1>{t("diagnostics.title")}</h1>
        </div>
      </header>

      <section className="diagnosticStatusGrid">
        <article className="statusCard">
          <div className="cardHeader">
            <Settings size={18} />
            <span>Git</span>
          </div>
          <strong>{statusLabel(state.dependencies?.git.installed)}</strong>
          <p>{state.dependencies?.git.version ?? state.dependencies?.git.error ?? t("diagnostics.checking")}</p>
        </article>

        <article className="statusCard">
          <div className="cardHeader">
            <Github size={18} />
            <span>GitHub CLI</span>
          </div>
          <strong>{statusLabel(state.dependencies?.gh.installed)}</strong>
          <p>{state.dependencies?.gh.version ?? state.dependencies?.gh.error ?? t("diagnostics.checking")}</p>
        </article>
      </section>

      <section className="panel">
        <div className="repoPicker">
          <input placeholder="C:\\dev\\personal\\repo" value={path} onChange={(event) => setPath(event.target.value)} />
          <button className="secondaryAction iconOnly" type="button" onClick={chooseFolder} title={t("diagnostics.selectFolder")}>
            <FolderOpen size={18} />
          </button>
          <button className="primaryAction compactAction" type="button" onClick={run} disabled={!path}>
            <Play size={16} />
            {t("diagnostics.testRepo")}
          </button>
        </div>
      </section>

      {diagnostic && (
        <section className="diagnosticGrid">
          <article className="panel">
            <h2>{t("diagnostics.result")}</h2>
            <dl className="details">
              <dt>{t("diagnostics.isGitRepo")}</dt>
              <dd>{diagnostic.isRepo ? t("common.yes") : t("common.no")}</dd>
              <dt>Remote origin</dt>
              <dd>{diagnostic.remote ?? t("diagnostics.notFound")}</dd>
              <dt>user.name</dt>
              <dd>{diagnostic.userName ?? t("diagnostics.notConfigured")}</dd>
              <dt>user.email</dt>
              <dd>{diagnostic.userEmail ?? t("diagnostics.notConfigured")}</dd>
              <dt>gh active account</dt>
              <dd>{diagnostic.activeGhUser ?? state.auth?.activeUser ?? t("diagnostics.notDetected")}</dd>
              <dt>{t("diagnostics.expectedProfile")}</dt>
              <dd>{diagnostic.matchedProfile?.profileName ?? t("diagnostics.none")}</dd>
            </dl>
          </article>

          <article className="panel">
            <h2>{t("diagnostics.warnings")}</h2>
            <div className="list">
              {diagnostic.warnings.map((warning) => (
                <div className="warningRow" key={warning}>
                  <TriangleAlert size={16} />
                  <span>{warning}</span>
                </div>
              ))}
              {diagnostic.warnings.length === 0 && <p className="success">{t("diagnostics.noConflicts")}</p>}
            </div>
          </article>

          <article className="panel wide">
            <h2>{t("diagnostics.configOrigin")}</h2>
            <div className="configOrigins">
              {diagnostic.configOrigins.map((item) => (
                <div key={`${item.origin}-${item.key}-${item.value}`}>
                  <code>{item.origin}</code>
                  <strong>{item.key}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
              {diagnostic.configOrigins.length === 0 && <p className="muted">{t("diagnostics.noOriginData")}</p>}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

export default Diagnostics;
