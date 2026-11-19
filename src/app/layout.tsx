import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: "Med's Leads | Sales Command Center", description: 'Premium CRM dashboard backed by Google Sheets' };
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }