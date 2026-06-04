import { CheckCircle2, Info, Lock, Plus, Search, Trash2, UserCheck, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AppState } from "../App";
import { useI18n } from "../i18n";
import { activateProfile, deleteProfile, saveProfile } from "../lib/api";
import type { Profile, ProfileInput } from "../types";

const defaultBasePath = "C:\\Users\\PRDESK";

const emptyProfile: ProfileInput = {
  profileName: "",
  githubUsername: "",
  gitUserName: "",
  gitUserEmail: "",
  basePath: defaultBasePath,
};

function matchesSearch(profile: Profile, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return true;

  return [profile.profileName, profile.githubUsername, profile.gitUserEmail].some((value) =>
    value.toLowerCase().includes(term),
  );
}

function Profiles({ state }: { state: AppState }) {
  const { t } = useI18n();
  const activeUser = state.auth?.activeUser ?? state.auth?.accounts.find((account) => account.active)?.username;
  const [selectedId, setSelectedId] = useState<string | null>(state.profiles[0]?.id ?? null);
  const [draft, setDraft] = useState<ProfileInput>(state.profiles[0] ?? emptyProfile);
  const [message, setMessage] = useState<{ text: string; variant: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [activatingProfileId, setActivatingProfileId] = useState<string | null>(null);

  const selected = useMemo(() => state.profiles.find((profile) => profile.id === selectedId), [selectedId, state.profiles]);
  const isCreating = selectedId === null;
  const selectedIsActive = Boolean(selected && activeUser === selected.githubUsername);
  const formLocked = Boolean(selectedIsActive && !isCreating);

  const filteredProfiles = useMemo(
    () => state.profiles.filter((profile) => matchesSearch(profile, search)),
    [search, state.profiles],
  );

  useEffect(() => {
    if (selectedId === null) return;

    const nextSelected = state.profiles.find((profile) => profile.id === selectedId);
    if (nextSelected) {
      setDraft(nextSelected);
      return;
    }

    const firstProfile = state.profiles[0];
    setSelectedId(firstProfile?.id ?? null);
    setDraft(firstProfile ?? emptyProfile);
  }, [selectedId, state.profiles]);

  function edit(profile: Profile) {
    setSelectedId(profile.id);
    setDraft(profile);
    setMessage(null);
  }

  function newProfile() {
    setSelectedId(null);
    setDraft(emptyProfile);
    setMessage(null);
  }

  function cancelCreate() {
    const nextSelected = state.profiles[0];
    setSelectedId(nextSelected?.id ?? null);
    setDraft(nextSelected ?? emptyProfile);
    setMessage(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (formLocked) return;

    const profileName = draft.profileName.trim();
    const saved = await saveProfile({
      ...draft,
      id: selectedId,
      profileName,
      gitUserName: profileName,
      basePath: draft.basePath || defaultBasePath,
    });
    setSelectedId(saved.id);
    setDraft(saved);
    setMessage({ text: isCreating ? t("profiles.profileCreated") : t("profiles.profileSaved"), variant: "success" });
    await state.refresh();
  }

  async function activate(id: string) {
    if (activatingProfileId) return;

    setMessage(null);
    setActivatingProfileId(id);
    try {
      await activateProfile(id);
      setMessage({ text: t("profiles.accountActivated"), variant: "success" });
      await state.refresh();
    } catch {
      setMessage({ text: t("home.activateFallbackError"), variant: "error" });
    } finally {
      setActivatingProfileId(null);
    }
  }

  async function remove() {
    if (!selectedId) return;

    await deleteProfile(selectedId);
    const remainingProfiles = state.profiles.filter((profile) => profile.id !== selectedId);
    const nextSelected = remainingProfiles[0];
    setSelectedId(nextSelected?.id ?? null);
    setDraft(nextSelected ?? emptyProfile);
    setMessage({ text: t("profiles.profileRemoved"), variant: "success" });
    await state.refresh();
  }

  return (
    <div className="page profilesPage">
      <section className="panel profilesPanel">
        <div className="sectionHeader">
          <div>
            <h1>{t("profiles.title")}</h1>
            <p>{t("profiles.subtitle")}</p>
          </div>
          <button className="iconButton" type="button" onClick={newProfile} title={t("profiles.newProfile")}>
            <Plus size={18} />
          </button>
        </div>

        <label className="searchField compactSearch">
          <Search size={18} />
          <input
            aria-label={t("home.searchProfile")}
            placeholder={t("home.searchProfile")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="profileList">
          {filteredProfiles.map((profile) => {
            const isActive = activeUser === profile.githubUsername;
            const isSelected = profile.id === selectedId;
            const isActivating = activatingProfileId === profile.id;

            return (
              <div className={isSelected ? "profileRow selected" : "profileRow"} key={profile.id}>
                <button className="profileRowMain" type="button" onClick={() => edit(profile)}>
                  <img src={`https://github.com/${profile.githubUsername}.png`} alt="" />
                  <span className="profileRowContent">
                    <strong title={profile.profileName}>{profile.profileName}</strong>
                    <span title={profile.githubUsername}>{profile.githubUsername}</span>
                  </span>
                </button>

                <div className="profileRowActions">
                  {isSelected && (
                    <span className="profileMetaBadge">
                      <CheckCircle2 size={14} />
                      {t("profiles.selected")}
                    </span>
                  )}
                  {isActive ? (
                    <span className="profileMetaBadge active">
                      <span aria-hidden="true" />
                      {t("profiles.activeProfile")}
                    </span>
                  ) : (
                    <button
                      className="profileActivateButton"
                      type="button"
                      onClick={() => activate(profile.id)}
                      disabled={Boolean(activatingProfileId)}
                      aria-busy={isActivating}
                    >
                      {isActivating ? (
                        <>
                          <span className="buttonSpinner" aria-hidden="true" />
                          {t("common.activating")}
                        </>
                      ) : (
                        <>
                          <UserCheck size={15} />
                          {t("common.activate")}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredProfiles.length === 0 && (
            <p className="emptyState">
              {state.profiles.length === 0 ? t("home.emptyProfiles") : t("home.emptySearch")}
            </p>
          )}
        </div>
      </section>

      <section className="panel profileEditorPanel">
        <div className="sectionHeader">
          <div>
            <h1>{isCreating ? t("profiles.createProfile") : t("profiles.editProfile")}</h1>
            <p>{isCreating ? t("profiles.createSubtitle") : t("profiles.editSubtitle")}</p>
          </div>
        </div>

        {formLocked && (
          <div className="noticeBox">
            <Info size={18} />
            <p>{t("profiles.lockedNotice")}</p>
          </div>
        )}

        <form className="form profileForm" onSubmit={submit}>
          <label>
            {t("home.profileName")}
            <span className="inputShell">
              <input
                value={draft.profileName}
                onChange={(event) => setDraft({ ...draft, profileName: event.target.value })}
                disabled={formLocked}
                required
              />
              {formLocked && <Lock size={16} />}
            </span>
          </label>
          <label>
            GitHub username
            <span className="inputShell">
              <input
                value={draft.githubUsername}
                onChange={(event) => setDraft({ ...draft, githubUsername: event.target.value })}
                disabled={formLocked}
                required
              />
              {formLocked && <Lock size={16} />}
            </span>
          </label>
          <label>
            Email
            <span className="inputShell">
              <input
                type="email"
                value={draft.gitUserEmail}
                onChange={(event) => setDraft({ ...draft, gitUserEmail: event.target.value })}
                disabled={formLocked}
                required
              />
              {formLocked && <Lock size={16} />}
            </span>
          </label>

          {message && <p className={message.variant === "error" ? "errorText" : "success"}>{message.text}</p>}

          <div className="editorActions">
            <button className="primaryAction" type="submit" disabled={formLocked}>
              {formLocked && <Lock size={16} />}
              {isCreating ? t("profiles.createProfile") : t("profiles.saveChanges")}
            </button>

            {isCreating ? (
              <button className="secondaryAction" type="button" onClick={cancelCreate}>
                <X size={16} />
                {t("common.cancel")}
              </button>
            ) : (
              <button className="dangerAction" type="button" onClick={remove} disabled={!selectedId}>
                <Trash2 size={16} />
                {t("profiles.removeProfile")}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

export default Profiles;
