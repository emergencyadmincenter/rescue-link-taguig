import { Outfit, Inter } from "next/font/google";

export const outfit = Outfit({
  variable: "--font-outfit",
  weight: ["700"],
  subsets: ["latin"],
});
export const inter = Inter({
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
