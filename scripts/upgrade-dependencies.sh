#!/usr/bin/env bash
set -e

# Safe dependency upgrades (minor/patch versions)
SAFE_PACKAGES=(
  "@radix-ui/react-accordion@1.2.11"
  "@radix-ui/react-alert-dialog@1.1.14"
  "@radix-ui/react-aspect-ratio@1.1.7"
  "@radix-ui/react-avatar@1.1.10"
  "@radix-ui/react-checkbox@1.3.2"
  "@radix-ui/react-collapsible@1.1.11"
  "@radix-ui/react-context-menu@2.2.15"
  "@radix-ui/react-dialog@1.1.14"
  "@radix-ui/react-dropdown-menu@2.1.15"
  "@radix-ui/react-hover-card@1.1.14"
  "@radix-ui/react-label@2.1.7"
  "@radix-ui/react-menubar@1.1.15"
  "@radix-ui/react-navigation-menu@1.2.13"
  "@radix-ui/react-popover@1.1.14"
  "@radix-ui/react-progress@1.1.7"
  "@radix-ui/react-radio-group@1.3.7"
  "@radix-ui/react-scroll-area@1.2.9"
  "@radix-ui/react-select@2.2.5"
  "@radix-ui/react-separator@1.1.7"
  "@radix-ui/react-slider@1.3.5"
  "@radix-ui/react-slot@1.2.3"
  "@radix-ui/react-switch@1.2.5"
  "@radix-ui/react-tabs@1.1.12"
  "@radix-ui/react-toast@1.2.14"
  "@radix-ui/react-toggle@1.1.9"
  "@radix-ui/react-toggle-group@1.1.10"
  "@radix-ui/react-tooltip@1.2.7"
  "@supabase/supabase-js@2.53.0"
  "@tanstack/react-query@5.84.1"
  "cmdk@1.1.1"
  "embla-carousel-react@8.6.0"
  "input-otp@1.4.2"
  "lucide-react@0.536.0"
  "react-hook-form@7.62.0"
  "react-virtualized-auto-sizer@1.0.26"
  "@eslint/js@9.32.0"
  "@tailwindcss/typography@0.5.16"
  "@vitejs/plugin-react-swc@3.11.0"
  "autoprefixer@10.4.21"
  "eslint@9.32.0"
  "eslint-plugin-react-hooks@5.2.0"
  "eslint-plugin-react-refresh@0.4.20"
  "lovable-tagger@1.1.9"
  "postcss@8.5.6"
  "typescript@5.9.2"
  "typescript-eslint@8.39.0"
)

# Risky dependency upgrades (major versions)
RISKY_PACKAGES=(
  "@hookform/resolvers@5.2.1"
  "date-fns@4.1.0"
  "dompurify@3.2.6"
  "dotenv@17.2.1"
  "express@5.1.0"
  "react@19.1.1"
  "react-day-picker@9.8.1"
  "react-dom@19.1.1"
  "react-resizable-panels@3.0.4"
  "react-router-dom@7.7.1"
  "recharts@3.1.0"
  "sonner@2.0.7"
  "tailwind-merge@3.3.1"
  "vaul@1.1.2"
  "zod@4.0.14"
  "@types/node@24.2.0"
  "@types/react@19.1.9"
  "@types/react-dom@19.1.7"
  "globals@16.3.0"
  "tailwindcss@4.1.11"
  "vite@7.0.6"
)

echo "Upgrading safe packages..."
npm install "${SAFE_PACKAGES[@]}"

if npm run lint && npm run build; then
  echo "Safe packages upgraded successfully."
else
  echo "Safe package upgrade failed." >&2
  exit 1
fi

echo

printf '%s\n' "The following packages have major updates and may contain breaking changes:" "${RISKY_PACKAGES[@]}"
read -p "Do you want to upgrade these risky packages? (y/N) " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm install "${RISKY_PACKAGES[@]}"
  npm run lint && npm run build
else
  echo "Skipping risky package upgrades."
fi
