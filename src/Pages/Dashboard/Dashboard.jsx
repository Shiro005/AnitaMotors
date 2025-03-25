import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../Database/firebaseconfig';
import { Package, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalParts: 0,
    totalValue: 0,
    lowStockItems: 0,
    recentTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Fetch parts data
    const partsRef = ref(database, 'spareParts');
    const unsubscribeParts = onValue(partsRef, (snapshot) => {
      if (snapshot.exists()) {
        const partsData = snapshot.val();
        const partsArray = Object.values(partsData);
        
        // Calculate statistics
        const totalParts = partsArray.length;
        const totalValue = partsArray.reduce((sum, part) => 
          sum + (part.price * part.quantity), 0);
        const lowStockItems = partsArray.filter(part => part.quantity <= 5).length;
        
        setStats(prev => ({
          ...prev,
          totalParts,
          totalValue,
          lowStockItems
        }));
      }
    });
    
    // Fetch transactions data
    const transactionsRef = ref(database, 'transactions');
    const unsubscribeTransactions = onValue(transactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const transactionsData = snapshot.val();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Count today's transactions
        const recentTransactions = Object.values(transactionsData).filter(transaction => {
          const transactionDate = new Date(transaction.timestamp);
          return transactionDate >= today;
        }).length;
        
        setStats(prev => ({
          ...prev,
          recentTransactions
        }));
      }
      
      setLoading(false);
    });
    
    return () => {
      unsubscribeParts();
      unsubscribeTransactions();
    };
  }, []);

  // Stat cards
  const statCards = [
    { 
      title: 'Total Parts',
      value: stats.totalParts,
      icon: Package,
      color: 'bg-blue-500'
    },
    { 
      title: 'Inventory Value',
      value: `₹${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    { 
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500'
    },
    { 
      title: "Today's Transactions",
      value: stats.recentTransactions,
      icon: ShoppingCart,
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 flex items-center">
              <div className={`${card.color} rounded-full p-3 mr-4`}>
                <card.icon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">Low Stock Items</h2>
          {stats.lowStockItems === 0 ? (
            <p className="text-gray-500">No items are currently low in stock.</p>
          ) : (
            <p className="text-red-500">
              {stats.lowStockItems} items are running low and need to be restocked soon.
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold mb-4">Quick Tips</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Use the "Record Transaction" button to log sales and purchases</li>
            <li>Check the Transactions page for a complete history</li>
            <li>Items with red quantity are low in stock</li>
            <li>Delete parts only when they're no longer offered</li>
          </ul>
        </div>
      </div>
    </div>
  );
}