// SparePartsManagement.jsx
import { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../../Database/firebaseconfig';
import { PlusCircle, Edit2, Trash2, Save, X } from 'lucide-react';

export default function SparePartsManagement() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPart, setCurrentPart] = useState({
    id: null,
    name: '',
    partNumber: '',
    quantity: 0,
    price: 0,
    category: '',
    manufacturer: '',
    location: ''
  });
  const [transactionData, setTransactionData] = useState({
    partId: '',
    quantity: 1,
    type: 'sale', // 'sale' or 'purchase'
    notes: ''
  });
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);

  // Fetch parts from Firebase
  useEffect(() => {
    const partsRef = ref(database, 'spareParts');
    
    const unsubscribe = onValue(partsRef, (snapshot) => {
      setLoading(true);
      
      if (snapshot.exists()) {
        const partsData = snapshot.val();
        const partsArray = Object.keys(partsData).map(key => ({
          id: key,
          ...partsData[key]
        }));
        setParts(partsArray);
      } else {
        setParts([]);
      }
      
      setLoading(false);
    }, (error) => {
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle part form input changes
  const handlePartInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPart({
      ...currentPart,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value
    });
  };

  // Handle transaction form input changes
  const handleTransactionInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionData({
      ...transactionData,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    });
  };

  // Add new part
  const handleAddPart = () => {
    setIsEditMode(false);
    setCurrentPart({
      id: null,
      name: '',
      partNumber: '',
      quantity: 0,
      price: 0,
      category: '',
      manufacturer: '',
      location: ''
    });
    setIsFormOpen(true);
  };

  // Edit existing part
  const handleEditPart = (part) => {
    setIsEditMode(true);
    setCurrentPart(part);
    setIsFormOpen(true);
  };

  // Save part (add or update)
  const handleSavePart = () => {
    if (!currentPart.name || !currentPart.partNumber) {
      setError('Name and Part Number are required.');
      return;
    }

    try {
      if (isEditMode && currentPart.id) {
        // Update existing part
        const partRef = ref(database, `spareParts/${currentPart.id}`);
        update(partRef, {
          name: currentPart.name,
          partNumber: currentPart.partNumber,
          quantity: currentPart.quantity,
          price: currentPart.price,
          category: currentPart.category,
          manufacturer: currentPart.manufacturer,
          location: currentPart.location,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Add new part
        const partsRef = ref(database, 'spareParts');
        push(partsRef, {
          name: currentPart.name,
          partNumber: currentPart.partNumber,
          quantity: currentPart.quantity,
          price: currentPart.price,
          category: currentPart.category,
          manufacturer: currentPart.manufacturer,
          location: currentPart.location,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      setIsFormOpen(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete part
  const handleDeletePart = (partId) => {
    if (window.confirm('Are you sure you want to delete this spare part?')) {
      try {
        const partRef = ref(database, `spareParts/${partId}`);
        remove(partRef);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Handle transactions (sales/purchases)
  const handleTransaction = () => {
    if (!transactionData.partId || transactionData.quantity <= 0) {
      setError('Please select a part and enter a valid quantity.');
      return;
    }

    const selectedPart = parts.find(part => part.id === transactionData.partId);
    if (!selectedPart) {
      setError('Selected part not found.');
      return;
    }

    // Calculate new quantity based on transaction type
    let newQuantity;
    if (transactionData.type === 'sale') {
      newQuantity = selectedPart.quantity - transactionData.quantity;
      if (newQuantity < 0) {
        setError('Not enough quantity available for this sale.');
        return;
      }
    } else {
      newQuantity = selectedPart.quantity + transactionData.quantity;
    }

    try {
      // Update part quantity
      const partRef = ref(database, `spareParts/${transactionData.partId}`);
      update(partRef, {
        quantity: newQuantity,
        updatedAt: new Date().toISOString()
      });

      // Record transaction
      const transactionsRef = ref(database, 'transactions');
      push(transactionsRef, {
        partId: transactionData.partId,
        partName: selectedPart.name,
        partNumber: selectedPart.partNumber,
        quantity: transactionData.quantity,
        type: transactionData.type,
        notes: transactionData.notes,
        previousQuantity: selectedPart.quantity,
        newQuantity: newQuantity,
        timestamp: new Date().toISOString()
      });

      // Reset form and close
      setTransactionData({
        partId: '',
        quantity: 1,
        type: 'sale',
        notes: ''
      });
      setIsTransactionFormOpen(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Form for adding/editing parts
  const renderPartForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{isEditMode ? 'Edit Spare Part' : 'Add New Spare Part'}</h2>
          <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Part Name*</label>
            <input
              type="text"
              name="name"
              value={currentPart.name}
              onChange={handlePartInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Part Number*</label>
            <input
              type="text"
              name="partNumber"
              value={currentPart.partNumber}
              onChange={handlePartInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                min="0"
                name="quantity"
                value={currentPart.quantity}
                onChange={handlePartInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="price"
                value={currentPart.price}
                onChange={handlePartInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              name="category"
              value={currentPart.category}
              onChange={handlePartInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
            <input
              type="text"
              name="manufacturer"
              value={currentPart.manufacturer}
              onChange={handlePartInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Storage Location</label>
            <input
              type="text"
              name="location"
              value={currentPart.location}
              onChange={handlePartInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
            />
          </div>
          
          <button
            onClick={handleSavePart}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 mt-2"
          >
            <Save size={18} />
            Save Part
          </button>
        </div>
      </div>
    </div>
  );

  // Form for transactions (sales/purchases)
  const renderTransactionForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Record Transaction</h2>
          <button onClick={() => setIsTransactionFormOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Part*</label>
            <select
              name="partId"
              value={transactionData.partId}
              onChange={handleTransactionInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
              required
            >
              <option value="">-- Select Part --</option>
              {parts.map(part => (
                <option key={part.id} value={part.id}>
                  {part.name} ({part.partNumber}) - Available: {part.quantity}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction Type*</label>
              <select
                name="type"
                value={transactionData.type}
                onChange={handleTransactionInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
              >
                <option value="sale">Sale (Out)</option>
                <option value="purchase">Purchase (In)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity*</label>
              <input
                type="number"
                min="1"
                name="quantity"
                value={transactionData.quantity}
                onChange={handleTransactionInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={transactionData.notes}
              onChange={handleTransactionInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2 border"
              rows="3"
            />
          </div>
          
          <button
            onClick={handleTransaction}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 mt-2"
          >
            <Save size={18} />
            Record Transaction
          </button>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Spare Parts Management</h1>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setIsTransactionFormOpen(true)}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Record Transaction
            </button>
            
            <button 
              onClick={handleAddPart}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <PlusCircle size={18} />
              Add New Part
            </button>
          </div>
        </div>
        
        {error && <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">{error}</div>}
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : parts.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-md text-center">
            <p className="text-gray-500 text-lg">No spare parts found. Add your first part to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part #</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parts.map(part => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 whitespace-nowrap">{part.name}</td>
                    <td className="py-4 px-4 whitespace-nowrap">{part.partNumber}</td>
                    <td className={`py-4 px-4 whitespace-nowrap font-medium ${part.quantity <= 5 ? 'text-red-600' : part.quantity <= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {part.quantity}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">₹{part.price?.toFixed(2)}</td>
                    <td className="py-4 px-4 whitespace-nowrap">{part.category || '-'}</td>
                    <td className="py-4 px-4 whitespace-nowrap">{part.manufacturer || '-'}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPart(part)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit part"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeletePart(part.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete part"
                        >
                          <Trash2 size={18} />
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
      
      {isFormOpen && renderPartForm()}
      {isTransactionFormOpen && renderTransactionForm()}
    </div>
  );
}