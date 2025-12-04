import { useState, useEffect, useRef } from 'react';

const DateRangePicker = ({ onChange, initialValue = 'today', disabled = false }) => {
  const [dateRange, setDateRange] = useState(() => {
    // Load persisted date range from localStorage on component mount
    const persisted = localStorage.getItem('statistics_date_range');
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        return parsed.type || initialValue;
      } catch (e) {
        console.warn('Failed to parse persisted date range:', e);
      }
    }
    return initialValue;
  });
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    // Load persisted custom dates if they exist
    const persisted = localStorage.getItem('statistics_date_range');
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        if (parsed.type === 'custom' && parsed.startDate && parsed.endDate) {
          return parsed.startDate;
        }
      } catch (e) {
        console.warn('Failed to parse persisted date range:', e);
      }
    }
    return '';
  });
  const [endDate, setEndDate] = useState(() => {
    // Load persisted custom dates if they exist
    const persisted = localStorage.getItem('statistics_date_range');
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        if (parsed.type === 'custom' && parsed.startDate && parsed.endDate) {
          return parsed.endDate;
        }
      } catch (e) {
        console.warn('Failed to parse persisted date range:', e);
      }
    }
    return '';
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const datePickerRef = useRef(null);

  // Listen for outlet changes to reset the date range
  useEffect(() => {
    const outletChangeHandler = () => {
      setDateRange('today');
      setShowCustomRange(false);
      setStartDate('');
      setEndDate('');
    };

    // Listen for a custom event that indicates the outlet has changed
    window.addEventListener('outlet:changed', outletChangeHandler);
    
    // Also listen for cache:clear event (e.g., on logout)
    window.addEventListener('cache:clear', outletChangeHandler);
    
    return () => {
      window.removeEventListener('outlet:changed', outletChangeHandler);
      window.removeEventListener('cache:clear', outletChangeHandler);
    };
  }, []);

  // Reset date range when initialValue changes (e.g., when outlet changes)
  useEffect(() => {
    setDateRange(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDropdown(false);
        setShowCustomRange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format a date string (YYYY-MM-DD) to display format (DD MMM YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  const handleRangeChange = (range) => {
    setDateRange(range);
    setShowDropdown(false);
    
    if (range === 'custom') {
      setShowCustomRange(true);
      // Don't call onChange yet, wait for custom dates
    } else {
      setShowCustomRange(false);
      onChange({ type: range });
    }
  };

  const handleCustomRangeApply = () => {
    if (startDate && endDate) {
      setDateRange('custom');
      setShowCustomRange(false);
      onChange({
        type: 'custom',
        startDate,
        endDate
      });
    }
  };

  const getDisplayText = () => {
    switch (dateRange) {
      case 'all':
        return 'All Time';
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'last7days':
        return 'Last 7 Days';
      case 'last30days':
        return 'Last 30 Days';
      case 'thisMonth':
        return 'This Month';
      case 'lastMonth':
        return 'Last Month';
      case 'custom':
        return startDate && endDate
          ? `${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}`
          : 'Custom Range';
      default:
        return 'Select Date Range';
    }
  };

  return (
    <div className="relative z-[1] inline-block w-full text-left" ref={datePickerRef}>
      {/* Dropdown button */}
      <button
        type="button"
        className={`inline-flex justify-between w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm font-medium ${
          disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 focus:ring-1 focus:ring-primary-500'
        }`}
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
        disabled={disabled}
      >
        <span className="flex items-center truncate">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 flex-shrink-0 ${disabled ? 'text-gray-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{getDisplayText()}</span>
        </span>
        <svg className={`h-4 w-4 ml-2 flex-shrink-0 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu - only show if not disabled */}
      {showDropdown && !disabled && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-[10]">
          <div className="py-1">
            {['all', 'today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth'].map((range) => (
              <button
                key={range}
                onClick={() => handleRangeChange(range)}
                className={`${
                  dateRange === range ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50`}
              >
                {range === 'all' && 'All Time'}
                {range === 'today' && 'Today'}
                {range === 'yesterday' && 'Yesterday'}
                {range === 'last7days' && 'Last 7 Days'}
                {range === 'last30days' && 'Last 30 Days'}
                {range === 'thisMonth' && 'This Month'}
                {range === 'lastMonth' && 'Last Month'}
              </button>
            ))}
          </div>
          <div className="py-1">
            <button
              onClick={() => handleRangeChange('custom')}
              className={`${
                dateRange === 'custom' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
              } group flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50`}
            >
              Custom Range
            </button>
          </div>
        </div>
      )}

      {/* Custom date range picker - only show if not disabled */}
      {showCustomRange && !disabled && (
        <div className="absolute z-[10] left-0 sm:right-0 sm:left-auto mt-2 p-4 bg-white rounded-md shadow-lg border border-gray-200 w-full sm:w-auto min-w-[280px]">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate} // Prevent selection of end date before start date
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
                onClick={() => setShowCustomRange(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                onClick={handleCustomRangeApply}
                disabled={!startDate || !endDate}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker; 