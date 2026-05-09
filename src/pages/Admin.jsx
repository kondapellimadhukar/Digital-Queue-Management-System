import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, Users, Play, Pause, AlertTriangle, CheckSquare, LogOut, User as UserIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


export default function Admin() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [queueData, setQueueData] = useState({ waiting: [], serving: null, totalWaiting: 0, isPaused: false, isEmergency: false });
  const [chartData, setChartData] = useState([
    { time: '09:00', wait: 5 },
    { time: '10:00', wait: 15 },
    { time: '11:00', wait: 25 },
  ]);

  useEffect(() => {
    // Auth Check
    const storedUser = localStorage.getItem('staffUser');
    if (!storedUser) {
      navigate('/staff-login');
      return;
    }
    setCurrentUser(JSON.parse(storedUser));

    const socket = io('http://localhost:5000');
    
    socket.on('queue_update', (data) => {
      setQueueData(data);
      // Dynamically update chart
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setChartData(prev => {
        const newData = [...prev, { time: timeStr, wait: data.totalWaiting * 5 }];
        return newData.slice(-6); // Keep last 6 points
      });
    });

    fetch('http://localhost:5000/api/queue')
      .then(res => res.json())
      .then(data => setQueueData(data))
      .catch(console.error);

    return () => socket.disconnect();
  }, []);

  const handleCallNext = async () => {
    try {
      await fetch('http://localhost:5000/api/admin/call-next', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePause = async () => {
    try {
      await fetch('http://localhost:5000/api/admin/pause', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleEmergency = async () => {
    try {
      await fetch('http://localhost:5000/api/admin/emergency', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staffUser');
    navigate('/staff-login');
  };

  if (!currentUser) return null; // Prevent flicker while redirecting

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 glass-panel hover:bg-slate-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-['Outfit']">Service Controller</h1>
            <p className="text-slate-400">Admin Dashboard & Analytics</p>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="glass-panel py-2 px-4 flex items-center gap-4 border-sky-500/20">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
            <UserIcon size={20} className="text-sky-400" />
          </div>
          <div>
            <div className="font-bold text-sm">{currentUser.name}</div>
            <div className="text-xs text-sky-400">{currentUser.department}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="ml-4 p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Controls Panel */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-4">Queue Controls</h3>
            
            <div className="bg-slate-900/50 rounded-xl p-6 text-center border border-sky-500/30 shadow-[0_0_20px_rgba(56,189,248,0.1)] mb-6">
              <div className="text-sm text-sky-400 mb-1">Currently Serving</div>
              <div className="text-5xl font-bold neon-text font-['Outfit']">
                {queueData.serving ? queueData.serving.tokenNumber : 'None'}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleCallNext}
              className="btn-primary w-full shadow-[0_0_20px_rgba(56,189,248,0.2)]"
            >
              <Play fill="currentColor" size={20} />
              Call Next Token
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleTogglePause}
                className={`${queueData.isPaused ? 'bg-amber-500 hover:bg-amber-600 border-amber-400' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'} text-white p-3 rounded-xl flex justify-center items-center gap-2 transition-colors border`}
              >
                <Pause size={18} /> {queueData.isPaused ? 'Resume' : 'Pause'}
              </button>
              <button 
                onClick={handleToggleEmergency}
                className={`${queueData.isEmergency ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'} p-3 rounded-xl flex justify-center items-center gap-2 transition-colors border border-rose-500/20`}
              >
                <AlertTriangle size={18} /> {queueData.isEmergency ? 'Clear Emg.' : 'Emergency'}
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="glass-panel p-6 lg:col-span-2">
          <h3 className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-6">Live Wait Time Analytics (mins)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Area type="monotone" dataKey="wait" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorWait)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Waiting List */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <Users size={16} /> Waitlist ({queueData.totalWaiting})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 text-sm">
                <th className="pb-3 pl-4 font-medium">Token No.</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 pr-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {queueData.waiting.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan="5" className="text-center py-8 text-slate-500">No tokens in queue.</td>
                  </motion.tr>
                ) : (
                  queueData.waiting.map((token) => (
                    <motion.tr 
                      key={token._id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-4 pl-4 font-bold text-sky-400">{token.tokenNumber}</td>
                      <td className="py-4 text-slate-300">{token.name}</td>
                      <td className="py-4 text-slate-400 text-sm">
                        <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{token.category}</span>
                      </td>
                      <td className="py-4">
                        <span className="flex items-center gap-2 text-amber-400 text-sm">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span> Waiting
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <button className="text-slate-400 hover:text-white p-2">
                          <CheckSquare size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
