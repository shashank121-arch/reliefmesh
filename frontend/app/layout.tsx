import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { FreighterCheck } from "@/components/FreighterCheck";
import { PageTracker } from "@/components/PageTracker";

export const metadata: Metadata = {
  title: "ReliefMesh — Decentralized Disaster Relief on Stellar",
  description:
    "Bypass broken banks. Send digital aid directly to disaster victims via SMS. Powered by Stellar blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <PageTracker />
          {children}
          <FreighterCheck />
        </WalletProvider>
      </body>
    </html>
  );
}
