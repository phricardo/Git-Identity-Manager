mod commands;
mod error;
mod localization;
mod models;
mod platform;
mod providers;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::check_dependencies,
            commands::list_profiles,
            commands::save_profile,
            commands::prepare_profile_creation,
            commands::start_profile_github_login,
            commands::finish_profile_creation,
            commands::create_profile_with_auth,
            commands::delete_profile,
            commands::apply_profile_config,
            commands::activate_profile,
            commands::get_gh_auth_status,
            commands::run_repo_diagnostic,
            commands::list_github_credentials,
            commands::open_global_gitconfig,
            commands::open_path,
            commands::reset_app_state,
            localization::get_app_settings,
            localization::set_language_preference,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Git Identity Manager");
}
