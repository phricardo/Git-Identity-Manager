import {
  ArrowDownToLine,
  ArrowLeft,
  Check,
  Code2,
  Eye,
  GitBranch,
  Github,
  Menu,
  Network,
  PanelsTopLeft,
  ShieldCheck,
  Shapes,
  Star,
  Terminal,
  UserRoundCog,
  Zap,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { BrandIcon } from "./components/BrandIcon";
import { DebianIcon, LinuxIcon, MintIcon, UbuntuIcon, WindowsIcon, type OsIconProps } from "./components/OsIcons";
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

const downloadIcons: Record<DownloadTarget["iconKeys"][number], (props: OsIconProps) => JSX.Element> = {
  debian: DebianIcon,
  linux: LinuxIcon,
  mint: MintIcon,
  ubuntu: UbuntuIcon,
  windows: WindowsIcon,
};

const heroOsLogos = [
  {
    icon: WindowsIcon,
    label: "Windows",
  },
  {
    icon: UbuntuIcon,
    label: "Ubuntu",
  },
  {
    icon: MintIcon,
    label: "Linux Mint",
  },
  {
    icon: DebianIcon,
    label: "Debian",
  },
] as const;

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const heroMockupRef = useRef<HTMLDivElement>(null);
  const isDownloadsPage = window.location.pathname === ALL_DOWNLOADS_PATH;
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const resetHeroPerspective = () => {
    const mockup = heroMockupRef.current;

    if (!mockup) {
      return;
    }

    mockup.style.setProperty("--hero-rotate-x", "0deg");
    mockup.style.setProperty("--hero-rotate-y", "0deg");
    mockup.style.setProperty("--hero-lift", "0px");
    mockup.style.setProperty("--hero-glare-x", "50%");
    mockup.style.setProperty("--hero-glare-y", "42%");
  };
  const updateHeroPerspective = (event: React.MouseEvent<HTMLDivElement>) => {
    const mockup = heroMockupRef.current;

    if (!mockup || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const bounds = mockup.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const rotateY = (x - 0.5) * 10;
    const rotateX = (0.5 - y) * 8;

    mockup.style.setProperty("--hero-rotate-x", `${rotateX.toFixed(2)}deg`);
    mockup.style.setProperty("--hero-rotate-y", `${rotateY.toFixed(2)}deg`);
    mockup.style.setProperty("--hero-lift", "-4px");
    mockup.style.setProperty("--hero-glare-x", `${(x * 100).toFixed(1)}%`);
    mockup.style.setProperty("--hero-glare-y", `${(y * 100).toFixed(1)}%`);
  };

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
            <button
              className={styles.mobileMenuButton}
              type="button"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-controls="primary-navigation"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            >
              {isMobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
            <div
              className={`${styles.navLinks} ${isMobileMenuOpen ? styles.navLinksOpen : ""}`}
              id="primary-navigation"
            >
              <a href="#features" onClick={closeMobileMenu}>
                <Shapes size={14} aria-hidden="true" />
                Features
              </a>
              <a href={ALL_DOWNLOADS_PATH} onClick={closeMobileMenu}>
                <ArrowDownToLine size={14} aria-hidden="true" />
                Downloads
              </a>
              <a href={SOURCE_CODE_URL} target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
                <Code2 size={14} aria-hidden="true" />
                Source
              </a>
              <a className={styles.starLink} href={SOURCE_CODE_URL} target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
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

              <div className={styles.heroOsLogos} aria-label="Supported operating systems">
                {heroOsLogos.map((os) => {
                  const Icon = os.icon;

                  return <Icon key={os.label} size={26} title={os.label} />;
                })}
              </div>
            </motion.div>

            <motion.div
              className={`${styles.mockupWindow} ${styles.screenshotFrame} ${styles.appShell}`}
              ref={heroMockupRef}
              initial={{ opacity: 0, scale: 0.98, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease: "easeOut" }}
              onMouseMove={updateHeroPerspective}
              onMouseLeave={resetHeroPerspective}
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
            <h2>
              Built for <span className={styles.impactText}>identity-heavy</span> Git workflows.
            </h2>
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

      <HowItWorksSection />

      <section className={styles.section} id="downloads">
        <div className={styles.shell}>
          <DownloadPanel />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function HowItWorksSection() {
  return (
    <section className={styles.howItWorksSection} aria-labelledby="how-it-works-title">
      <div className={`${styles.shell} ${styles.howItWorksShell}`}>
        <div className={styles.howItWorksHeader}>
          <span className={styles.howItWorksEyebrow}>How it works</span>
          <h2 id="how-it-works-title">
            Keep Git and GitHub CLI. Get a <span className={styles.impactText}>simpler</span> workflow.
          </h2>
          <p>
            We build on top of the tools you already use, unify the setup, and turn repetitive
            terminal work into a visual 1-click experience.
          </p>
        </div>

        <div className={styles.howItWorksFlow}>
          <div className={styles.workflowSources} aria-label="Source tools">
            <article className={styles.workflowSourceCard}>
              <span className={styles.workflowIconBox}>
                <GitBranch size={34} aria-hidden="true" />
              </span>
              <div>
                <h3>Git</h3>
                <p>user.name, user.email, git config</p>
              </div>
            </article>

            <article className={styles.workflowSourceCard}>
              <span className={styles.workflowIconBox}>
                <Terminal size={34} aria-hidden="true" />
              </span>
              <div>
                <h3>GitHub CLI</h3>
                <p>auth login, auth status, auth switch</p>
              </div>
            </article>
          </div>

          <div className={styles.workflowInputConnector} aria-hidden="true">
            <span className={styles.workflowInputBranchTop} />
            <span className={styles.workflowInputBranchBottom} />
            <span className={styles.workflowInputTrunk} />
            <span className={styles.workflowInputExit} />
            <span className={styles.workflowInputNodeTop} />
            <span className={styles.workflowInputNodeBottom} />
            <span className={styles.workflowInputNodeJoin} />
            <span className={styles.workflowInputNodeCore} />
          </div>

          <div className={styles.workflowCoreWrap}>
            <motion.div
              className={styles.workflowCore}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <span className={styles.workflowCoreIcon}>
                <BrandIcon size={64} aria-hidden="true" />
              </span>
              <h3>
                Git Identity
                <br />
                Manager Core
              </h3>
              <div className={styles.workflowActions}>
                <span>
                  <Eye size={17} aria-hidden="true" />
                  Read
                </span>
                <span>
                  <Network size={17} aria-hidden="true" />
                  Unify
                </span>
                <span>
                  <Check size={17} aria-hidden="true" />
                  Apply
                </span>
              </div>
            </motion.div>
            <span className={styles.workflowConnectorRight} aria-hidden="true" />
          </div>

          <div className={styles.workflowOutput}>
            <div className={styles.workflowWindow} aria-hidden="true">
              <div className={styles.workflowWindowBar}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.workflowWindowBody}>
                <aside className={styles.workflowWindowSidebar}>
                  <UserRoundCog size={30} aria-hidden="true" />
                  <span />
                  <span />
                </aside>
                <div className={styles.workflowWindowCards}>
                  <div className={styles.workflowWindowCard}>
                    <span />
                    <small />
                  </div>
                  <div className={`${styles.workflowWindowCard} ${styles.workflowWindowCardActive}`}>
                    <span />
                    <small />
                    <Check size={18} aria-hidden="true" />
                  </div>
                  <div className={styles.workflowWindowCard}>
                    <span />
                    <small />
                  </div>
                </div>
              </div>
            </div>
            <strong>1-click desktop UI</strong>
          </div>
        </div>

        <p className={styles.workflowTagline}>
          <span>
            <Zap size={24} aria-hidden="true" />
          </span>
          Less repetition. More clarity. Faster switching.
        </p>
      </div>
    </section>
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
            Back
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
            <span className={styles.releaseBadge}>LTS</span>
            <span className={styles.releaseDivider} aria-hidden="true" />
            <span className={styles.releaseRecommendation}>Recommended for most users</span>
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
  return (
    <a
      className={variant === "primary" ? styles.primaryPill : styles.downloadPill}
      href={download.href}
    >
      <span className={styles.downloadIconGroup} aria-hidden="true">
        {download.iconKeys.map((iconKey) => {
          const Icon = downloadIcons[iconKey];

          return <Icon key={iconKey} size={20} />;
        })}
      </span>
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
