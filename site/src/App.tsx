import {
  ArrowDownToLine,
  ArrowLeft,
  Code2,
  Github,
  PanelsTopLeft,
  ShieldCheck,
  Shapes,
  Star,
  UserRoundCog,
} from "lucide-react";
import { motion } from "framer-motion";
import { DebianIcon, LinuxIcon, UbuntuIcon, WindowsIcon, type OsIconProps } from "./components/OsIcons";
import logoUrl from "./assets/logo.svg";
import screenshotUrl from "./assets/app-screen--001.png";
import {
  ALL_DOWNLOADS_PATH,
  DOWNLOADS,
  LICENSE_URL,
  RELEASE_VERSION,
  SOURCE_CODE_URL,
  type DownloadTarget,
} from "./constants/links";
import styles from "./App.module.css";

const downloadIcons: Record<DownloadTarget["iconKey"], (props: OsIconProps) => JSX.Element> = {
  debian: DebianIcon,
  linux: LinuxIcon,
  ubuntu: UbuntuIcon,
  windows: WindowsIcon,
};

const features = [
  {
    icon: UserRoundCog,
    title: "Identity profiles",
    text: "Keep Git names, emails, and signing defaults organized for each working context.",
  },
  {
    icon: Github,
    title: "GitHub CLI accounts",
    text: "Review authenticated accounts and connect local identity choices with GitHub CLI state.",
  },
  {
    icon: ShieldCheck,
    title: "Diagnostics",
    text: "Spot missing tools, mismatched config, and identity drift before it reaches a commit.",
  },
  {
    icon: PanelsTopLeft,
    title: "Desktop workflow",
    text: "Use a focused Tauri interface made for quick checks and repeated profile switching.",
  },
] as const;

export function App() {
  const isDownloadsPage = window.location.pathname === ALL_DOWNLOADS_PATH;

  if (isDownloadsPage) {
    return <DownloadsPage />;
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.shell}>
          <nav className={styles.nav} aria-label="Primary">
            <a className={styles.brandMark} href="#top" aria-label="Git Identity Manager">
              <img src={logoUrl} alt="Git Identity Manager" />
            </a>
            <div className={styles.navLinks}>
              <a href="#features">
                <Shapes size={14} aria-hidden="true" />
                Features
              </a>
              <a href={ALL_DOWNLOADS_PATH}>
                <ArrowDownToLine size={14} aria-hidden="true" />
                Downloads
              </a>
              <a href={SOURCE_CODE_URL} target="_blank" rel="noreferrer">
                <Code2 size={14} aria-hidden="true" />
                Source
              </a>
              <a className={styles.starLink} href={SOURCE_CODE_URL} target="_blank" rel="noreferrer">
                <Star size={14} aria-hidden="true" />
                Star on GitHub
              </a>
            </div>
          </nav>

          <div className={styles.heroGrid} id="top">
            <motion.div
              className={styles.heroCopy}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <h1 className={styles.heroTitle}>
                <span>Manage Git</span>
                <span className={styles.impactText}>identities</span>
                <span>without</span>
                <span>leaving your</span>
                <span className={styles.impactText}>desktop.</span>
              </h1>
              <p className={styles.lead}>
                Git Identity Manager keeps local Git profiles, GitHub CLI
                accounts, and diagnostics in one focused, secure desktop app.
              </p>

              <div className={styles.actions}>
                <a className={styles.primaryButton} href="#downloads">
                  <ArrowDownToLine size={18} aria-hidden="true" />
                  Download
                </a>
                <a className={styles.secondaryButton} href={SOURCE_CODE_URL} target="_blank" rel="noreferrer">
                  <Github size={18} aria-hidden="true" />
                  Source code
                </a>
              </div>
            </motion.div>

            <motion.div
              className={`${styles.mockupWindow} ${styles.screenshotFrame}`}
              initial={{ opacity: 0, scale: 0.98, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease: "easeOut" }}
            >
              <img
                className={styles.appScreenshot}
                src={screenshotUrl}
                alt="Git Identity Manager desktop app screenshot"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="features">
        <div className={styles.shell}>
          <div className={styles.sectionHeader}>
            <span className={styles.codeLabel}>features.map()</span>
            <h2>Built for identity-heavy Git workflows.</h2>
          </div>
          <div className={styles.featureGrid}>
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.article
                  className={styles.featureCard}
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.42, delay: index * 0.07 }}
                >
                  <Icon size={24} aria-hidden="true" />
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.screenshotSection} aria-labelledby="screenshot-title">
        <div className={styles.shell}>
          <div className={styles.screenshotGrid}>
            <div>
              <span className={styles.codeLabel}>preview_001</span>
              <h2 id="screenshot-title">
                Clear visibility into{" "}
                <span className={styles.impactText}>every local</span>{" "}
                <span className={styles.impactText}>identity.</span>
              </h2>
              <p>
                Review Git profiles, GitHub CLI accounts, and diagnostics from
                one focused desktop surface.
              </p>
              <div className={`${styles.actions} ${styles.previewActions}`}>
                <a className={styles.primaryButton} href="#downloads">
                  <ArrowDownToLine size={18} aria-hidden="true" />
                  Download
                </a>
                <a className={styles.secondaryButton} href={SOURCE_CODE_URL} target="_blank" rel="noreferrer">
                  <Github size={18} aria-hidden="true" />
                  Source code
                </a>
              </div>
            </div>
            <motion.div
              className={styles.screenshotFrame}
              initial={{ opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
            >
              <img
                className={styles.appScreenshot}
                src={screenshotUrl}
                alt="Git Identity Manager interface screenshot"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="downloads">
        <div className={styles.shell}>
          <DownloadPanel />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function DownloadPanel() {
  const detectedPlatform = detectPlatform();
  const platformDownload = DOWNLOADS.find(
    (download) => download.platform === detectedPlatform,
  );

  return (
    <div className={styles.downloadPanel}>
      <span className={styles.codeLabel}>release.targets</span>
      <h2>
        Ready to organize your Git <span className={styles.impactText}>identities?</span>
      </h2>
      <p>Download the desktop app for your platform or view every release target.</p>

      {platformDownload ? (
        <DownloadButton download={platformDownload} variant="primary" />
      ) : (
        <a className={styles.primaryPill} href={ALL_DOWNLOADS_PATH}>
          View all downloads
        </a>
      )}

      {platformDownload ? (
        <a className={styles.allDownloadsLink} href={ALL_DOWNLOADS_PATH}>
          View all downloads
        </a>
      ) : null}
    </div>
  );
}

function DownloadsPage() {
  return (
    <main className={styles.downloadsPage}>
      <div className={`${styles.shell} ${styles.downloadsShell}`}>
        <nav className={styles.downloadsNav} aria-label="Downloads navigation">
          <a className={styles.brandMark} href="/" aria-label="Git Identity Manager">
            <img src={logoUrl} alt="Git Identity Manager" />
          </a>
          <a className={styles.backLink} href="/">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to home
          </a>
        </nav>

        <section className={styles.downloadsHero}>
          <h1>
            <span className={styles.impactText}>Downloads</span>
          </h1>
          <p>Choose the installer for your platform.</p>
        </section>

        <section className={styles.releaseCard} aria-label={`${RELEASE_VERSION} downloads`}>
          <div className={styles.releaseMeta}>
            <strong>{RELEASE_VERSION}</strong>
            <span>Current release</span>
          </div>
          <div className={styles.releaseDownloads}>
            {[...DOWNLOADS]
              .sort((left, right) => left.priority - right.priority)
              .map((download) => (
                <DownloadButton download={download} key={download.label} variant="secondary" />
            ))}
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}

function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.shell} ${styles.footerInner}`}>
        <a className={styles.footerLogo} href="/" aria-label="Git Identity Manager">
          <img src={logoUrl} alt="Git Identity Manager" />
        </a>
        <p className={styles.footerText}>Open source today. Open source forever.</p>
        <div className={styles.footerLinks}>
          <a className={styles.footerLink} href={LICENSE_URL}>
            License
          </a>
          <span aria-hidden="true">|</span>
          <a className={styles.footerLink} href={SOURCE_CODE_URL} target="_blank" rel="noreferrer">
            Source code
          </a>
        </div>
      </div>
    </footer>
  );
}

function DownloadButton({
  download,
  variant,
}: {
  download: DownloadTarget;
  variant: "primary" | "secondary";
}) {
  const Icon = downloadIcons[download.iconKey];

  return (
    <a
      className={variant === "primary" ? styles.primaryPill : styles.downloadPill}
      href={download.href}
    >
      <Icon size={20} aria-hidden="true" />
      <span>{download.osLabel}</span>
      <small>{download.badge}</small>
    </a>
  );
}

function detectPlatform(): DownloadTarget["platform"] | "unknown" {
  const nav = window.navigator as Navigator & {
    userAgentData?: {
      platform?: string;
    };
  };

  const platform = [
    nav.userAgentData?.platform,
    nav.platform,
    nav.userAgent,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (platform.includes("win")) {
    return "windows";
  }

  if (platform.includes("linux") || platform.includes("ubuntu")) {
    return "linux";
  }

  return "unknown";
}
