import { useState } from 'react';

interface RelayControlProps {
  relays: boolean[];
  relayNames: string[];
  disabled: boolean;
  onToggle: (index: number) => void;
  onToggleAll: (state: boolean) => void;
  onRename: (index: number, name: string) => void;
}

export const RelayControl = ({ relays, relayNames, disabled, onToggle, onToggleAll, onRename }: RelayControlProps) => {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditName(relayNames[idx]);
  };

  const handleSave = (idx: number) => {
    onRename(idx, editName || `Relay ${idx + 1}`);
    setEditingIdx(null);
  };

  return (
    <div className="bg-[#11141b] rounded-xl p-5 border border-white/5 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Kontrol Relay</h2>
        <div className="flex gap-2">
          <button 
            disabled={disabled}
            onClick={() => onToggleAll(true)}
            className="text-[9px] px-3 py-1 bg-orange-600 text-black font-bold uppercase rounded-sm disabled:opacity-50 transition-colors"
          >
            Semua ON
          </button>
          <button 
            disabled={disabled}
            onClick={() => onToggleAll(false)}
            className="text-[9px] px-3 py-1 bg-gray-800 text-white font-bold uppercase rounded-sm disabled:opacity-50 transition-colors"
          >
            Semua OFF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-grow content-start">
        {relays.map((isOn, idx) => (
          <div key={idx} className={`bg-white/5 p-4 rounded-lg flex flex-col gap-3 border-l-2 transition-all duration-300 ${isOn ? 'border-orange-500 shadow-[inset_0_0_20px_rgba(255,107,0,0.05)]' : 'border-gray-700'} ${disabled ? 'opacity-50 grayscale' : ''}`}>
            {editingIdx === idx ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleSave(idx)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave(idx)}
                autoFocus
                className="w-full bg-black/50 border border-orange-500 text-[11px] font-bold tracking-wide text-white px-2 py-1 rounded"
              />
            ) : (
              <span 
                className="text-[11px] font-bold tracking-wide text-white cursor-pointer hover:text-orange-400 truncate"
                onClick={() => handleEdit(idx)}
                title="Klik untuk mengubah nama"
              >
                {relayNames[idx]}
              </span>
            )}
            <button
              disabled={disabled}
              onClick={() => onToggle(idx)}
              className={`w-full h-8 flex items-center justify-center rounded cursor-pointer transition-colors ${isOn ? 'bg-orange-600' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <span className={`text-[10px] font-black uppercase tracking-wider ${isOn ? 'text-black' : 'text-gray-500'}`}>
                STATUS: {isOn ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        ))}
      </div>
      
      {disabled && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10">
          <div className="bg-black/80 px-4 py-2 border border-orange-500/30 rounded text-[10px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">
            Terkunci Oleh Pola Animasi
          </div>
        </div>
      )}
    </div>
  );
};
