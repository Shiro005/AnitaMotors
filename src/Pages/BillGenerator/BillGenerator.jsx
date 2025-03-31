import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const BillGenerator = ({ vehicle, initialBillData, onCompleteSale, onCancel }) => {
  const [billData, setBillData] = useState({
    ...initialBillData,
    motorNo: '',
    chassisNo: '',
    batteryNo: '',
    controllerNo: '',
  });
  const [editMode, setEditMode] = useState(true);
  const [savedBills, setSavedBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('customerName');
  const billRef = useRef();

  // Load saved bills from localStorage on component mount
  useEffect(() => {
    const bills = JSON.parse(localStorage.getItem('savedBills') || '[]');
    setSavedBills(bills);
  }, []);

  // Generate next invoice number based on last saved bill
  useEffect(() => {
    if (savedBills.length > 0) {
      const lastInvoiceNumber = savedBills[savedBills.length - 1].billNumber;
      const match = lastInvoiceNumber.match(/AM(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        setBillData(prev => ({
          ...prev,
          billNumber: `AM${nextNumber.toString().padStart(4, '0')}`
        }));
      }
    } else {
      setBillData(prev => ({
        ...prev,
        billNumber: 'AM0001'
      }));
    }
  }, [savedBills]);

  // Calculate total amount and taxes
  const calculateAmounts = () => {
    const totalAmount = billData.sellingPrice * billData.quantity;
    const cgst = totalAmount * 0.025; // 2.5% CGST
    const sgst = totalAmount * 0.025; // 2.5% SGST
    const totalTax = cgst + sgst;
    const finalAmount = totalAmount + totalTax;
    
    return {
      totalAmount,
      cgst,
      sgst,
      totalTax,
      finalAmount
    };
  };

  const { totalAmount, cgst, sgst, finalAmount } = calculateAmounts();

  // Convert number to words
  const numberToWords = (num) => {
    const converter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const formattedAmount = converter.format(num);
    return `${formattedAmount} Only`;
  };

  // Handle input changes for bill data
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillData({
      ...billData,
      [name]: name === 'quantity' || name === 'sellingPrice'
        ? parseFloat(value) || 0
        : value
    });
  };

  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => billRef.current,
    documentTitle: `Invoice-${billData.billNumber}`,
  });

  // Save bill as PDF to localStorage
  const saveBillToLocalStorage = (bill) => {
    const updatedBills = [...savedBills, bill];
    localStorage.setItem('savedBills', JSON.stringify(updatedBills));
    setSavedBills(updatedBills);
  };

  // Handle save and download
  const handleSave = () => {
    if (!billData.customerName.trim()) {
      alert('Customer name is required');
      return;
    }
    
    if (!billData.chassisNo.trim() || !billData.motorNo.trim()) {
      alert('Chassis and Motor numbers are required');
      return;
    }
    
    // Validate quantity
    if (billData.quantity <= 0 || billData.quantity > vehicle.quantity) {
      alert(`Invalid quantity. Available: ${vehicle.quantity}`);
      return;
    }
    
    const billToSave = {
      ...billData,
      vehicleDetails: vehicle,
      totalAmount,
      cgst,
      sgst,
      finalAmount,
      createdAt: new Date().toISOString()
    };
    
    saveBillToLocalStorage(billToSave);
    onCompleteSale(billToSave);
    
    // Automatically trigger print/download
    setTimeout(() => {
      handlePrint();
    }, 500);
  };
  
  // Handle bill download
  const handleDownload = () => {
    handlePrint();
  };

  // Search functionality
  const filteredBills = savedBills.filter(bill => {
    if (!searchTerm) return false;
    
    const searchValue = bill[searchCategory]?.toString().toLowerCase() || '';
    return searchValue.includes(searchTerm.toLowerCase());
  });

  // Delete a saved bill
  const handleDeleteBill = (billNumber) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      const updatedBills = savedBills.filter(bill => bill.billNumber !== billNumber);
      localStorage.setItem('savedBills', JSON.stringify(updatedBills));
      setSavedBills(updatedBills);
    }
  };

  // Edit a saved bill
  const handleEditBill = (bill) => {
    setBillData(bill);
    setEditMode(true);
  };

  // Get next service date
  const getServiceDate = (months) => {
    const date = new Date(billData.date);
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString('en-IN');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Vehicle Bill Generator</h2>
        <div>
          {!editMode && (
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm mr-2"
            >
              Download PDF
            </button>
          )}
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm mr-2"
          >
            {editMode ? 'Preview' : 'Edit'}
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Print
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Search Previous Bills</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter search term..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-48">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="customerName">Customer Name</option>
              <option value="chassisNo">Chassis Number</option>
              <option value="motorNo">Motor Number</option>
              <option value="batteryNo">Battery Number</option>
              <option value="controllerNo">Controller Number</option>
              <option value="date">Bill Date</option>
              <option value="billNumber">Invoice Number</option>
            </select>
          </div>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Clear
          </button>
        </div>

        {filteredBills.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Invoice #</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Customer</th>
                  <th className="p-2 border">Chassis No</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.billNumber} className="hover:bg-gray-50">
                    <td className="p-2 border">{bill.billNumber}</td>
                    <td className="p-2 border">{new Date(bill.date).toLocaleDateString()}</td>
                    <td className="p-2 border">{bill.customerName}</td>
                    <td className="p-2 border">{bill.chassisNo}</td>
                    <td className="p-2 border">₹{bill.finalAmount?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="p-2 border">
                      <button
                        onClick={() => handleEditBill(bill)}
                        className="px-2 py-1 bg-blue-500 text-white rounded mr-1 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBill(bill.billNumber)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-2">Invoice Number*</label>
            <input
              type="text"
              name="billNumber"
              value={billData.billNumber}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Bill Date*</label>
            <input
              type="date"
              name="date"
              value={billData.date}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Customer Name*</label>
            <input
              type="text"
              name="customerName"
              value={billData.customerName}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Customer Contact</label>
            <input
              type="text"
              name="customerContact"
              value={billData.customerContact}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Customer Address</label>
            <textarea
              name="customerAddress"
              value={billData.customerAddress || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Quantity*</label>
            <input
              type="number"
              name="quantity"
              value={billData.quantity}
              onChange={handleInputChange}
              min="1"
              max={vehicle.quantity}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Selling Price (₹)*</label>
            <input
              type="number"
              name="sellingPrice"
              value={billData.sellingPrice}
              onChange={handleInputChange}
              min="1"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Motor Number*</label>
            <input
              type="text"
              name="motorNo"
              value={billData.motorNo}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Chassis Number*</label>
            <input
              type="text"
              name="chassisNo"
              value={billData.chassisNo}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Battery Number</label>
            <input
              type="text"
              name="batteryNo"
              value={billData.batteryNo}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Controller Number</label>
            <input
              type="text"
              name="controllerNo"
              value={billData.controllerNo}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      ) : (
        <div ref={billRef} className="p-4 border border-gray-200 rounded-lg bg-white">
          {/* Bill Header - Based on the provided PDF format */}
          <div className="border-b-2 border-blue-700 pb-4 mb-4">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">Tax Invoice</h1>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">ANITA MOTORS</h2>
                <p className="text-sm">Shop no 2, Rahate complex, Jawahar Nagar,</p>
                <p className="text-sm">Akola 444001. Contact: - 8468857781</p>
                <p className="text-sm">GSTIN NO=27CSZPR0818J1ZX</p>
              </div>
              <div className="text-right">
                <p className="text-sm"><strong>Invoice no:</strong> {billData.billNumber}</p>
                <p className="text-sm"><strong>Date:</strong> {new Date(billData.date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6 border-b pb-2">
            <div className="flex justify-between">
              <div>
                <p><strong>CONSIGNEE:</strong> {billData.customerName}</p>
                <p><strong>MOB NO:</strong> {billData.customerContact || '-'}</p>
                <p><strong>Address:</strong> {billData.customerAddress || '-'}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border text-center">SR NO</th>
                  <th className="p-2 border text-left">Particulars</th>
                  <th className="p-2 border text-right">RATE</th>
                  <th className="p-2 border text-center">QTY</th>
                  <th className="p-2 border text-center">HSN/SAC</th>
                  <th className="p-2 border text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border text-center">01</td>
                  <td className="p-2 border">
                    <div>
                      <p className="font-medium">{vehicle.name || "Electric Vehicle"}</p>
                      <p className="text-sm text-gray-600">Model: {vehicle.model || "-"}</p>
                      {vehicle.engineCapacity && <p className="text-sm text-gray-600">Engine: {vehicle.engineCapacity}</p>}
                    </div>
                  </td>
                  <td className="p-2 border text-right">₹{billData.sellingPrice.toLocaleString()}</td>
                  <td className="p-2 border text-center">{billData.quantity}</td>
                  <td className="p-2 border text-center">87116020</td>
                  <td className="p-2 border text-right">₹{totalAmount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-2 border text-center">02</td>
                  <td className="p-2 border"><strong>MOTOR NO</strong></td>
                  <td colSpan="4" className="p-2 border">{billData.motorNo}</td>
                </tr>
                <tr>
                  <td className="p-2 border text-center">03</td>
                  <td className="p-2 border"><strong>CHASSIS NO</strong></td>
                  <td colSpan="4" className="p-2 border">{billData.chassisNo}</td>
                </tr>
                <tr>
                  <td className="p-2 border text-center">04</td>
                  <td className="p-2 border"><strong>BATTERY NO</strong></td>
                  <td colSpan="4" className="p-2 border">{billData.batteryNo || '-'}</td>
                </tr>
                <tr>
                  <td className="p-2 border text-center">05</td>
                  <td className="p-2 border"><strong>CONTROLLER NO</strong></td>
                  <td colSpan="4" className="p-2 border">{billData.controllerNo || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Summary */}
          <div className="mb-4 grid grid-cols-2">
            <div>
              <p><strong>• CGST 2.5% :</strong> ₹{cgst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p><strong>• SGST 2.5% :</strong> ₹{sgst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className="mt-2"><strong>IN WORDS :</strong> {numberToWords(finalAmount)}</p>
            </div>
            <div className="border-2 border-gray-300 p-2">
              <div className="flex justify-between border-b pb-1">
                <strong>TOTAL</strong>
                <span>₹{totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b py-1">
                <strong>GST 5%</strong>
                <span>₹{(cgst + sgst).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-1 font-bold">
                <strong>GRAND TOTAL</strong>
                <span>₹{finalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between mt-8 mb-4">
            <div className="w-1/3 border-t pt-1 text-center">
              <p>CUSTOMER SIGNATURE</p>
            </div>
            <div className="w-1/3 border-t pt-1 text-center">
              <p>FOR ANITA MOTORS</p>
              <p className="mt-6">Proprietor</p>
            </div>
          </div>

          {/* Terms & Notes */}
          <div className="mt-8 text-xs border-t pt-2">
            <p className="font-semibold">Battery Usage Guidelines:</p>
            <ul className="pl-4 list-disc text-xs">
              <li>Battery should not be over charged, if it is seen that the battery is bulging then the warranty will be terminated.</li>
              <li>Get all the batteries balanced by rotating in every 3 months from your nearest dealer.</li>
              <li>Keep the batteries away from water. Do not wash batteries. Batteries are sealed do not attempt to add acid.</li>
              <li>Do not accelerate and brake abruptly. Do not over load the scooter. Keep batteries cool. Charge under shade.</li>
              <li>Once a month, Discharge battery fully and Charge battery fully. Charge after at-least 30 minutes of a long drive.</li>
            </ul>
          </div>

          {/* Service Schedule */}
          <div className="mt-4 text-xs border p-2 bg-gray-50">
            <p className="font-semibold text-center mb-2">FOR SERVICE RELATED ISSUE CALL 8468857781</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              <p>1:- FIRST free SERVICE 500 KM OR 2 MONTHS WHICHEVER COMES FIRST {getServiceDate(2)}</p>
              <p>2:- SECOND free SERVICE 2000KM OR 4 MONTHS WHICHEVER COMES FIRST {getServiceDate(4)}</p>
              <p>3:- Third Paid SERVICE 4000 KM OR 6 MONTHS WHICHEVER COMES FIRST {getServiceDate(6)}</p>
              <p>4:- Fourth Paid SERVICE 6000 KM OR 8 MONTHS WHICHEVER COMES FIRST {getServiceDate(8)}</p>
              <p>5:- FIFTH Paid SERVICE 8000 KM OR 10 MONTHS WHICHEVER COMES FIRST {getServiceDate(10)}</p>
            </div>
          </div>

          {/* Warranty Terms */}
          <div className="mt-2 text-xs">
            <ul className="pl-2">
              <li>➢ BATTERY 8+4 GUARANTEE/WARRANTY.</li>
              <li>➢ CONTROLLER AND MOTOR COMPLETE 1 YEAR GUARANTEE.</li>
              <li>➢ NO CHARGER GUARANTEE/ WARRANTY.</li>
              <li>➢ NO BULGING WARRANTY FOR BATTERY.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 mr-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Complete Sale & Save
        </button>
      </div>
    </div>
  );
};

export default BillGenerator;