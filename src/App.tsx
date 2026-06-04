import { Activity, Github, Settings as SettingsIcon, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAppSettings, checkDependencies, getGhAuthStatus, listGithubCredentials, listProfiles, setLanguagePreference as saveLanguagePreference } from "./lib/api";
import Diagnostics from "./pages/Diagnostics";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import { I18nProvider, useI18n } from "./i18n";
import type { AppSettings, CredentialEntry, DependencyStatus, GhAuthStatus, LanguagePreference, Profile } from "./types";

type Tab = "home" | "diagnostics" | "settings";

export type AppState = {
  dependencies: DependencyStatus | null;
  profiles: Profile[];
  auth: GhAuthStatus | null;
  credentials: CredentialEntry[];
  settings: AppSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  setLanguagePreference: (preference: LanguagePreference) => Promise<void>;
};

const defaultSettings: AppSettings = {
  languagePreference: "system",
  resolvedLanguage: "en",
};

const detectedLocale = () => navigator.language || "en";

function AppContent({
  appState,
  tab,
  setTab,
}: {
  appState: AppState;
  tab: Tab;
  setTab: (tab: Tab) => void;
}) {
  const { t } = useI18n();
  const navItems: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "home", label: t("nav.profiles"), icon: <UsersRound size={20} /> },
    { id: "diagnostics", label: t("nav.diagnostics"), icon: <Activity size={20} /> },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brandMark">
              <Github size={28} strokeWidth={1.8} />
            </div>
            <div>
              <strong>Git Identity Manager</strong>
              <span>{t("app.beta")}</span>
            </div>
          </div>

          <nav className="nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={tab === item.id ? "navItem active" : "navItem"}
                type="button"
                onClick={() => setTab(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button
          className={tab === "settings" ? "navItem active sidebarFooterItem" : "navItem sidebarFooterItem"}
          type="button"
          onClick={() => setTab("settings")}
        >
          <SettingsIcon size={20} />
          <span>{t("nav.settings")}</span>
        </button>
      </aside>

      <section className="content">
        {tab === "home" && <Home state={appState} />}
        {tab === "diagnostics" && <Diagnostics state={appState} />}
        {tab === "settings" && <Settings state={appState} />}
      </section>
    </main>
  );
}

function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [dependencies, setDependencies] = useState<DependencyStatus | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [auth, setAuth] = useState<GhAuthStatus | null>(null);
  const [credentials, setCredentials] = useState<CredentialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [nextDependencies, nextProfiles, nextAuth, nextCredentials] = await Promise.all([
      checkDependencies(),
      listProfiles(),
      getGhAuthStatus(),
      listGithubCredentials(),
    ]);
    setDependencies(nextDependencies);
    setProfiles(nextProfiles);
    setAuth(nextAuth);
    setCredentials(nextCredentials);
    setLoading(false);
  }, []);

  const setLanguagePreference = useCallback(async (preference: LanguagePreference) => {
    const nextSettings = await saveLanguagePreference(preference, detectedLocale());
    setSettings(nextSettings);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const nextSettings = await getAppSettings(detectedLocale());
        if (!cancelled) {
          setSettings(nextSettings);
          await refresh();
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    initialize();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const appState = useMemo<AppState>(
    () => ({ dependencies, profiles, auth, credentials, settings, loading, refresh, setLanguagePreference }),
    [auth, credentials, dependencies, loading, profiles, refresh, setLanguagePreference, settings],
  );

  return (
    <I18nProvider language={settings.resolvedLanguage}>
      <AppContent appState={appState} tab={tab} setTab={setTab} />
    </I18nProvider>
  );
}

export default App;
