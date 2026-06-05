export type DownloadTarget = {
  readonly label: string;
  readonly platform: "windows" | "linux";
  readonly architecture: "x64";
  readonly version: string;
  readonly href: string;
  readonly fileType: "exe" | "msi" | "deb";
  readonly osLabel: string;
  readonly badge: string;
  readonly iconKeys: readonly ("windows" | "linux" | "debian" | "ubuntu" | "mint")[];
  readonly priority: number;
};

export const RELEASE_VERSION = "v1.0.1";
const RELEASE_BASE_URL =
  "https://github.com/phricardo/Git-Identity-Manager/releases/download";

export const SOURCE_CODE_URL =
  "https://github.com/phricardo/Git-Identity-Manager" as const;
export const LICENSE_URL =
  "https://github.com/phricardo/Git-Identity-Manager/blob/main/LICENSE.md" as const;
export const ALL_DOWNLOADS_PATH = "/downloads" as const;

export const DOWNLOADS: readonly DownloadTarget[] = [
  {
    label: "Windows 64-bit",
    platform: "windows",
    architecture: "x64",
    version: RELEASE_VERSION,
    href: `${RELEASE_BASE_URL}/${RELEASE_VERSION}/Git.Identity.Manager_1.0.1_windows_x64_setup.exe`,
    fileType: "exe",
    osLabel: "Windows",
    badge: ".exe",
    iconKeys: ["windows"],
    priority: 1,
  },
  {
    label: "Windows 64-bit MSI",
    platform: "windows",
    architecture: "x64",
    version: RELEASE_VERSION,
    href: `${RELEASE_BASE_URL}/${RELEASE_VERSION}/Git.Identity.Manager_1.0.1_windows_x64.msi`,
    fileType: "msi",
    osLabel: "Windows MSI",
    badge: ".msi",
    iconKeys: ["windows"],
    priority: 2,
  },
  {
    label: "Debian / Ubuntu",
    platform: "linux",
    architecture: "x64",
    version: RELEASE_VERSION,
    href: `${RELEASE_BASE_URL}/${RELEASE_VERSION}/Git.Identity.Manager_1.0.1_linux_amd64.deb`,
    fileType: "deb",
    osLabel: "Linux",
    badge: ".deb",
    iconKeys: ["ubuntu", "mint", "debian"],
    priority: 3,
  },
] as const;
