// pages/_app.tsx
import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/images/common/project-logo-200x200.png" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
