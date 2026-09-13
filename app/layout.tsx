import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Company Admin Hub', description: 'Private company transaction and balance hub' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}