import { Navigate, Route, Routes } from 'react-router-dom';
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
import OrderPage from './pages/OrderPage';
import PaymentPage from './pages/PaymentPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/birth-chart" element={<BirthChartPage />} />
      <Route path="/dasha" element={<DashaPage />} />
      <Route path="/compatibility" element={<CompatibilityPage />} />
      <Route path="/horoscope" element={<HoroscopePage />} />
      <Route path="/career-report" element={<CareerReportPage />} />
      <Route path="/love-marriage-report" element={<LoveMarriageReportPage />} />
      <Route path="/education-report" element={<EducationReportPage />} />
      <Route path="/health-report" element={<HealthReportPage />} />
      <Route path="/spiritual-growth-report" element={<SpiritualGrowthReportPage />} />
      <Route path="/family-children-report" element={<FamilyChildrenReportPage />} />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
