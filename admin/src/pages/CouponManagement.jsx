import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { backendUrl } from '../App';

const CouponManagement = ({ token }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    discountPercentage: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    code: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setFetching(true);
      const response = await axios.get(`${backendUrl}/api/coupons`, {
        headers: {
          token: token
        }
      });
      
      // Handle different response formats
      let couponsData = [];
      if (Array.isArray(response.data)) {
        couponsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        couponsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.coupons)) {
        couponsData = response.data.coupons;
      } else {
        console.warn('Unexpected response format:', response.data);
        couponsData = [];
      }
      
      setCoupons(couponsData);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch coupons';
      toast.error(errorMessage);
      setCoupons([]); // Set empty array on error
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/coupons`, formData, {
        headers: {
          token: token
        }
      });
      
      if (response.status === 201 || response.status === 200) {
      toast.success('Coupon created successfully');
      setFormData({
        discountPercentage: '',
        validFrom: '',
        validUntil: '',
        usageLimit: '',
        code: ''
      });
      fetchCoupons();
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create coupon';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        const response = await axios.delete(`${backendUrl}/api/coupons/${id}`, {
          headers: {
            token: token
          }
        });
        
        if (response.status === 200 || response.status === 204) {
        toast.success('Coupon deleted successfully');
        fetchCoupons();
        }
      } catch (error) {
        console.error('Error deleting coupon:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete coupon';
        toast.error(errorMessage);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Coupon Management</h1>
      
      {/* Create Coupon Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Coupon</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount Percentage</label>
            <input
              type="number"
              name="discountPercentage"
              value={formData.discountPercentage}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              min="1"
              max="100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Valid From</label>
            <input
              type="datetime-local"
              name="validFrom"
              value={formData.validFrom}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Valid Until</label>
            <input
              type="datetime-local"
              name="validUntil"
              value={formData.validUntil}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Usage Limit (Optional)</label>
            <input
              type="number"
              name="usageLimit"
              value={formData.usageLimit}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="1"
            />
          </div>
          
          <div>
            <label>Coupon Code (optional)</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. JJ20"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {loading ? 'Creating...' : 'Create Coupon'}
          </button>
        </form>
      </div>

      {/* Coupons List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Existing Coupons</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No coupons found. Create your first coupon above.</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map((coupon) => {
                  const now = new Date();
                  const validFrom = new Date(coupon.validFrom);
                  const validUntil = new Date(coupon.validUntil);
                  const isActive = now >= validFrom && now <= validUntil;
                  const isExpired = now > validUntil;
                  const isUpcoming = now < validFrom;
                  const usageExceeded = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
                  
                  return (
                <tr key={coupon._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coupon.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coupon.discountPercentage}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(coupon.validFrom).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(coupon.validUntil).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isExpired ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Expired</span>
                        ) : isUpcoming ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Upcoming</span>
                        ) : usageExceeded ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Limit Reached</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDelete(coupon._id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default CouponManagement; 