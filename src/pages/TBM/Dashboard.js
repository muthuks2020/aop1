import React from 'react';
import SalesRepDashboard from '../SalesRep/Dashboard';

// TBM (Territory Business Manager) Dashboard
// Currently uses the same interface as Sales Rep
// Can be customized with additional features like:
// - View commitments from all sales reps in territory
// - Approve/Reject submissions
// - Territory-wide analytics

function TBMDashboard() {
  return <SalesRepDashboard />;
}

export default TBMDashboard;
