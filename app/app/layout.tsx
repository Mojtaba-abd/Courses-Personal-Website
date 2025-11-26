import './globals.css'
import type { Metadata } from 'next'
import { ToasterProvider } from '@/components/providers/toaster-provider'
import { ConfettiProvider } from '@/components/providers/confetti-provider'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'حسين الحلو - خبير الأمن السيبراني',
  description: 'خبير في الأمن السيبراني وحماية المعلومات | متخصص في اختبار اختراق تطبيقات الويب والتحليل الجنائي الرقمي',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet" />
      </head>
      <body>
        <ConfettiProvider />
        <ToasterProvider />
        {children}
        <Script 
          src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js" 
          strategy="afterInteractive"
        />
        <Script src="https://unpkg.com/aos@2.3.1/dist/aos.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
