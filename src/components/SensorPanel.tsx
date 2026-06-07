import { SensorData } from '../types';

interface SensorPanelProps {
  temperature: number;
  humidity: number;
  history: SensorData[];
  threshold: number;
  setThreshold: (val: number) => void;
}

export const SensorPanel = ({ temperature, humidity, history, threshold, setThreshold }: SensorPanelProps) => {
  const isAlert = temperature > threshold;

  const drawPath = (data: number[], min: number, max: number) => {
    if (data.length < 2) return '';
    const range = max - min || 1;
    const stepX = 100 / Math.max(19, data.length - 1);
    return data.map((val, i) => {
      const x = i * stepX;
      // SVG Y is top-down, so invert Y
      const y = 40 - ((val - min) / range) * 40;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  const getTempPath = () => {
    const temps = history.map(d => d.temperature);
    const maxTemp = Math.max(50, ...temps);
    const minTemp = Math.min(0, ...temps);
    return drawPath(temps, minTemp, maxTemp);
  };

  const getHumPath = () => {
    const hums = history.map(d => d.humidity);
    return drawPath(hums, 0, 100);
  };

  return (
    <div className={`bg-[#11141b] rounded-xl p-5 border flex flex-col justify-between h-full relative overflow-hidden transition-colors ${isAlert ? 'border-red-500/50 shadow-[inset_0_0_50px_rgba(239,68,68,0.1)]' : 'border-white/5'}`}>
      <div className="flex justify-between items-start z-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Data Sensor Realtime</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-400">
            <span>Alert &gt;</span>
            <input 
              type="number" 
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-6 bg-transparent text-white font-bold text-center focus:outline-none focus:text-orange-500"
            />
            <span>°C</span>
          </div>
          <span className="bg-orange-500/10 text-orange-500 text-[10px] px-2 py-1 rounded border border-orange-500/20 font-bold tracking-wider">AUTO-UPDATE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 py-4 z-10 flex-grow content-center">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Suhu Ruangan</div>
            <div className={`text-5xl lg:text-5xl xl:text-6xl font-light tabular-nums ${isAlert ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
              {temperature.toFixed(1)}<span className="text-2xl text-gray-600">°C</span>
            </div>
          </div>
          <div className="w-24 lg:w-32 h-12 bg-white/5 rounded relative overflow-hidden shrink-0">
             <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
               {history.length > 1 ? (
                 <path d={getTempPath()} fill="none" stroke="#FF6B00" strokeWidth="2" strokeLinejoin="round" />
               ) : (
                 <path d="M0,30 Q10,15 20,25 T40,10 T60,25 T80,5 T100,20" fill="none" stroke="#FF6B00" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
               )}
             </svg>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Kelembapan</div>
            <div className="text-5xl lg:text-5xl xl:text-6xl font-light text-orange-500 tabular-nums">
              {humidity.toFixed(1)}<span className="text-2xl text-gray-600">%</span>
            </div>
          </div>
          <div className="w-24 lg:w-32 h-12 bg-white/5 rounded relative overflow-hidden shrink-0">
             <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
               {history.length > 1 ? (
                 <path d={getHumPath()} fill="none" stroke="#FF6B00" strokeWidth="2" strokeLinejoin="round" />
               ) : (
                 <path d="M0,20 Q10,35 20,20 T40,30 T60,10 T80,25 T100,35" fill="none" stroke="#FF6B00" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
               )}
             </svg>
          </div>
        </div>
      </div>
      
      <div className="text-[9px] text-gray-600 italic z-10">
        Peringatan: Suhu tinggi di atas {threshold}°C akan memicu bunyi alarm.
      </div>

      {isAlert && (
         <div className="absolute right-0 bottom-0 text-[150px] leading-none opacity-5 font-black text-red-500 select-none pointer-events-none">
           !
         </div>
      )}
    </div>
  );
};
