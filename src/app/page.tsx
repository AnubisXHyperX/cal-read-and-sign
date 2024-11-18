import Head from "next/head";
import ReadAndSign from "./ReadAndSign";

export default function Home() {
  return (
    <>
      <Head>
        <title>Read and Sign</title>
        <meta name="description" content="A secure read and sign application" />
      </Head>
      <main>
        <ReadAndSign />
      </main>
    </>
  );
}