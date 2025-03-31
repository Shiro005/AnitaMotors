import React, { useState, useEffect, useRef } from 'react';
import { database } from '../../Database/firebaseconfig';
import { ref, set, onValue, remove, update, push } from 'firebase/database';
import BillGenerator from '../BillGenerator/BillGenerator';

const Vehicle = () => {
  // States for vehicle data
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    quantity: 0,
    price: '',
    specifications: '',
    engineCapacity: '',
    id: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('name');

  // New state for individual vehicle units
  const [vehicleUnits, setVehicleUnits] = useState([]);
  const [showVehicleUnits, setShowVehicleUnits] = useState(false);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState(null);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);

  // States for bill management
  const [showBill, setShowBill] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [billData, setBillData] = useState({
    vehicleId: '',
    quantity: 1,
    customerName: '',
    customerContact: '',
    sellingPrice: 0,
    date: new Date().toISOString().split('T')[0],
    billNumber: `BILL-${Math.floor(Math.random() * 10000)}`
  });

  // Fetch vehicles from Firebase
  useEffect(() => {
    const vehiclesRef = ref(database, 'vehicles');
    onValue(vehiclesRef, (snapshot) => {
      const data = snapshot.val();
      const vehiclesList = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setVehicles(vehiclesList);
      setFilteredVehicles(vehiclesList);
    });

    // Fetch individual vehicle units
    const unitsRef = ref(database, 'vehicleUnits');
    onValue(unitsRef, (snapshot) => {
      const data = snapshot.val();
      const unitsList = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setVehicleUnits(unitsList);
    });
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'price') {
      // Remove leading zeros
      const cleanedValue = value.replace(/^0+/, '') || '';
      setFormData({
        ...formData,
        [name]: cleanedValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'quantity' ? parseFloat(value) || 0 : value
      });
    }
  };

  // Handle individual unit input changes
  const handleUnitInputChange = (index, field, value) => {
    const updatedUnits = [...vehicleUnits];
    if (!updatedUnits[index]) {
      updatedUnits[index] = {};
    }
    updatedUnits[index][field] = value;
    setVehicleUnits(updatedUnits);
  };

  // Handle submit for adding/editing vehicle
  const handleSubmit = (e) => {
    e.preventDefault();

    const vehicleData = {
      name: formData.name,
      category: 'Scooter', // Default category
      model: formData.model,
      quantity: formData.quantity,
      price: parseFloat(formData.price) || 0,
      specifications: formData.specifications,
      engineCapacity: formData.engineCapacity,
      colors: 'Blue, Navy Blue, Sky Blue', // Default colors
    };

    if (isEditing && formData.id) {
      // Update existing vehicle
      update(ref(database, `vehicles/${formData.id}`), vehicleData);
      setShowVehicleUnits(false);
    } else {
      // Add new vehicle
      const newVehicleKey = push(ref(database, 'vehicles')).key;
      set(ref(database, `vehicles/${newVehicleKey}`), {
        ...vehicleData,
        dateAdded: new Date().toISOString()
      });

      // If quantity is greater than 0, show the vehicle units form
      if (formData.quantity > 0) {
        // Initialize empty units based on quantity
        const initialUnits = Array(parseInt(formData.quantity)).fill().map(() => ({
          vehicleId: newVehicleKey,
          motorNo: '',
          chassisNo: '',
          batteryNo: '',
          controllerNo: '',
          color: '',  // Add this new field
          status: 'available'
        }));
        setVehicleUnits(initialUnits);
        setShowVehicleUnits(true);
      } else {
        resetForm();
      }
    }
  };

  // Save vehicle units to Firebase
  const saveVehicleUnits = () => {
    // Validate that all required fields are filled
    // Validate that all required fields are filled
    const isValid = vehicleUnits.every(unit =>
      unit.motorNo && unit.chassisNo && unit.batteryNo && unit.controllerNo && unit.color
    );

    if (!isValid) {
      alert('Please fill all fields for each vehicle unit.');
      return;
    }

    // Save each unit to Firebase
    vehicleUnits.forEach(unit => {
      const newUnitKey = push(ref(database, 'vehicleUnits')).key;
      set(ref(database, `vehicleUnits/${newUnitKey}`), {
        ...unit,
        dateAdded: new Date().toISOString()
      });
    });

    setShowVehicleUnits(false);
    resetForm();
    alert('Vehicle units saved successfully!');
  };

  // Reset the form fields
  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      quantity: 0,
      price: '',
      specifications: '',
      engineCapacity: '',
      id: null
    });
    setIsEditing(false);
    setVehicleUnits([]);
    setShowVehicleUnits(false);
  };

  // Edit a vehicle
  const handleEdit = (vehicle) => {
    setFormData({
      ...vehicle,
      price: vehicle.price.toString(), // Convert to string for form input
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete a vehicle
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      remove(ref(database, `vehicles/${id}`));

      // Also delete any associated vehicle units
      vehicleUnits.forEach(unit => {
        if (unit.vehicleId === id) {
          remove(ref(database, `vehicleUnits/${unit.id}`));
        }
      });
    }
  };

  // Search functionality
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredVehicles(vehicles);
      setShowVehicleDetails(false);
    } else {
      if (searchFilter === 'chassisNo') {
        // Search for specific chassis number in vehicle units
        const matchingUnit = vehicleUnits.find(unit =>
          unit.chassisNo && unit.chassisNo.toLowerCase().includes(query)
        );

        if (matchingUnit) {
          // Find the vehicle that this unit belongs to
          const matchingVehicle = vehicles.find(v => v.id === matchingUnit.vehicleId);
          if (matchingVehicle) {
            setFilteredVehicles([matchingVehicle]);
            setSelectedVehicleDetails(matchingUnit);
            setShowVehicleDetails(true);
          } else {
            setFilteredVehicles([]);
            setShowVehicleDetails(false);
          }
        } else {
          setFilteredVehicles([]);
          setShowVehicleDetails(false);
        }
      } else {
        // Normal search in vehicles
        const filtered = vehicles.filter(vehicle => {
          if (searchFilter === 'all') {
            return Object.values(vehicle).some(value =>
              value && value.toString().toLowerCase().includes(query)
            );
          } else {
            return vehicle[searchFilter] &&
              vehicle[searchFilter].toString().toLowerCase().includes(query);
          }
        });
        setFilteredVehicles(filtered);
        setShowVehicleDetails(false);
      }
    }
  };

  // View all units of a specific vehicle
  const handleViewUnits = (vehicleId) => {
    const units = vehicleUnits.filter(unit => unit.vehicleId === vehicleId);
    setSelectedVehicleDetails(units);
    setShowVehicleDetails(true);
  };

  // Handle initiating sale of a vehicle
  const handleSellClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setBillData({
      ...billData,
      vehicleId: vehicle.id,
      sellingPrice: vehicle.price,
      billNumber: `BILL-${Math.floor(Math.random() * 10000)}-${new Date().getTime().toString().slice(-4)}`
    });
    setShowBill(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleSellUnit = (unit) => {
    // Find the vehicle that this unit belongs to
    const vehicle = vehicles.find(v => v.id === unit.vehicleId);

    if (vehicle) {
      setSelectedVehicle({
        ...vehicle,
        selectedUnit: unit // Add the specific unit information
      });

      // Set initial bill data with the unit's information
      setBillData({
        ...billData,
        vehicleId: vehicle.id,
        sellingPrice: vehicle.price,
        unitId: unit.id,
        // Pass the specific unit's data
        chassisNo: unit.chassisNo || '',
        motorNo: unit.motorNo || '',
        batteryNo: unit.batteryNo || '',
        controllerNo: unit.controllerNo || '',
        color: unit.color,
        quantity: 1, // Since we're selling a specific unit, quantity is 1
        date: new Date().toISOString().split('T')[0], // Set current date in YYYY-MM-DD format
        billNumber: `AM${Math.floor(1000 + Math.random() * 9000)}` // Format to match your AM prefix pattern
      });

      setShowBill(true);
      setShowVehicleDetails(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCompleteSale = (finalBillData) => {
    if (!selectedVehicle) return;

    // Add sale record
    const newSaleKey = push(ref(database, 'sales')).key;

    // Create sale record with specific unit details if available
    const saleData = {
      ...finalBillData,
      vehicleName: selectedVehicle.name,
      vehicleModel: selectedVehicle.model,
      timestamp: new Date().toISOString()
    };

    // If we're selling a specific unit
    if (finalBillData.unitId) {
      set(ref(database, `sales/${newSaleKey}`), saleData);

      // Mark the specific unit as sold
      update(ref(database, `vehicleUnits/${finalBillData.unitId}`), {
        status: 'sold',
        saleId: newSaleKey
      });

      // Update vehicle quantity
      update(ref(database, `vehicles/${finalBillData.vehicleId}`), {
        quantity: selectedVehicle.quantity - 1
      });
    } else {
      // Original bulk sale logic
      set(ref(database, `sales/${newSaleKey}`), saleData);

      // Update vehicle quantity
      update(ref(database, `vehicles/${finalBillData.vehicleId}`), {
        quantity: selectedVehicle.quantity - finalBillData.quantity
      });

      // Mark sold units as sold
      const availableUnits = vehicleUnits.filter(
        unit => unit.vehicleId === finalBillData.vehicleId && unit.status === 'available'
      );

      for (let i = 0; i < finalBillData.quantity && i < availableUnits.length; i++) {
        update(ref(database, `vehicleUnits/${availableUnits[i].id}`), {
          status: 'sold',
          saleId: newSaleKey
        });
      }
    }

    // Reset and close bill view
    setShowBill(false);
    setSelectedVehicle(null);
    alert('Sale recorded successfully!');
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Header */}
      <header className="text-black p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Scooter Inventory</h1>
          {(showBill || showVehicleUnits || showVehicleDetails) && (
            <button
              onClick={() => {
                setShowBill(false);
                setShowVehicleUnits(false);
                setShowVehicleDetails(false);
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors"
            >
              Back to Inventory
            </button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 mt-8">
        {showBill ? (
          // Bill Generator Component
          <BillGenerator
            vehicle={selectedVehicle}
            initialBillData={billData}
            onCompleteSale={handleCompleteSale}
            onCancel={() => setShowBill(false)}
          />
        ) : showVehicleUnits ? (
          // Vehicle Units Form
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">
              Enter Individual Vehicle Details
            </h2>
            <p className="mb-4 text-gray-600">
              Please enter details for each of the {vehicleUnits.length} vehicles in this batch.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motor No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chassis No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Battery No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Controller No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicleUnits.map((unit, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={unit.motorNo || ''}
                          onChange={(e) => handleUnitInputChange(index, 'motorNo', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter motor number"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={unit.chassisNo || ''}
                          onChange={(e) => handleUnitInputChange(index, 'chassisNo', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter chassis number"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={unit.batteryNo || ''}
                          onChange={(e) => handleUnitInputChange(index, 'batteryNo', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter battery number"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={unit.controllerNo || ''}
                          onChange={(e) => handleUnitInputChange(index, 'controllerNo', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter controller number"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={unit.color || ''}
                          onChange={(e) => handleUnitInputChange(index, 'color', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter color"
                          required
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowVehicleUnits(false)}
                className="px-4 py-2 mr-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveVehicleUnits}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save All Units
              </button>
            </div>
          </div>
        ) : showVehicleDetails ? (
          // Vehicle Details View
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">
              Vehicle Details
            </h2>

            {Array.isArray(selectedVehicleDetails) ? (
              // Multiple units view
              <div className="overflow-x-auto">
                <table className="w-full min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Motor No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chassis No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Battery No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Controller No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Color
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedVehicleDetails.map((unit, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {unit.motorNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {unit.chassisNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {unit.batteryNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {unit.controllerNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {unit.color}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${unit.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {unit.status === 'available' ? 'Available' : 'Sold'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleSellUnit(unit)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            disabled={unit.status !== 'available'}
                          >
                            Sell
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Single unit view
              <div className="bg-white rounded-lg shadow-md p-6 border border-blue-200">
                <h3 className="text-xl font-bold mb-4">Chassis Number: {selectedVehicleDetails.chassisNo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Motor Number:</p>
                    <p className="font-semibold">{selectedVehicleDetails.motorNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Battery Number:</p>
                    <p className="font-semibold">{selectedVehicleDetails.batteryNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Controller Number:</p>
                    <p className="font-semibold">{selectedVehicleDetails.controllerNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Color:</p>
                    <p className="font-semibold">{selectedVehicleDetails.color}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status:</p>
                    <p className={`font-semibold ${selectedVehicleDetails.status === 'available' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {selectedVehicleDetails.status === 'available' ? 'Available' : 'Sold'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Vehicle Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">
                {isEditing ? 'Edit Scooter' : 'Add New Scooter'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Scooter Name*</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Model*</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Quantity*</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Price (₹)*</label>
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Enter price"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Engine Capacity</label>
                    <input
                      type="text"
                      name="engineCapacity"
                      value={formData.engineCapacity}
                      onChange={handleInputChange}
                      placeholder="e.g. 110cc, 125cc"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">Specifications & Features</label>
                  <textarea
                    name="specifications"
                    value={formData.specifications}
                    onChange={handleInputChange}
                    placeholder="Enter specifications, features and other details..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  ></textarea>
                </div>

                <div className="mt-6 flex justify-end">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 mr-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {isEditing ? 'Update Scooter' : 'Add Scooter'}
                  </button>
                </div>
              </form>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <input
                    type="text"
                    placeholder="Search scooters or chassis number..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full md:w-48 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Fields</option>
                    <option value="name">Name</option>
                    <option value="model">Model</option>
                    <option value="chassisNo">Chassis Number</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vehicle List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.length > 0 ? filteredVehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{vehicle.name}</h3>
                    <p className="text-sm opacity-90">Model: {vehicle.model}</p>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-lg text-blue-800">₹{vehicle.price.toLocaleString()}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${vehicle.quantity > 10 ? 'bg-blue-100 text-blue-800' :
                        vehicle.quantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {vehicle.quantity > 0 ? `${vehicle.quantity} in stock` : 'Out of stock'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">Colors:</span>
                        <p>Blue, Navy Blue, Sky Blue</p>
                      </div>
                      {vehicle.engineCapacity && (
                        <div>
                          <span className="text-gray-600">Engine:</span>
                          <p>{vehicle.engineCapacity}</p>
                        </div>
                      )}
                    </div>

                    {vehicle.specifications && (
                      <div className="text-sm mb-4">
                        <span className="text-gray-600">Specifications:</span>
                        <p className="text-gray-700 line-clamp-2">{vehicle.specifications}</p>
                      </div>
                    )}

                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleViewUnits(vehicle.id)}
                        className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                      >
                        View Units
                      </button>
                      <button
                        onClick={() => handleSellClick(vehicle)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        disabled={vehicle.quantity < 1}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      className="w-16 h-16 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">
                      No scooters found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery.trim() !== ''
                        ? 'Your search did not match any scooters.'
                        : 'No scooters have been added yet.'}
                    </p>
                    {searchQuery.trim() !== '' && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilteredVehicles(vehicles);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Vehicle;