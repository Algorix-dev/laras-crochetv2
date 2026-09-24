/*
  TIP: Every account page (About You, Order History, Order Tracking,
  Addresses) has the same skeleton in Figma: breadcrumb, then a heading
  row, then the sidebar on the left with the page content on the right.
  The sidebar's first link lines up with the FIRST THING UNDER THE
  HEADING (the "Username" label, the first address input, the
  "You haven't placed any orders yet" line), not with the heading itself.

  Instead of nudging the sidebar down with a margin-top that has to
  match each page's heading height, this uses two grid rows:
    row 1 → heading (+ optional action like search / Add Address)
    row 2 → sidebar on the left, page content on the right
  Because the sidebar and the content share a row, their tops always
  line up, whatever the heading looks like.

  On mobile there's one column, so the DOM order is the visual order:
  sidebar dropdown → heading → content.

  Column widths: at 1920px Figma starts the heading/content 305px in
  from the sidebar's left edge (~23.25% of the 1312px content area).
  max() keeps the sidebar from getting too narrow on small laptops.

  Props:
    active        which sidebar link is highlighted ('about' | 'orders' | ...)
    title         the <h1> contents (string or JSX)
    headerAction  optional node on the right of the heading row
    children      the page content
*/
import { Link } from 'react-router-dom';
import AccountSidebar from './AccountSidebar';
import RecommendedProducts from './RecommendedProducts';
import Footer from './Footer';

export default function AccountLayout({ active, title, headerAction, children }) {
  return (
    <>
      <section className="px-5 py-10 md:px-8 lg:px-[15.83%]">
        <p className="mb-6 text-base text-[var(--muted)]">
          <Link to="/" className="hover:underline">
            Home
          </Link>{' '}
          / Account
        </p>

        <div className="grid gap-y-6 md:grid-cols-[200px_1fr] md:gap-x-0 lg:grid-cols-[max(180px,23.25%)_1fr]">
          {/* max-md:mb-4 keeps the 40px gap between the mobile dropdown
              and the heading (24px row gap + 16px). */}
          <div className="max-md:mb-4 md:col-start-1 md:row-start-2">
            <AccountSidebar active={active} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 md:col-start-2 md:row-start-1">
            <h1 className="sm:text-[24px] lg:text-[36px] md:text-3xl font-bold uppercase tracking-[-2%] text-[var(--ink)]">
              {title}
            </h1>
            {headerAction}
          </div>

          <div className="min-w-0 md:col-start-2 md:row-start-2">{children}</div>
        </div>

        <RecommendedProducts />
      </section>

      <Footer />
    </>
  );
}