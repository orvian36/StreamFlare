import type { Metadata } from "next";
import { AuthProvider } from "../context/auth-context";
import StyledComponentsRegistry from "../lib/registry";
import { ReducedMotionProvider } from "@streamflare/ui/motion";
import { Toaster } from "@streamflare/ui/components/ui/sonner";
import { fontVariables } from "./fonts";
import "@streamflare/ui/globals.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamFlare",
  description: "Movie streaming app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <StyledComponentsRegistry>
          <ReducedMotionProvider>
            <AuthProvider>{children}</AuthProvider>
          </ReducedMotionProvider>
        </StyledComponentsRegistry>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
