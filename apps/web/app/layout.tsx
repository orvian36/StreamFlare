import type { Metadata } from "next";
import { AuthProvider } from "../context/auth-context";
import StyledComponentsRegistry from "../lib/registry";
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
          <AuthProvider>{children}</AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
