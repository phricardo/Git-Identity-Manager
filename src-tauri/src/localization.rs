use std::{
    env, fs,
    path::PathBuf,
    sync::{Mutex, OnceLock},
};

use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum Language {
    #[serde(rename = "en")]
    En,
    #[serde(rename = "pt-BR")]
    PtBr,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum LanguagePreference {
    #[serde(rename = "system")]
    System,
    #[serde(rename = "en")]
    En,
    #[serde(rename = "pt-BR")]
    PtBr,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub language_preference: LanguagePreference,
    pub resolved_language: Language,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredSettings {
    language_preference: LanguagePreference,
}

static CURRENT_LANGUAGE: OnceLock<Mutex<Language>> = OnceLock::new();

fn language_cell() -> &'static Mutex<Language> {
    CURRENT_LANGUAGE.get_or_init(|| Mutex::new(Language::En))
}

pub fn set_current_language(language: Language) {
    if let Ok(mut current) = language_cell().lock() {
        *current = language;
    }
}

pub fn current_language() -> Language {
    language_cell().lock().map(|current| *current).unwrap_or(Language::En)
}

pub fn resolve_language(preference: LanguagePreference, detected_locale: &str) -> Language {
    match preference {
        LanguagePreference::En => Language::En,
        LanguagePreference::PtBr => Language::PtBr,
        LanguagePreference::System => {
            if detected_locale.trim().to_ascii_lowercase().starts_with("pt") {
                Language::PtBr
            } else {
                Language::En
            }
        }
    }
}

pub fn tr(key: &str) -> &'static str {
    match current_language() {
        Language::En => en(key),
        Language::PtBr => pt_br(key),
    }
}

fn en(key: &str) -> &'static str {
    match key {
        "github_login_required" => "GitHub login required.",
        "github_account_authenticated" => "GitHub account already authenticated.",
        "github_login_message" => "Enter the code on GitHub to confirm this login.",
        "github_login_not_confirmed_prefix" => "Login was not confirmed for",
        "github_login_not_confirmed_suffix" => "Confirm it in the browser or sign in to the correct account.",
        "profile_created_activated_git_updated" => "Profile created and activated. Global Git config updated.",
        "profile_created_activated" => "Profile created and activated.",
        "profile_created" => "Profile created.",
        "assisted_login_required" => "This action now uses assisted login in the interface. Use the Add profile flow.",
        "profile_not_found" => "Profile not found.",
        "selected_folder_not_repo" => "The selected folder is not a Git repository.",
        "user_name_mismatch" => "The effective user.name does not match profile",
        "user_email_mismatch" => "The effective user.email does not match profile",
        "active_account_mismatch" => "The active GitHub CLI account does not match profile",
        "no_profile_matches_active_account" => "No profile matches the active GitHub CLI account.",
        "profile_name_required" => "Enter the profile name.",
        "github_username_required" => "Enter the GitHub username.",
        "git_email_required" => "Enter a valid Git email.",
        "git_user_name_required" => "Enter the user.name.",
        "base_path_absolute" => "The base folder must be an absolute path.",
        "config_dir_not_found" => "User configuration directory not found.",
        "home_dir_not_found" => "User home directory not found.",
        "command_failed" => "Failed to run",
        "program_no_version" => "did not return a version.",
        "start_github_login_failed" => "Failed to start GitHub CLI login:",
        "github_login_code_failed" => "Could not get the GitHub CLI login code.",
        "github_cli_closed_before_code" => "GitHub CLI exited before generating the login code. Status:",
        "github_cli_closed_without_code" => "GitHub CLI exited without generating the login code.",
        "logout_failed_prefix" => "Could not sign out of account",
        "logout_failed_middle" => "on",
        "gh_auth_status_failed" => "Could not query gh auth status.",
        "activate_account_failed_prefix" => "Could not activate account",
        "account_not_found_prefix" => "GitHub account",
        "account_not_found_suffix" => "was not found in GitHub CLI.",
        "refresh_scopes_failed_prefix" => "Could not update permissions for account",
        "refresh_scopes_failed_suffix" => "Authorize the repo and workflow scopes.",
        "credential_removal_v11" => "Credential removal is planned for V1.1.",
        "path_not_found" => "Path not found:",
        "open_path_failed" => "Failed to open path:",
        "open_url_failed" => "Failed to open URL:",
        "system_open_path_failed_windows" => "Could not open the path in Windows.",
        "system_open_path_failed_linux" => "Could not open the path in Linux.",
        "system_open_url_failed_windows" => "Could not open the URL in Windows.",
        "system_open_url_failed_linux" => "Could not open the URL in Linux.",
        "gh_no_accounts_warning" => "GitHub CLI did not have accounts to remove or did not respond:",
        "remove_profiles_failed" => "Could not remove local profiles:",
        "clear_git_value_failed" => "Could not clear Git global value",
        _ => "Missing translation",
    }
}

fn pt_br(key: &str) -> &'static str {
    match key {
        "github_login_required" => "Login do GitHub necessário.",
        "github_account_authenticated" => "Conta GitHub já autenticada.",
        "github_login_message" => "Digite o código no GitHub para confirmar este login.",
        "github_login_not_confirmed_prefix" => "Login não confirmado para",
        "github_login_not_confirmed_suffix" => "Confirme no navegador ou entre na conta correta.",
        "profile_created_activated_git_updated" => "Perfil criado e ativado. Git global atualizado.",
        "profile_created_activated" => "Perfil criado e ativado.",
        "profile_created" => "Perfil criado.",
        "assisted_login_required" => "Esta ação agora usa login assistido pela interface. Use o fluxo Adicionar perfil.",
        "profile_not_found" => "Perfil não encontrado.",
        "selected_folder_not_repo" => "A pasta selecionada não é um repositório Git.",
        "user_name_mismatch" => "O user.name efetivo não corresponde ao perfil",
        "user_email_mismatch" => "O user.email efetivo não corresponde ao perfil",
        "active_account_mismatch" => "A conta ativa no GitHub CLI não corresponde ao perfil",
        "no_profile_matches_active_account" => "Nenhum perfil corresponde a conta ativa do GitHub CLI.",
        "profile_name_required" => "Informe o nome do perfil.",
        "github_username_required" => "Informe o usuário do GitHub.",
        "git_email_required" => "Informe um email do Git válido.",
        "git_user_name_required" => "Informe o user.name.",
        "base_path_absolute" => "A pasta base precisa ser um caminho absoluto.",
        "config_dir_not_found" => "Diretório de configuração do usuário não encontrado.",
        "home_dir_not_found" => "Diretório home do usuário não encontrado.",
        "command_failed" => "Falha ao executar",
        "program_no_version" => "não retornou versão.",
        "start_github_login_failed" => "Falha ao iniciar login do GitHub CLI:",
        "github_login_code_failed" => "Não foi possível obter o código de login do GitHub CLI.",
        "github_cli_closed_before_code" => "GitHub CLI encerrou antes de gerar o código de login. Status:",
        "github_cli_closed_without_code" => "GitHub CLI encerrou sem gerar o código de login.",
        "logout_failed_prefix" => "Não foi possível sair da conta",
        "logout_failed_middle" => "em",
        "gh_auth_status_failed" => "Não foi possível consultar gh auth status.",
        "activate_account_failed_prefix" => "Não foi possível ativar a conta",
        "account_not_found_prefix" => "Conta GitHub",
        "account_not_found_suffix" => "não encontrada no GitHub CLI.",
        "refresh_scopes_failed_prefix" => "Não foi possível atualizar permissões da conta",
        "refresh_scopes_failed_suffix" => "Autorize os escopos repo e workflow.",
        "credential_removal_v11" => "Remoção de credenciais fica para a V1.1.",
        "path_not_found" => "Caminho não encontrado:",
        "open_path_failed" => "Falha ao abrir caminho:",
        "open_url_failed" => "Falha ao abrir URL:",
        "system_open_path_failed_windows" => "Não foi possível abrir o caminho no Windows.",
        "system_open_path_failed_linux" => "Não foi possível abrir o caminho no Linux.",
        "system_open_url_failed_windows" => "Não foi possível abrir a URL no Windows.",
        "system_open_url_failed_linux" => "Não foi possível abrir a URL no Linux.",
        "gh_no_accounts_warning" => "GitHub CLI não tinha contas para remover ou não respondeu:",
        "remove_profiles_failed" => "Não foi possível remover perfis locais:",
        "clear_git_value_failed" => "Não foi possível limpar valor do Git global",
        _ => "Tradução ausente",
    }
}

#[tauri::command]
pub fn get_app_settings(detected_locale: String) -> AppResult<AppSettings> {
    let stored = read_stored_settings()?;
    let resolved_language = resolve_language(stored.language_preference, &detected_locale);
    set_current_language(resolved_language);
    Ok(AppSettings {
        language_preference: stored.language_preference,
        resolved_language,
    })
}

#[tauri::command]
pub fn set_language_preference(
    preference: LanguagePreference,
    detected_locale: String,
) -> AppResult<AppSettings> {
    let stored = StoredSettings {
        language_preference: preference,
    };
    write_stored_settings(&stored)?;
    let resolved_language = resolve_language(preference, &detected_locale);
    set_current_language(resolved_language);
    Ok(AppSettings {
        language_preference: preference,
        resolved_language,
    })
}

fn read_stored_settings() -> AppResult<StoredSettings> {
    let path = settings_path()?;
    if !path.exists() {
        return Ok(StoredSettings {
            language_preference: LanguagePreference::System,
        });
    }

    let data = fs::read_to_string(path)?;
    serde_json::from_str(&data).map_err(AppError::from)
}

fn write_stored_settings(settings: &StoredSettings) -> AppResult<()> {
    let dir = app_config_dir()?;
    fs::create_dir_all(&dir)?;
    let data = serde_json::to_string_pretty(settings)?;
    fs::write(dir.join("settings.json"), data)?;
    Ok(())
}

fn settings_path() -> AppResult<PathBuf> {
    Ok(app_config_dir()?.join("settings.json"))
}

#[cfg(target_os = "windows")]
fn app_config_dir() -> AppResult<PathBuf> {
    let base = env::var("APPDATA")
        .or_else(|_| env::var("XDG_CONFIG_HOME"))
        .map_err(|_| AppError::NotFound(tr("config_dir_not_found").into()))?;
    Ok(PathBuf::from(base).join("Git Identity Manager"))
}

#[cfg(not(target_os = "windows"))]
fn app_config_dir() -> AppResult<PathBuf> {
    let base = env::var("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .or_else(|_| {
            env::var("HOME")
                .map(PathBuf::from)
                .map(|home| home.join(".config"))
        })
        .map_err(|_| AppError::NotFound(tr("config_dir_not_found").into()))?;
    Ok(base.join("Git Identity Manager"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_portuguese_system_locale_to_pt_br() {
        assert_eq!(resolve_language(LanguagePreference::System, "pt-BR"), Language::PtBr);
        assert_eq!(resolve_language(LanguagePreference::System, "pt"), Language::PtBr);
        assert_eq!(resolve_language(LanguagePreference::System, "pt-PT"), Language::PtBr);
    }

    #[test]
    fn resolves_non_portuguese_system_locale_to_english() {
        assert_eq!(resolve_language(LanguagePreference::System, "en-US"), Language::En);
        assert_eq!(resolve_language(LanguagePreference::System, ""), Language::En);
        assert_eq!(resolve_language(LanguagePreference::System, "zz-ZZ"), Language::En);
    }

    #[test]
    fn explicit_preference_overrides_system_locale() {
        assert_eq!(resolve_language(LanguagePreference::En, "pt-BR"), Language::En);
        assert_eq!(resolve_language(LanguagePreference::PtBr, "en-US"), Language::PtBr);
    }
}
