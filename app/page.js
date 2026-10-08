import { redirect } from 'next/navigation';
import { SITE_URL } from '@/lib/site';
import CreativeHome from '@/components/CreativeHome';

export const metadata = {
  title: 'AI Fashion Content, Ads & Try-On Studio | Smit Kapadiya, Surat',
  description: 'AI fashion modelling, UGC-style ads, short brand films and website virtual try-on. Explore Smit Kapadiya’s portfolio and book a product-led demo in Surat.',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  openGraph: { type: 'website', title: 'Kapadiya — AI Creative Studio & Try-On', siteName: 'Kapadiya & Sons', locale: 'en_IN', url: '/' },
  twitter: { card: 'summary_large_image' },
};

export default function Home() {
  if (process.env.KIOSK_MODE === '1') redirect('/mirror');
  return <CreativeHome />;
}
