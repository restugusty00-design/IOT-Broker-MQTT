import { useEffect, useState } from 'react';

export const TopBar = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex justify-between items-end mb-6 border-b border-[#FF6B00]/20 pb-4 shrink-0">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300" style={{ fontFamily: "'Helvetica Neue', sans-serif" }}>
          DASHBOARD IOT <span className="text-[10px] md:text-xs align-top bg-orange-600 text-black px-2 py-0.5 ml-2 font-black italic">VER 2.4</span>
        </h1>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold hidden sm:inline">System Status: <span className="text-orange-500">Running</span></span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse shadow-[0_0_8px_#FF6B00]"></div>
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-orange-500 font-bold">Online</span>
          </div>
        </div>
      </div>
      <div className="text-right hidden sm:block">
        <div className="text-3xl font-light text-orange-500 leading-none tracking-widest tabular-nums">{time.toLocaleTimeString('id-ID')}</div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mt-1">
          {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </header>
  );
};
