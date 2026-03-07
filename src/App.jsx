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
import SpiritualGrowthReportPage from './pages/SpiritualGrowthReportPage';
import FamilyChildrenReportPage from './pages/FamilyChildrenReportPage';
import MyReportsPage from './pages/MyReportsPage';
import OrderPage from './pages/OrderPage';
import PaymentPage from './pages/PaymentPage';
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
import MuhurtaFinderPage from './pages/MuhurtaFinderPage';
import ChartWizardPage from './pages/ChartWizardPage';

// My Data pages
import MyDataLayout from './pages/mydata/MyDataLayout';
import MyDetailsPage from './pages/mydata/MyDetailsPage';
import AvakhadaChakraPage from './pages/mydata/AvakhadaChakraPage';
import MyPersonalityPage from './pages/mydata/MyPersonalityPage';
import SavedChartsPage from './pages/mydata/SavedChartsPage';
import BirthDetailsPage from './pages/mydata/BirthDetailsPage';
import YogasPage from './pages/mydata/YogasPage';
import SadeSatiPage from './pages/mydata/SadeSatiPage';
import TransitPage from './pages/mydata/TransitPage';
import TemporalForecastPage from './pages/mydata/TemporalForecastPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — require authentication */}
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/birth-chart" element={<ProtectedRoute><BirthChartPage /></ProtectedRoute>} />
        <Route path="/birth-chart/house/:houseNum" element={<ProtectedRoute><HouseExplorePage /></ProtectedRoute>} />
        <Route path="/dasha" element={<ProtectedRoute><DashaPage /></ProtectedRoute>} />
        <Route path="/compatibility" element={<ProtectedRoute><CompatibilityPage /></ProtectedRoute>} />
        <Route path="/horoscope" element={<ProtectedRoute><HoroscopePage /></ProtectedRoute>} />
        <Route path="/muhurta" element={<ProtectedRoute><MuhurtaFinderPage /></ProtectedRoute>} />
        <Route path="/chart-wizard" element={<ProtectedRoute><ChartWizardPage /></ProtectedRoute>} />
        <Route path="/career-report" element={<ProtectedRoute><CareerReportPage /></ProtectedRoute>} />
        <Route path="/love-marriage-report" element={<ProtectedRoute><LoveMarriageReportPage /></ProtectedRoute>} />
        <Route path="/education-report" element={<ProtectedRoute><EducationReportPage /></ProtectedRoute>} />
        <Route path="/health-report" element={<ProtectedRoute><HealthReportPage /></ProtectedRoute>} />
        <Route path="/spiritual-growth-report" element={<ProtectedRoute><SpiritualGrowthReportPage /></ProtectedRoute>} />
        <Route path="/family-children-report" element={<ProtectedRoute><FamilyChildrenReportPage /></ProtectedRoute>} />
        <Route path="/my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
        <Route path="/order" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />

        {/* My Data routes — nested under shared layout with birth data context */}
        <Route path="/my-data" element={<ProtectedRoute><MyDataLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="details" replace />} />
          <Route path="details" element={<MyDetailsPage />} />
          <Route path="avakhada" element={<AvakhadaChakraPage />} />
          <Route path="personality" element={<MyPersonalityPage />} />
          <Route path="saved-charts" element={<SavedChartsPage />} />
          <Route path="birth-details" element={<BirthDetailsPage />} />
          <Route path="yogas" element={<YogasPage />} />
          <Route path="sade-sati" element={<SadeSatiPage />} />
          <Route path="transit" element={<TransitPage />} />
          <Route path="temporal-forecast" element={<TemporalForecastPage />} />
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
