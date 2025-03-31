import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../../Database/firebaseconfig';

function Servicing() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    bikeModel: '',
    batteryHealth: '',
    serviceType: 'Regular Maintenance',
    description: '',
    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
    status: 'Pending',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch data from Firebase on component mount
  useEffect(() => {
    const servicesRef = ref(database, 'bikeServices');
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const servicesList = Object.keys(data).map((id) => ({ id, ...data[id] }));

      // Sort by date (newest first)
      servicesList.sort((a, b) => new Date(b.date) - new Date(a.date));

      setServices(servicesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (isEditing && editId) {
        // Update existing record
        const serviceRef = ref(database, `bikeServices/${editId}`);
        await update(serviceRef, formData);
        showSuccessMessage('Service updated successfully!');
      } else {
        // Add new record
        const servicesRef = ref(database, 'bikeServices');
        await push(servicesRef, {
          ...formData,
          timestamp: Date.now(),
        });
        showSuccessMessage('Service scheduled successfully!');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Show success message temporarily
  const showSuccessMessage = (message) => {
    setSubmitSuccess(message);
    setTimeout(() => {
      setSubmitSuccess(false);
    }, 3000);
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      customerName: '',
      phone: '',
      email: '',
      bikeModel: '',
      batteryHealth: '',
      serviceType: 'Regular Maintenance',
      description: '',
      date: new Date().toLocaleDateString('en-CA'),
      status: 'Pending',
    });
    setIsEditing(false);
    setEditId(null);
  };

  // Delete a service record
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service record?')) {
      try {
        const serviceRef = ref(database, `bikeServices/${id}`);
        await remove(serviceRef);
        showSuccessMessage('Service record deleted');
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  // Edit a service record
  const handleEdit = (service) => {
    setFormData(service);
    setIsEditing(true);
    setEditId(service.id);

    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Change service status
  const handleStatusChange = async (id, newStatus) => {
    try {
      const serviceRef = ref(database, `bikeServices/${id}`);
      await update(serviceRef, { status: newStatus });
      showSuccessMessage(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Filter services based on status
  const filteredServices =
    filter === 'all'
      ? services
      : services.filter((service) => service.status === filter);

  return (
    <div className="bg-gray-100 min-h-screen pb-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-100 transition-all hover:shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {isEditing ? 'Edit Service Request' : 'New Service Request'}
              </h2>

              {submitSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        {submitSuccess}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Customer Name*
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Phone*
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Bike Model*
                  </label>
                  <input
                    type="text"
                    name="bikeModel"
                    value={formData.bikeModel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Battery Health (%)
                  </label>
                  <input
                    type="number"
                    name="batteryHealth"
                    value={formData.batteryHealth}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Service Type*
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Regular Maintenance">Regular Maintenance</option>
                    <option value="Battery Service">Battery Service</option>
                    <option value="Motor Repair">Motor Repair</option>
                    <option value="Controller Issues">Controller Issues</option>
                    <option value="Brake System">Brake System</option>
                    <option value="Software Update">Software Update</option>
                    <option value="Full Inspection">Full Inspection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Service Date*
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Description of Issue
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsEditing(false);
                      setEditId(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className={`px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      submitLoading 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-1'
                    }`}
                  >
                    {submitLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : isEditing ? (
                      'Update Service'
                    ) : (
                      'Schedule Service'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Service Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Service Stats
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 transform transition-transform hover:scale-105">
                  <p className="text-sm text-blue-600 font-medium">Total Services</p>
                  <p className="text-2xl font-bold">{services.length}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 transform transition-transform hover:scale-105">
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-2xl font-bold">
                    {services.filter(s => s.status === 'Pending').length}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 transform transition-transform hover:scale-105">
                  <p className="text-sm text-purple-600 font-medium">In Progress</p>
                  <p className="text-2xl font-bold">
                    {services.filter(s => s.status === 'In Progress').length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 transform transition-transform hover:scale-105">
                  <p className="text-sm text-green-600 font-medium">Completed</p>
                  <p className="text-2xl font-bold">
                    {services.filter(s => s.status === 'Completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4 md:mb-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Service Records
                </h2>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === 'all' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilter('Pending')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === 'Pending' 
                        ? 'bg-yellow-500 text-white shadow-md' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Pending
                  </button>
                  <button 
                    onClick={() => setFilter('In Progress')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === 'In Progress' 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    In Progress
                  </button>
                  <button 
                    onClick={() => setFilter('Completed')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      filter === 'Completed' 
                        ? 'bg-green-600 text-white shadow-md' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Loading service records...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-lg text-gray-600">No service records found</p>
                  <p className="text-gray-500">Try changing your filter or add a new service</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer & Bike
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Info
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredServices.map(service => (
                        <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {service.customerName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {service.phone}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Model: {service.bikeModel}
                                </div>
                                {service.batteryHealth && (
                                  <div className="mt-1">
                                    <div className="text-xs text-gray-500 mb-1">
                                      Battery Health: {service.batteryHealth}%
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full ${
                                          parseInt(service.batteryHealth) > 70 
                                            ? 'bg-green-500' 
                                            : parseInt(service.batteryHealth) > 30 
                                              ? 'bg-yellow-500' 
                                              : 'bg-red-500'
                                        }`}
                                        style={{ width: `${service.batteryHealth}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900 font-medium">
                              {service.serviceType}
                            </div>
                            <div className="text-sm text-gray-500">
                              Date: {new Date(service.date).toLocaleDateString()}
                            </div>
                            {service.description && (
                              <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                                {service.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              service.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : service.status === 'In Progress'
                                  ? 'bg-purple-100 text-purple-800'
                                  : service.status === 'Cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {service.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <div className="relative">
                                <select
                                  value={service.status}
                                  onChange={(e) => handleStatusChange(service.id, e.target.value)}
                                  className="text-sm border border-gray-300 rounded-md py-1 pl-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>
                              <button
                                onClick={() => handleEdit(service)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(service.id)}
                                className="text-red-600 hover:text-red-900 transition-colors hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Servicing;