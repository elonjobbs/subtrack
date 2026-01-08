import type { AppProps } from 'next/app'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Subscription Tracker - Find & Cancel Hidden Subscriptions</title>
        <meta name="description" content="Upload your credit card statements and discover hidden subscriptions costing you thousands per year" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
