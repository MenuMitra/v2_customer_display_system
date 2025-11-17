import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleApiError } from '../utils/sessionUtils';
import { useNavigate } from 'react-router-dom';
import { ENV } from '../config/apiConfig';

const SubscriptionRemainDay = ({ selectedOutlet, dateRange }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const authData = localStorage.getItem("authData");
  let token = null;
  if (authData) {
    try {
      token = JSON.parse(authData).access_token;
    } catch (err) {
      console.error("Failed to parse authData", err);
    }
  }

  const fetchSubscriptionData = async (outletId) => {
    if (!outletId || !token) return;
    
    setLoading(true);
    setError('');
    try {
      const requestPayload = {
        outlet_id: outletId,
        date_filter: dateRange || "today",
        owner_id: 1,
        app_source: "admin",
      };
      
      const response = await axios.post(
        `${ENV.V2_COMMON_BASE}/cds_kds_order_listview`,
        requestPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = response.data;
      if (data && data.subscription_details) {
        setSubscriptionData(data.subscription_details);
      } else {
        setSubscriptionData(null);
      }
    } catch (err) {
      if (handleApiError(err, navigate)) {
        return;
      }
      setError("Failed to fetch subscription data");
      setSubscriptionData(null);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedOutlet) {
      fetchSubscriptionData(selectedOutlet.outlet_id);
    }
  }, [selectedOutlet, dateRange]);

  const calculateTotalDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (!selectedOutlet) {
    return null;
  }

  // Load silently in background; keep rendering without showing loader

  if (error) {
    return null;
  }

  if (!subscriptionData) {
    return null;
  }

  const totalDays = calculateTotalDays(subscriptionData.start_date, subscriptionData.end_date);
  const endDate = new Date(subscriptionData.end_date);
  const now = new Date();
  const remainingDaysRaw = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, remainingDaysRaw);
  const completedDays = Math.max(0, totalDays - remainingDays);
  const percentage = totalDays > 0 ? Math.min(100, Math.max(0, (completedDays / totalDays) * 100)) : 0;

  let color = '#177841';
  if (remainingDays <= 5) {
    color = '#d10606';
  } else if (remainingDays <= 15) {
    color = '#F59E0B';
  }

  // Only show timeline when subscription remaining days are 5 or fewer
  if (remainingDays > 5) {
    return null;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '10px' }}>
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 4px rgba(80,89,111,0.06)',
        border: '1px solid #ededed',
        width: '100%',
        maxWidth: '360px',
        margin: '0 auto',
      }}>
        <div style={{ padding: '10px 12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#222' }}>Subscription Timeline</div>
            
          </div>

          <div style={{ width: '100%', marginBottom: '6px' }}>
            <div style={{
              height: '14px',
              borderRadius: '8px',
              background: '#e4e6ea',
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${percentage}%`,
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                borderRadius: '8px',
                transition: 'width 0.3s ease',
                zIndex: 1,
              }} />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            margin: '0 2px',
            color: '#374151'
          }}>
            <span style={{ fontWeight: 500 }}>{completedDays} days completed</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{remainingDays} days remaining</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SubscriptionRemainDay;