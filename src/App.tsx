import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { LogEntry, BrokerStatus, SensorData } from './types';
import { TopBar } from './components/TopBar';
import { SensorPanel } from './components/SensorPanel';
import { BrokerStatusPanel } from './components/BrokerStatusPanel';
import { RelayControl } from './components/RelayControl';
import { PatternControl } from './components/PatternControl';
import { LogPanel } from './components/LogPanel';
import { VoiceControl } from './components/VoiceControl';
import { playBeep, speak } from './lib/audio';

export default function App() {
  // --- States ---
  const [flespiToken, setFlespiToken] = useState(() => localStorage.getItem('iot_flespi_token') || '');
  const [threshold, setThreshold] = useState(() => Number(localStorage.getItem('iot_temp_threshold')) || 35);
  
  const [temperature, setTemperature] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const temperatureRef = useRef<number>(0);
  const humidityRef = useRef<number>(0);
  const [history, setHistory] = useState<SensorData[]>([]);
  
  const [relays, setRelays] = useState<boolean[]>([false, false, false, false]);
  const [relayNames, setRelayNames] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('iot_relay_names') || '[]'); }
    catch { return ['Relay 1', 'Relay 2', 'Relay 3', 'Relay 4']; }
  });
  if (relayNames.length === 0) setRelayNames(['Relay 1', 'Relay 2', 'Relay 3', 'Relay 4']);
  
  const [patterns, setPatterns] = useState<boolean[]>([false, false]);
  
  const [brokerStatuses, setBrokerStatuses] = useState<BrokerStatus[]>([
    { id: 'mosquitto1', name: 'Mosquitto Public', connected: false, latency: 0 },
    { id: 'flespi', name: 'Flespi Bridge', connected: false, latency: 0 },
    { id: 'mosquitto2', name: 'Mosquitto Auth', connected: false, latency: 0 },
  ]);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Refs for clients
  const m1Ref = useRef<mqtt.MqttClient | null>(null);
  const fRef = useRef<mqtt.MqttClient | null>(null);
  const m2Ref = useRef<mqtt.MqttClient | null>(null);
  
  const latencyPingIntervals = useRef<any>({});

  // --- Helpers ---
  const addLog = (message: string, type: 'info'|'out'|'error'|'in') => {
    setLogs(prev => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toLocaleTimeString('id-ID'),
        type, message
      };
      return [newLog, ...prev.slice(0, 99)]; // Keep last 100
    });
  };

  const updateBrokerStatus = (id: string, updates: Partial<BrokerStatus>) => {
    setBrokerStatuses(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // Setup MQTT
  useEffect(() => {
    const timestamp = new Date().getTime();
    
    // Broker 1: Mosquitto WSS
    // Note: Due to mixed-content policies on AI Studio (HTTPS), we use WSS standard test port 8081 instead of WS 8080.
    const m1 = mqtt.connect('wss://test.mosquitto.org:8081/mqtt', { clientId: `dash_m1_${timestamp}`, reconnectPeriod: 3000 });
    m1.on('connect', () => {
      updateBrokerStatus('mosquitto1', { connected: true });
      addLog('Terhubung ke Mosquitto Public', 'info');
      m1.subscribe('iot/sensor/suhu', { qos: 0 });
      m1.subscribe('iot/sensor/kelembapan', { qos: 0 });
    });
    m1.on('disconnect', () => updateBrokerStatus('mosquitto1', { connected: false }));
    m1.on('error', (err) => {
      updateBrokerStatus('mosquitto1', { connected: false });
      addLog(`Mosquitto1 Error: ${err.message}`, 'error');
    });
    m1Ref.current = m1;

    // Broker 3: Mosquitto Auth WSS
    // Using WSS standard auth port 8091 instead of WS 8090
    const m2 = mqtt.connect('wss://test.mosquitto.org:8091/mqtt', {
      clientId: `dash_m2_${timestamp}`,
      username: 'rw',
      password: 'readwrite',
      reconnectPeriod: 3000
    });
    m2.on('connect', () => {
      updateBrokerStatus('mosquitto2', { connected: true });
      addLog('Terhubung ke Mosquitto Auth', 'info');
    });
    m2.on('disconnect', () => updateBrokerStatus('mosquitto2', { connected: false }));
    m2.on('error', (err) => {
      updateBrokerStatus('mosquitto2', { connected: false });
      addLog(`Mosquitto2 Error: ${err.message}`, 'error');
    });
    m2Ref.current = m2;

    const handleMessage = (topic: string, message: Buffer) => {
      const payload = message.toString();
      if (topic === 'iot/sensor/suhu') {
        const val = parseFloat(payload);
        if (!isNaN(val)) {
          setTemperature(val);
          temperatureRef.current = val;
          setHistory(prev => {
            const h = [...prev, { time: new Date().toLocaleTimeString(), temperature: val, humidity: prev.length ? prev[prev.length-1].humidity : 0 }];
            return h.slice(-20);
          });
          if (val > threshold) {
            playBeep();
          }
        }
      } else if (topic === 'iot/sensor/kelembapan') {
        const val = parseFloat(payload);
        if (!isNaN(val)) {
          setHumidity(val);
          humidityRef.current = val;
          setHistory(prev => {
            const h = [...prev];
            if (h.length > 0) h[h.length - 1].humidity = val;
            return h;
          });
        }
      } else if (topic.startsWith('ping_reply/')) {
        const id = topic.split('/')[1];
        const sentTime = parseInt(payload);
        const latency = new Date().getTime() - sentTime;
        updateBrokerStatus(id, { latency });
      }
    };

    m1.on('message', handleMessage);
    m2.on('message', handleMessage);

    // Setup ping interval for latency check
    const pingLoop = setInterval(() => {
      const now = new Date().getTime().toString();
      if (m1Ref.current?.connected) {
        m1Ref.current.publish('ping_reply/mosquitto1', now, { qos: 0 });
        m1Ref.current.subscribe('ping_reply/mosquitto1', { qos: 0 });
      }
      if (m2Ref.current?.connected) {
        m2Ref.current.publish('ping_reply/mosquitto2', now, { qos: 0 });
        m2Ref.current.subscribe('ping_reply/mosquitto2', { qos: 0 });
      }
      if (fRef.current?.connected) {
        fRef.current.publish('ping_reply/flespi', now, { qos: 0 });
        fRef.current.subscribe('ping_reply/flespi', { qos: 0 });
      }
    }, 5000);

    return () => {
      m1.end();
      m2.end();
      clearInterval(pingLoop);
    };
  }, []);

  // Flespi client logic separation since it depends on flespiToken which changes
  useEffect(() => {
    localStorage.setItem('iot_flespi_token', flespiToken);
    
    if (flespiToken.length < 5) return; // Prevent connecting with obvious invalid token
    
    const f = mqtt.connect('wss://mqtt.flespi.io:443', {
      clientId: `dash_f_${new Date().getTime()}`,
      username: flespiToken,
      password: '',
      reconnectPeriod: 3000
    });
    
    f.on('connect', () => {
      updateBrokerStatus('flespi', { connected: true });
      addLog('Terhubung ke Flespi', 'info');
    });
    f.on('disconnect', () => updateBrokerStatus('flespi', { connected: false }));
    f.on('error', (err) => {
      updateBrokerStatus('flespi', { connected: false });
      addLog(`Flespi Error/Auth Failed`, 'error');
    });
    f.on('message', (topic, payload) => {
      if (topic === 'ping_reply/flespi') {
        const sentTime = parseInt(payload.toString());
        updateBrokerStatus('flespi', { latency: new Date().getTime() - sentTime });
      }
    });
    
    fRef.current = f;
    return () => { f.end(); };
  }, [flespiToken]);

  // Effects for local storage
  useEffect(() => { localStorage.setItem('iot_relay_names', JSON.stringify(relayNames)); }, [relayNames]);
  useEffect(() => { localStorage.setItem('iot_temp_threshold', threshold.toString()); }, [threshold]);

  // --- Publish Logic ---
  const publishMulti = (topic: string, msg: string) => {
    const pubOps = [];
    if (m1Ref.current?.connected) pubOps.push(() => m1Ref.current?.publish(topic, msg, { qos: 0 }));
    if (m2Ref.current?.connected) pubOps.push(() => m2Ref.current?.publish(topic, msg, { qos: 0 }));
    if (fRef.current?.connected) pubOps.push(() => fRef.current?.publish(topic, msg, { qos: 0 }));
    
    pubOps.forEach(f => f());
    addLog(`Published [${topic}]: ${msg}`, 'out');
  };

  const publishRelayState = (idx: number, state: boolean) => {
    const newState = [...relays];
    newState[idx] = state;
    setRelays(newState);
    publishMulti(`iot/relay/${idx + 1}`, state ? 'ON' : 'OFF');
  };

  const publishPatternState = (idx: number, state: boolean) => {
    const newState = [...patterns];
    newState[idx] = state;
    setPatterns(newState);
    publishMulti(`iot/pola/${idx + 1}`, state ? 'ON' : 'OFF');
  };

  const arePatternsActive = patterns.includes(true);

  // --- Voice Commands Router ---
  const handleVoiceCommand = (cmd: string, rawText: string) => {
    addLog(`Perintah Suara: "${rawText}"`, 'info');
    
    switch(cmd) {
      case 'ALL_RELAY_ON':
        setRelays([true, true, true, true]);
        [1,2,3,4].forEach(i => publishMulti(`iot/relay/${i}`, 'ON'));
        speak('Semua relay dinyalakan');
        break;
      case 'ALL_RELAY_OFF':
        setRelays([false, false, false, false]);
        [1,2,3,4].forEach(i => publishMulti(`iot/relay/${i}`, 'OFF'));
        speak('Semua relay dimatikan');
        break;
      case 'SHUTDOWN':
        setRelays([false, false, false, false]);
        setPatterns([false, false]);
        [1,2,3,4].forEach(i => publishMulti(`iot/relay/${i}`, 'OFF'));
        [1,2].forEach(i => publishMulti(`iot/pola/${i}`, 'OFF'));
        speak('Semua perangkat dimatikan');
        break;
      case 'ALL_PATTERN_ON':
        setPatterns([true, true]);
        [1,2].forEach(i => publishMulti(`iot/pola/${i}`, 'ON'));
        speak('Semua pola dinyalakan');
        break;
      case 'ALL_PATTERN_OFF':
        setPatterns([false, false]);
        [1,2].forEach(i => publishMulti(`iot/pola/${i}`, 'OFF'));
        speak('Semua pola dimatikan');
        break;
      case 'RELAY_1_ON': publishRelayState(0, true); speak(`Relay satu dinyalakan`); break;
      case 'RELAY_2_ON': publishRelayState(1, true); speak(`Relay dua dinyalakan`); break;
      case 'RELAY_3_ON': publishRelayState(2, true); speak(`Relay tiga dinyalakan`); break;
      case 'RELAY_4_ON': publishRelayState(3, true); speak(`Relay empat dinyalakan`); break;
      case 'RELAY_1_OFF': publishRelayState(0, false); speak(`Relay satu dimatikan`); break;
      case 'RELAY_2_OFF': publishRelayState(1, false); speak(`Relay dua dimatikan`); break;
      case 'RELAY_3_OFF': publishRelayState(2, false); speak(`Relay tiga dimatikan`); break;
      case 'RELAY_4_OFF': publishRelayState(3, false); speak(`Relay empat dimatikan`); break;
      case 'PATTERN_1_ON': publishPatternState(0, true); speak('Pola satu dinyalakan, pola kiri ke kanan aktif'); break;
      case 'PATTERN_2_ON': publishPatternState(1, true); speak('Pola dua dinyalakan, pola strobe aktif'); break;
      case 'PATTERN_1_OFF': publishPatternState(0, false); speak('Pola satu dimatikan'); break;
      case 'PATTERN_2_OFF': publishPatternState(1, false); speak('Pola dua dimatikan'); break;
      case 'QUERY_TEMP': speak(`Suhu saat ini ${temperatureRef.current.toFixed(1)} derajat celcius`); break;
      case 'QUERY_HUM': speak(`Kelembapan saat ini ${humidityRef.current.toFixed(1)} persen`); break;
      case 'QUERY_ALL': speak(`Suhu ${temperatureRef.current.toFixed(1)} derajat, kelembapan ${humidityRef.current.toFixed(1)} persen`); break;
      case 'CLEAR_LOG': 
        setLogs([]);
        speak('Log dibersihkan');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-4 lg:p-6 flex flex-col font-sans overflow-x-hidden relative">
      <div className="max-w-[1400px] w-full mx-auto flex flex-col flex-grow">
        <TopBar />
        
        <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4 flex-grow pb-32">
          <div className="md:col-span-4 md:row-span-3">
            <SensorPanel 
              temperature={temperature} 
              humidity={humidity} 
              history={history} 
              threshold={threshold}
              setThreshold={setThreshold}
            />
          </div>

          <div className="md:col-span-5 md:row-span-3">
            <RelayControl 
              relays={relays} 
              relayNames={relayNames}
              disabled={arePatternsActive}
              onToggle={(idx) => publishRelayState(idx, !relays[idx])}
              onToggleAll={(state) => {
                setRelays([state, state, state, state]);
                [1,2,3,4].forEach(i => publishMulti(`iot/relay/${i}`, state ? 'ON' : 'OFF'));
              }}
              onRename={(idx, name) => {
                const newNames = [...relayNames];
                newNames[idx] = name;
                setRelayNames(newNames);
              }}
            />
          </div>

          <div className="md:col-span-3 md:row-span-3">
            <BrokerStatusPanel 
              statuses={brokerStatuses} 
              flespiToken={flespiToken}
              setFlespiToken={setFlespiToken}
            />
          </div>

          <div className="md:col-span-9 md:row-span-3">
            <LogPanel logs={logs} onClear={() => setLogs([])} />
          </div>

          <div className="md:col-span-3 md:row-span-3">
            <PatternControl 
              patterns={patterns}
              onToggle={(idx) => publishPatternState(idx, !patterns[idx])}
              onToggleAll={(state) => {
                setPatterns([state, state]);
                [1,2].forEach(i => publishMulti(`iot/pola/${i}`, state ? 'ON' : 'OFF'));
              }}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50">
        <div className="pointer-events-auto">
          <VoiceControl onCommand={handleVoiceCommand} addLog={addLog} />
        </div>
      </div>
    </div>
  );
}
