import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  Info,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Sun,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/authHelpers";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { EnhancedLazyImage } from "@/components/ui/EnhancedLazyImage";
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
      { name: "Book Library", href: "/book-library" },
      { name: "Discover Books", href: "/discovery" },
      { name: "My Bookshelf", href: "/bookshelf", authOnly: true },
      { name: "Publish a Book", href: "/publish", authOnly: true },
      { name: "My Publications", href: "/my-publications", authOnly: true },
    ],
  },
  {
    name: "Articles",
    href: "/articles",
    items: [
      { name: "Articles", href: "/articles", tourTarget: "articles" },
      { name: "Newsroom", href: "/news" },
      { name: "Blogs", href: "/blog" },
      { name: "Quotes", href: "/quotes" },
      { name: "My Articles", href: "/articles/my", authOnly: true },
      { name: "Write Article", href: "/articles/write", authOnly: true },
    ],
  },
  {
    name: "Social Media",
    href: "/social",
    items: [
      { name: "Community Feed", href: "/social", tourTarget: "community" },
      { name: "Discover Friends", href: "/social?tab=friends" },
      { name: "Reading Groups", href: "/groups" },
      { name: "Reader's Map", href: "/social?tab=map" },
      { name: "Reader Map by Book", href: "/reader-map" },
      { name: "Book Discussions", href: "/social?tab=threads" },
      { name: "Reading Rooms", href: "/social?tab=rooms" },
      { name: "Shared Marginalia", href: "/social?tab=margins" },
      { name: "Reading DNA", href: "/social?tab=dna" },
      { name: "Community Stories", href: "/community-stories" },
      { name: "Life Stories", href: "/life-stories" },
      { name: "Friends & Readers Map", href: "/map" },
    ],
  },
];

const PUBLIC_NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    name: "Library",
    href: "/library",
    items: [
      { name: "Research Papers", href: "/research-papers" },
    ],
  },
  {
    name: "Social Media",
    href: "/social",
    items: [
      { name: "Feed", href: "/social", tourTarget: "community" },
      { name: "Discover Friends", href: "/social?tab=friends" },
      { name: "Reading Groups", href: "/groups" },
      { name: "Reader's Map", href: "/social?tab=map" },
      {
        name: "Book Discussion",
        href: "/social?tab=threads",
        children: [
          { name: "Book Discussions", href: "/social?tab=threads" },
          { name: "Reading Rooms", href: "/social?tab=rooms" },
          { name: "Shared Marginalia", href: "/social?tab=margins" },
          { name: "Reading DNA", href: "/social?tab=dna" },
        ],
      },
    ],
  },
  {
    name: "Articles",
    href: "/articles",
    items: [
      { name: "Blogs", href: "/blog" },
      { name: "News", href: "/news" },
      { name: "Life Stories", href: "/life-stories", disabled: true },
      { name: "Quotes", href: "/quotes" },
    ],
  },
  {
    name: "Authors",
    href: "/authors",
    items: [
      { name: "Scientists", href: "/scientists" },
      { name: "Social Activists", href: "/social-activists" },
      { name: "Freedom Fighters", href: "/freedom-fighters" },
    ],
  },
];

const PEOPLE_AND_MORE: NavigationItem[] = [
  { name: "Authors", href: "/authors" },
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
  if (path === "/social") return pathname === path;
  return pathname === path || pathname.startsWith(path + "/");
}

function isNavigationItemActive(pathname: string, search: string, href: string) {
  const [path, queryString] = href.split("?");
  if (!pathMatches(pathname, path)) return false;
  if (!queryString) return true;

  const expected = new URLSearchParams(queryString);
  const current = new URLSearchParams(search);
  for (const [key, value] of expected.entries()) {
    if (key === "tab" && value === "feed" && !current.has("tab")) continue;
    if (current.get(key) !== value) return false;
  }
  return true;
}

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [contactDialogRequested, setContactDialogRequested] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Reader";

  useEffect(() => {
    if (user) setContactDialogRequested(false);
  }, [user]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

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
    await signOut();
    setIsOpen(false);
    navigate("/signin");
  };

  const isCurrentRoute = (href: string) => {
    if (href === "/dashboard" && user && location.pathname === "/") return true;
    return isNavigationItemActive(location.pathname, location.search, href);
  };

  const isNavigationItemActive = (item: NavigationItem): boolean =>
    (!item.disabled && isCurrentRoute(item.href)) ||
    Boolean(item.children?.some(isNavigationItemActive));

  const isSectionActive = (section: NavigationSection) =>
    isCurrentRoute(section.href) || section.items.some(isNavigationItemActive);

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
    const active = isCurrentRoute(item.href);
    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={() => setIsOpen(false)}
        data-tour-target={item.tourTarget}
        aria-current={active ? "page" : undefined}
        className={
          "flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm transition-colors " +
          (active
            ? "bg-[hsl(var(--brand-primary)/0.10)] font-semibold text-[hsl(var(--brand-primary))]"
            : "text-foreground hover:bg-muted hover:text-[hsl(var(--brand-primary))]")
        }
      >
        {item.name}
      </Link>
    );
  };

  const renderDrawerSection = (section: NavigationSection) => (
    <div key={section.name} className="relative flex items-start gap-1 rounded-lg border border-border bg-background p-1">
      <div className="min-w-0 flex-1">
        {renderDrawerLink({
          name: section.name,
          href: section.href,
          tourTarget: section.items[0]?.tourTarget,
        })}
      </div>
      <details className="group shrink-0">
        <summary
          aria-label={section.name + " submenu"}
          className="flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden"
        >
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="absolute right-1 top-full z-20 mt-1 max-h-72 w-[min(78vw,320px)] overflow-y-auto rounded-lg border border-border bg-background p-2 shadow-lg">
          {visibleItems(section.items)
            .filter((item) => item.href !== section.href)
            .map(renderDrawerLink)}
        </div>
      </details>
    </div>
  );

  const renderPublicDrawerItem = (item: NavigationItem): React.ReactNode => {
    if (item.disabled) {
      return (
        <div key={item.name} aria-disabled="true" className="flex min-h-[44px] items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60">
          <span>{item.name}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide">Coming soon</span>
        </div>
      );
    }

    if (item.children?.length) {
      return (
        <details key={item.name} className="group rounded-md border border-border/70">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">
            {item.name}
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="space-y-0.5 border-t border-border/70 px-1 py-1.5">
            {item.children.map(renderPublicDrawerItem)}
          </div>
        </details>
      );
    }

    return renderDrawerLink(item);
  };

  const renderPublicDrawerSection = (section: NavigationSection) => (
    <div key={section.name} className="relative flex items-start gap-1 rounded-lg border border-border bg-background p-1">
      <div className="min-w-0 flex-1">
        {renderDrawerLink({
          name: section.name,
          href: section.href,
          tourTarget: section.items[0]?.tourTarget,
        })}
      </div>
      <details className="group shrink-0">
        <summary
          aria-label={section.name + " submenu"}
          className="flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden"
        >
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="absolute right-1 top-full z-20 mt-1 max-h-96 w-[min(78vw,320px)] overflow-y-auto rounded-lg border border-border bg-background p-2 shadow-lg">
          {section.items.map(renderPublicDrawerItem)}
        </div>
      </details>
    </div>
  );

  const renderPublicDropdownItem = (item: NavigationItem): React.ReactNode => {
    if (item.children?.length) {
      return (
        <DropdownMenuSub key={item.name}>
          <DropdownMenuSubTrigger>{item.name}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 p-2">
            {item.children.map(renderPublicDropdownItem)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }

    if (item.disabled) {
      return (
        <DropdownMenuItem key={item.name} disabled className="justify-between gap-3">
          <span>{item.name}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Coming soon</span>
        </DropdownMenuItem>
      );
    }

    return (
      <DropdownMenuItem key={item.name} asChild>
        <Link to={item.href} aria-current={isCurrentRoute(item.href) ? "page" : undefined} className="cursor-pointer">
          {item.name}
        </Link>
      </DropdownMenuItem>
    );
  };

  const renderPublicDesktopSection = (section: NavigationSection, align: "start" | "end" = "start") => (
    <div key={section.name} className="flex shrink-0 items-center gap-0.5">
      <Link
        to={section.href}
        aria-current={isCurrentRoute(section.href) ? "page" : undefined}
        className={
          "min-h-10 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted " +
          (isSectionActive(section)
            ? "text-[hsl(var(--brand-primary))]"
            : "text-muted-foreground hover:text-foreground")
        }
      >
        {section.name}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={section.name + " submenu"}
            className="inline-flex min-h-10 min-w-8 items-center justify-center rounded-md px-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} sideOffset={8} className="w-60 p-2">
          {section.items.map(renderPublicDropdownItem)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (location.pathname.startsWith("/admin")) return null;

  const homeHref = user ? "/dashboard" : "/";
  const homeLabel = user ? "Dashboard" : "Home";

  return (
    <>
      <header
        className={
          "fixed left-0 right-0 top-0 z-40 border-b transition-all duration-300 " +
          (scrolled
            ? "border-border bg-background/95 shadow-xs backdrop-blur-md"
            : "border-border/40 bg-background/85 backdrop-blur-sm")
        }
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
          <div className="flex min-h-16 items-center gap-2 lg:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen((open) => !open)}
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation-menu"
              ref={menuButtonRef}
              className="min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 text-foreground hover:bg-muted"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>

            <Link
              to={homeHref}
              className="flex shrink-0 items-center space-x-2 font-bold text-xl text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 xl:text-2xl"
              aria-label="Sahadhyayi Home"
            >
              <EnhancedLazyImage
                src="/optimized-assets/site-logo.webp"
                alt=""
                aria-hidden="true"
                className="h-8 w-8 shrink-0"
                width={32}
                height={32}
              />
              <span className="whitespace-nowrap leading-none">Sahadhyayi</span>
            </Link>

            {!isMobile && (
              user ? (
                <nav
                aria-label="Main navigation"
                className="ml-2 flex min-w-0 flex-1 items-center justify-center gap-1 xl:gap-2"
              >
                <Link
                  to={homeHref}
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

                <Link
                  to="/library"
                  data-tour-target="library"
                  aria-current={isCurrentRoute("/library") ? "page" : undefined}
                  className={
                    "min-h-10 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted " +
                    (isSectionActive(NAVIGATION_SECTIONS[0])
                      ? "text-[hsl(var(--brand-primary))]"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  Library
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Library submenu"
                      className="inline-flex min-h-10 min-w-8 items-center justify-center rounded-md px-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={8} className="w-60 p-2">
                    {visibleItems(NAVIGATION_SECTIONS[0].items).map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          data-tour-target={item.tourTarget}
                          aria-current={isCurrentRoute(item.href) ? "page" : undefined}
                          className="cursor-pointer"
                        >
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  to="/articles"
                  data-tour-target="articles"
                  aria-current={isCurrentRoute("/articles") ? "page" : undefined}
                  className={
                    "min-h-10 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted " +
                    (isSectionActive(NAVIGATION_SECTIONS[1])
                      ? "text-[hsl(var(--brand-primary))]"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  Articles
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Articles submenu"
                      className="inline-flex min-h-10 min-w-8 items-center justify-center rounded-md px-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={8} className="w-60 p-2">
                    {visibleItems(NAVIGATION_SECTIONS[1].items).map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          data-tour-target={item.tourTarget}
                          aria-current={isCurrentRoute(item.href) ? "page" : undefined}
                          className="cursor-pointer"
                        >
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  to="/games"
                  aria-current={isCurrentRoute("/games") ? "page" : undefined}
                  className={
                    "min-h-10 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted " +
                    (isCurrentRoute("/games")
                      ? "text-[hsl(var(--brand-primary))]"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  Games
                </Link>

                <Link
                  to="/social"
                  data-tour-target="community"
                  aria-current={isCurrentRoute("/social") ? "page" : undefined}
                  className={
                    "min-h-10 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted " +
                    (isSectionActive(NAVIGATION_SECTIONS[2])
                      ? "text-[hsl(var(--brand-primary))]"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  Social Media
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Social Media submenu"
                      className="inline-flex min-h-10 min-w-8 items-center justify-center rounded-md px-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-2">
                    {visibleItems(NAVIGATION_SECTIONS[2].items).map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          data-tour-target={item.tourTarget}
                          aria-current={isCurrentRoute(item.href) ? "page" : undefined}
                          className="cursor-pointer"
                        >
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
              ) : (
                <nav aria-label="Main navigation" className="ml-1 flex min-w-0 flex-1 items-center justify-center gap-0.5 xl:gap-1">
                  <Link
                    to="/"
                    aria-current={isCurrentRoute("/") ? "page" : undefined}
                    className={
                      "min-h-10 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted " +
                      (isCurrentRoute("/") ? "text-[hsl(var(--brand-primary))]" : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    Home
                  </Link>
                  {PUBLIC_NAVIGATION_SECTIONS.map((section, index) =>
                    renderPublicDesktopSection(section, index === PUBLIC_NAVIGATION_SECTIONS.length - 1 ? "end" : "start")
                  )}
                </nav>
              )
            )}

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="group flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-muted/50 text-muted-foreground shadow-2xs transition-colors hover:border-border hover:bg-muted hover:text-foreground xl:w-auto xl:justify-start xl:gap-2 xl:px-3"
                aria-label="Search library and books"
                title="Search library and books"
                data-tour-target="search"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span className="hidden text-xs font-normal text-foreground/80 xl:inline">
                  Search books & authors...
                </span>
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
                      <Link to="/signup">
                        <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 font-medium text-white hover:from-amber-700 hover:to-orange-700">
                          Sign up
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

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className="w-[min(88vw,380px)] overflow-y-auto p-0"
        >
          <SheetHeader className="border-b border-border px-5 py-5 pr-12 text-left">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <EnhancedLazyImage
                src="/optimized-assets/site-logo.webp"
                alt=""
                aria-hidden="true"
                className="h-7 w-7"
                width={28}
                height={28}
              />
              Browse Sahadhyayi
            </SheetTitle>
            <SheetDescription>
              Books, research, stories and the reading community.
            </SheetDescription>
            {user ? (
              <>
                <div className="flex min-w-0 items-center gap-3 pt-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={userDisplayName} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 font-medium text-white">
                      {getUserInitials(user.user_metadata?.full_name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{userDisplayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                {isMobile && (
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-xs font-medium text-muted-foreground">Messages and notifications</span>
                    <div className="flex items-center gap-2">
                      <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                        <MessageDropdown />
                      </Suspense>
                      <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                        <NotificationDropdown />
                      </Suspense>
                    </div>
                  </div>
                )}
                {!isMobile && (
                  <div className="pt-2">
                    <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                      <AuthenticatedUserDropdown
                        user={user}
                        userDisplayName={userDisplayName}
                        onSignOut={handleSignOut}
                      />
                    </Suspense>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2 pt-2">
                {contactButton(() => setContactDialogRequested(true))}
                <Button asChild size="sm" className="flex-1">
                  <Link to="/signup" onClick={() => setIsOpen(false)}>Sign up</Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="flex-1">
                  <Link to="/signin" onClick={() => setIsOpen(false)}>Sign In</Link>
                </Button>
              </div>
            )}
          </SheetHeader>

          <nav id="mobile-navigation-menu" aria-label="Mobile navigation">
            <div className="space-y-2 px-3 py-3">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearchOpen(true);
                }}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Search books, authors, and articles"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Search books, authors and articles
              </button>

              {user ? (
                <>
              {renderDrawerLink({ name: homeLabel, href: homeHref })}

              {renderDrawerSection(NAVIGATION_SECTIONS[0])}
              {renderDrawerSection(NAVIGATION_SECTIONS[1])}
              {renderDrawerLink({ name: "Games", href: "/games" })}
              {renderDrawerSection(NAVIGATION_SECTIONS[2])}
              {renderDrawerLink({ name: "Authors", href: "/authors" })}

              <details className="group overflow-hidden rounded-lg border border-border bg-background">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    More people
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="space-y-0.5 border-t border-border px-2 py-2">
                  {PEOPLE_AND_MORE.slice(1, 4).map(renderDrawerLink)}
                </div>
              </details>

              <details className="group overflow-hidden rounded-lg border border-border bg-background">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <Info className="h-4 w-4" aria-hidden="true" />
                    More from Sahadhyayi
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="space-y-0.5 border-t border-border px-2 py-2">
                  {PEOPLE_AND_MORE.slice(4).map(renderDrawerLink)}
                </div>
              </details>


                </>
              ) : (
                <>
                  {renderDrawerLink({ name: "Home", href: "/" })}
                  {PUBLIC_NAVIGATION_SECTIONS.map(renderPublicDrawerSection)}
                </>
              )}

              {user && isMobile && (
                <div className="space-y-0.5 rounded-lg border border-border p-2">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Your account
                  </p>
                  {renderDrawerLink({ name: "Profile", href: "/profile" })}
                  {renderDrawerLink({ name: "My Bookshelf", href: "/bookshelf" })}
                  {renderDrawerLink({ name: "My Articles", href: "/articles/my" })}
                  {renderDrawerLink({ name: "My Publications", href: "/my-publications" })}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex min-h-[44px] w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {searchOpen && (
        <Suspense fallback={null}>
          <EnhancedGlobalSearch isOpen onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default Navigation;
