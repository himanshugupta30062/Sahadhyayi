import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  Info,
  MapPin,
  MessageSquare,
  Bookmark,
  BrainCircuit,
  Star,
  UsersRound,
  BookOpenText,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Sun,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/authHelpers";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { EnhancedLazyImage } from "@/components/ui/EnhancedLazyImage";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const ContactFormDialog = lazy(() => import("@/components/ContactFormDialog"));
const AuthenticatedUserDropdown = lazy(() => import("@/components/AuthenticatedUserDropdown"));

const EnhancedGlobalSearch = lazy(() =>
  import("@/components/EnhancedGlobalSearch").then(({ EnhancedGlobalSearch }) => ({ default: EnhancedGlobalSearch }))
);
const MessageDropdown = lazy(() =>
  import("@/components/messages/MessageDropdown").then(({ MessageDropdown }) => ({ default: MessageDropdown }))
);
const NotificationDropdown = lazy(() =>
  import("@/components/notifications/NotificationDropdown").then(({ NotificationDropdown }) => ({ default: NotificationDropdown }))
);

type NavigationItem = {
  name: string;
  href: string;
  authOnly?: boolean;
  disabled?: boolean;
  tourTarget?: string;
  children?: NavigationItem[];
};

type NavigationSection = {
  name: string;
  href: string;
  items: NavigationItem[];
};

const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    name: "Library",
    href: "/library",
    items: [
      { name: "Library", href: "/library", tourTarget: "library" },
      { name: "Research Papers", href: "/research-papers" },
      { name: "My Bookshelf", href: "/bookshelf", authOnly: true },
      { name: "Publish Book", href: "/publish", authOnly: true },
      { name: "My Publications", href: "/my-publications", authOnly: true },
    ],
  },
  {
    name: "Social",
    href: "/social",
    items: [
      { name: "Friends Feed", href: "/social", tourTarget: "community" },
      { name: "Discover Friends", href: "/social?tab=friends" },
      { name: "Reading Groups", href: "/groups" },
      { name: "Saved Discussions", href: "/groups/saved-discussions", authOnly: true },
      { name: "Reader Map", href: "/map" },
      { name: "Book Discussions", href: "/social?tab=threads" },
      { name: "Reading Rooms", href: "/social?tab=rooms" },
      { name: "Book Reviews", href: "/social?tab=reviews" },
      { name: "Shared Marginalia", href: "/social?tab=margins" },
      { name: "Reading DNA", href: "/social?tab=dna" },
    ],
  },
  {
    name: "Read & Write",
    href: "/articles",
    items: [
      { name: "Articles", href: "/articles", tourTarget: "articles" },
      { name: "Stories & Serials", href: "/stories" },
      { name: "Life Stories & Memoirs", href: "/life-stories" },
      { name: "Newsroom", href: "/news" },
      { name: "Blogs", href: "/blog" },
      { name: "Quotes", href: "/quotes" },
      { name: "My Articles", href: "/articles/my", authOnly: true },
      { name: "Write Article", href: "/articles/write", authOnly: true },
    ],
  },
  {
    name: "Authors",
    href: "/authors",
    items: [
      { name: "Authors", href: "/authors" },
      { name: "Reviewers & Critics", href: "/reviewers-critics" },
      { name: "Scientists", href: "/scientists" },
      { name: "Social Activists", href: "/social-activists" },
      { name: "Freedom Fighters", href: "/freedom-fighters" },
      { name: "Author Connect", href: "/author-connect" },
    ],
  },
  {
    name: "Activity",
    href: "/activity",
    items: [
      { name: "Activity Hub", href: "/activity" },
      { name: "Events & Festivals", href: "/events" },
      { name: "Reading Challenges", href: "/activity?tab=challenges" },
      { name: "Book Games", href: "/games" },
      { name: "Reader Meetups", href: "/activity?tab=meetups" },
    ],
  },
];

const PUBLIC_NAVIGATION_SECTIONS: NavigationSection[] = [
  NAVIGATION_SECTIONS[0],
  NAVIGATION_SECTIONS[1],
  NAVIGATION_SECTIONS[2],
  NAVIGATION_SECTIONS[3],
  NAVIGATION_SECTIONS[4],
];

const SOCIAL_ITEM_ICONS: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "Friends Feed": UsersRound,
  "Discover Friends": Users,
  "Reader Map": MapPin,
  "Reading Groups": BookOpen,
  "Reading Rooms": MessageCircle,
  "Shared Marginalia": BookOpenText,
  "Reading DNA": BrainCircuit,
  "Book Discussions": MessageSquare,
  "Book Reviews": Star,
  "Saved Discussions": Bookmark,
};

const SOCIAL_MENU_GROUPS = [
  {
    title: "Connect",
    description: "Your reader network",
    names: ["Friends Feed", "Discover Friends", "Reader Map"],
  },
  {
    title: "Reading Spaces",
    description: "Read together",
    names: ["Reading Groups", "Reading Rooms", "Shared Marginalia", "Reading DNA"],
  },
  {
    title: "Book Talk",
    description: "Exchange ideas",
    names: ["Book Discussions", "Book Reviews", "Saved Discussions"],
  },
];

const PEOPLE_AND_MORE: NavigationItem[] = [
  { name: "Newsroom", href: "/news" },
  { name: "Blogs", href: "/blog" },
  { name: "Quotes", href: "/quotes" },
  { name: "My Articles", href: "/articles/my", authOnly: true },
  { name: "Write Article", href: "/articles/write", authOnly: true },
  { name: "Scientists", href: "/scientists" },
  { name: "Publishers", href: "/publishers" },
  { name: "Author Connect", href: "/author-connect" },
  { name: "About Sahadhyayi", href: "/about" },
  { name: "Investors", href: "/investors" },
  { name: "Help Center", href: "/help-center" },
  { name: "Feedback", href: "/feedback" },
  { name: "Community Guidelines", href: "/community-guidelines" },
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Service", href: "/terms-of-service" },
  { name: "Cookie Policy", href: "/cookie-policy" },
  { name: "DMCA", href: "/dmca" },
  { name: "Open Source Licenses", href: "/open-source-licenses" },
];

function getUserInitials(nameOrEmail?: string | null) {
  if (!nameOrEmail || typeof nameOrEmail !== "string") return "U";
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return "U";
  const parts = trimmed.split(" ");
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.charAt(0).toUpperCase();
}

function pathMatches(pathname: string, href: string) {
  const path = href.split("?")[0];

  if (path === "/") return pathname === "/";
  if (path === "/authors") {
    return pathname === path ||
      pathname.startsWith("/authors/") ||
      pathname.startsWith("/author/") ||
      pathname.startsWith("/author-profile/");
  }
  if (path === "/scientists") {
    return pathname === path || pathname.startsWith("/scientists/");
  }
  if (path === "/library") {
    return pathname === path ||
      pathname.startsWith("/library/") ||
      pathname.startsWith("/book/") ||
      pathname.startsWith("/books/") ||
      pathname.startsWith("/reader/");
  }
  if (path === "/social") {
    return pathname === path || pathname.startsWith("/stories") || pathname.startsWith("/groups");
  }
  if (path === "/activity") {
    return (
      pathname === path ||
      pathname.startsWith("/events") ||
      pathname.startsWith("/games")
    );
  }
  return pathname === path || pathname.startsWith(path + "/");
}

function isNavigationItemActive(pathname: string, search: string, href: string) {
  const [path, queryString] = href.split("?");
  if (!pathMatches(pathname, path)) return false;

  const current = new URLSearchParams(search);
  if (!queryString) {
    if (path === "/social" && current.has("tab") && current.get("tab") !== "feed") {
      return false;
    }
    if (path === "/activity" && current.has("tab") && current.get("tab") !== "hub") {
      return false;
    }
    return true;
  }

  const expected = new URLSearchParams(queryString);
  for (const [key, value] of expected.entries()) {
    if (key === "tab" && value === "feed" && !current.has("tab")) continue;
    if (current.get(key) !== value) return false;
  }
  return true;
}

const NAVIGATION_ORDER = ["Library", "Social", "Read & Write", "Authors", "Activity"];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const closeDesktopMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDesktopMenuCloseTimer = useCallback(() => {
    if (closeDesktopMenuTimer.current !== null) {
      clearTimeout(closeDesktopMenuTimer.current);
      closeDesktopMenuTimer.current = null;
    }
  }, []);

  const openDesktopMenuByKey = useCallback((key: string) => {
    clearDesktopMenuCloseTimer();
    setOpenDesktopMenu(key);
  }, [clearDesktopMenuCloseTimer]);

  const scheduleDesktopMenuClose = useCallback((key: string) => {
    clearDesktopMenuCloseTimer();
    closeDesktopMenuTimer.current = setTimeout(() => {
      setOpenDesktopMenu((current) => current === key ? null : current);
      closeDesktopMenuTimer.current = null;
    }, 150);
  }, [clearDesktopMenuCloseTimer]);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [contactDialogRequested, setContactDialogRequested] = useState(false);
  const [expandedPublicSections, setExpandedPublicSections] = useState<Record<string, boolean>>({});
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Keep the relevant Social destinations visible when readers open navigation
  // from a Social page, without expanding unrelated sections.
  useEffect(() => {
    if (!isOpen) return;
    const onSocialRoute =
      location.pathname === "/social" ||
      location.pathname.startsWith("/groups") ||
      location.pathname === "/map";
    if (!onSocialRoute) return;
    const socialKey = user ? "signed-in.social" : "section.social";
    setExpandedPublicSections((current) =>
      current[socialKey] ? current : { ...current, [socialKey]: true }
    );
  }, [isOpen, location.pathname, user]);

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Reader";

  const desktopSections = useMemo(() => {
    const sections = user
      ? [...NAVIGATION_SECTIONS]
      : [...PUBLIC_NAVIGATION_SECTIONS];

    return sections
      .sort((a, b) => NAVIGATION_ORDER.indexOf(a.name) - NAVIGATION_ORDER.indexOf(b.name))
      .map((section) => ({
        key: section.name.toLowerCase().replace(/\s+/g, "-"),
        label: section.name,
        section,
        tourTarget: section.items[0]?.tourTarget,
      }));
  }, [user]);

  useEffect(() => () => {
    clearDesktopMenuCloseTimer();
  }, [clearDesktopMenuCloseTimer]);

  useEffect(() => {
    if (user) setContactDialogRequested(false);
  }, [user]);

  useEffect(() => {
    clearDesktopMenuCloseTimer();
    setIsOpen(false);
    setOpenDesktopMenu(null);
  }, [location.pathname, location.search, clearDesktopMenuCloseTimer]);

  useEffect(() => {
    const handleScroll = () => {
      const nextScrolled = window.scrollY > 20;
      setScrolled((previous) => (previous === nextScrolled ? previous : nextScrolled));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.warn("Sign out notice:", error);
    } finally {
      setIsOpen(false);
      navigate("/signin");
    }
  };

  const isCurrentRoute = (href: string) => {
    if (href === "/dashboard" && user && location.pathname === "/") return true;
    return isNavigationItemActive(location.pathname, location.search, href);
  };

  const handleDesktopNavigationClick = (href: string) => {
    setOpenDesktopMenu(null);
    const [targetPath, targetQuery = ""] = href.split("?");
    const targetSearch = targetQuery ? `?${targetQuery}` : "";
    if (location.pathname === targetPath && location.search === targetSearch) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isNavigationEntryActive = (item: NavigationItem): boolean =>
    (!item.disabled && isCurrentRoute(item.href)) ||
    Boolean(item.children?.some(isNavigationEntryActive));

  const isSectionActive = (section: NavigationSection) =>
    isCurrentRoute(section.href) || section.items.some(isNavigationEntryActive);

  const visibleItems = (items: NavigationItem[]) =>
    items.filter((item) => !item.authOnly || Boolean(user));

  const contactButton = (onClick?: () => void) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="border-border text-foreground hover:bg-muted font-medium"
    >
      <MessageCircle className="mr-1.5 h-4 w-4" />
      Contact Us
    </Button>
  );

  const renderDrawerLink = (item: NavigationItem) => {
    const section = NAVIGATION_SECTIONS.find((entry) => entry.name === item.name);
    const active = isCurrentRoute(item.href) || Boolean(section?.items.some(isNavigationEntryActive));
    const SocialItemIcon = SOCIAL_ITEM_ICONS[item.name];
    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={() => {
          setIsOpen(false);
          setExpandedPublicSections({});
          if (active) window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        data-tour-target={item.tourTarget}
        aria-current={active ? "page" : undefined}
        className={
          "flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm transition-colors " +
          (active
            ? "bg-[hsl(var(--brand-primary)/0.10)] font-semibold text-[hsl(var(--brand-primary))]"
            : "text-foreground hover:bg-muted hover:text-[hsl(var(--brand-primary))]")
        }
      >
        {SocialItemIcon && <SocialItemIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        <span className="min-w-0">{item.name}</span>
      </Link>
    );
  };

  const renderDrawerSectionHeading = (
    section: NavigationSection,
    expanded: boolean,
    panelId: string,
    onToggle: () => void,
  ) => (
    <div className="flex items-center gap-1">
      <div className="min-w-0 flex-1">
        {renderDrawerLink({
          name: section.name,
          href: section.href,
          tourTarget: section.items[0]?.tourTarget,
        })}
      </div>
      <button
        type="button"
        aria-label={section.name + " submenu"}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronDown className={"h-4 w-4 transition-transform " + (expanded ? "rotate-180" : "")} aria-hidden="true" />
      </button>
    </div>
  );

  const renderDrawerSection = (section: NavigationSection) => {
    const disclosureKey = "signed-in." + section.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const panelId = "signed-in-nav-" + disclosureKey.replace(/[^a-z0-9-]/g, "");
    const expanded = Boolean(expandedPublicSections[disclosureKey]);
    return (
      <div key={section.name} className="border-b border-border/70 py-1">
        {renderDrawerSectionHeading(
          section,
          expanded,
          panelId,
          () => setExpandedPublicSections((current) => ({ ...current, [disclosureKey]: !current[disclosureKey] })),
        )}
        <div id={panelId} hidden={!expanded} className="space-y-0.5 border-l-2 border-border py-1 pl-2">
          {section.name === "Social" ? SOCIAL_MENU_GROUPS.map((group) => {
            const items = visibleItems(section.items).filter((item) => group.names.includes(item.name));
            if (!items.length) return null;
            return (
              <div key={group.title} className="py-1">
                <p className="px-3 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</p><p className="px-3 pb-1 text-[11px] leading-relaxed text-muted-foreground/75">{group.description}</p>
                {items.map(renderDrawerLink)}
              </div>
            );
          }) : visibleItems(section.items).filter((item) => item.href !== section.href).map(renderDrawerLink)}
        </div>
      </div>
    );
  };

  const publicNavKey = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const togglePublicSection = (key: string) =>
    setExpandedPublicSections((current) => ({ ...current, [key]: !current[key] }));

  const renderPublicDrawerItem = (item: NavigationItem, parentKey = "public"): React.ReactNode => {
    if (item.disabled) {
      return (
        <div key={parentKey + "-" + publicNavKey(item.name)} aria-disabled="true" className="flex min-h-[44px] items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60">
          <span>{item.name}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide">Coming soon</span>
        </div>
      );
    }

    if (item.children?.length) {
      const disclosureKey = parentKey + "." + publicNavKey(item.name);
      const panelId = "public-nav-" + publicNavKey(disclosureKey);
      const expanded = Boolean(expandedPublicSections[disclosureKey]);
      return (
        <div key={disclosureKey} className="rounded-md">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => togglePublicSection(disclosureKey)}
            className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {item.name}
            <ChevronDown className={"h-4 w-4 shrink-0 transition-transform " + (expanded ? "rotate-180" : "")} aria-hidden="true" />
          </button>
          <div id={panelId} hidden={!expanded} className="ml-3 space-y-0.5 border-l-2 border-border py-1 pl-2">
            {item.children.map((child) => renderPublicDrawerItem(child, disclosureKey))}
          </div>
        </div>
      );
    }

    return renderDrawerLink(item);
  };

  const renderPublicDrawerSection = (section: NavigationSection) => {
    const disclosureKey = "section." + publicNavKey(section.name);
    const panelId = "public-nav-" + publicNavKey(disclosureKey);
    const expanded = Boolean(expandedPublicSections[disclosureKey]);
    return (
      <div key={section.name} className="border-b border-border/70 py-1">
        {renderDrawerSectionHeading(
          section,
          expanded,
          panelId,
          () => togglePublicSection(disclosureKey),
        )}
        <div id={panelId} hidden={!expanded} className="mt-1 max-h-96 overflow-y-auto rounded-md border-l-2 border-border bg-muted/20 py-1 pl-2">
          <div className="space-y-0.5">
            {section.name === "Social" ? SOCIAL_MENU_GROUPS.map((group) => {
              const items = section.items.filter((item) => group.names.includes(item.name) && (!item.authOnly || Boolean(user)));
              if (!items.length) return null;
              return (
                <div key={group.title} className="py-1">
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</p>
                  <p className="px-3 pb-1 text-[11px] leading-relaxed text-muted-foreground/75">{group.description}</p>
                  {items.map((item) => renderPublicDrawerItem(item, disclosureKey))}
                </div>
              );
            }) : section.items.map((item) => renderPublicDrawerItem(item, disclosureKey))}
          </div>
        </div>
      </div>
    );
  };

  if (location.pathname.startsWith("/admin")) return null;

  const homeHref = user ? "/dashboard" : "/";
  const homeLabel = user ? "Dashboard" : "Home";

  return (
    <>
      <header
        className={
          "fixed left-0 right-0 top-0 z-[120] border-b transition-all duration-300 " +
          (scrolled
            ? "border-border bg-background/95 shadow-xs backdrop-blur-md"
            : "border-border/40 bg-background/85 backdrop-blur-sm")
        }
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="flex min-h-16 items-center gap-2 lg:gap-3">
            {!isMobile ? (
              <SidebarTrigger
                aria-label="Toggle left navigation"
                title="Toggle left navigation"
                className="min-h-11 min-w-11 h-11 w-11 shrink-0 rounded-lg text-foreground hover:bg-muted"
              />
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen((current) => !current)}
                aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isOpen}
                aria-controls="site-navigation-drawer"
                ref={menuButtonRef}
                className="min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 text-foreground hover:bg-muted"
              >
                {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </Button>
            )}

            <Link
              to={homeHref}
              className="flex shrink-0 items-center space-x-2 font-bold text-xl text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 xl:text-2xl"
              aria-label="Sahadhyayi Home"
            >
              <EnhancedLazyImage
                src="/brand/sahadhyayi-connected-readers.svg"
                alt=""
                aria-hidden="true"
                className="h-8 w-8 shrink-0"
                width={32}
                height={32}
              />
              <span className="whitespace-nowrap leading-none">Sahadhyayi</span>
            </Link>

              {!isMobile && (
              <>
                <nav
                aria-label="Main navigation"
                className="ml-2 flex min-w-0 flex-1 items-center justify-center gap-1 xl:gap-2"
              >
                <Link
                  to={homeHref}
                  onClick={() => handleDesktopNavigationClick(homeHref)}
                  aria-current={isCurrentRoute(homeHref) ? "page" : undefined}
                  className={
                    "min-h-10 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted " +
                    (isCurrentRoute(homeHref)
                      ? "text-[hsl(var(--brand-primary))]"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {homeLabel}
                </Link>

                {desktopSections.map(({ key, label, section, tourTarget }) => (
                  <DropdownMenu
                    key={key}
                    modal={false}
                    open={openDesktopMenu === key}
                    onOpenChange={(open) => {
                      clearDesktopMenuCloseTimer();
                      if (open) {
                        openDesktopMenuByKey(key);
                      } else {
                        setOpenDesktopMenu((current) => current === key ? null : current);
                      }
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        onMouseEnter={() => openDesktopMenuByKey(key)}
                        onMouseLeave={() => scheduleDesktopMenuClose(key)}
                        data-tour-target={tourTarget}
                        aria-haspopup="menu"
                        aria-expanded={openDesktopMenu === key}
                        className={
                          "inline-flex min-h-10 items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                          (isSectionActive(section)
                            ? "text-[hsl(var(--brand-primary))]"
                            : "text-muted-foreground hover:text-foreground")
                        }
                      >
                        {label}
                        <ChevronDown
                          className={"h-3.5 w-3.5 transition-transform duration-200 " + (openDesktopMenu === key ? "rotate-180" : "")}
                          aria-hidden="true"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      onMouseEnter={clearDesktopMenuCloseTimer}
                      onMouseLeave={() => scheduleDesktopMenuClose(key)}
                      align="start"
                      side="bottom"
                      sideOffset={6}
                      avoidCollisions={true}
                      collisionPadding={12}
                      className={"z-[60] max-h-[min(75vh,600px)] overflow-y-auto rounded-xl border border-border/80 bg-popover/95 p-3 shadow-2xl backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-1 data-[state=closed]:slide-out-to-top-1 duration-150 " + (key === "social" || key === "social-media" || key === "activity" ? "w-[min(760px,calc(100vw-2rem))]" : "w-64")}
                    >
                      <div className="mb-3 overflow-hidden rounded-lg border border-[hsl(var(--brand-primary)/0.18)] bg-gradient-to-r from-[hsl(var(--brand-primary)/0.12)] via-[hsl(var(--brand-primary)/0.06)] to-transparent px-3 py-2.5">
                        <p className="text-sm font-bold tracking-tight text-foreground">{section.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {key === "social" || key === "social-media"
                            ? "Connect, read stories, meet readers and join discussions"
                            : key === "activity"
                            ? "Events, challenges, reading groups, meetups and games"
                            : key === "library"
                            ? "Browse the library, publications and research papers"
                            : key === "read-write"
                            ? "Read articles and stories, or share your own writing"
                            : "Meet the authors, critics and thinkers shaping ideas"}
                        </p>
                      </div>
                      {key === "social" || key === "social-media" ? (() => {
                        const socialItems = visibleItems(section.items);
                        return (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
                            {SOCIAL_MENU_GROUPS.map((group) => {
                              const items = socialItems.filter((item) => group.names.includes(item.name));
                              if (!items.length) return null;
                              return (
                                <section key={group.title} className="min-w-0 rounded-lg border border-border/60 bg-card/50 p-2.5 transition-colors hover:border-[hsl(var(--brand-primary)/0.25)]">
                                  <h3 className="pb-1 text-xs font-bold uppercase tracking-wider text-[hsl(var(--brand-primary))]">{group.title}</h3>
                                  <p className="pb-2 text-xs text-muted-foreground">{group.description}</p>
                                  <div className="space-y-1">
                                    {items.map((item) => {
                                      const active = isCurrentRoute(item.href);
                                      const SocialItemIcon = SOCIAL_ITEM_ICONS[item.name];
                                      return (
                                        <DropdownMenuItem key={item.name} asChild>
                                          <Link
                                            to={item.href}
                                            onClick={() => handleDesktopNavigationClick(item.href)}
                                            data-tour-target={item.tourTarget}
                                            aria-current={active ? "page" : undefined}
                                            className={"flex min-h-10 cursor-pointer items-center rounded-md px-2.5 py-2 text-sm transition-colors " + (active
                                              ? "bg-[hsl(var(--brand-primary)/0.10)] font-semibold text-[hsl(var(--brand-primary))]"
                                              : "text-foreground hover:bg-muted")}
                                          >
                                            {SocialItemIcon && <SocialItemIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                                            <span>{item.name}</span>
                                          </Link>
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </div>
                                </section>
                              );
                            })}
                          </div>
                        );
                      })() : key === "activity" ? (() => {
                        const activityItems = visibleItems(section.items);
                        const groups = [
                          { title: "Hub & Gatherings", description: "Central home and local meetups", names: ["Activity Hub", "Reader Meetups"] },
                          { title: "Events & Festivals", description: "Literary sessions and festivals", names: ["Events & Festivals"] },
                          { title: "Challenges & Games", description: "Milestones and book trivia", names: ["Reading Challenges", "Book Games"] },
                        ];
                        const validGroups = groups
                          .map((group) => ({
                            ...group,
                            items: activityItems.filter((item) => group.names.includes(item.name)),
                          }))
                          .filter((group) => group.items.length > 0);

                        return (
                          <div className={cn(
                            "grid grid-cols-1 gap-3 sm:grid-cols-2",
                            validGroups.length <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
                          )}>
                            {validGroups.map((group) => (
                              <section key={group.title} className="min-w-0 rounded-lg border border-border/70 bg-card/70 p-2.5 shadow-sm transition-colors hover:border-[hsl(var(--brand-primary)/0.28)]">
                                <h3 className="px-1 pb-1 text-xs font-bold uppercase tracking-wider text-[hsl(var(--brand-primary))]">{group.title}</h3>
                                <p className="px-1 pb-2 text-xs leading-relaxed text-muted-foreground/80">{group.description}</p>
                                <div className="space-y-0.5">
                                  {group.items.map((item) => {
                                    const active = isCurrentRoute(item.href);
                                    return (
                                      <DropdownMenuItem key={item.name} asChild>
                                        <Link
                                          to={item.href}
                                          onClick={() => handleDesktopNavigationClick(item.href)}
                                          data-tour-target={item.tourTarget}
                                          aria-current={active ? "page" : undefined}
                                          className={
                                            "flex min-h-10 cursor-pointer items-center rounded-lg px-2 py-2 text-sm transition-colors " +
                                            (active
                                              ? "bg-[hsl(var(--brand-primary)/0.10)] font-semibold text-[hsl(var(--brand-primary))]"
                                              : "text-foreground hover:bg-muted")
                                          }
                                        >
                                          {item.name}
                                        </Link>
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </div>
                              </section>
                            ))}
                          </div>
                        );
                      })() : (
                        <div>
                          {(visibleItems(section.items).some((item) => item.href === section.href)
                            ? visibleItems(section.items)
                            : [{ name: section.name, href: section.href, tourTarget }, ...visibleItems(section.items)]
                          ).map((item) => {
                            const active = isCurrentRoute(item.href);
                            return (
                              <DropdownMenuItem key={item.name} asChild>
                                <Link
                                  to={item.href}
                                  onClick={() => handleDesktopNavigationClick(item.href)}
                                  data-tour-target={item.tourTarget}
                                  aria-current={active ? "page" : undefined}
                                  className={
                                    "flex min-h-10 cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-colors " +
                                    (active
                                      ? "bg-[hsl(var(--brand-primary)/0.10)] font-semibold text-[hsl(var(--brand-primary))]"
                                      : "text-foreground hover:bg-muted")
                                  }
                                >
                                  {item.name}
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </nav>
              </>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/40 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Search Sahadhyayi"
                title="Search Sahadhyayi"
                data-tour-target="search"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={"Switch to " + (theme === "dark" ? "light" : "dark") + " mode"}
                title={"Switch to " + (theme === "dark" ? "light" : "dark") + " mode"}
                className="min-h-[44px] min-w-[44px] h-11 w-11 text-foreground hover:bg-muted"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-700" />
                )}
              </Button>

              {user ? (
                <>
                  {!isMobile && (
                    <>
                      <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                        <MessageDropdown />
                      </Suspense>
                      <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                        <NotificationDropdown />
                      </Suspense>
                      <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                        <AuthenticatedUserDropdown
                          user={user}
                          userDisplayName={userDisplayName}
                          onSignOut={handleSignOut}
                        />
                      </Suspense>
                    </>
                  )}
                </>
              ) : (
                <>
                  {!isMobile && (
                    <>
                      {contactDialogRequested ? (
                        <Suspense fallback={contactButton(() => setContactDialogRequested(true))}>
                          <ContactFormDialog initialOpen trigger={contactButton()} />
                        </Suspense>
                      ) : (
                        contactButton(() => setContactDialogRequested(true))
                      )}
                      <Link to="/signin">
                        <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 font-medium text-white hover:from-amber-700 hover:to-orange-700">
                          Sign In
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu: retain the earlier full-width dropdown-panel design. */}
      {isMobile && isOpen && (
        <div className="fixed inset-x-0 top-16 z-[119] max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background shadow-xl">
          <nav id="site-navigation-drawer" aria-label="Mobile navigation" className="mx-auto max-w-7xl px-3 py-3 sm:px-4">
            <button
              type="button"
              onClick={() => { setIsOpen(false); setSearchOpen(true); }}
              className="mb-3 flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-border/70 bg-muted/50 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Search Sahadhyayi"
              data-tour-target="search"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search books & authors...
            </button>

            {user && (
              <Link to="/profile" onClick={() => setIsOpen(false)} className="mb-3 flex min-h-[64px] items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 transition-colors hover:bg-muted">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={userDisplayName} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 font-medium text-white">{getUserInitials(user.user_metadata?.full_name || user?.email)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{userDisplayName}</p><p className="truncate text-xs text-muted-foreground">View profile</p></div>
                <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" aria-hidden="true" />
              </Link>
            )}
            <div className="space-y-1">
              {renderDrawerLink({ name: homeLabel, href: homeHref })}
              {user ? (
                <>
                  {[...NAVIGATION_SECTIONS].sort((a, b) => NAVIGATION_ORDER.indexOf(a.name) - NAVIGATION_ORDER.indexOf(b.name)).map(renderDrawerSection)}
                  {renderPublicDrawerItem({ name: "Explore More", href: "/articles", children: PEOPLE_AND_MORE }, "authenticated-more")}
                </>
              ) : (
                <>
                  {[...PUBLIC_NAVIGATION_SECTIONS].sort((a, b) => NAVIGATION_ORDER.indexOf(a.name) - NAVIGATION_ORDER.indexOf(b.name)).map(renderPublicDrawerSection)}
                  {renderPublicDrawerItem({ name: "Explore More", href: "/articles", children: PEOPLE_AND_MORE }, "public-more")}
                </>
              )}
            </div>

            {user ? (
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={userDisplayName} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 font-medium text-white">
                      {getUserInitials(user.user_metadata?.full_name || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{userDisplayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email || 'Reader'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {renderDrawerLink({ name: "Notifications", href: "/notifications" })}
                  {renderDrawerLink({ name: "Messages", href: "/messages" })}
                  {renderDrawerLink({ name: "My Bookshelf", href: "/bookshelf" })}
                  {renderDrawerLink({ name: "My Articles", href: "/articles/my" })}
                  {renderDrawerLink({ name: "My Publications", href: "/my-publications" })}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 flex min-h-[44px] w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <Button asChild size="sm" className="min-h-[44px] flex-1">
                  <Link to="/signin" onClick={() => setIsOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="min-h-[44px] flex-1">
                  <Link to="/signup" onClick={() => setIsOpen(false)}>Sign up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}

      {searchOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[15vh]" role="status" aria-label="Loading search"><div className="rounded-xl border border-border bg-background px-5 py-4 text-sm text-muted-foreground shadow-xl">Opening search…</div></div>}>
          <EnhancedGlobalSearch isOpen onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default Navigation;
