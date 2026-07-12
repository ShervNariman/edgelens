import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans } from "next/font/google";
import { PostHogAnalytics } from "@/components/analytics/posthog-analytics";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { META_DESCRIPTION, META_TITLE } from "@/lib/product-copy";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${plexSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <a
          href="#analyzer"
          className="absolute left-4 top-4 z-50 -translate-y-16 rounded-md bg-background px-3 py-2 text-sm shadow ring-2 ring-ring transition-transform focus:translate-y-0"
        >
          Skip to analyzer
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
        <PostHogAnalytics
          product="edgelens"
          excludeRoutes={["/record"]}
        />
      </body>
    </html>
  );
}
