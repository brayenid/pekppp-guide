import './globals.css'
import { AppLayoutWrapper } from '../components/layout/AppLayoutWrapper'
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
  description: 'Platform pemantauan dan evaluasi kinerja penyelenggaraan pelayanan publik Kabupaten Kutai Barat. 6 Aspek, 31 Indikator Berbobot.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${googleSans.variable} font-sans`} suppressHydrationWarning>
      <head>
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
        <Toaster position="bottom-right" richColors />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `
          }}
        />
      </body>
    </html>
  )
}
