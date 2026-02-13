"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from '@/lib/firebase';
import { auth, isMockEnabled } from '@/lib/firebase';

interface AuthContextType {
    user: any;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isMockEnabled) {
            // In mock mode, immediately set a dev user
            setUser(auth.currentUser);
            setLoading(false);
            return;
        }

        try {
            const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
                setUser(user);
                setLoading(false);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("Auth observer failed:", error);
            // Fallback to mock if it fails at runtime
            setUser(auth.currentUser);
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
