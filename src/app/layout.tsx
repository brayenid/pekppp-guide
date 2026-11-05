import './globals.css'
import { AppLayoutWrapper } from '../components/layout/AppLayoutWrapper'
import { PushNotificationManager } from '../components/layout/PushNotificationManager'
import { Toaster } from 'sonner'
import NextTopLoader from 'nextjs-toploader'
import localFont from 'next/font/local'

const googleSans = localFont({
  src: '../../public/Google_Sans_Flex/GoogleSansFlex-VariableFont_ROND,opsz,slnt,wdth,wght.ttf',
  variable: '--font-google-sans',
  display: 'swap',
})

export const metadata = {
  title: 'PEKPPP.ext - Evaluasi Pelayanan Publik Kutai Barat',
  description: 'Platform pemantauan dan evaluasi kinerja penyelenggaraan pelayanan publik Kabupaten Kutai Barat. 6 Aspek, 31 Indikator Berbobot.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/pwa/favicon.ico' },
      { url: '/pwa/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/pwa/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/pwa/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PEKPPP.ext'
  }
}

export const viewport = {
  themeColor: '#1D5BB9',
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${googleSans.variable} font-sans`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
        <meta name="theme-color" content="#1D5BB9" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('pekppp-theme') || 'system';
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme === 'dark' || (theme === 'system' && systemDark);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `
          }}
        />
      </head>
      <body className={`${googleSans.className} min-h-screen bg-canvas text-ink flex flex-col antialiased selection:bg-[#C9DCFB] selection:text-[#0E2D60]`}>
        <NextTopLoader color="#ffffff" showSpinner={false} height={3} />
        <AppLayoutWrapper>
          {children}
        </AppLayoutWrapper>
        <PushNotificationManager />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}

