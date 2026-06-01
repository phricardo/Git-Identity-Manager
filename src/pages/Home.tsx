import { CheckCircle2, Plus, Search, TriangleAlert, X } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { AppState } from "../App";
import {
  activateProfile,
  finishProfileCreation,
  getGhAuthStatus,
  prepareProfileCreation,
  startProfileGithubLogin,
} from "../lib/api";
import type { CreateProfileWithAuthInput, GithubLoginStartResult, Profile } from "../types";

type Props = {
  state: AppState;
};

type ProfileFilter = "all" | "active" | "recent";
type FeedbackVariant = "success" | "error";
type ProfileFeedback = {
  title: string;
  description: string;
};

const filters: Array<{ id: ProfileFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "recent", label: "Recentes" },
];

const emptyCreateDraft: CreateProfileWithAuthInput = {
  profileName: "",
  githubUsername: "",
  gitUserEmail: "",
};

const LOGIN_POLL_INTERVAL_MS = 2_000;
const LOGIN_TIMEOUT_MS = 5 * 60_000;

function profileMatchesSearch(profile: Profile, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return true;

  return [profile.profileName, profile.githubUsername, profile.gitUserEmail].some((value) =>
    value.toLowerCase().includes(term),
  );
}

function sortByUpdatedAt(profiles: Profile[]) {
  return [...profiles].sort((a, b) => {
    const left = new Date(a.updatedAt || a.createdAt).getTime();
    const right = new Date(b.updatedAt || b.createdAt).getTime();
    return right - left;
  });
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function hasGithubAccount(accounts: Array<{ username: string; host: string }>, username: string) {
  return accounts.some(
    (account) => account.host === "github.com" && account.username.toLowerCase() === username.trim().toLowerCase(),
  );
}

function FeedbackBanner({
  variant,
  title,
  description,
  onClose,
}: {
  variant: FeedbackVariant;
  title: string;
  description: string;
  onClose: () => void;
}) {
  const Icon = variant === "success" ? CheckCircle2 : TriangleAlert;

  return (
    <div className={`feedbackBanner ${variant}`} role={variant === "error" ? "alert" : "status"}>
      <span className="feedbackBannerIcon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.9} />
      </span>
      <div className="feedbackBannerContent">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button className="feedbackBannerClose" type="button" onClick={onClose} aria-label="Fechar mensagem">
        <X size={18} />
      </button>
    </div>
  );
}

function Home({ state }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProfileFilter>("all");
  const [activatingProfileId, setActivatingProfileId] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<ProfileFeedback | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateProfileWithAuthInput>(emptyCreateDraft);
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [githubLogin, setGithubLogin] = useState<GithubLoginStartResult | null>(null);
  const [githubCodeCopied, setGithubCodeCopied] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const createCancelledRef = useRef(false);
  const activeUser = state.auth?.activeUser ?? state.auth?.accounts.find((account) => account.active)?.username;
  const activeProfile = state.profiles.find((profile) => profile.githubUsername === activeUser);
  const activeDisplayName = activeProfile?.profileName ?? activeUser;

  const visibleProfiles = useMemo(() => {
    const searched = state.profiles.filter((profile) => profileMatchesSearch(profile, search));

    if (filter === "active") {
      return searched.filter((profile) => profile.githubUsername === activeUser);
    }

    if (filter === "recent") {
      return sortByUpdatedAt(searched).slice(0, 5);
    }

    return searched;
  }, [activeUser, filter, search, state.profiles]);

  function openCreateProfile() {
    setCreateDraft(emptyCreateDraft);
    setCreateStatus(null);
    setCreateError(null);
    setActivationError(null);
    setGithubLogin(null);
    setGithubCodeCopied(false);
    setProfileMessage(null);
    createCancelledRef.current = false;
    setCreateOpen(true);
  }

  function closeCreateProfile() {
    createCancelledRef.current = true;
    setCreatingProfile(false);
    setCreateOpen(false);
    setCreateStatus(null);
    setCreateError(null);
    setActivationError(null);
    setGithubLogin(null);
    setGithubCodeCopied(false);
  }

  async function submitCreateProfile(event: FormEvent) {
    event.preventDefault();
    const input = {
      profileName: createDraft.profileName.trim(),
      githubUsername: createDraft.githubUsername.trim(),
      gitUserEmail: createDraft.gitUserEmail.trim(),
    };

    setCreateError(null);
    setGithubLogin(null);
    setProfileMessage(null);
    createCancelledRef.current = false;
    setCreatingProfile(true);
    setCreateStatus("Verificando GitHub CLI, Git e contas autenticadas.");

    try {
      setCreateStatus("Verificando contas autenticadas no GitHub CLI.");
      const preparation = await prepareProfileCreation(input);
      let previousActiveUser = preparation.activeUser ?? null;

      if (preparation.requiresLogin) {
        setCreateStatus("Abrindo login no navegador. O GitHub CLI vai copiar o código para a área de transferência.");
        const login = await startProfileGithubLogin();
        setGithubLogin(login);
        setGithubCodeCopied(false);

        const startedAt = Date.now();
        setCreateStatus(login.message);

        while (!createCancelledRef.current) {
          if (Date.now() - startedAt > LOGIN_TIMEOUT_MS) {
            throw new Error("Tempo esgotado aguardando o login do GitHub. Tente novamente.");
          }

          await sleep(LOGIN_POLL_INTERVAL_MS);
          const auth = await getGhAuthStatus();
          previousActiveUser = previousActiveUser ?? auth.activeUser ?? null;

          if (hasGithubAccount(auth.accounts, input.githubUsername)) {
            break;
          }
        }

        if (createCancelledRef.current) {
          return;
        }
      }

      setCreateStatus("Configurando Git.");
      const result = await finishProfileCreation(input, previousActiveUser);
      if (createCancelledRef.current) {
        return;
      }
      setCreateStatus(result.message);
      setProfileMessage({
        title: "Perfil criado e ativado",
        description: "Git global atualizado.",
      });
      await state.refresh();
      setCreateOpen(false);
      setCreateDraft(emptyCreateDraft);
      setGithubLogin(null);
      setGithubCodeCopied(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : typeof error === "string" ? error : "Não foi possível criar o perfil.";
      setCreateError(message);
    } finally {
      setCreatingProfile(false);
    }
  }

  async function activateQuickProfile(profileId: string) {
    if (activatingProfileId) return;

    setActivationError(null);
    setProfileMessage(null);
    setActivatingProfileId(profileId);
    try {
      await activateProfile(profileId);
      setProfileMessage({
        title: "Perfil ativado",
        description: "Git global atualizado.",
      });
      await state.refresh();
    } catch {
      setActivationError("Não foi possível ativar o perfil.");
    } finally {
      setActivatingProfileId(null);
    }
  }

  async function openGithubLoginUrl() {
    if (!githubLogin) return;
    await openUrl(githubLogin.verificationUri);
  }

  async function copyGithubLoginCode() {
    if (!githubLogin) return;
    await writeText(githubLogin.userCode);
    setGithubCodeCopied(true);
  }

  return (
    <div className="page homePage">
      <header className="homeHeader">
        <h1>Identidades Git sem editar config na mão</h1>
        <p>Gerencie e troque suas identidades do GitHub de forma rápida e segura.</p>
      </header>

      <section className="homeSection">
        <h2>Conta ativa</h2>
        <article className="activeAccountCard">
          {activeUser ? (
            <>
              <div className="activeAccountIdentity">
                <img src={`https://github.com/${activeUser}.png`} alt="" />
                <div>
                  <strong title={activeDisplayName}>{activeDisplayName}</strong>
                  <span title={activeUser}>{activeUser}</span>
                </div>
              </div>
              <span className="activeBadge">
                <span aria-hidden="true" />
                Ativa
              </span>
            </>
          ) : (
            <div className="emptyActiveAccount">
              <strong>Nenhuma conta ativa</strong>
              <span>{state.auth?.error ?? "Faça login com gh auth login."}</span>
            </div>
          )}
        </article>
      </section>

      <section className="homeSection">
        <div className="homeSectionHeader">
          <h2>Perfis</h2>
          <button className="primaryAction addProfileButton" type="button" onClick={openCreateProfile}>
            <Plus size={18} />
            Adicionar perfil
          </button>
        </div>

        {profileMessage && (
          <FeedbackBanner
            variant="success"
            title={profileMessage.title}
            description={profileMessage.description}
            onClose={() => setProfileMessage(null)}
          />
        )}
        {activationError && (
          <FeedbackBanner
            variant="error"
            title="Não foi possível concluir"
            description={activationError}
            onClose={() => setActivationError(null)}
          />
        )}

        <article className="profileSwitchPanel">
          <div className="profileSwitchToolbar">
            <label className="searchField">
              <Search size={18} />
              <input
                aria-label="Buscar perfil"
                placeholder="Buscar perfil"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="filterTabs" aria-label="Filtrar perfis">
              {filters.map((item) => (
                <button
                  key={item.id}
                  className={filter === item.id ? "filterTab active" : "filterTab"}
                  type="button"
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="profileTable" role="table" aria-label="Perfis GitHub">
            <div className="profileTableHeader" role="row">
              <span role="columnheader">Perfil</span>
              <span role="columnheader">Usuário</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" aria-label="Ação" />
            </div>

            <div className="profileTableBody">
              {visibleProfiles.map((profile) => {
                const isActive = activeUser === profile.githubUsername;
                const isActivating = activatingProfileId === profile.id;

                return (
                  <div className={isActive ? "homeProfileRow active" : "homeProfileRow"} key={profile.id} role="row">
                    <div className="homeProfileCell profileIdentity" role="cell">
                      <img src={`https://github.com/${profile.githubUsername}.png`} alt="" />
                      <strong title={profile.profileName}>{profile.profileName}</strong>
                    </div>
                    <span className="homeProfileCell mutedText" role="cell" title={profile.githubUsername}>
                      {profile.githubUsername}
                    </span>
                    <span className="homeProfileCell" role="cell">
                      {isActive ? <span className="tableStatusBadge">Ativa</span> : <span className="inactiveBadge">Inativa</span>}
                    </span>
                    <span className="homeProfileCell actionCell" role="cell">
                      <button
                        className={isActive ? "activateProfileButton active" : "activateProfileButton"}
                        type="button"
                        onClick={() => activateQuickProfile(profile.id)}
                        disabled={isActive || Boolean(activatingProfileId)}
                        aria-busy={isActivating}
                      >
                        {isActivating && <span className="buttonSpinner" aria-hidden="true" />}
                        {isActive ? "Ativo" : isActivating ? "Ativando" : "Ativar"}
                      </button>
                    </span>
                  </div>
                );
              })}

              {visibleProfiles.length === 0 && (
                <div className="emptyProfileTable">
                  {state.profiles.length === 0 ? "Nenhum perfil criado ainda." : "Nenhum perfil encontrado."}
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      {createOpen && (
        <div className="modalOverlay" role="presentation">
          <section className="modalPanel" role="dialog" aria-modal="true" aria-labelledby="create-profile-title">
            <div className="modalHeader">
              <div>
                <h2 id="create-profile-title">Adicionar perfil</h2>
                <p>Informe a identidade Git e a conta GitHub usada neste perfil.</p>
              </div>
              <button className="iconButton" type="button" onClick={closeCreateProfile} title="Fechar">
                <X size={18} />
              </button>
            </div>

            <form className="form profileForm" onSubmit={submitCreateProfile}>
              <label>
                Nome do perfil
                <span className="inputShell">
                  <input
                    value={createDraft.profileName}
                    onChange={(event) => setCreateDraft({ ...createDraft, profileName: event.target.value })}
                    placeholder="Nome do perfil"
                    disabled={creatingProfile}
                    required
                  />
                </span>
              </label>
              <label>
                Usuário do GitHub
                <span className="inputShell">
                  <input
                    value={createDraft.githubUsername}
                    onChange={(event) => setCreateDraft({ ...createDraft, githubUsername: event.target.value })}
                    placeholder="usuario-github"
                    disabled={creatingProfile}
                    required
                  />
                </span>
              </label>
              <label>
                Email do Git
                <span className="inputShell">
                  <input
                    type="email"
                    value={createDraft.gitUserEmail}
                    onChange={(event) => setCreateDraft({ ...createDraft, gitUserEmail: event.target.value })}
                    placeholder="email@exemplo.com"
                    disabled={creatingProfile}
                    required
                  />
                </span>
              </label>

              {(createStatus || creatingProfile) && (
                <div className={creatingProfile ? "noticeBox withSpinner" : "noticeBox"}>
                  {creatingProfile && <span className="buttonSpinner" aria-hidden="true" />}
                  <p>{createStatus ?? "Criando perfil."}</p>
                </div>
              )}
              {githubLogin && (
                <div className="githubLoginBox">
                  <div className="githubLoginCode">
                    <span>Código GitHub</span>
                    <strong>{githubLogin.userCode}</strong>
                  </div>
                  <div className="githubLoginActions">
                    <button className="secondaryAction" type="button" onClick={openGithubLoginUrl}>
                      Abrir GitHub
                    </button>
                    <button className="secondaryAction" type="button" onClick={copyGithubLoginCode}>
                      {githubCodeCopied ? "Copiado" : "Copiar código"}
                    </button>
                  </div>
                </div>
              )}
              {createError && (
                <FeedbackBanner
                  variant="error"
                  title="Não foi possível concluir"
                  description={createError}
                  onClose={() => setCreateError(null)}
                />
              )}

              <div className="editorActions">
                <button className="primaryAction" type="submit" disabled={creatingProfile}>
                  {creatingProfile && <span className="buttonSpinner" aria-hidden="true" />}
                  {creatingProfile ? "Processando" : "Adicionar perfil"}
                </button>
                <button className="secondaryAction" type="button" onClick={closeCreateProfile}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Home;
