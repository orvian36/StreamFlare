"use client";

import Link from "next/link";
import { SIGN_IN, SIGN_UP, BROWSE } from "../constants/routes";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>StreamFlare</h1>
      <p>Welcome.</p>
      <nav style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Link href={SIGN_IN}>Sign in</Link>
        <span>·</span>
        <Link href={SIGN_UP}>Sign up</Link>
        <span>·</span>
        <Link href={BROWSE}>Browse</Link>
      </nav>
    </main>
  );
}
