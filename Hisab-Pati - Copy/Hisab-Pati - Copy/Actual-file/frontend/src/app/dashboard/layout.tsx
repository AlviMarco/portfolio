"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Receipt,
    Package,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Menu
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth, signOut } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/dashboard/accounts', icon: BookOpen },
    { name: 'Transactions', href: '/dashboard/transactions', icon: Receipt },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
    { name: 'Companies', href: '/dashboard/companies', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { user } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Sign out failed:", error);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <aside
                className={`glass relative z-30 flex flex-col border-r border-border transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                    }`}
            >
                <div className="flex h-16 items-center justify-between px-6">
                    {!collapsed && (
                        <span className="text-xl font-bold tracking-tight text-primary">
                            HISAB<span className="text-accent">PATI</span>
                        </span>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="rounded-lg p-1.5 hover:bg-muted"
                    >
                        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <item.icon size={collapsed ? 24 : 20} className={collapsed ? 'mx-auto' : ''} />
                                {!collapsed && <span className="font-medium">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-border p-4">
                    {!collapsed && (
                        <div className="mb-4 flex items-center gap-3 px-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold truncate max-w-[140px]">
                                    {user?.email}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                    Administrator
                                </span>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                        <LogOut size={20} />
                        {!collapsed && <span className="font-medium">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="relative flex-1 overflow-y-auto overflow-x-hidden p-8 animate-fade-in">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Welcome back to Hisab-Pati management.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full border border-border bg-card shadow-sm" />
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}
