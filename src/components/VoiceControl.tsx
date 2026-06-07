import { useState, useEffect, useRef } from 'react';

interface VoiceControlProps {
  onCommand: (command: string, rawText: string) => void;
  addLog: (msg: string, type: 'info'|'error') => void;
}

export const VoiceControl = ({ onCommand, addLog }: VoiceControlProps) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<'denied' | 'prompt' | 'granted' | 'active'>('prompt');
  
  const permissionGranted = useRef(false);
  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'microphone' as any }).then(res => {
        if (res.state === 'granted') {
          permissionGranted.current = true;
          setStatus('granted');
        } else if (res.state === 'denied') {
          permissionGranted.current = false;
          setStatus('denied');
        }
      });
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'id-ID';

      rec.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.toLowerCase().trim();
          handleTranscript(transcript);
        }
      };

      rec.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          permissionGranted.current = false;
          isListeningRef.current = false;
          setIsListening(false);
          setStatus('denied');
          addLog(`Error mikrofon: ${event.error}`, 'error');
          return;
        }
        if (event.error === 'aborted') {
          return;
        }
        isListeningRef.current = false;
        setIsListening(false);
        addLog(`Error mikrofon (${event.error})`, 'error');
      };

      rec.onend = () => {
        if (isListeningRef.current && permissionGranted.current) {
          try {
            rec.start();
          } catch (e) {
            isListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          isListeningRef.current = false;
          setIsListening(false);
          if (permissionGranted.current) setStatus('granted');
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleTranscript = (text: string) => {
    if (text.match(/semua relay nyala|hidupkan semua relay|nyalakan semua relay|semua relay on|aktifkan semua relay|relay semua nyala|semua relay hidup|hidupkan seluruh relay|nyalakan seluruh relay|aktifkan seluruh relay|seluruh relay nyala|semua relay aktif|relay on semua|on semua relay|semua on|nyalain semua relay|on kan semua relay/)) {
      onCommand('ALL_RELAY_ON', text);
    }
    else if (text.match(/semua relay mati|matikan semua relay|semua relay off|nonaktifkan semua relay|relay semua mati|semua relay padam|matikan seluruh relay|nonaktifkan seluruh relay|seluruh relay mati|semua relay nonaktif|padamkan semua relay|relay off semua|off semua relay|semua off|matiin semua relay|off kan semua relay/)) {
      onCommand('ALL_RELAY_OFF', text);
    }
    else if (text.match(/semua mati|matikan semua|shutdown/)) {
      onCommand('SHUTDOWN', text);
    }
    else if (text.match(/semua pola nyala|hidupkan semua pola|aktifkan semua pola|nyalakan semua pola|semua pola on|semua pola aktif|aktifkan seluruh pola|hidupkan seluruh pola|seluruh pola nyala|pola on semua|on semua pola|nyalain semua pola|hidupkan pola semua|pola semua on|on kan semua pola/)) {
      onCommand('ALL_PATTERN_ON', text);
    }
    else if (text.match(/matikan semua pola|stop pola|semua pola mati|nonaktifkan semua pola|semua pola off|matikan seluruh pola|stop semua pola|nonaktifkan seluruh pola|seluruh pola mati|padamkan semua pola|pola off semua|off semua pola|matiin semua pola|matikan pola semua|hentikan semua pola/)) {
      onCommand('ALL_PATTERN_OFF', text);
    }
    else if (text.match(/relay (satu|1|pertama) (nyala|on)/) || text.match(/(hidupkan|aktifkan|nyalakan) relay (satu|1|pertama)/)) {
      onCommand('RELAY_1_ON', text);
    }
    else if (text.match(/relay (dua|2|kedua) (nyala|on)/) || text.match(/(hidupkan|aktifkan|nyalakan) relay (dua|2|kedua)/)) {
      onCommand('RELAY_2_ON', text);
    }
    else if (text.match(/relay (tiga|3|ketiga) (nyala|on)/) || text.match(/(hidupkan|aktifkan|nyalakan) relay (tiga|3|ketiga)/)) {
      onCommand('RELAY_3_ON', text);
    }
    else if (text.match(/relay (empat|4|keempat) (nyala|on)/) || text.match(/(hidupkan|aktifkan|nyalakan) relay (empat|4|keempat)/)) {
      onCommand('RELAY_4_ON', text);
    }
    else if (text.match(/relay (satu|1|pertama) (mati|off)/) || text.match(/(matikan|nonaktifkan|padamkan) relay (satu|1|pertama)/)) {
      onCommand('RELAY_1_OFF', text);
    }
    else if (text.match(/relay (dua|2|kedua) (mati|off)/) || text.match(/(matikan|nonaktifkan|padamkan) relay (dua|2|kedua)/)) {
      onCommand('RELAY_2_OFF', text);
    }
    else if (text.match(/relay (tiga|3|ketiga) (mati|off)/) || text.match(/(matikan|nonaktifkan|padamkan) relay (tiga|3|ketiga)/)) {
      onCommand('RELAY_3_OFF', text);
    }
    else if (text.match(/relay (empat|4|keempat) (mati|off)/) || text.match(/(matikan|nonaktifkan|padamkan) relay (empat|4|keempat)/)) {
      onCommand('RELAY_4_OFF', text);
    }
    else if (text.match(/pola (satu|1) (nyala|on)/) || text.match(/(hidupkan|aktifkan|nyalakan|jalankan) pola (satu|1)/)) {
      onCommand('PATTERN_1_ON', text);
    }
    else if (text.match(/pola (dua|2) (nyala|on)/) || text.match(/(hidupkan|aktifkan|nyalakan|jalankan) pola (dua|2)/)) {
      onCommand('PATTERN_2_ON', text);
    }
    else if (text.match(/pola (satu|1) (mati|off)/) || text.match(/(matikan|stop|nonaktifkan|hentikan) pola (satu|1)/)) {
      onCommand('PATTERN_1_OFF', text);
    }
    else if (text.match(/pola (dua|2) (mati|off)/) || text.match(/(matikan|stop|nonaktifkan|hentikan) pola (dua|2)/)) {
      onCommand('PATTERN_2_OFF', text);
    }
    else if (text.match(/tampilkan suhu|berapa suhu|cek suhu|baca suhu|suhu sekarang|suhu saat ini/)) {
      onCommand('QUERY_TEMP', text);
    }
    else if (text.match(/tampilkan kelembapan|berapa kelembapan|cek kelembapan|kelembapan sekarang/)) {
      onCommand('QUERY_HUM', text);
    }
    else if (text.match(/tampilkan sensor|cek sensor|baca sensor|status sensor|info sensor/)) {
      onCommand('QUERY_ALL', text);
    }
    else if (text.match(/bersihkan log|hapus log|clear log/)) {
      onCommand('CLEAR_LOG', text);
    } else {
      addLog(`Perintah tidak dikenali: "${text}"`, 'info');
    }
  };

  const toggleMic = async () => {
    if (isListeningRef.current) {
      if (recognitionRef.current) recognitionRef.current.stop();
      isListeningRef.current = false;
      setIsListening(false);
      setStatus(permissionGranted.current ? 'granted' : 'prompt');
      return;
    }

    try {
      setStatus('prompt');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionGranted.current = true;
      isListeningRef.current = true;
      setIsListening(true);
      setStatus('active');
      if (recognitionRef.current) recognitionRef.current.start();
      addLog('Mikrofon diizinkan, voice command aktif', 'info');
    } catch (err) {
      permissionGranted.current = false;
      setStatus('denied');
      addLog('Izin mikrofon ditolak. Izinkan di pengaturan browser.', 'error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pointer-events-auto">
      {status === 'denied' && (
        <div className="bg-red-900/50 text-red-200 px-4 py-2 rounded-full mb-4 text-[10px] font-bold tracking-widest border border-red-500/50 whitespace-nowrap uppercase">
          Mikrofon Diblokir. Izinkan di Browser.
        </div>
      )}
      
      <div className="relative">
        {isListening && (
          <>
            <div className="absolute -inset-4 bg-orange-600/20 rounded-full animate-ping pointer-events-none"></div>
            <div className="absolute -inset-2 bg-orange-600/10 rounded-full pointer-events-none"></div>
          </>
        )}
        <button
          onClick={toggleMic}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-[0_0_30px_rgba(255,107,0,0.5)] ${
            status === 'denied' ? 'bg-red-600 text-black shadow-red-500/50 cursor-not-allowed' :
            isListening ? 'bg-[#FF6B00] text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 shadow-none'
          }`}
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>
      </div>
      
      {isListening ? (
        <span className="mt-4 text-[11px] font-bold uppercase tracking-[0.4em] text-orange-500 drop-shadow-[0_0_10px_rgba(255,107,0,0.5)] underline underline-offset-8">Mendengarkan...</span>
      ) : (
        <span className="mt-4 text-[11px] font-bold uppercase tracking-[0.4em] text-gray-500">{status === 'prompt' ? 'Meminta Izin...' : 'Voice Command'}</span>
      )}
    </div>
  );
};
