use crate::{
    error::AppResult,
    models::{ConfigOrigin, CredentialEntry, EffectiveUser, GhAuthStatus},
};

pub trait GitProvider {
    fn get_version(&self) -> AppResult<String>;
    fn is_repo(&self, repo_path: &str) -> bool;
    fn get_effective_user(&self, repo_path: &str) -> AppResult<EffectiveUser>;
    fn get_remote(&self, repo_path: &str) -> AppResult<Option<String>>;
    fn get_config_origins(&self, repo_path: &str) -> AppResult<Vec<ConfigOrigin>>;
}

pub trait GhProvider {
    fn get_version(&self) -> AppResult<String>;
    fn get_auth_status(&self) -> AppResult<GhAuthStatus>;
    fn get_active_user(&self) -> AppResult<Option<String>>;
    fn switch_user(&self, username: &str) -> AppResult<()>;
    fn setup_git(&self) -> AppResult<()>;
}

pub trait CredentialProvider {
    fn list_github_credentials(&self) -> AppResult<Vec<CredentialEntry>>;
    fn remove_credential(&self, target: &str) -> AppResult<()>;
}

pub trait GitConfigProvider {
    fn read_global_config(&self) -> AppResult<String>;
    fn write_include_if(&self, profile_id: &str) -> AppResult<crate::models::ApplyConfigResult>;
    fn write_profile_config(&self, profile_id: &str)
        -> AppResult<crate::models::ApplyConfigResult>;
}
