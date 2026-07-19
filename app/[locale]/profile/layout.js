// app/[locale]/profile/layout.js
//
// Applies to every page under /profile. robots.txt stops crawling, but a page
// linked from elsewhere can still be indexed — this meta tag prevents that.

export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function ProfileLayout({ children }) {
  return children
}