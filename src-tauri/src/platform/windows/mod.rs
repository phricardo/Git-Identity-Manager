use std::{
    env, fs,
    io::{Read, Write},
    os::windows::process::CommandExt,
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::mpsc,
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use serde_json::Value;

use crate::{
    error::{AppError, AppResult},
    models::{
        ApplyConfigResult, CommandOutput, ConfigOrigin, CredentialEntry, EffectiveUser, GhAccount,
        GhAuthStatus, GithubLoginStartResult, Profile, ProfileInput, ResetAppStateResult,
    },
    providers::{CredentialProvider, GhProvider, GitConfigProvider, GitProvider},
};

const BEGIN_MARKER: &str = "# BEGIN Git Identity Manager";
const END_MARKER: &str = "# END Git Identity Manager";
const CREATE_NO_WINDOW: u32 = 0x08000000;
const GITHUB_DEVICE_LOGIN_URL: &str = "https://github.com/login/device";
const GH_LOGIN_OUTPUT_TIMEOUT: Duration = Duration::from_secs(30);

pub struct WindowsGitProvider;
pub struct WindowsGhProvider;
pub struct WindowsCredentialProvider;
pub struct WindowsGitConfigProvider;

pub fn app_config_dir() -> AppResult<PathBuf> {
    let base = env::var("APPDATA")
        .or_else(|_| env::var("XDG_CONFIG_HOME"))
        .map_err(|_| {
            AppError::NotFound("Diretório de configuração do usuário não encontrado.".into())
        })?;
    Ok(PathBuf::from(base).join("Git Identity Manager"))
}

pub fn home_dir() -> AppResult<PathBuf> {
    env::var("USERPROFILE")
        .or_else(|_| env::var("HOME"))
        .map(PathBuf::from)
        .map_err(|_| AppError::NotFound("Diretório home do usuário não encontrado.".into()))
}

fn profiles_path() -> AppResult<PathBuf> {
    Ok(app_config_dir()?.join("profiles.json"))
}

fn now_string() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string()
}

fn run_command(program: &str, args: &[&str]) -> AppResult<CommandOutput> {
    let output = Command::new(program)
        .args(args)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|error| AppError::Command(format!("Falha ao executar {program}: {error}")))?;

    Ok(CommandOutput {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
    })
}

fn first_line(text: &str) -> String {
    text.lines().next().unwrap_or(text).trim().to_string()
}

fn command_version(program: &str) -> AppResult<String> {
    let output = run_command(program, &["--version"])?;
    if output.success {
        Ok(first_line(&output.stdout))
    } else {
        Err(AppError::Command(if output.stderr.is_empty() {
            format!("{program} não retornou versão.")
        } else {
            output.stderr
        }))
    }
}

fn read_gh_login_stream<R: Read + Send + 'static>(stream: R, sender: mpsc::Sender<String>) {
    let mut stream = stream;
    let mut buffer = [0_u8; 1024];

    while let Ok(bytes_read) = stream.read(&mut buffer) {
        if bytes_read == 0 {
            break;
        }

        let chunk = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
        if sender.send(chunk).is_err() {
            break;
        }
    }
}

pub fn parse_github_login_output(output: &str) -> Option<GithubLoginStartResult> {
    let user_code = find_github_user_code(output)?;
    let verification_uri =
        find_github_device_url(output).unwrap_or_else(|| GITHUB_DEVICE_LOGIN_URL.to_string());

    Some(GithubLoginStartResult {
        verification_uri,
        user_code,
        message: "Digite o código no GitHub para confirmar este login.".into(),
    })
}

fn find_github_device_url(output: &str) -> Option<String> {
    output
        .split_whitespace()
        .map(|value| {
            value.trim_matches(|character: char| {
                matches!(character, '.' | ',' | ';' | ':' | ')' | '(' | '[' | ']')
            })
        })
        .find(|value| {
            value.starts_with("https://github.com/login/device")
                || value.starts_with("http://github.com/login/device")
        })
        .map(ToString::to_string)
}

fn find_github_user_code(output: &str) -> Option<String> {
    output
        .split(|character: char| character.is_whitespace() || matches!(character, ':' | ',' | ';'))
        .map(|value| {
            value.trim_matches(|character: char| {
                !character.is_ascii_alphanumeric() && character != '-'
            })
        })
        .find(|value| is_github_user_code(value))
        .map(ToString::to_string)
}

fn is_github_user_code(value: &str) -> bool {
    let mut parts = value.split('-');
    let Some(left) = parts.next() else {
        return false;
    };
    let Some(right) = parts.next() else {
        return false;
    };

    parts.next().is_none()
        && left.len() == 4
        && right.len() == 4
        && left
            .chars()
            .all(|character| character.is_ascii_alphanumeric())
        && right
            .chars()
            .all(|character| character.is_ascii_alphanumeric())
}

pub fn read_profiles() -> AppResult<Vec<Profile>> {
    let path = profiles_path()?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let data = fs::read_to_string(path)?;
    let mut profiles: Vec<Profile> = serde_json::from_str(&data)?;
    profiles.sort_by(|left, right| left.profile_name.cmp(&right.profile_name));
    Ok(profiles)
}

pub fn write_profiles(profiles: &[Profile]) -> AppResult<()> {
    let dir = app_config_dir()?;
    fs::create_dir_all(&dir)?;
    let data = serde_json::to_string_pretty(profiles)?;
    fs::write(dir.join("profiles.json"), data)?;
    Ok(())
}

pub fn save_profile_input(input: ProfileInput) -> AppResult<Profile> {
    validate_profile(&input)?;
    let mut profiles = read_profiles()?;
    let timestamp = now_string();
    let base_path = if input.base_path.trim().is_empty() {
        home_dir()?
    } else {
        PathBuf::from(input.base_path.trim())
    };
    let id = input
        .id
        .clone()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| format!("profile-{}-{}", slugify(&input.profile_name), timestamp));

    let created_at = profiles
        .iter()
        .find(|profile| profile.id == id)
        .map(|profile| profile.created_at.clone())
        .unwrap_or_else(|| timestamp.clone());

    let profile = Profile {
        id: id.clone(),
        profile_name: input.profile_name.trim().to_string(),
        github_username: input.github_username.trim().to_string(),
        git_user_name: input.git_user_name.trim().to_string(),
        git_user_email: input.git_user_email.trim().to_string(),
        base_path: base_path.to_string_lossy().to_string(),
        created_at,
        updated_at: timestamp,
    };

    profiles.retain(|current| current.id != id);
    profiles.push(profile.clone());
    write_profiles(&profiles)?;
    Ok(profile)
}

pub fn delete_profile_by_id(id: &str) -> AppResult<()> {
    let mut profiles = read_profiles()?;
    let initial_len = profiles.len();
    profiles.retain(|profile| profile.id != id);
    if profiles.len() == initial_len {
        return Err(AppError::NotFound("Perfil não encontrado.".into()));
    }
    write_profiles(&profiles)?;
    Ok(())
}

fn validate_profile(input: &ProfileInput) -> AppResult<()> {
    if input.profile_name.trim().is_empty() {
        return Err(AppError::Validation("Informe o nome do perfil.".into()));
    }
    if input.github_username.trim().is_empty() {
        return Err(AppError::Validation("Informe o GitHub username.".into()));
    }
    if input.git_user_name.trim().is_empty() {
        return Err(AppError::Validation("Informe o user.name.".into()));
    }
    if input.git_user_email.trim().is_empty() || !input.git_user_email.contains('@') {
        return Err(AppError::Validation("Informe um user.email válido.".into()));
    }
    if !input.base_path.trim().is_empty() && !Path::new(input.base_path.trim()).is_absolute() {
        return Err(AppError::Validation(
            "A pasta base precisa ser um caminho absoluto.".into(),
        ));
    }
    Ok(())
}

fn find_profile(id: &str) -> AppResult<Profile> {
    read_profiles()?
        .into_iter()
        .find(|profile| profile.id == id)
        .ok_or_else(|| AppError::NotFound("Perfil não encontrado.".into()))
}

pub fn slugify(value: &str) -> String {
    let mut slug = String::new();
    for character in value.chars() {
        if character.is_ascii_alphanumeric() {
            slug.push(character.to_ascii_lowercase());
        } else if !slug.ends_with('-') {
            slug.push('-');
        }
    }
    slug.trim_matches('-').to_string()
}

pub fn normalize_gitdir_pattern(path: &str) -> String {
    let mut normalized = path.trim().replace('\\', "/");
    while normalized.ends_with('/') {
        normalized.pop();
    }
    format!("{normalized}/**")
}

fn normalize_path_for_compare(path: &str) -> String {
    path.trim().replace('\\', "/").to_ascii_lowercase()
}

fn global_gitconfig_path() -> AppResult<PathBuf> {
    Ok(home_dir()?.join(".gitconfig"))
}

pub fn global_gitconfig_path_for_command() -> AppResult<PathBuf> {
    global_gitconfig_path()
}

fn profile_config_path(profile: &Profile) -> AppResult<PathBuf> {
    Ok(home_dir()?.join(format!(".gitconfig-gim-{}", slugify(&profile.profile_name))))
}

fn path_for_git_config(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn profile_config_content(profile: &Profile) -> String {
    format!(
        "[user]\n    name = {}\n    email = {}\n",
        profile.git_user_name, profile.git_user_email
    )
}

pub fn build_managed_region(profiles: &[Profile]) -> String {
    let mut region = String::from(BEGIN_MARKER);
    region.push('\n');
    for profile in profiles {
        if let Ok(config_path) = profile_config_path(profile) {
            region.push_str(&format!(
                "[includeIf \"gitdir/i:{}\"]\n    path = {}\n",
                normalize_gitdir_pattern(&profile.base_path),
                path_for_git_config(&config_path)
            ));
        }
    }
    region.push_str(END_MARKER);
    region.push('\n');
    region
}

pub fn replace_managed_region(existing: &str, region: &str) -> String {
    if let (Some(begin), Some(end_start)) = (existing.find(BEGIN_MARKER), existing.find(END_MARKER))
    {
        let end = end_start + END_MARKER.len();
        let mut output = String::new();
        output.push_str(existing[..begin].trim_end());
        if !output.is_empty() {
            output.push_str("\n\n");
        }
        output.push_str(region.trim_end());
        let tail = existing[end..].trim_start();
        if !tail.is_empty() {
            output.push_str("\n\n");
            output.push_str(tail);
        }
        output.push('\n');
        output
    } else {
        let mut output = existing.trim_end().to_string();
        if !output.is_empty() {
            output.push_str("\n\n");
        }
        output.push_str(region.trim_end());
        output.push('\n');
        output
    }
}

impl WindowsGitProvider {
    fn git_value(&self, repo_path: &str, key: &str) -> AppResult<Option<String>> {
        let output = run_command("git", &["-C", repo_path, "config", key])?;
        if output.success && !output.stdout.is_empty() {
            Ok(Some(output.stdout))
        } else {
            Ok(None)
        }
    }
}

impl GitProvider for WindowsGitProvider {
    fn get_version(&self) -> AppResult<String> {
        command_version("git")
    }

    fn is_repo(&self, repo_path: &str) -> bool {
        run_command(
            "git",
            &["-C", repo_path, "rev-parse", "--is-inside-work-tree"],
        )
        .map(|output| output.success && output.stdout == "true")
        .unwrap_or(false)
    }

    fn get_effective_user(&self, repo_path: &str) -> AppResult<EffectiveUser> {
        Ok(EffectiveUser {
            name: self.git_value(repo_path, "user.name")?,
            email: self.git_value(repo_path, "user.email")?,
        })
    }

    fn get_remote(&self, repo_path: &str) -> AppResult<Option<String>> {
        let output = run_command("git", &["-C", repo_path, "remote", "get-url", "origin"])?;
        if output.success && !output.stdout.is_empty() {
            Ok(Some(output.stdout))
        } else {
            Ok(None)
        }
    }

    fn get_config_origins(&self, repo_path: &str) -> AppResult<Vec<ConfigOrigin>> {
        let output = run_command(
            "git",
            &["-C", repo_path, "config", "--list", "--show-origin"],
        )?;
        if !output.success {
            return Ok(Vec::new());
        }
        Ok(parse_config_origins(&output.stdout))
    }
}

impl WindowsGhProvider {
    pub fn start_login_web(&self) -> AppResult<GithubLoginStartResult> {
        let mut child = Command::new("gh")
            .args([
                "auth",
                "login",
                "--hostname",
                "github.com",
                "--git-protocol",
                "https",
                "--web",
                "--clipboard",
            ])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|error| {
                AppError::Command(format!("Falha ao iniciar login do GitHub CLI: {error}"))
            })?;

        let mut stdin = child.stdin.take();
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();
        let (sender, receiver) = mpsc::channel::<String>();

        if let Some(stdout) = stdout {
            let sender = sender.clone();
            thread::spawn(move || read_gh_login_stream(stdout, sender));
        }

        if let Some(stderr) = stderr {
            let sender = sender.clone();
            thread::spawn(move || read_gh_login_stream(stderr, sender));
        }
        drop(sender);

        let mut collected = String::new();
        let started_at = Instant::now();
        let login = loop {
            if started_at.elapsed() > GH_LOGIN_OUTPUT_TIMEOUT {
                let _ = child.kill();
                let _ = child.wait();
                return Err(AppError::Command(
                    "Não foi possível obter o código de login do GitHub CLI.".into(),
                ));
            }

            match receiver.recv_timeout(Duration::from_millis(250)) {
                Ok(chunk) => {
                    collected.push_str(&chunk);
                    if let Some(login) = parse_github_login_output(&collected) {
                        break login;
                    }
                }
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    if let Some(status) = child.try_wait()? {
                        return Err(AppError::Command(format!(
                            "GitHub CLI encerrou antes de gerar o código de login. Status: {status}."
                        )));
                    }
                }
                Err(mpsc::RecvTimeoutError::Disconnected) => {
                    return Err(AppError::Command(
                        "GitHub CLI encerrou sem gerar o código de login.".into(),
                    ));
                }
            }
        };

        let _ = open_url_with_system(&login.verification_uri);
        if let Some(stdin) = stdin.as_mut() {
            let _ = stdin.write_all(b"\n");
            let _ = stdin.flush();
        }
        drop(stdin);

        thread::spawn(move || {
            let _ = child.wait();
        });

        Ok(login)
    }

    fn logout_account(&self, host: &str, username: &str) -> AppResult<()> {
        let output = run_command(
            "gh",
            &["auth", "logout", "--hostname", host, "--user", username],
        )?;
        if output.success {
            Ok(())
        } else {
            Err(AppError::Command(if output.stderr.is_empty() {
                format!("Não foi possível sair da conta {username} em {host}.")
            } else {
                output.stderr
            }))
        }
    }
}

impl GhProvider for WindowsGhProvider {
    fn get_version(&self) -> AppResult<String> {
        command_version("gh")
    }

    fn get_auth_status(&self) -> AppResult<GhAuthStatus> {
        let output = run_command("gh", &["auth", "status", "--json", "hosts"])?;
        if !output.success && output.stdout.is_empty() {
            return Err(AppError::Command(if output.stderr.is_empty() {
                "Não foi possível consultar gh auth status.".into()
            } else {
                output.stderr
            }));
        }
        parse_gh_auth_status(&output.stdout)
    }

    fn get_active_user(&self) -> AppResult<Option<String>> {
        let output = run_command("gh", &["api", "user", "--jq", ".login"])?;
        if output.success && !output.stdout.is_empty() {
            Ok(Some(output.stdout))
        } else {
            Ok(None)
        }
    }

    fn switch_user(&self, username: &str) -> AppResult<()> {
        let output = run_command(
            "gh",
            &[
                "auth",
                "switch",
                "--hostname",
                "github.com",
                "--user",
                username,
            ],
        )?;
        if output.success {
            Ok(())
        } else {
            Err(AppError::Command(if output.stderr.is_empty() {
                format!("Não foi possível ativar a conta {username}.")
            } else {
                output.stderr
            }))
        }
    }

    fn setup_git(&self) -> AppResult<()> {
        let output = run_command("gh", &["auth", "setup-git"])?;
        if output.success {
            Ok(())
        } else {
            Err(AppError::Command(output.stderr))
        }
    }
}

impl CredentialProvider for WindowsCredentialProvider {
    fn list_github_credentials(&self) -> AppResult<Vec<CredentialEntry>> {
        let output = run_command("cmdkey", &["/list"])?;
        if !output.success {
            return Ok(Vec::new());
        }
        Ok(parse_cmdkey_github_credentials(&output.stdout))
    }

    fn remove_credential(&self, _target: &str) -> AppResult<()> {
        Err(AppError::Validation(
            "Remoção de credenciais fica para a V1.1.".into(),
        ))
    }
}

impl WindowsGitConfigProvider {
    fn backup_global_config(&self) -> AppResult<Option<String>> {
        let global_path = global_gitconfig_path()?;
        if global_path.exists() {
            let backup_path =
                global_path.with_extension(format!("gitconfig.gim-backup-{}", now_string()));
            fs::copy(&global_path, &backup_path)?;
            Ok(Some(path_for_git_config(&backup_path)))
        } else {
            Ok(None)
        }
    }
}

impl GitConfigProvider for WindowsGitConfigProvider {
    fn read_global_config(&self) -> AppResult<String> {
        Ok(fs::read_to_string(global_gitconfig_path()?).unwrap_or_default())
    }

    fn write_include_if(&self, profile_id: &str) -> AppResult<ApplyConfigResult> {
        self.write_profile_config(profile_id)
    }

    fn write_profile_config(&self, profile_id: &str) -> AppResult<ApplyConfigResult> {
        let profile = find_profile(profile_id)?;
        let backup_path = self.backup_global_config()?;
        let name_output = run_command(
            "git",
            &["config", "--global", "user.name", &profile.git_user_name],
        )?;
        if !name_output.success {
            return Err(AppError::Command(name_output.stderr));
        }
        let email_output = run_command(
            "git",
            &["config", "--global", "user.email", &profile.git_user_email],
        )?;
        if !email_output.success {
            return Err(AppError::Command(email_output.stderr));
        }
        let global_config_path = path_for_git_config(&global_gitconfig_path()?);
        Ok(ApplyConfigResult {
            global_config_path: global_config_path.clone(),
            profile_config_path: global_config_path,
            backup_path,
        })
    }
}

pub fn parse_config_origins(stdout: &str) -> Vec<ConfigOrigin> {
    stdout
        .lines()
        .filter_map(|line| {
            let mut parts = line.splitn(2, char::is_whitespace);
            let origin = parts.next()?.trim();
            let rest = parts.next()?.trim();
            let (key, value) = rest.split_once('=')?;
            Some(ConfigOrigin {
                origin: origin.to_string(),
                key: key.to_string(),
                value: value.to_string(),
            })
        })
        .collect()
}

pub fn parse_gh_auth_status(stdout: &str) -> AppResult<GhAuthStatus> {
    let value: Value = serde_json::from_str(stdout)?;
    let mut accounts = Vec::new();

    if let Some(hosts) = value.get("hosts").and_then(Value::as_object) {
        for (host, entries) in hosts {
            if let Some(entries) = entries.as_array() {
                for entry in entries {
                    let username = entry
                        .get("account")
                        .or_else(|| entry.get("user"))
                        .or_else(|| entry.get("username"))
                        .or_else(|| entry.get("login"))
                        .and_then(Value::as_str)
                        .unwrap_or_default()
                        .to_string();
                    if username.is_empty() {
                        continue;
                    }
                    accounts.push(GhAccount {
                        username,
                        host: host.clone(),
                        active: entry
                            .get("active")
                            .and_then(Value::as_bool)
                            .unwrap_or(false),
                        state: entry
                            .get("state")
                            .or_else(|| entry.get("status"))
                            .and_then(Value::as_str)
                            .map(str::to_string),
                    });
                }
            }
        }
    }

    let active_user = accounts
        .iter()
        .find(|account| account.host == "github.com" && account.active)
        .or_else(|| accounts.iter().find(|account| account.active))
        .map(|account| account.username.clone());

    Ok(GhAuthStatus {
        installed: true,
        accounts,
        active_user,
        error: None,
    })
}

pub fn parse_cmdkey_github_credentials(stdout: &str) -> Vec<CredentialEntry> {
    stdout
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            let target = trimmed
                .strip_prefix("Target:")
                .or_else(|| trimmed.strip_prefix("Alvo:"))
                .map(str::trim)?;
            let lower = target.to_ascii_lowercase();
            if lower.contains("github.com")
                || lower.contains("git:https://github.com")
                || lower.contains("github")
            {
                Some(CredentialEntry {
                    target: target.to_string(),
                    kind: Some("Windows Credential Manager".into()),
                })
            } else {
                None
            }
        })
        .collect()
}

pub fn match_profile_for_path(path: &str, profiles: &[Profile]) -> Option<Profile> {
    let candidate = normalize_path_for_compare(path);
    profiles
        .iter()
        .find(|profile| candidate.starts_with(&normalize_path_for_compare(&profile.base_path)))
        .cloned()
}

pub fn open_path_with_system(path: &str) -> AppResult<()> {
    if !Path::new(path).exists() {
        return Err(AppError::NotFound(format!(
            "Caminho não encontrado: {path}"
        )));
    }
    let output = Command::new("cmd")
        .args(["/C", "start", "", path])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|error| AppError::Command(format!("Falha ao abrir caminho: {error}")))?;
    if output.status.success() {
        Ok(())
    } else {
        Err(AppError::Command(
            "Não foi possível abrir o caminho no Windows.".into(),
        ))
    }
}

fn open_url_with_system(url: &str) -> AppResult<()> {
    let output = Command::new("cmd")
        .args(["/C", "start", "", url])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|error| AppError::Command(format!("Falha ao abrir URL: {error}")))?;
    if output.status.success() {
        Ok(())
    } else {
        Err(AppError::Command(
            "Não foi possível abrir a URL no Windows.".into(),
        ))
    }
}

pub fn reset_app_state() -> AppResult<ResetAppStateResult> {
    let mut warnings = Vec::new();
    let mut logged_out_accounts = 0usize;
    let mut cleared_git_config = false;
    let mut removed_profiles = false;
    let mut removed_managed_files = 0usize;
    let gh_provider = WindowsGhProvider;

    match gh_provider.get_auth_status() {
        Ok(status) => {
            for account in status.accounts {
                match gh_provider.logout_account(&account.host, &account.username) {
                    Ok(()) => logged_out_accounts += 1,
                    Err(error) => warnings.push(error.to_string()),
                }
            }
        }
        Err(error) => warnings.push(format!(
            "GitHub CLI não tinha contas para remover ou não respondeu: {error}"
        )),
    }

    match unset_global_git_value("user.name") {
        Ok(()) => cleared_git_config = true,
        Err(error) => warnings.push(error.to_string()),
    }
    match unset_global_git_value("user.email") {
        Ok(()) => cleared_git_config = true,
        Err(error) => warnings.push(error.to_string()),
    }

    match profiles_path() {
        Ok(path) if path.exists() => match fs::remove_file(&path) {
            Ok(()) => removed_profiles = true,
            Err(error) => warnings.push(format!("Não foi possível remover perfis locais: {error}")),
        },
        Ok(_) => removed_profiles = true,
        Err(error) => warnings.push(error.to_string()),
    }

    match remove_managed_profile_files() {
        Ok(count) => removed_managed_files = count,
        Err(error) => warnings.push(error.to_string()),
    }

    if let Err(error) = remove_managed_region_from_global_config() {
        warnings.push(error.to_string());
    }

    Ok(ResetAppStateResult {
        logged_out_accounts,
        cleared_git_config,
        removed_profiles,
        removed_managed_files,
        warnings,
    })
}

fn unset_global_git_value(key: &str) -> AppResult<()> {
    let output = run_command("git", &["config", "--global", "--unset-all", key])?;
    if output.success || output.stderr.to_ascii_lowercase().contains("no such") {
        Ok(())
    } else {
        Err(AppError::Command(if output.stderr.is_empty() {
            format!("Não foi possível limpar {key} do Git global.")
        } else {
            output.stderr
        }))
    }
}

fn remove_managed_profile_files() -> AppResult<usize> {
    let home = home_dir()?;
    let mut count = 0usize;
    for entry in fs::read_dir(home)? {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with(".gitconfig-gim-") {
            fs::remove_file(entry.path())?;
            count += 1;
        }
    }
    Ok(count)
}

fn remove_managed_region_from_global_config() -> AppResult<()> {
    let path = global_gitconfig_path()?;
    if !path.exists() {
        return Ok(());
    }
    let existing = fs::read_to_string(&path)?;
    let cleaned = remove_managed_region(&existing);
    if cleaned != existing {
        fs::write(path, cleaned)?;
    }
    Ok(())
}

pub fn remove_managed_region(existing: &str) -> String {
    if let (Some(begin), Some(end_start)) = (existing.find(BEGIN_MARKER), existing.find(END_MARKER))
    {
        let end = end_start + END_MARKER.len();
        let mut output = String::new();
        output.push_str(existing[..begin].trim_end());
        let tail = existing[end..].trim_start();
        if !output.is_empty() && !tail.is_empty() {
            output.push_str("\n\n");
        }
        output.push_str(tail);
        if !output.is_empty() && !output.ends_with('\n') {
            output.push('\n');
        }
        output
    } else {
        existing.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_windows_gitdir_pattern() {
        assert_eq!(normalize_gitdir_pattern(r"C:\dev\work"), "C:/dev/work/**");
    }

    #[test]
    fn replaces_managed_region_idempotently() {
        let original = "[core]\n    editor = code\n\n# BEGIN Git Identity Manager\nold\n# END Git Identity Manager\n";
        let region = "# BEGIN Git Identity Manager\nnew\n# END Git Identity Manager\n";
        let once = replace_managed_region(original, region);
        let twice = replace_managed_region(&once, region);
        assert_eq!(once, twice);
        assert!(once.contains("editor = code"));
        assert!(once.contains("new"));
        assert!(!once.contains("old"));
    }

    #[test]
    fn parses_cmdkey_github_entries() {
        let input = "Target: git:https://github.com\nType: Generic\nTarget: LegacyGeneric:target=example.com\nTarget: https://api.github.com/phricardo";
        let entries = parse_cmdkey_github_credentials(input);
        assert_eq!(entries.len(), 2);
    }

    #[test]
    fn parses_gh_auth_status_json() {
        let input = r#"{"hosts":{"github.com":[{"account":"personal","active":false},{"account":"work","active":true}]}}"#;
        let parsed = parse_gh_auth_status(input).unwrap();
        assert_eq!(parsed.accounts.len(), 2);
        assert_eq!(parsed.active_user.as_deref(), Some("work"));
    }

    #[test]
    fn parses_gh_auth_status_json_with_login_field() {
        let input = r#"{"hosts":{"github.com":[{"state":"success","active":true,"host":"github.com","login":"keratolabs","tokenSource":"keyring","scopes":"gist, read:org, repo","gitProtocol":"https"}]}}"#;
        let parsed = parse_gh_auth_status(input).unwrap();
        assert_eq!(parsed.accounts.len(), 1);
        assert_eq!(parsed.accounts[0].username, "keratolabs");
        assert_eq!(parsed.active_user.as_deref(), Some("keratolabs"));
    }

    #[test]
    fn parses_github_login_output_with_code_and_url() {
        let input = "First copy your one-time code: ABCD-1234\nThen open https://github.com/login/device in your browser.";
        let parsed = parse_github_login_output(input).unwrap();
        assert_eq!(parsed.user_code, "ABCD-1234");
        assert_eq!(parsed.verification_uri, "https://github.com/login/device");
    }

    #[test]
    fn parses_github_login_output_with_default_url() {
        let input = "First copy your one-time code: WXYZ-9876\nPress Enter to open GitHub.";
        let parsed = parse_github_login_output(input).unwrap();
        assert_eq!(parsed.user_code, "WXYZ-9876");
        assert_eq!(parsed.verification_uri, GITHUB_DEVICE_LOGIN_URL);
    }

    #[test]
    fn ignores_github_login_output_without_code() {
        assert!(parse_github_login_output("Press Enter to open GitHub.").is_none());
    }

    #[test]
    fn builds_profile_config_slug() {
        assert_eq!(slugify("Work Account!"), "work-account");
    }
}
