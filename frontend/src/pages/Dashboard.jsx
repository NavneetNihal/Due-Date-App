import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';
import CreatorDashboard from './CreatorDashboard.jsx';
import OwnerDashboard from './OwnerDashboard.jsx';

function Dashboard() {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (user.role === 'creator') {
    return <CreatorDashboard />;
  }

  if (user.role === 'owner') {
    return <OwnerDashboard />;
  }

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
      <div className="text-red-400 text-sm font-semibold">Unauthorized: Unknown user role</div>
    </div>
  );
}

export default Dashboard;
