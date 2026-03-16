import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Addagle - Talk to strangers. Make connections." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="mesh-bg" />

      <Component {...pageProps} />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-raised)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-body)',
          },
          success: {
            iconTheme: { primary: '#22d3a5', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: 'white' },
          },
        }}
      />
    </ThemeProvider>
  );
}
