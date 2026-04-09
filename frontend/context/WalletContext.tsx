"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface WalletState {
  publicKey: string | null;
  xlmBalance: string;
  usdcBalance: string;
  connected: boolean;
  connecting: boolean;
  walletType: "freighter" | "albedo" | "manual" | null;
  connectFreighter: () => Promise<void>;
  connectAlbedo: () => Promise<void>;
  connectManual: (key: string) => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ||
  "https://horizon-testnet.stellar.org";

/* ─── Provider ─────────────────────────────────────────────────────────────── */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [xlmBalance, setXlmBalance] = useState("0");
  const [usdcBalance, setUsdcBalance] = useState("0");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState<
    "freighter" | "albedo" | "manual" | null
  >(null);

  /* ── Fetch balances from Horizon ──────────────────────────────────────── */
  const getBalances = useCallback(async (key: string) => {
    try {
      const res = await fetch(`${HORIZON_URL}/accounts/${key}`);
      if (!res.ok) {
        setXlmBalance("0");
        setUsdcBalance("0");
        return;
      }
      const data = await res.json();
      const xlm = data.balances?.find(
        (b: any) => b.asset_type === "native"
      );
      const usdc = data.balances?.find(
        (b: any) =>
          b.asset_code === "USDC" ||
          b.asset_code === "yUSDC"
      );
      setXlmBalance(xlm ? parseFloat(xlm.balance).toFixed(2) : "0");
      setUsdcBalance(usdc ? parseFloat(usdc.balance).toFixed(2) : "0");
    } catch {
      setXlmBalance("0");
      setUsdcBalance("0");
    }
  }, []);

  /* ── Refresh balance ──────────────────────────────────────────────────── */
  const refreshBalance = useCallback(async () => {
    if (publicKey) {
      await getBalances(publicKey);
    }
  }, [publicKey, getBalances]);

  /* ── Sign Transaction ────────────────────────────────────────────────── */
  const signTransaction = useCallback(
    async (xdr: string) => {
      const win = window as any;
      if (walletType === "freighter") {
        return await win.freighterApi.signTransaction({
          xdr,
          network: "TESTNET",
        });
      } else if (walletType === "albedo") {
        const result = await win.albedo.tx({
          xdr,
          network: "testnet",
        });
        return result.signed_envelope;
      } else {
        throw new Error("Signing not supported for this wallet type");
      }
    },
    [walletType]
  );

  /* ── Freighter ────────────────────────────────────────────────────────── */
  const connectFreighter = useCallback(async () => {
    setConnecting(true);
    try {
      const win = window as any;
      if (!win.freighterApi) {
        window.open("https://freighter.app", "_blank");
        throw new Error("Freighter not installed");
      }
      const api = win.freighterApi;
      const key = await api.getPublicKey();
      if (key) {
        setPublicKey(key);
        setConnected(true);
        setWalletType("freighter");
        localStorage.setItem("rm_wallet_key", key);
        localStorage.setItem("rm_wallet_type", "freighter");
        await getBalances(key);
      }
    } catch (e) {
      console.error("Freighter connection failed:", e);
    } finally {
      setConnecting(false);
    }
  }, [getBalances]);

  /* ── Albedo ───────────────────────────────────────────────────────────── */
  const connectAlbedo = useCallback(async () => {
    setConnecting(true);
    try {
      const win = window as any;
      if (!win.albedo) {
        window.open("https://albedo.link", "_blank");
        throw new Error("Albedo not available");
      }
      const result = await win.albedo.publicKey({});
      if (result?.pubkey) {
        setPublicKey(result.pubkey);
        setConnected(true);
        setWalletType("albedo");
        localStorage.setItem("rm_wallet_key", result.pubkey);
        localStorage.setItem("rm_wallet_type", "albedo");
        await getBalances(result.pubkey);
      }
    } catch (e) {
      console.error("Albedo connection failed:", e);
    } finally {
      setConnecting(false);
    }
  }, [getBalances]);

  /* ── Manual key ───────────────────────────────────────────────────────── */
  const connectManual = useCallback(
    (key: string) => {
      if (key && key.length === 56 && key.startsWith("G")) {
        setPublicKey(key);
        setConnected(true);
        setWalletType("manual");
        localStorage.setItem("rm_wallet_key", key);
        localStorage.setItem("rm_wallet_type", "manual");
        getBalances(key);
      }
    },
    [getBalances]
  );

  /* ── Disconnect ───────────────────────────────────────────────────────── */
  const disconnect = useCallback(() => {
    setPublicKey(null);
    setXlmBalance("0");
    setUsdcBalance("0");
    setConnected(false);
    setWalletType(null);
    localStorage.removeItem("rm_wallet_key");
    localStorage.removeItem("rm_wallet_type");
  }, []);

  /* ── Auto-reconnect from localStorage ─────────────────────────────────── */
  useEffect(() => {
    const savedKey = localStorage.getItem("rm_wallet_key");
    const savedType = localStorage.getItem("rm_wallet_type") as
      | "freighter"
      | "albedo"
      | "manual"
      | null;
    if (savedKey && savedType) {
      setPublicKey(savedKey);
      setConnected(true);
      setWalletType(savedType);
      getBalances(savedKey);
    }
  }, [getBalances]);

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        xlmBalance,
        usdcBalance,
        connected,
        connecting,
        walletType,
        connectFreighter,
        connectAlbedo,
        connectManual,
        disconnect,
        refreshBalance,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

/* ─── Hook ─────────────────────────────────────────────────────────────────── */
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
