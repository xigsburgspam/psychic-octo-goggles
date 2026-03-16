import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Syne (display/headings) + DM Sans (body) + JetBrains Mono (code/timestamps) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Theme color */}
        <meta name="theme-color" content="#0b0b18" />
        <meta name="color-scheme" content="dark light" />
        {/* PWA basics */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Addagle" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Addagle — Talk to Strangers" />
        <meta property="og:description" content="Connect instantly with random strangers worldwide." />
        <meta property="og:image" content="/og-image.png" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Addagle" />
        <meta name="twitter:description" content="Anonymous random chat. Modern, safe, instant." />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
