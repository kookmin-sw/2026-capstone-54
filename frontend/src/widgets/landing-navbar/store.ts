import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface NavbarState {
  isMobileDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useNavbarStore = create<NavbarState>()(
  devtools(
    (set) => ({
      isMobileDrawerOpen: false,
      openDrawer: () => set({ isMobileDrawerOpen: true }),
      closeDrawer: () => set({ isMobileDrawerOpen: false }),
      toggleDrawer: () =>
        set((s) => ({ isMobileDrawerOpen: !s.isMobileDrawerOpen })),
    }),
    { name: "widget/landing-navbar" }
  )
);
