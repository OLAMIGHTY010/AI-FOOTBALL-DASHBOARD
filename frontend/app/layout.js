import { Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import PWA from "./components/PWA";
import ToastContainer from "./components/ToastContainer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "SimScoutbet",
  description: "Real-money sports betting, FPL, and Ultimate Team platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SimScoutbet",
  },
};

export const viewport = {
  themeColor: "#00ff87",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overscroll-y-none">
        <PWA />
        <AppProvider>
          {children}
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
