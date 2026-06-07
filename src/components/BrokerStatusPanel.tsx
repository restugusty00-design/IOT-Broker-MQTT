import { BrokerStatus as BrokerStatusType } from '../types';

interface BrokerStatusProps {
  statuses: BrokerStatusType[];
  flespiToken: string;
  setFlespiToken: (token: string) => void;
}

export const BrokerStatusPanel = ({ statuses, flespiToken, setFlespiToken }: BrokerStatusProps) => {
  return (
    <div className="bg-[#11141b] rounded-xl p-5 border border-white/5 h-full flex flex-col">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">MQTT Broker Status</h2>
      <div className="space-y-4 flex-grow">
        {statuses.map(broker => (
          <div key={broker.id} className={`flex items-center justify-between p-3 bg-white/5 rounded ${!broker.connected ? 'border border-red-500/20' : ''}`}>
            <div>
              <div className="text-[10px] font-bold text-white">{broker.name}</div>
              <div className="text-[9px] text-gray-500">{broker.id}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold tabular-nums ${broker.connected ? 'text-green-500' : 'text-red-500 tracking-tight'}`}>
                  {broker.connected ? (broker.latency > 0 ? `${broker.latency}ms` : '-') : 'TIMEOUT'}
                </span>
                <div className={`w-2 h-2 rounded-full ${broker.connected ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'}`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 mt-auto border-t border-white/10">
        <input 
          type="password" 
          value={flespiToken}
          onChange={(e) => setFlespiToken(e.target.value)}
          placeholder="Token Flespi (opsional)..."
          className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-[10px] text-gray-400 focus:outline-none focus:border-orange-500"
        />
      </div>
    </div>
  );
};
