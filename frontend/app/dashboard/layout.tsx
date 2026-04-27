"use client"

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Globe, Users, Store, Zap, Settings, MessageSquare, DollarSign, BarChart2, Shield, BookOpen } from 'lucide-react';
import { WalletConnect } from '@/components/ui/WalletConnect';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/fund", icon: DollarSign, label: "Fund Pool" },
    { href: "/dashboard/distribute", icon: Globe, label: "Distribute Aid" },
    { href: "/dashboard/victims", icon: Users, label: "Victims" },
    { href: "/dashboard/shopkeepers", icon: Store, label: "Shopkeepers" },
    { href: "/dashboard/clawback", icon: Zap, label: "Clawback" },
    { href: "/dashboard/metrics", icon: BarChart2, label: "Metrics" },
    { href: "/dashboard/security", icon: Shield, label: "Security" },
    { href: "/docs", icon: BookOpen, label: "Docs" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    { href: "/feedback", icon: MessageSquare, label: "Feedback" },
  ];


  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* LEFT SIDEBAR (desktop) */}
      <aside className="hidden md:flex w-[260px] bg-[rgba(10,10,10,0.9)] border-r border-[var(--border-subtle)] flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 mb-2">
            <Image src="/logo.png" alt="ReliefMesh" width={36} height={36} className="rounded-lg" />
            <div>
              <span className="font-display font-bold italic text-white text-2xl tracking-wide block leading-none">ReliefMesh</span>
              <span className="label-text text-[9px] opacity-70">Charity Command Center</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 mt-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive 
                    ? "text-[var(--gold)] border-l-2 border-[var(--gold)] bg-[var(--bg-glass)]" 
                    : "text-gray-400 hover:text-white hover:bg-[var(--bg-glass-hover)] border-l-2 border-transparent"
                }`}
              >
                <Icon size={20} className={isActive ? "text-[var(--gold)]" : "text-gray-400"} />
                <span className="font-body text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-6 mt-auto">
          <WalletConnect className="w-full" />
        </div>
      </aside>

      {/* MOBILE: Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] z-50 flex justify-around items-center px-2">
         {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full p-2 ${isActive ? "text-[var(--gold)]" : "text-gray-500"}`}
              >
                <Icon size={20} className="mb-1" />
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}
   </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full relative z-0">
         <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
         </div>
      </main>
    </div>
  );
}
