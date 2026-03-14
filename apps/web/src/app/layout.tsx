import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://renmaeai.com"),
  title: "RenmaeAI | Cỗ Máy 13-Bước Sản Xuất Video AI",
  description: "Trải nghiệm tạo Video bằng công nghệ Client-side Rendering và BYOK Architecture. Khởi tạo Không gian Dựng Phim Thời gian thực (Real-time Pipeline) với 0đ Phí Server.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "RenmaeAI | Cỗ Máy 13-Bước Sản Xuất Video AI",
    description: "Trải nghiệm tạo Video bằng công nghệ Client-side Rendering và BYOK Architecture. Khởi tạo Không gian Dựng Phim Thời gian thực với 0đ Phí Server.",
    type: "website",
    locale: "vi_VN",
    url: "https://renmaeai.com",
    siteName: "RenmaeAI",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "RenmaeAI — Sản Xuất Video AI Chuyên Nghiệp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RenmaeAI | Sản Xuất Video AI Chuyên Nghiệp",
    description: "Hệ thống 13-bước tự động từ Transcript đến Video 4K. BYOK Architecture. 0đ Phí Server.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} antialiased font-inter`}
      >
        {children}
      </body>
    </html>
  );
}
