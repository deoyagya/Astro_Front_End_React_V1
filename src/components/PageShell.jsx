import LegalModals from './LegalModals';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';
import BackendIndicator from './BackendIndicator';
import StarsBackground from './StarsBackground';

export default function PageShell({ activeNav, children }) {
  return (
    <>
      <SiteHeader active={activeNav} />
      {children}
      <SiteFooter />
      <StarsBackground />
      <LegalModals />
      <BackendIndicator />
    </>
  );
}
