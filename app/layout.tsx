import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"
import { ToasterProvider } from "@/components/shared/ToasterProvider"

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
})

export const metadata: Metadata = {
  title: "ApplyNest — Your College Application Companion",
  description: "Track, organize, and manage your college and graduate school applications in one cozy place.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body className="min-h-full bg-cream text-foreground antialiased font-sans">
        {children}
        <ToasterProvider />
      </body>
    </html>
  )
}
