use crate::{
    error::AppResult,
    models::{
        ApplyConfigResult, CreateProfileWithAuthInput, CreateProfileWithAuthResult,
        CredentialEntry, DependencyInfo, DependencyStatus, GhAuthStatus, GithubLoginStartResult,
        PrepareProfileCreationResult, Profile, ProfileInput, RepoDiagnostic, ResetAppStateResult,
    },
    localization::tr,
    platform::{
        delete_profile_by_id, global_gitconfig_path_for_command, home_dir, open_path_with_system,
        read_profiles, reset_app_state as reset_platform_app_state, save_profile_input,
        PlatformCredentialProvider, PlatformGhProvider, PlatformGitConfigProvider,
        PlatformGitProvider,
    },
    providers::{CredentialProvider, GhProvider, GitConfigProvider, GitProvider},
};

#[tauri::command]
pub fn check_dependencies() -> AppResult<DependencyStatus> {
    let git_provider = PlatformGitProvider;
    let gh_provider = PlatformGhProvider;
    Ok(DependencyStatus {
        git: dependency_info(git_provider.get_version()),
        gh: dependency_info(gh_provider.get_version()),
    })
}

#[tauri::command]
pub fn list_profiles() -> AppResult<Vec<Profile>> {
    read_profiles()
}

#[tauri::command]
pub fn save_profile(profile: ProfileInput) -> AppResult<Profile> {
    save_profile_input(profile)
}

#[tauri::command]
pub fn prepare_profile_creation(
    input: CreateProfileWithAuthInput,
) -> AppResult<PrepareProfileCreationResult> {
    let git_provider = PlatformGitProvider;
    let gh_provider = PlatformGhProvider;
    git_provider.get_version()?;
    gh_provider.get_version()?;
    validate_create_profile_input(&input)?;

    let existing_profiles = read_profiles()?;
    let is_first_profile = existing_profiles.is_empty();
    let requested_user = input.github_username.trim().to_string();
    let active_user = gh_provider.get_active_user().unwrap_or(None);
    let status = gh_provider.get_auth_status().unwrap_or(GhAuthStatus {
        installed: true,
        accounts: Vec::new(),
        active_user: active_user.clone(),
        error: None,
    });
    let requires_login = !has_github_account(&status, &requested_user);

    Ok(PrepareProfileCreationResult {
        requires_login,
        is_first_profile,
        active_user,
        message: if requires_login {
            tr("github_login_required").into()
        } else {
            tr("github_account_authenticated").into()
        },
    })
}

#[tauri::command]
pub fn start_profile_github_login() -> AppResult<GithubLoginStartResult> {
    let gh_provider = PlatformGhProvider;
    gh_provider.get_version()?;
    gh_provider.start_login_web()
}

#[tauri::command]
pub fn finish_profile_creation(
    input: CreateProfileWithAuthInput,
    _previous_active_user: Option<String>,
) -> AppResult<CreateProfileWithAuthResult> {
    let gh_provider = PlatformGhProvider;
    validate_create_profile_input(&input)?;

    let requested_user = input.github_username.trim().to_string();
    let status = gh_provider.get_auth_status()?;

    if !has_github_account(&status, &requested_user) {
        return Err(crate::error::AppError::Validation(format!(
            "{} {requested_user}. {}",
            tr("github_login_not_confirmed_prefix"),
            tr("github_login_not_confirmed_suffix")
        )));
    }

    let profile = save_profile_input(ProfileInput {
        id: None,
        profile_name: input.profile_name.trim().to_string(),
        github_username: requested_user,
        git_user_name: input.profile_name.trim().to_string(),
        git_user_email: input.git_user_email.trim().to_string(),
        base_path: home_dir()?.to_string_lossy().to_string(),
    })?;

    gh_provider.switch_user(&profile.github_username)?;
    gh_provider.ensure_required_scopes(&profile.github_username)?;
    gh_provider.setup_git()?;
    PlatformGitConfigProvider.write_profile_config(&profile.id)?;

    let required_login = !status.accounts.iter().any(|account| {
        account
            .username
            .eq_ignore_ascii_case(&profile.github_username)
    });

    Ok(CreateProfileWithAuthResult {
        message: tr("profile_created_activated_git_updated").into(),
        profile,
        activated: true,
        required_login,
    })
}

#[tauri::command]
pub fn create_profile_with_auth(
    input: CreateProfileWithAuthInput,
) -> AppResult<CreateProfileWithAuthResult> {
    let git_provider = PlatformGitProvider;
    let gh_provider = PlatformGhProvider;
    git_provider.get_version()?;
    gh_provider.get_version()?;

    let existing_profiles = read_profiles()?;
    let is_first_profile = existing_profiles.is_empty();
    let previous_active_user = gh_provider.get_active_user().unwrap_or(None);
    let requested_user = input.github_username.trim().to_string();
    let required_login = false;

    let initial_status = gh_provider.get_auth_status().unwrap_or(GhAuthStatus {
        installed: true,
        accounts: Vec::new(),
        active_user: previous_active_user.clone(),
        error: None,
    });

    if !has_github_account(&initial_status, &requested_user) {
        return Err(crate::error::AppError::Validation(
            tr("assisted_login_required").into(),
        ));
    }

    let profile = save_profile_input(ProfileInput {
        id: None,
        profile_name: input.profile_name.trim().to_string(),
        github_username: requested_user.clone(),
        git_user_name: input.profile_name.trim().to_string(),
        git_user_email: input.git_user_email.trim().to_string(),
        base_path: home_dir()?.to_string_lossy().to_string(),
    })?;

    let activated = if is_first_profile {
        gh_provider.switch_user(&profile.github_username)?;
        gh_provider.ensure_required_scopes(&profile.github_username)?;
        gh_provider.setup_git()?;
        PlatformGitConfigProvider.write_profile_config(&profile.id)?;
        true
    } else {
        if required_login {
            if let Some(previous_user) = previous_active_user {
                if !previous_user.eq_ignore_ascii_case(&profile.github_username) {
                    let _ = gh_provider.switch_user(&previous_user);
                }
            }
        }
        false
    };

    Ok(CreateProfileWithAuthResult {
        message: if activated {
            tr("profile_created_activated").into()
        } else {
            tr("profile_created").into()
        },
        profile,
        activated,
        required_login,
    })
}

#[tauri::command]
pub fn delete_profile(id: String) -> AppResult<()> {
    delete_profile_by_id(&id)
}

#[tauri::command]
pub fn apply_profile_config(id: String) -> AppResult<ApplyConfigResult> {
    PlatformGitConfigProvider.write_profile_config(&id)
}

#[tauri::command]
pub fn activate_profile(id: String) -> AppResult<()> {
    let profile = read_profiles()?
        .into_iter()
        .find(|profile| profile.id == id)
        .ok_or_else(|| crate::error::AppError::NotFound(tr("profile_not_found").into()))?;
    PlatformGhProvider.switch_user(&profile.github_username)?;
    PlatformGhProvider.ensure_required_scopes(&profile.github_username)?;
    PlatformGhProvider.setup_git()?;
    PlatformGitConfigProvider.write_profile_config(&profile.id)?;
    Ok(())
}

#[tauri::command]
pub fn get_gh_auth_status() -> AppResult<GhAuthStatus> {
    let provider = PlatformGhProvider;
    match provider.get_auth_status() {
        Ok(mut status) => {
            if status.active_user.is_none() {
                status.active_user = provider.get_active_user().unwrap_or(None);
            }
            Ok(status)
        }
        Err(error) => Ok(GhAuthStatus {
            installed: false,
            accounts: Vec::new(),
            active_user: None,
            error: Some(error.to_string()),
        }),
    }
}

#[tauri::command]
pub fn run_repo_diagnostic(path: String) -> AppResult<RepoDiagnostic> {
    let git = PlatformGitProvider;
    let gh = PlatformGhProvider;
    let profiles = read_profiles()?;
    let is_repo = git.is_repo(&path);
    let effective_user = if is_repo {
        git.get_effective_user(&path)?
    } else {
        crate::models::EffectiveUser {
            name: None,
            email: None,
        }
    };
    let remote = if is_repo {
        git.get_remote(&path)?
    } else {
        None
    };
    let config_origins = if is_repo {
        git.get_config_origins(&path)?
    } else {
        Vec::new()
    };
    let active_gh_user = gh.get_active_user().unwrap_or(None);
    let matched_profile = active_gh_user
        .as_ref()
        .and_then(|active_user| {
            profiles
                .iter()
                .find(|profile| profile.github_username == *active_user)
        })
        .cloned();
    let mut warnings = Vec::new();

    if !is_repo {
        warnings.push(tr("selected_folder_not_repo").into());
    }
    if let Some(profile) = &matched_profile {
        if effective_user.name.as_deref() != Some(profile.git_user_name.as_str()) {
            warnings.push(format!(
                "{} {}.",
                tr("user_name_mismatch"),
                profile.profile_name
            ));
        }
        if effective_user.email.as_deref() != Some(profile.git_user_email.as_str()) {
            warnings.push(format!(
                "{} {}.",
                tr("user_email_mismatch"),
                profile.profile_name
            ));
        }
        if active_gh_user.as_deref() != Some(profile.github_username.as_str()) {
            warnings.push(format!(
                "{} {}.",
                tr("active_account_mismatch"),
                profile.profile_name
            ));
        }
    } else if is_repo {
        warnings.push(tr("no_profile_matches_active_account").into());
    }

    Ok(RepoDiagnostic {
        path,
        is_repo,
        remote,
        user_name: effective_user.name,
        user_email: effective_user.email,
        config_origins,
        active_gh_user,
        matched_profile,
        warnings,
    })
}

#[tauri::command]
pub fn list_github_credentials() -> AppResult<Vec<CredentialEntry>> {
    PlatformCredentialProvider.list_github_credentials()
}

#[tauri::command]
pub fn open_global_gitconfig() -> AppResult<()> {
    let path = global_gitconfig_path_for_command()?;
    if !path.exists() {
        std::fs::write(&path, "")?;
    }
    open_path_with_system(&path.to_string_lossy())
}

#[tauri::command]
pub fn open_path(path: String) -> AppResult<()> {
    open_path_with_system(&path)
}

#[tauri::command]
pub fn reset_app_state() -> AppResult<ResetAppStateResult> {
    reset_platform_app_state()
}

fn dependency_info(result: AppResult<String>) -> DependencyInfo {
    match result {
        Ok(version) => DependencyInfo {
            installed: true,
            version: Some(version),
            error: None,
        },
        Err(error) => DependencyInfo {
            installed: false,
            version: None,
            error: Some(error.to_string()),
        },
    }
}

fn has_github_account(status: &GhAuthStatus, username: &str) -> bool {
    status.accounts.iter().any(|account| {
        account.host == "github.com" && account.username.eq_ignore_ascii_case(username.trim())
    })
}

fn validate_create_profile_input(input: &CreateProfileWithAuthInput) -> AppResult<()> {
    if input.profile_name.trim().is_empty() {
        return Err(crate::error::AppError::Validation(
            tr("profile_name_required").into(),
        ));
    }
    if input.github_username.trim().is_empty() {
        return Err(crate::error::AppError::Validation(
            tr("github_username_required").into(),
        ));
    }
    if input.git_user_email.trim().is_empty() || !input.git_user_email.contains('@') {
        return Err(crate::error::AppError::Validation(
            tr("git_email_required").into(),
        ));
    }
    Ok(())
}
