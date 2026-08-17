import { Helmet } from "react-helmet-async";

function About() {
    return (
      <>
      <Helmet><title>About Us | Tamanna&apos;s Hut</title><meta name="description" content="Learn about Tamanna's Hut, a kidswear store owned and operated by Tamanna Enterprise in Howrah, West Bengal." /><link rel="canonical" href="https://www.tamannashut.com/about" /></Helmet>
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16 lg:py-20">
        <h1 className="mb-8 text-3xl font-bold sm:text-4xl">
          About Tamanna's Hut
        </h1>
  
        <div className="space-y-6 text-lg leading-8 text-gray-700">
          <p>Tamanna&apos;s Hut is an Indian kidswear store offering clothing for babies and children. We focus on comfortable fits, practical fabrics and styles for everyday wear and celebrations.</p>
          <p>The online shop is owned and operated by <strong>Tamanna Enterprise</strong>, a registered business based in Howrah, West Bengal. Products are checked before dispatch and orders are fulfilled from our business location.</p>
          <section className="rounded-2xl border bg-white p-6 text-base leading-7"><h2 className="text-xl font-semibold text-gray-900">Business information</h2><address className="mt-3 not-italic">Tamanna Enterprise<br />House No. N0072, Ground Floor<br />Raghudebbati West, Sankrail<br />Howrah, West Bengal 711310, India</address><p className="mt-3">GSTIN: 19BKDPB6636D1ZE<br />Email: <a className="text-brand-primary underline" href="mailto:support@tamannashut.com">support@tamannashut.com</a><br />Phone: <a className="text-brand-primary underline" href="tel:+919874328578">+91 98743 28578</a></p></section>
        </div>
      </div>
      </>
    );
  }
  
  export default About;
