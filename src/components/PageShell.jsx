import LegalModals from './LegalModals';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

export default function PageShell({ activeNav, children }) {
  return (
    <>
      <SiteHeader active={activeNav} />
      {children}
      <SiteFooter />
      <div className="stars" id="stars"></div>
      <LegalModals />
    </>
  );
}
