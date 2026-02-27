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
import AdminObservabilityPage from './pages/admin/AdminObservabilityPage';
import AdminPipelineWizardPage from './pages/admin/AdminPipelineWizardPage';

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
        <Route path="/career-report" element={<ProtectedRoute><CareerReportPage /></ProtectedRoute>} />
        <Route path="/love-marriage-report" element={<ProtectedRoute><LoveMarriageReportPage /></ProtectedRoute>} />
        <Route path="/education-report" element={<ProtectedRoute><EducationReportPage /></ProtectedRoute>} />
        <Route path="/health-report" element={<ProtectedRoute><HealthReportPage /></ProtectedRoute>} />
        <Route path="/spiritual-growth-report" element={<ProtectedRoute><SpiritualGrowthReportPage /></ProtectedRoute>} />
        <Route path="/family-children-report" element={<ProtectedRoute><FamilyChildrenReportPage /></ProtectedRoute>} />
        <Route path="/my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
        <Route path="/order" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />

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
        <Route path="/admin/observability" element={<AdminProtectedRoute><AdminObservabilityPage /></AdminProtectedRoute>} />
        <Route path="/admin/pipeline-wizard" element={<AdminProtectedRoute><AdminPipelineWizardPage /></AdminProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
