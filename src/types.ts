export type DependencyInfo = {
  installed: boolean;
  version?: string | null;
  error?: string | null;
};

export type DependencyStatus = {
  git: DependencyInfo;
  gh: DependencyInfo;
};

export type Profile = {
  id: string;
  profileName: string;
  githubUsername: string;
  gitUserName: string;
  gitUserEmail: string;
  basePath: string;
  createdAt: string;
  updatedAt: string;
};

export type ProfileInput = Omit<Profile, "id" | "createdAt" | "updatedAt"> & {
  id?: string | null;
};

export type CreateProfileWithAuthInput = {
  profileName: string;
  githubUsername: string;
  gitUserEmail: string;
};

export type CreateProfileWithAuthResult = {
  profile: Profile;
  activated: boolean;
  requiredLogin: boolean;
  message: string;
};

export type GithubLoginStartResult = {
  verificationUri: string;
  userCode: string;
  message: string;
};

export type PrepareProfileCreationResult = {
  requiresLogin: boolean;
  isFirstProfile: boolean;
  activeUser?: string | null;
  message: string;
};

export type GhAccount = {
  username: string;
  host: string;
  active: boolean;
  state?: string | null;
  scopes: string[];
};

export type GhAuthStatus = {
  installed: boolean;
  accounts: GhAccount[];
  activeUser?: string | null;
  error?: string | null;
};

export type ApplyConfigResult = {
  globalConfigPath: string;
  profileConfigPath: string;
  backupPath?: string | null;
};

export type ConfigOrigin = {
  origin: string;
  key: string;
  value: string;
};

export type RepoDiagnostic = {
  path: string;
  isRepo: boolean;
  remote?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  configOrigins: ConfigOrigin[];
  activeGhUser?: string | null;
  matchedProfile?: Profile | null;
  warnings: string[];
};

export type CredentialEntry = {
  target: string;
  kind?: string | null;
};

export type ResetAppStateResult = {
  loggedOutAccounts: number;
  clearedGitConfig: boolean;
  removedProfiles: boolean;
  removedManagedFiles: number;
  warnings: string[];
};
