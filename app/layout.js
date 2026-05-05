import './globals.css';

export const metadata = {
  title: 'Ancestors \u2014 Original Botanica',
  description:
    'A perpetual virtual altar to honor those who came before us. From Original Botanica in the Bronx, since 1959.',
  openGraph: {
    title: 'Ancestors \u2014 Original Botanica',
    description:
      'A flame that never goes out for those we never forget. A perpetual virtual altar from Original Botanica.',
    url: 'https://ancestors.originalbotanica.com',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Brand fonts \u2014 same as originalbotanica.com */}
        <link rel="stylesheet" href="https://use.typekit.net/xvx5ipz.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
