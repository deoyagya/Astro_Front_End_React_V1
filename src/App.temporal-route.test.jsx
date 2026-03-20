import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { role: 'premium', email: 'sonam@example.com' },
  }),
}));

vi.mock('./context/LegalModalContext', () => ({
  LegalModalProvider: ({ children }) => children,
}));

vi.mock('./components/SiteGate', () => ({
  default: ({ children }) => children,
}));

vi.mock('./components/ChatWidget', () => ({
  default: () => null,
}));

vi.mock('./pages/ThreatOpportunityPage', () => ({
  default: () => <div>Standalone Threat Opportunity Page</div>,
}));
vi.mock('./pages/TemporalForecastLandingPage', () => ({
  default: () => <div>Temporal Forecast Landing</div>,
}));
vi.mock('./pages/MuhurtaLandingPage', () => ({
  default: () => <div>Muhurta Landing</div>,
}));
vi.mock('./pages/SadeSatiReportPage', () => ({
  default: () => <div>Sade Sati Report Landing</div>,
}));

vi.mock('./pages/HomePage', () => ({ default: () => <div>Home</div> }));
vi.mock('./pages/LoginPage', () => ({ default: () => <div>Login</div> }));
vi.mock('./pages/ReportsPage', () => ({ default: () => <div>Reports</div> }));
vi.mock('./pages/BirthChartPage', () => ({ default: () => <div>Birth Chart</div> }));
vi.mock('./pages/DashaPage', () => ({ default: () => <div>Dasha</div> }));
vi.mock('./pages/CompatibilityPage', () => ({ default: () => <div>Compatibility</div> }));
vi.mock('./pages/HoroscopePage', () => ({ default: () => <div>Horoscope</div> }));
vi.mock('./pages/CareerReportPage', () => ({ default: () => <div>Career</div> }));
vi.mock('./pages/LoveMarriageReportPage', () => ({ default: () => <div>Love</div> }));
vi.mock('./pages/EducationReportPage', () => ({ default: () => <div>Education</div> }));
vi.mock('./pages/HealthReportPage', () => ({ default: () => <div>Health</div> }));
vi.mock('./pages/SpiritualReportPage', () => ({ default: () => <div>Spiritual</div> }));
vi.mock('./pages/FamilyReportPage', () => ({ default: () => <div>Family</div> }));
vi.mock('./pages/ManglikDoshaPage', () => ({ default: () => <div>Manglik</div> }));
vi.mock('./pages/BirthChartAnalysisPage', () => ({ default: () => <div>Birth Analysis</div> }));
vi.mock('./pages/MyReportsPage', () => ({ default: () => <div>My Reports</div> }));
vi.mock('./pages/OrderPage', () => ({ default: () => <div>Order</div> }));
vi.mock('./pages/PaymentPage', () => ({ default: () => <div>Payment</div> }));
vi.mock('./pages/AskQuestionPage', () => ({ default: () => <div>Ask Question</div> }));
vi.mock('./pages/CheckoutReturnPage', () => ({ default: () => <div>Checkout Return</div> }));
vi.mock('./pages/HouseExplorePage', () => ({ default: () => <div>House Explore</div> }));
vi.mock('./pages/PublicSurveyPage', () => ({ default: () => <div>Survey</div> }));
vi.mock('./pages/MuhurtaFinderPage', () => ({ default: () => <div>Muhurta</div> }));
vi.mock('./pages/ChartWizardPage', () => ({ default: () => <div>Chart Wizard</div> }));
vi.mock('./pages/PricingPage', () => ({ default: () => <div>Pricing</div> }));
vi.mock('./pages/MyOrdersPage', () => ({ default: () => <div>My Orders</div> }));
vi.mock('./pages/admin/AdminThemesPage', () => ({ default: () => <div>Admin Themes</div> }));
vi.mock('./pages/admin/AdminThemeFormPage', () => ({ default: () => <div>Admin Theme Form</div> }));
vi.mock('./pages/admin/AdminLifeAreasPage', () => ({ default: () => <div>Admin Life Areas</div> }));
vi.mock('./pages/admin/AdminLifeAreaFormPage', () => ({ default: () => <div>Admin Life Area Form</div> }));
vi.mock('./pages/admin/AdminLifeAreasListPage', () => ({ default: () => <div>Admin Life Areas List</div> }));
vi.mock('./pages/admin/AdminQuestionsPage', () => ({ default: () => <div>Admin Questions</div> }));
vi.mock('./pages/admin/AdminQuestionListPage', () => ({ default: () => <div>Admin Question List</div> }));
vi.mock('./pages/admin/AdminQuestionEditPage', () => ({ default: () => <div>Admin Question Edit</div> }));
vi.mock('./pages/admin/AdminReportsPage', () => ({ default: () => <div>Admin Reports</div> }));
vi.mock('./pages/admin/AdminReportWizardPage', () => ({ default: () => <div>Admin Report Wizard</div> }));
vi.mock('./pages/admin/AdminPromptsPage', () => ({ default: () => <div>Admin Prompts</div> }));
vi.mock('./pages/admin/AdminMuhurtaPage', () => ({ default: () => <div>Admin Muhurta</div> }));
vi.mock('./pages/admin/AdminObservabilityPage', () => ({ default: () => <div>Admin Observability</div> }));
vi.mock('./pages/admin/AdminPipelineWizardPage', () => ({ default: () => <div>Admin Pipeline Wizard</div> }));
vi.mock('./pages/admin/AdminRuleCVWizardPage', () => ({ default: () => <div>Admin Rule CV Wizard</div> }));
vi.mock('./pages/admin/AdminRuleBuilderPage', () => ({ default: () => <div>Admin Rule Builder</div> }));
vi.mock('./pages/admin/AdminWizardContentPage', () => ({ default: () => <div>Admin Wizard Content</div> }));
vi.mock('./pages/admin/AdminSubscriptionPage', () => ({ default: () => <div>Admin Subscription</div> }));
vi.mock('./pages/admin/AdminOrderManagementPage', () => ({ default: () => <div>Admin Order Management</div> }));
vi.mock('./pages/admin/AdminStyleManagerPage', () => ({ default: () => <div>Admin Style Manager</div> }));
vi.mock('./pages/admin/AdminSurveyListPage', () => ({ default: () => <div>Admin Survey List</div> }));
vi.mock('./pages/admin/AdminSurveyBuilderPage', () => ({ default: () => <div>Admin Survey Builder</div> }));
vi.mock('./pages/admin/AdminGatewayConfigPage', () => ({ default: () => <div>Admin Gateway</div> }));
vi.mock('./pages/admin/AdminUserManagementPage', () => ({ default: () => <div>Admin Users</div> }));
vi.mock('./pages/mydata/MyDataLayout', async () => {
  const { Outlet } = await import('react-router-dom');

  return {
    default: () => (
      <div>
        <div>My Data Layout</div>
        <Outlet />
      </div>
    ),
  };
});
vi.mock('./pages/mydata/MyDetailsPage', () => ({ default: () => <div>My Details</div> }));
vi.mock('./pages/mydata/AvakhadaChakraPage', () => ({ default: () => <div>Avakhada</div> }));
vi.mock('./pages/mydata/MyPersonalityPage', () => ({ default: () => <div>Personality</div> }));
vi.mock('./pages/mydata/BirthDetailsPage', () => ({ default: () => <div>Birth Details</div> }));
vi.mock('./pages/mydata/YogasPage', () => ({ default: () => <div>Yogas</div> }));
vi.mock('./pages/mydata/SadeSatiPage', () => ({ default: () => <div>Sade Sati</div> }));
vi.mock('./pages/mydata/TransitPage', () => ({ default: () => <div>Transit</div> }));
vi.mock('./pages/mydata/TemporalForecastPage', () => ({ default: () => <div>Legacy Temporal</div> }));
vi.mock('./pages/mydata/SubscriptionPage', () => ({ default: () => <div>Subscription</div> }));
vi.mock('./components/ProtectedRoute', () => ({ default: ({ children }) => children }));
vi.mock('./components/AdminProtectedRoute', () => ({ default: ({ children }) => children }));

describe('Temporal forecast routing', () => {
  it('renders the public temporal landing page on /temporal-forecast', () => {
    render(
      <MemoryRouter initialEntries={['/temporal-forecast']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Temporal Forecast Landing')).toBeInTheDocument();
  });

  it('renders the standalone page on /threat-opportunity', () => {
    render(
      <MemoryRouter initialEntries={['/threat-opportunity']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Standalone Threat Opportunity Page')).toBeInTheDocument();
  });

  it('redirects /my-data/temporal-forecast to the standalone page', () => {
    render(
      <MemoryRouter initialEntries={['/my-data/temporal-forecast']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Standalone Threat Opportunity Page')).toBeInTheDocument();
  });

  it('renders the public muhurta landing page on /muhurta-finder', () => {
    render(
      <MemoryRouter initialEntries={['/muhurta-finder']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Muhurta Landing')).toBeInTheDocument();
  });

  it('renders the public sade sati report page on /sade-sati-report', () => {
    render(
      <MemoryRouter initialEntries={['/sade-sati-report']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sade Sati Report Landing')).toBeInTheDocument();
  });
});
