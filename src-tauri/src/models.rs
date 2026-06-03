use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DependencyInfo {
    pub installed: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DependencyStatus {
    pub git: DependencyInfo,
    pub gh: DependencyInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: String,
    pub profile_name: String,
    pub github_username: String,
    pub git_user_name: String,
    pub git_user_email: String,
    pub base_path: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileInput {
    pub id: Option<String>,
    pub profile_name: String,
    pub github_username: String,
    pub git_user_name: String,
    pub git_user_email: String,
    pub base_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProfileWithAuthInput {
    pub profile_name: String,
    pub github_username: String,
    pub git_user_email: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProfileWithAuthResult {
    pub profile: Profile,
    pub activated: bool,
    pub required_login: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GithubLoginStartResult {
    pub verification_uri: String,
    pub user_code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrepareProfileCreationResult {
    pub requires_login: bool,
    pub is_first_profile: bool,
    pub active_user: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GhAccount {
    pub username: String,
    pub host: String,
    pub active: bool,
    pub state: Option<String>,
    pub scopes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GhAuthStatus {
    pub installed: bool,
    pub accounts: Vec<GhAccount>,
    pub active_user: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyConfigResult {
    pub global_config_path: String,
    pub profile_config_path: String,
    pub backup_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigOrigin {
    pub origin: String,
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoDiagnostic {
    pub path: String,
    pub is_repo: bool,
    pub remote: Option<String>,
    pub user_name: Option<String>,
    pub user_email: Option<String>,
    pub config_origins: Vec<ConfigOrigin>,
    pub active_gh_user: Option<String>,
    pub matched_profile: Option<Profile>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialEntry {
    pub target: String,
    pub kind: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetAppStateResult {
    pub logged_out_accounts: usize,
    pub cleared_git_config: bool,
    pub removed_profiles: bool,
    pub removed_managed_files: usize,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct EffectiveUser {
    pub name: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Clone)]
pub struct CommandOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}
