import { Outlet, useLocation } from "react-router";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

function RoutedLayout() {
  const location = useLocation();
  const showHeader = location.pathname !== "/";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
      storageKey="vite-ui-theme"
    >
      <div
        className={showHeader ? "grid h-svh overflow-hidden grid-rows-[auto_1fr]" : "h-svh overflow-hidden"}
      >
        {showHeader ? <Header /> : null}
        <Outlet />
      </div>
      <Toaster richColors />
    </ThemeProvider>
  );
}

export default function AppShell() {
  return <RoutedLayout />;
}
