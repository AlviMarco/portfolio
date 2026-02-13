import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Hisab-Pati | Premium Accounting & Inventory",
  description: "Professional accounting and inventory management for modern businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-primary/20">
        <Providers>
          <AuthProvider>
            <DataProvider>
              <div className="relative min-h-screen">
                {children}
              </div>
            </DataProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
