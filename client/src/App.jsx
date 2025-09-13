import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Login from './pages/Login';
import EHR from './pages/EHR';
import AIDoctor from './pages/AIDoctor';
import QRCodePage from './pages/QRCodePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ehr" element={<EHR />} />
        <Route path="/ai-doctor" element={<AIDoctor />} />
        <Route path="/qrcode" element={<QRCodePage />} />
      </Routes>
    </Router>
  );
}

export default App;
