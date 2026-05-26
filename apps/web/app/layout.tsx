import type { Metadata } from "next";
import { AuthProvider } from "../context/auth-context";
import StyledComponentsRegistry from "../lib/registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamFlare",
  description: "Movie streaming app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <AuthProvider>{children}</AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
