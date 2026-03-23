import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ReportsPage from './pages/ReportsPage';
import BirthChartPage from './pages/BirthChartPage';
import DashaPage from './pages/DashaPage';
import CompatibilityPage from './pages/CompatibilityPage';
import HoroscopePage from './pages/HoroscopePage';
import CareerReportPage from './pages/CareerReportPage';
import LoveMarriageReportPage from './pages/LoveMarriageReportPage';
import EducationReportPage from './pages/EducationReportPage';
import HealthReportPage from './pages/HealthReportPage';
import SpiritualReportPage from './pages/SpiritualReportPage';
import FamilyReportPage from './pages/FamilyReportPage';
import ManglikDoshaPage from './pages/ManglikDoshaPage';
import SadeSatiReportPage from './pages/SadeSatiReportPage';
import BirthChartAnalysisPage from './pages/BirthChartAnalysisPage';
import MyReportsPage from './pages/MyReportsPage';
import OrderPage from './pages/OrderPage';
import PaymentPage from './pages/PaymentPage';
import AskQuestionPage from './pages/AskQuestionPage';
import CheckoutReturnPage from './pages/CheckoutReturnPage';
import HouseExplorePage from './pages/HouseExplorePage';
import AdminThemesPage from './pages/admin/AdminThemesPage';
import AdminThemeFormPage from './pages/admin/AdminThemeFormPage';
import AdminLifeAreasPage from './pages/admin/AdminLifeAreasPage';
import AdminLifeAreaFormPage from './pages/admin/AdminLifeAreaFormPage';
import AdminLifeAreasListPage from './pages/admin/AdminLifeAreasListPage';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import AdminQuestionListPage from './pages/admin/AdminQuestionListPage';
import AdminQuestionEditPage from './pages/admin/AdminQuestionEditPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminReportWizardPage from './pages/admin/AdminReportWizardPage';
import AdminPromptsPage from './pages/admin/AdminPromptsPage';
import AdminMuhurtaPage from './pages/admin/AdminMuhurtaPage';
import AdminObservabilityPage from './pages/admin/AdminObservabilityPage';
import AdminPipelineWizardPage from './pages/admin/AdminPipelineWizardPage';
import AdminRuleCVWizardPage from './pages/admin/AdminRuleCVWizardPage';
import AdminRuleBuilderPage from './pages/admin/AdminRuleBuilderPage';
import AdminWizardContentPage from './pages/admin/AdminWizardContentPage';
import AdminSubscriptionPage from './pages/admin/AdminSubscriptionPage';
import AdminOrderManagementPage from './pages/admin/AdminOrderManagementPage';
import AdminStyleManagerPage from './pages/admin/AdminStyleManagerPage';
import AdminSurveyListPage from './pages/admin/AdminSurveyListPage';
import AdminSurveyBuilderPage from './pages/admin/AdminSurveyBuilderPage';
import AdminGatewayConfigPage from './pages/admin/AdminGatewayConfigPage';
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage';
import PublicSurveyPage from './pages/PublicSurveyPage';
import MuhurtaFinderPage from './pages/MuhurtaFinderPage';
import MuhurtaLandingPage from './pages/MuhurtaLandingPage';
import LalKitabKundliPage from './pages/LalKitabKundliPage';
import ChartWizardPage from './pages/ChartWizardPage';
import PricingPage from './pages/PricingPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ThreatOpportunityPage from './pages/ThreatOpportunityPage';
import TemporalForecastLandingPage from './pages/TemporalForecastLandingPage';
import ChatWidget from './components/ChatWidget';
import SiteGate from './components/SiteGate';
import { LegalModalProvider } from './context/LegalModalContext';

// My Data pages
import MyDataLayout from './pages/mydata/MyDataLayout';
import MyDetailsPage from './pages/mydata/MyDetailsPage';
import AvakhadaChakraPage from './pages/mydata/AvakhadaChakraPage';
import MyPersonalityPage from './pages/mydata/MyPersonalityPage';
import BirthDetailsPage from './pages/mydata/BirthDetailsPage';
import YogasPage from './pages/mydata/YogasPage';
import SadeSatiPage from './pages/mydata/SadeSatiPage';
import TransitPage from './pages/mydata/TransitPage';
import SubscriptionPage from './pages/mydata/SubscriptionPage';

export default function App() {
  return (
    <SiteGate>
    <LegalModalProvider>
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/muhurta-finder" element={<MuhurtaLandingPage />} />
        <Route path="/lal-kitab-kundli" element={<LalKitabKundliPage />} />
        <Route path="/temporal-forecast" element={<TemporalForecastLandingPage />} />
        <Route path="/threat-opportunity" element={<ProtectedRoute><ThreatOpportunityPage /></ProtectedRoute>} />
        <Route path="/survey/:slug" element={<PublicSurveyPage />} />

        {/* Free tools — no login required */}
        <Route path="/birth-chart" element={<BirthChartPage />} />
        <Route path="/birth-chart/house/:houseNum" element={<HouseExplorePage />} />
        <Route path="/dasha" element={<DashaPage />} />
        <Route path="/compatibility" element={<CompatibilityPage />} />
        <Route path="/horoscope" element={<HoroscopePage />} />

        {/* Ask a Question — public browse, auth for ordering */}
        <Route path="/ask-question" element={<AskQuestionPage />} />

        {/* Protected routes — require authentication */}
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/muhurta" element={<ProtectedRoute><MuhurtaFinderPage /></ProtectedRoute>} />
        <Route path="/chart-wizard" element={<ProtectedRoute><ChartWizardPage /></ProtectedRoute>} />
        <Route path="/career-report" element={<CareerReportPage />} />
        <Route path="/love-marriage-report" element={<LoveMarriageReportPage />} />
        <Route path="/education-report" element={<EducationReportPage />} />
        <Route path="/health-report" element={<HealthReportPage />} />
        <Route path="/spiritual-report" element={<SpiritualReportPage />} />
        <Route path="/family-report" element={<FamilyReportPage />} />
        <Route path="/manglik-dosha" element={<ManglikDoshaPage />} />
        <Route path="/sade-sati-report" element={<SadeSatiReportPage />} />
        <Route path="/birth-chart-analysis" element={<BirthChartAnalysisPage />} />
        <Route path="/my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
        <Route path="/order" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/checkout/return" element={<CheckoutReturnPage />} />

        {/* My Data routes — nested under shared layout with birth data context */}
        <Route path="/my-data" element={<ProtectedRoute><MyDataLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="details" replace />} />
          <Route path="details" element={<MyDetailsPage />} />
          <Route path="avakhada" element={<AvakhadaChakraPage />} />
          <Route path="personality" element={<MyPersonalityPage />} />
          <Route path="birth-details" element={<BirthDetailsPage />} />
          <Route path="yogas" element={<YogasPage />} />
          <Route path="sade-sati" element={<SadeSatiPage />} />
          <Route path="transit" element={<TransitPage />} />
          <Route path="temporal-forecast" element={<Navigate to="/threat-opportunity" replace />} />
          <Route path="subscription" element={<SubscriptionPage />} />
        </Route>

        {/* Admin routes — require admin role */}
        <Route path="/admin/themes/add" element={<AdminProtectedRoute><AdminThemeFormPage /></AdminProtectedRoute>} />
        <Route path="/admin/themes/:themeId/edit" element={<AdminProtectedRoute><AdminThemeFormPage /></AdminProtectedRoute>} />
        <Route path="/admin/themes/:themeId/life-areas/add" element={<AdminProtectedRoute><AdminLifeAreaFormPage /></AdminProtectedRoute>} />
        <Route path="/admin/themes/:themeId/life-areas/:areaId/edit" element={<AdminProtectedRoute><AdminLifeAreaFormPage /></AdminProtectedRoute>} />
        <Route path="/admin/themes/:themeId/life-areas" element={<AdminProtectedRoute><AdminLifeAreasPage /></AdminProtectedRoute>} />
        <Route path="/admin/themes" element={<AdminProtectedRoute><AdminThemesPage /></AdminProtectedRoute>} />
        <Route path="/admin/life-areas" element={<AdminProtectedRoute><AdminLifeAreasListPage /></AdminProtectedRoute>} />
        <Route path="/admin/questions/add" element={<AdminProtectedRoute><AdminQuestionsPage /></AdminProtectedRoute>} />
        <Route path="/admin/questions/:questionId/edit" element={<AdminProtectedRoute><AdminQuestionEditPage /></AdminProtectedRoute>} />
        <Route path="/admin/questions" element={<AdminProtectedRoute><AdminQuestionListPage /></AdminProtectedRoute>} />
        <Route path="/admin/reports/create" element={<AdminProtectedRoute><AdminReportWizardPage /></AdminProtectedRoute>} />
        <Route path="/admin/reports/:configId/edit" element={<AdminProtectedRoute><AdminReportWizardPage /></AdminProtectedRoute>} />
        <Route path="/admin/reports" element={<AdminProtectedRoute><AdminReportsPage /></AdminProtectedRoute>} />
        <Route path="/admin/prompts" element={<AdminProtectedRoute><AdminPromptsPage /></AdminProtectedRoute>} />
        <Route path="/admin/muhurta" element={<AdminProtectedRoute><AdminMuhurtaPage /></AdminProtectedRoute>} />
        <Route path="/admin/observability" element={<AdminProtectedRoute><AdminObservabilityPage /></AdminProtectedRoute>} />
        <Route path="/admin/pipeline-wizard" element={<AdminProtectedRoute><AdminPipelineWizardPage /></AdminProtectedRoute>} />
        <Route path="/admin/rule-cv-wizard" element={<AdminProtectedRoute><AdminRuleCVWizardPage /></AdminProtectedRoute>} />
        <Route path="/admin/rule-builder" element={<AdminProtectedRoute><AdminRuleBuilderPage /></AdminProtectedRoute>} />
        <Route path="/admin/wizard-content" element={<AdminProtectedRoute><AdminWizardContentPage /></AdminProtectedRoute>} />
        <Route path="/admin/subscriptions" element={<AdminProtectedRoute><AdminSubscriptionPage /></AdminProtectedRoute>} />
        <Route path="/admin/orders" element={<AdminProtectedRoute><AdminOrderManagementPage /></AdminProtectedRoute>} />
        <Route path="/admin/gateway-config" element={<AdminProtectedRoute><AdminGatewayConfigPage /></AdminProtectedRoute>} />
        <Route path="/admin/users" element={<AdminProtectedRoute><AdminUserManagementPage /></AdminProtectedRoute>} />
        <Route path="/admin/style-manager" element={<AdminProtectedRoute><AdminStyleManagerPage /></AdminProtectedRoute>} />
        <Route path="/admin/surveys" element={<AdminProtectedRoute><AdminSurveyListPage /></AdminProtectedRoute>} />
        <Route path="/admin/surveys/create" element={<AdminProtectedRoute><AdminSurveyBuilderPage /></AdminProtectedRoute>} />
        <Route path="/admin/surveys/:formId/edit" element={<AdminProtectedRoute><AdminSurveyBuilderPage /></AdminProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatWidget />
    </AuthProvider>
    </LegalModalProvider>
    </SiteGate>
  );
}
