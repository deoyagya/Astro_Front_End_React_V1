import LegalModals from './LegalModals';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';
import AnnouncementRibbon from './AnnouncementRibbon';
import BackendIndicator from './BackendIndicator';
import StarsBackground from './StarsBackground';

export default function PageShell({ activeNav, children }) {
  return (
    <>
      <SiteHeader active={activeNav} />
      <AnnouncementRibbon />
      {children}
      <SiteFooter />
      <StarsBackground />
      <LegalModals />
      <BackendIndicator />
    </>
  );
}
