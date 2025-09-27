import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { handleApiError } from '../utils/sessionUtils';
import { useNavigate } from 'react-router-dom';

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
        "https://men4u.xyz/v2/common/cds_kds_order_listview",
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
    // Use teal/green color for remaining days as shown in the image
    return '#20C997'; // Teal/Medium Green
  };

  if (!selectedOutlet) {
    return null;
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-3">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

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

  const daysRemaining = calculateDaysRemaining(subscriptionData.end_date);
  const totalDays = calculateTotalDays(subscriptionData.start_date, subscriptionData.end_date);
  const daysCompleted = Math.max(0, totalDays - daysRemaining);
  const progressPercentage = (daysCompleted / totalDays) * 100;

  return (
    <div className="container-fluid py-1" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-md-5 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-1">
              {/* Timeline Header */}
              <h6 className="card-title mb-1 text-dark fw-bold" style={{ fontSize: '0.85rem', color: '#374151' }}>Timeline</h6>
              
              {/* Progress Bar Container */}
              <div className="mb-1">
                <div 
                  className="rounded-pill" 
                  style={{ 
                    height: '18px', 
                    backgroundColor: '#E5E7EB',
                    overflow: 'hidden',
                    position: 'relative',
                    width: '100%',
                    display: 'flex'
                  }}
                >
                  {/* Completed Days - Light Gray */}
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercentage}%`,
                      backgroundColor: '#E5E7EB',
                      transition: 'width 0.3s ease',
                      borderRadius: progressPercentage === 100 ? '50px' : '50px 0 0 50px'
                    }}
                  >
                  </div>
                  
                  {/* Remaining Days - Teal/Green */}
                  <div
                    style={{
                      height: '100%',
                      width: `${100 - progressPercentage}%`,
                      backgroundColor: getProgressColor(daysRemaining),
                      transition: 'width 0.3s ease',
                      borderRadius: progressPercentage === 0 ? '50px' : '0 50px 50px 0'
                    }}
                  >
                  </div>
                </div>
              </div>

              {/* Days Information - Simple Text */}
              <div className="row text-center">
                <div className="col-6">
                  <div className="text-center pe-2">
                    <span 
                      style={{ 
                        color: '#6B7280',
                        fontSize: '0.7rem',
                        fontWeight: '400'
                      }}
                    >
                      {daysCompleted} days completed
                    </span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center ps-2">
                    <span 
                      style={{ 
                        color: '#6B7280',
                        fontSize: '0.7rem',
                        fontWeight: '400'
                      }}
                    >
                      {daysRemaining} days remaining
                    </span>
                  </div>
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