import { invoke } from "@tauri-apps/api/core";
import type {
  ApplyConfigResult,
  CreateProfileWithAuthInput,
  CreateProfileWithAuthResult,
  CredentialEntry,
  DependencyStatus,
  GhAuthStatus,
  GithubLoginStartResult,
  PrepareProfileCreationResult,
  Profile,
  ProfileInput,
  RepoDiagnostic,
  ResetAppStateResult,
} from "../types";

export function checkDependencies() {
  return invoke<DependencyStatus>("check_dependencies");
}

export function listProfiles() {
  return invoke<Profile[]>("list_profiles");
}

export function saveProfile(profile: ProfileInput) {
  return invoke<Profile>("save_profile", { profile });
}

export function createProfileWithAuth(input: CreateProfileWithAuthInput) {
  return invoke<CreateProfileWithAuthResult>("create_profile_with_auth", { input });
}

export function prepareProfileCreation(input: CreateProfileWithAuthInput) {
  return invoke<PrepareProfileCreationResult>("prepare_profile_creation", { input });
}

export function startProfileGithubLogin() {
  return invoke<GithubLoginStartResult>("start_profile_github_login");
}

export function finishProfileCreation(input: CreateProfileWithAuthInput, previousActiveUser?: string | null) {
  return invoke<CreateProfileWithAuthResult>("finish_profile_creation", {
    input,
    previousActiveUser: previousActiveUser ?? null,
  });
}

export function deleteProfile(id: string) {
  return invoke<void>("delete_profile", { id });
}

export function applyProfileConfig(id: string) {
  return invoke<ApplyConfigResult>("apply_profile_config", { id });
}

export function activateProfile(id: string) {
  return invoke<void>("activate_profile", { id });
}

export function getGhAuthStatus() {
  return invoke<GhAuthStatus>("get_gh_auth_status");
}

export function runRepoDiagnostic(path: string) {
  return invoke<RepoDiagnostic>("run_repo_diagnostic", { path });
}

export function listGithubCredentials() {
  return invoke<CredentialEntry[]>("list_github_credentials");
}

export function openGlobalGitconfig() {
  return invoke<void>("open_global_gitconfig");
}

export function openPath(path: string) {
  return invoke<void>("open_path", { path });
}

export function resetAppState() {
  return invoke<ResetAppStateResult>("reset_app_state");
}
