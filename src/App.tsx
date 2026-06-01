import { Activity, Github, Settings as SettingsIcon, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { checkDependencies, getGhAuthStatus, listGithubCredentials, listProfiles } from "./lib/api";
import Diagnostics from "./pages/Diagnostics";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import type { CredentialEntry, DependencyStatus, GhAuthStatus, Profile } from "./types";

type Tab = "home" | "diagnostics" | "settings";

export type AppState = {
  dependencies: DependencyStatus | null;
  profiles: Profile[];
  auth: GhAuthStatus | null;
  credentials: CredentialEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const navItems: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "home", label: "Perfis", icon: <UsersRound size={20} /> },
  { id: "diagnostics", label: "Diagnóstico", icon: <Activity size={20} /> },
];

function App() {
  const [tab, setTab] = useState<Tab>("home");
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

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  const appState = useMemo<AppState>(
    () => ({ dependencies, profiles, auth, credentials, loading, refresh }),
    [auth, credentials, dependencies, loading, profiles, refresh],
  );

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
              <span>Windows MVP</span>
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
          <span>Configurações</span>
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

export default App;
