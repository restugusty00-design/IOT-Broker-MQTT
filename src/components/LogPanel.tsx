import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const LogPanel = ({ logs, onClear }: LogPanelProps) => {
  const getLogColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-400';
      case 'out': return 'text-orange-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const handleExport = () => {
    const content = logs.map(l => `[${l.time}] ${l.type.toUpperCase()}: ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iot-log-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0a0c10] rounded-xl p-5 border border-white/5 flex flex-col h-[250px] lg:h-[300px] overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Log Aktivitas Sistem</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="text-[9px] px-2 py-1 text-gray-400 hover:text-white uppercase font-bold tracking-wider underline decoration-orange-500 underline-offset-4 cursor-pointer"
          >
            Export .txt
          </button>
          <button 
            onClick={onClear}
            className="text-[9px] px-2 py-1 text-gray-400 hover:text-white uppercase font-bold tracking-wider cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-grow bg-black/40 rounded border border-white/5 p-3 font-mono text-[11px] leading-relaxed overflow-y-auto">
        <div className="flex flex-col-reverse space-y-1 space-y-reverse">
          {logs.map(log => (
            <div key={log.id} className="text-gray-500 break-words">
              [{log.time}] <span className={`font-bold ${getLogColor(log.type)}`}>{log.type.toUpperCase()}:</span>{" "}
              <span className="text-gray-300">{log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-600 italic py-4 text-center">Belum ada log aktivitas...</div>
          )}
        </div>
      </div>
    </div>
  );
};
