
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Booking from './pages/Booking';
import LiveQueue from './pages/LiveQueue';
import Admin from './pages/Admin';

import StaffLogin from './pages/StaffLogin';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen relative overflow-hidden text-slate-100">
        {/* Abstract background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-600/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Booking />} />
            <Route path="/live" element={<LiveQueue />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
