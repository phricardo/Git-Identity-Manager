#[cfg(target_os = "linux")]
pub mod linux;
#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "linux")]
pub use linux::{
    delete_profile_by_id, global_gitconfig_path_for_command, home_dir, open_path_with_system,
    read_profiles, reset_app_state, save_profile_input,
    LinuxCredentialProvider as PlatformCredentialProvider, LinuxGhProvider as PlatformGhProvider,
    LinuxGitConfigProvider as PlatformGitConfigProvider, LinuxGitProvider as PlatformGitProvider,
};

#[cfg(target_os = "windows")]
pub use windows::{
    delete_profile_by_id, global_gitconfig_path_for_command, home_dir, open_path_with_system,
    read_profiles, reset_app_state, save_profile_input,
    WindowsCredentialProvider as PlatformCredentialProvider,
    WindowsGhProvider as PlatformGhProvider, WindowsGitConfigProvider as PlatformGitConfigProvider,
    WindowsGitProvider as PlatformGitProvider,
};
