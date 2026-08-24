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
  title: "AI Football Dashboard",
  description: "Real-money sports betting, FPL, and Ultimate Team platform",
  manifest: "/manifest.json",
  themeColor: "#00ff87",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Football",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
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
