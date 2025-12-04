import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardScreen from './screens/DashboardScreen';
import OrdersScreen from './screens/OrdersScreen';
import Login from './screens/Login';
import ProtectedRoute from './components/ProtectedRoute';
import "remixicon/fonts/remixicon.css";

function App() {
  return (

      <Routes>
        {/* Public Routes */}
        {/* <Route path="/login" element={<LoginScreen />} /> */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="/dashboard" element={<DashboardScreen />} /> */}
        
        {/* Protected Routes */}
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <OrdersScreen />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

  );
}

export default App;
  