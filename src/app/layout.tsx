import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: { default: "BilimMakon — O'qituvchilar uchun attestatsiya platformasi", template: "%s | BilimMakon" },
  description: "O'zbekiston o'qituvchilari uchun attestatsiyaga tayyorlanish platformasi.",
  keywords: ["attestatsiya", "o'qituvchi", "informatika", "bilim", "BilimMakon"],
  openGraph: { type: "website", locale: "uz_UZ", url: "https://bilimmakon.uz", siteName: "BilimMakon" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster position="top-right" toastOptions={{
            duration: 4000,
            style: { borderRadius: "12px", background: "var(--toast-bg)", color: "var(--toast-color)", border: "1px solid var(--toast-border)", fontSize: "14px", fontWeight: "500" },
          }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
