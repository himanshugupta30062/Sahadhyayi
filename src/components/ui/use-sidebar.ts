import React from "react"

export type SidebarContextValue = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

export const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    return {
      state: "expanded" as const,
      open: true,
      setOpen: () => {},
      openMobile: false,
      setOpenMobile: () => {},
      isMobile: false,
      toggleSidebar: () => {},
    }
  }
  return context
}
