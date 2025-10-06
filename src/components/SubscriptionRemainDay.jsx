import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleApiError } from '../utils/sessionUtils';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../config/apiConfig';

const SubscriptionRemainDay = ({ selectedOutlet, dateRange }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
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
        "https://ghanish.in/v2/common/cds_kds_order_listview",
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
        // Mock data for testing when subscription_details is not available
        const mockSubscriptionData = {
          subscription_id: 22,
          name: "POS App Basic",
          price: 1000.0,
          tenure: "3 months",
          start_date: "2025-09-25T13:49:35",
          end_date: "2025-12-25T13:49:35",
          status: true,
          subscription_price: 1000.0
        };
        setSubscriptionData(mockSubscriptionData);
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

  useEffect(() => {
    if (selectedOutlet) {
      fetchSubscriptionData(selectedOutlet.outlet_id);
    }
  }, [selectedOutlet, dateRange]);

  const calculateDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const calculateTotalDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const getProgressColor = (daysRemaining) => {
    if (daysRemaining > 30) return '#10B981'; // green
    if (daysRemaining < 5) return '#ef4444'; // red
    if (daysRemaining < 15) return '#f59e0b'; // orange
    if (daysRemaining < 30) return '#eab308'; // yellow
    return '#10B981';
  };

  if (!selectedOutlet) {
    return null;
  }

  // Load silently in background; keep rendering without showing loader

  if (error) {
    return (
      <div className="alert alert-warning text-center py-2" role="alert">
        {error}
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="alert alert-info text-center py-2" role="alert">
        No subscription data available
      </div>
    );
  }

  const totalDays = calculateTotalDays(subscriptionData.start_date, subscriptionData.end_date);
  const daysRemainingByDate = calculateDaysRemaining(subscriptionData.end_date);

  // Prefer API-provided numeric status as days completed when available
  const rawStatus = subscriptionData && subscriptionData.status;
  let daysCompleted = Math.max(0, totalDays - daysRemainingByDate);
  if (typeof rawStatus === 'number' && !Number.isNaN(rawStatus)) {
    daysCompleted = rawStatus;
  } else if (typeof rawStatus === 'string' && rawStatus.trim() !== '' && !Number.isNaN(Number(rawStatus))) {
    daysCompleted = Number(rawStatus);
  }
  // Clamp within [0, totalDays]
  daysCompleted = Math.min(Math.max(0, daysCompleted), totalDays);
  const daysRemaining = Math.max(0, totalDays - daysCompleted);
  const progressPercentage = totalDays > 0 ? (daysCompleted / totalDays) * 100 : 0;

  return (
    <div className="container-fluid py-1" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-md-5 col-lg-4">
          {/* KDS-style compact card with centered progress */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '6px' }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 1px 4px rgba(80,89,111,0.06)',
                  border: '1px solid #ededed',
                  width: '100%',
                  maxWidth: '300px',
                  margin: '0 auto',
                }}>
                  <div style={{ padding: '8px 12px 6px 12px' }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: '#222',
                      marginBottom: '4px'
                    }}>
                      Timeline
                    </div>
                    <div style={{ width: '100%', marginBottom: '6px' }}>
                      <div style={{
                        height: '16px',
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
                          width: '100%',
                          background: `linear-gradient(to right, ${getProgressColor(daysRemaining)} ${100 - progressPercentage}%, #E0E0E0 ${100 - progressPercentage}%)`,
                          borderRadius: '8px',
                          transition: 'all 0.3s',
                          zIndex: 1,
                        }} />
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      margin: '0 2px'
                    }}>
                      <span style={{ color: '#374151', fontWeight: '400' }}>{daysCompleted} {daysCompleted === 1 ? 'day' : 'days'} completed</span>
                      <span style={{ color: '#374151', fontWeight: '400' }}>{daysRemaining} days remaining</span>
                    </div>
                  </div>
                </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRemainDay;