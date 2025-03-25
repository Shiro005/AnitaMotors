import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../Database/firebaseconfig';
import { 
  Package, 
  Users, 
  Truck, 
  Smile,
  ShoppingCart, 
  AlertTriangle, 
  DollarSign, 
  PlusCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalParts: 0,
    totalValue: 0,
    lowStockItems: 0,
    totalWorkers: 0,
    totalVehicles: 0,
    recentTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [quickAlerts, setQuickAlerts] = useState([]);

  useEffect(() => {
    setLoading(true);
    const alerts = [];

    // Fetch parts data
    const partsRef = ref(database, 'spareParts');
    const unsubscribeParts = onValue(partsRef, (snapshot) => {
      if (snapshot.exists()) {
        const partsData = snapshot.val();
        const partsArray = Object.values(partsData);
        
        const totalParts = partsArray.length;
        const totalValue = partsArray.reduce((sum, part) => 
          sum + (part.price * part.quantity), 0);
        const lowStockItems = partsArray.filter(part => part.quantity <= 5).length;
        
        if (lowStockItems > 0) {
          alerts.push({
            type: 'warning',
            message: `${lowStockItems} spare parts are running low on stock!`
          });
        }

        setStats(prev => ({
          ...prev,
          totalParts,
          totalValue,
          lowStockItems
        }));
      }
    });
    
    // Fetch workers data
    const workersRef = ref(database, 'workers');
    const unsubscribeWorkers = onValue(workersRef, (snapshot) => {
      if (snapshot.exists()) {
        const workersData = snapshot.val();
        const totalWorkers = Object.keys(workersData).length;
        
        const pendingLeaves = Object.values(workersData).filter(worker => 
          worker.leaveStatus === 'Pending').length;
        
        if (pendingLeaves > 0) {
          alerts.push({
            type: 'info',
            message: `${pendingLeaves} worker leave requests pending`
          });
        }

        setStats(prev => ({
          ...prev,
          totalWorkers
        }));
      }
    });

    // Fetch vehicles data
    const vehiclesRef = ref(database, 'vehicles');
    const unsubscribeVehicles = onValue(vehiclesRef, (snapshot) => {
      if (snapshot.exists()) {
        const vehiclesData = snapshot.val();
        const totalVehicles = Object.keys(vehiclesData).length;
        
        const vehiclesNeedMaintenance = Object.values(vehiclesData).filter(vehicle => 
          vehicle.maintenanceStatus === 'Due').length;
        
        if (vehiclesNeedMaintenance > 0) {
          alerts.push({
            type: 'warning',
            message: `${vehiclesNeedMaintenance} vehicles require maintenance`
          });
        }

        setStats(prev => ({
          ...prev,
          totalVehicles
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
        
        const recentTransactions = Object.values(transactionsData).filter(transaction => {
          const transactionDate = new Date(transaction.timestamp);
          return transactionDate >= today;
        }).length;
        
        setStats(prev => ({
          ...prev,
          recentTransactions
        }));
      }
      
      setQuickAlerts(alerts);
      setLoading(false);
    });
    
    return () => {
      unsubscribeParts();
      unsubscribeWorkers();
      unsubscribeVehicles();
      unsubscribeTransactions();
    };
  }, []);

  // Dashboard action buttons
  const dashboardActions = [
    { 
      title: 'Manage Workers',
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => navigate('/workers')
    },
    { 
      title: 'Manage Vehicles',
      icon: Truck,
      color: 'bg-green-500',
      onClick: () => navigate('/vehicles')
    },
    { 
      title: 'Spare Parts',
      icon: Package,
      color: 'bg-purple-500',
      onClick: () => navigate('/spare-parts')
    },
    { 
      title: 'Maintenance',
      icon: Smile,
      color: 'bg-yellow-500',
      onClick: () => navigate('/maintenance')
    }
  ];

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
      title: 'Vehicles',
      value: stats.totalVehicles,
      icon: Truck,
      color: 'bg-purple-500'
    },
    { 
      title: 'Workers',
      value: stats.totalWorkers,
      icon: Users,
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Vehicle Management Dashboard</h1>
          <button 
            onClick={() => navigate('/add-new')}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <PlusCircle className="mr-2" /> Add New
          </button>
        </div>

        {/* Quick Alerts Section */}
        {quickAlerts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickAlerts.map((alert, index) => (
                <div 
                  key={index} 
                  className={`
                    p-4 rounded-lg 
                    ${alert.type === 'warning' 
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300' 
                      : 'bg-blue-100 text-blue-800 border-blue-300'}
                    border flex items-center
                  `}
                >
                  <AlertTriangle className="mr-3 flex-shrink-0" />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-5 flex items-center">
                <div className={`${card.color} rounded-full p-3 mr-4 shadow-md`}>
                  <card.icon size={28} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Action Buttons */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  ${action.color} text-white 
                  py-4 rounded-lg 
                  flex flex-col items-center justify-center
                  hover:opacity-90 transition
                  transform hover:-translate-y-1 hover:scale-105
                `}
              >
                <action.icon size={36} className="mb-2" />
                <span className="text-sm font-medium">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Low Stock Alerts</h2>
            {stats.lowStockItems === 0 ? (
              <p className="text-gray-500">No spare parts are currently low in stock.</p>
            ) : (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <p className="text-red-600 flex items-center">
                  <AlertTriangle className="mr-2" />
                  {stats.lowStockItems} spare parts are running low and need immediate restocking.
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Quick Tips</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center">
                <Smile className="mr-2 text-blue-500" size={18} />
                Regularly update vehicle maintenance records
              </li>
              <li className="flex items-center">
                <Package className="mr-2 text-purple-500" size={18} />
                Monitor spare parts inventory closely
              </li>
              <li className="flex items-center">
                <Users className="mr-2 text-green-500" size={18} />
                Keep worker information up to date
              </li>
              <li className="flex items-center">
                <ShoppingCart className="mr-2 text-orange-500" size={18} />
                Log all transactions promptly
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}