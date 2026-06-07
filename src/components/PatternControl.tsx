interface PatternControlProps {
  patterns: boolean[];
  onToggle: (index: number) => void;
  onToggleAll: (state: boolean) => void;
}

export const PatternControl = ({ patterns, onToggle, onToggleAll }: PatternControlProps) => {
  return (
    <div className="bg-[#11141b] rounded-xl p-5 border border-white/5 h-full flex flex-col">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Pola Lampu</h2>
      <div className="space-y-3 flex-grow">
        <button
          onClick={() => onToggle(0)}
          className={`w-full py-4 rounded-lg flex flex-col items-center gap-2 border transition-colors ${
            patterns[0] ? 'bg-orange-600/10 border-orange-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
        >
           <div className="flex gap-1 items-center h-4">
             <div className={`w-2 h-2 rounded-full ${patterns[0] ? 'bg-orange-500' : 'bg-gray-500'} transition-colors`}></div>
             <div className={`w-2 h-2 rounded-full ${patterns[0] ? 'bg-orange-500/30' : 'bg-gray-700'} transition-colors`}></div>
             <div className={`w-2 h-2 rounded-full ${patterns[0] ? 'bg-orange-500/30' : 'bg-gray-700'} transition-colors`}></div>
           </div>
           <span className={`text-[10px] font-bold uppercase tracking-tighter ${patterns[0] ? 'text-white' : 'text-gray-400'}`}>Kiri ke Kanan</span>
        </button>
        <button
          onClick={() => onToggle(1)}
          className={`w-full py-4 rounded-lg flex flex-col items-center gap-2 border transition-colors ${
            patterns[1] ? 'bg-orange-600/10 border-orange-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
        >
           <div className="flex gap-2 items-center h-4">
             <div className={`w-2 h-2 rounded-full ${patterns[1] ? 'bg-white animate-pulse' : 'bg-gray-500'}`}></div>
             <div className={`w-2 h-2 rounded-full ${patterns[1] ? 'bg-white animate-pulse' : 'bg-gray-500'}`}></div>
           </div>
           <span className={`text-[10px] font-bold uppercase tracking-tighter ${patterns[1] ? 'text-white' : 'text-gray-400'}`}>Mode Strobe</span>
        </button>
        <button 
          onClick={() => onToggleAll(false)}
          className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-[10px] font-bold uppercase transition-colors"
        >
          Matikan Semua Pola
        </button>
      </div>
    </div>
  );
};
