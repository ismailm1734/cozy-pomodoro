"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, RefreshCcw, Coffee, Skull, Flame, Settings, Volume2, VolumeX, Trophy, CheckCircle2, Circle, Plus, Trash2, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAIL_MESSAGES = [
  "Yine mi dikkatini dağıttın? Oysa ki yapman gerekenler vardı.",
  "Twitter'da veya YouTube'da dünyayı kurtardığını mı sanıyorsun? Geri dön!",
  "Pomodoro'yu bozmak mı? Gerçekten mi? Zayıflık...",
  "Odaklanma süren bir Japon balığından bile daha kısa.",
  "Böyle devam edersen o proje asla bitmeyecek.",
  "Pes etmek kolaydır. Tıpkı şu an senin yaptığın gibi.",
  "Tebrikler, az önce odağını çöpe attın."
];

const SUCCESS_MESSAGES = [
  "Fena değil. Bir seans daha yapabilir misin görelim.",
  "Nihayet odaklanabildin. Şimdi 5 dakika nefes al.",
  "İyi iş. Ama henüz bitmedi, mola bitince geri dön."
];

const QUOTES = [
  "Acı geçicidir, başarmamak sonsuza dek sürer.",
  "Rahatlık, potansiyelin en büyük düşmanıdır.",
  "Eğer kolay olsaydı, herkes yapardı.",
  "Disiplin, şu an ne istediğinle, en çok ne istediğin arasındaki seçimdir.",
  "Bugün kaytarırsan, yarın bedelini ödersin.",
  "İlhamı bekleme, masaya otur ve çalış."
];

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export default function RuthlessPomodoro() {
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [message, setMessage] = useState<string | null>(null);
  const [isFailed, setIsFailed] = useState(false);
  
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalFocused, setTotalFocused] = useState(0); 
  
  const [taskName, setTaskName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [playLofi, setPlayLofi] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(QUOTES[0]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const init = () => {
      const savedBest = localStorage.getItem("bestStreak");
      const savedTotal = localStorage.getItem("totalFocused");
      const savedTodos = localStorage.getItem("ruthlessTodos");
      if (savedBest) setBestStreak(parseInt(savedBest, 10));
      if (savedTotal) setTotalFocused(parseInt(savedTotal, 10));
      if (savedTodos) setTodos(JSON.parse(savedTodos));
      setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem("bestStreak", bestStreak.toString());
    localStorage.setItem("totalFocused", totalFocused.toString());
    localStorage.setItem("ruthlessTodos", JSON.stringify(todos));
  }, [bestStreak, totalFocused, todos]);

  // Retro 8-bit Death/Fail Sound
  const playHarshBeep = useCallback(() => {
    if (isMuted) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "square"; // 8-bit style waveform
      
      // Rapidly stepping down frequency for a "falling / dying" effect
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(250, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(100, ctx.currentTime + 0.4);
      osc.frequency.setValueAtTime(50, ctx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      console.log("Audio not supported");
    }
  }, [isMuted]);

  // Retro 8-bit Coin/Level Up Sound for Success
  const playSuccessChime = useCallback(() => {
    if (isMuted) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "square"; // 8-bit style waveform
      
      // Mario coin style double beep
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); // E6
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      console.log("Audio not supported");
    }
  }, [isMuted]);

  const fail = useCallback(() => {
    setIsRunning(false);
    setIsFailed(true);
    setStreak(0);
    playHarshBeep();
    
    const baseMsg = FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)];
    const taskMsg = taskName ? ` &quot;${taskName}&quot; hedefini böyle mi bitirecektin?` : "";
    setMessage(baseMsg + taskMsg);
    
    setTimeLeft(workDuration);
  }, [playHarshBeep, taskName, workDuration]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    if (mode === "work") {
      setMode("break");
      setTimeLeft(breakDuration);
      
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      
      playSuccessChime();
      setMessage(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
      setIsFailed(false);
      setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    } else {
      setMode("work");
      setTimeLeft(workDuration);
      setMessage("Mola bitti. Yeniden acımasız moda dönüyoruz.");
    }
  }, [mode, streak, bestStreak, breakDuration, workDuration, playSuccessChime]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && mode === "work") {
        fail();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, mode, fail]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
        
        if (mode === "work") {
          setTotalFocused((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, handleTimerComplete]);

  const toggleTimer = () => {
    if (isFailed) setIsFailed(false);
    if (message) setMessage(null);
    setShowSettings(false);
    setIsRunning(!isRunning);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(1);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMode("work");
    setTimeLeft(workDuration);
    setIsFailed(false);
    setMessage(null);
  };

  const applySettings = (w: number, b: number) => {
    setWorkDuration(w * 60);
    setBreakDuration(b * 60);
    if (!isRunning) {
      if (mode === "work") setTimeLeft(w * 60);
      else setTimeLeft(b * 60);
    }
    setShowSettings(false);
  };

  const progressPercentage = mode === "work" 
    ? ((workDuration - timeLeft) / workDuration) * 100 
    : ((breakDuration - timeLeft) / breakDuration) * 100;

  // Todo Functions
  const addTodo = () => {
    if(newTodo.trim()) {
      setTodos([...todos, {id: Date.now().toString(), text: newTodo, done: false}]);
      setNewTodo("");
    }
  };
  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? {...t, done: !t.done} : t));
  };
  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row items-center justify-center transition-colors duration-700 font-sans relative ${
      isFailed 
        ? "bg-red-950 text-red-500" 
        : mode === "work" 
          ? "bg-zinc-950 text-zinc-300 bg-gradient-to-br from-zinc-900 to-black" 
          : "bg-emerald-950 text-emerald-400"
    }`}>
      
      {/* Dynamic Background Pattern - Dot Grid */}
      <div 
        className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-700 ${
          isFailed ? "opacity-30" : mode === "work" ? "opacity-20" : "opacity-30"
        } bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]`}
      />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 h-2 w-full bg-black/40 z-50">
        <motion.div 
          className={`h-full shadow-[0_0_10px_rgba(255,255,255,0.5)] ${isFailed ? "bg-red-600" : mode === "work" ? "bg-zinc-100" : "bg-emerald-400"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      {/* Top Navbar Tools */}
      <div className="fixed top-6 right-6 flex items-center gap-4 z-50">
        <button 
          onClick={() => setPlayLofi(!playLofi)}
          className={`p-3 rounded-full transition-colors border backdrop-blur-sm ${playLofi ? "bg-indigo-600/80 text-white border-indigo-500" : "bg-black/40 hover:bg-black/60 border-zinc-700/50"}`}
          title="Lofi Müzik"
        >
          <Headphones className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors border border-zinc-700/50"
          title="Bildirim Sesleri"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          disabled={isRunning}
          className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors border border-zinc-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Ayarlar"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Lofi Player iframe */}
      <AnimatePresence>
        {playLofi && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 rounded-xl overflow-hidden shadow-2xl transition-opacity border border-zinc-800"
          >
            <iframe 
              width="250" height="140" 
              src="https://www.youtube.com/embed/lTRiuFIWV54?rel=0" 
              title="Lofi" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex flex-col items-center justify-center w-full max-w-2xl px-6 text-center z-10 relative mt-16 md:mt-0">
        
        <AnimatePresence mode="wait">
          {showSettings ? (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 bg-zinc-900/95 backdrop-blur-lg border border-zinc-700 p-6 rounded-2xl shadow-2xl w-full max-w-md z-50 text-zinc-200"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
                <Settings className="w-5 h-5" /> Ayarlar
              </h2>
              <div className="flex gap-4 mb-6">
                <button onClick={() => applySettings(25, 5)} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg font-medium transition-colors">Klasik</button>
                <button onClick={() => applySettings(50, 10)} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg font-medium transition-colors">Derin</button>
                <button onClick={() => applySettings(90, 15)} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg font-medium transition-colors">Uzun</button>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors">Kapat</button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={isFailed ? "failed" : mode}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center gap-3 mb-6 text-xl font-medium uppercase tracking-widest drop-shadow-md"
          >
            {isFailed ? (
              <><Skull className="w-6 h-6 animate-pulse text-red-500" /> BÜYÜK BAŞARISIZLIK</>
            ) : mode === "work" ? (
              <><Flame className={`w-6 h-6 ${isRunning ? "animate-pulse text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "text-zinc-500"}`} /> ACI ODAKLANMA</>
            ) : (
              <><Coffee className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> NEFES AL</>
            )}
          </motion.div>
        </AnimatePresence>

        {!isRunning && mode === "work" && !isFailed && (
          <div className="mb-6 w-full max-w-xs mx-auto">
            <input 
              type="text" 
              placeholder="Ana hedefin nedir?" 
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-zinc-500 text-center text-xl pb-2 outline-none transition-colors placeholder:text-zinc-700 text-white"
            />
          </div>
        )}

        {isRunning && taskName && mode === "work" && (
          <div className="mb-6 text-xl font-medium text-zinc-400 bg-zinc-900/60 px-6 py-2 rounded-full backdrop-blur-sm border border-zinc-800">
            Hedef: <span className="text-white drop-shadow-md">{taskName}</span>
          </div>
        )}

        <div className="relative mb-10">
          <motion.div 
            className={`text-8xl md:text-[11rem] font-bold tracking-tighter tabular-nums leading-none ${isFailed ? "text-red-600 drop-shadow-[0_0_40px_rgba(220,38,38,0.6)]" : "drop-shadow-2xl"}`}
            animate={{ scale: isRunning && mode === "work" ? [1, 1.01, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            {formatTime(timeLeft)}
          </motion.div>
        </div>

        <div className="h-24 mb-8 flex items-center justify-center w-full">
          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`text-lg md:text-xl font-medium px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-md w-full ${
                  isFailed ? "bg-red-900/60 border-red-700 text-red-100" : "bg-emerald-900/60 border-emerald-700 text-emerald-100"
                }`}
                dangerouslySetInnerHTML={{ __html: message }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={toggleTimer}
            className={`flex items-center gap-2 px-8 py-4 rounded-full text-xl font-bold transition-all transform hover:scale-105 active:scale-95 ${
              isRunning
                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-zinc-700"
                : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            }`}
          >
            {isRunning ? (
              <><Square className="fill-current w-5 h-5" /> Duraklatırsan Yanarsın</>
            ) : (
              <><Play className="fill-current w-5 h-5" /> {isFailed ? "Yeniden Dene" : "Başla"}</>
            )}
          </button>

          {isRunning && mode === "work" && (
            <button
              onClick={() => fail()}
              className="flex items-center gap-2 px-6 py-4 rounded-full bg-red-900/40 text-red-400 font-bold hover:bg-red-900/80 hover:text-red-100 transition-all border border-red-800/50 backdrop-blur-sm"
            >
              <Skull className="w-5 h-5" /> Pes Et
            </button>
          )}

          <button
            onClick={resetTimer}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-4 rounded-full bg-zinc-900/80 text-zinc-500 font-bold hover:bg-zinc-800 hover:text-zinc-300 transition-all backdrop-blur-sm border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCcw className="w-5 h-5" /> Sıfırla
          </button>
        </div>
        
        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-sm text-zinc-400 font-medium bg-zinc-900/40 p-4 rounded-2xl backdrop-blur-sm border border-zinc-800/50">
          <div className="flex flex-col items-center gap-1">
            <Flame className="w-5 h-5 text-orange-500" />
            <span>Seri: {streak}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>En İyi: {bestStreak}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Coffee className="w-5 h-5 text-blue-400" />
            <span>Toplam: {formatHours(totalFocused)}s</span>
          </div>
        </div>
        
        {/* Motivational Quote */}
        {!isRunning && !isFailed && (
          <div className="mt-10 text-sm text-zinc-500 italic bg-black/40 px-6 py-3 rounded-full backdrop-blur-sm border border-zinc-800/50">
            &quot;{currentQuote}&quot;
          </div>
        )}
      </main>

      {/* Sidebar: To-do List */}
      <aside className="w-full md:w-80 h-auto md:h-screen bg-black/60 backdrop-blur-md border-l border-zinc-800/80 p-6 flex flex-col md:overflow-y-auto mt-12 md:mt-0 z-10">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-zinc-200">
           Görevler <span className="text-sm font-normal text-zinc-500">({todos.filter(t=>t.done).length}/{todos.length})</span>
        </h3>
        
        <div className="flex gap-2 mb-6">
          <input 
            value={newTodo} 
            onChange={e => setNewTodo(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && addTodo()} 
            placeholder="Yeni görev ekle..." 
            className="flex-1 bg-zinc-900/80 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 outline-none focus:border-zinc-500 transition-colors shadow-inner" 
          />
          <button onClick={addTodo} className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg text-white transition-colors border border-zinc-700">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          <AnimatePresence>
            {todos.map(t => (
              <motion.div 
                key={t.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex items-center gap-3 bg-zinc-900/60 p-4 rounded-xl border transition-all shadow-sm group ${t.done ? 'border-zinc-800/50 opacity-60' : 'border-zinc-700/80 hover:border-zinc-500 hover:shadow-md'}`}
              >
                 <button onClick={() => toggleTodo(t.id)} className={`transition-colors ${t.done ? 'text-emerald-500' : 'text-zinc-500 hover:text-emerald-400'}`}>
                   {t.done ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                 </button>
                 <span className={`flex-1 text-left ${t.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                   {t.text}
                 </span>
                 <button onClick={() => deleteTodo(t.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Trash2 className="w-5 h-5" />
                 </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {todos.length === 0 && (
            <div className="text-center text-zinc-500 mt-10 bg-zinc-900/40 p-6 rounded-2xl border border-dashed border-zinc-800">
              Henüz görev eklemedin. Bugün dünyayı fethetmeye hazır mısın?
            </div>
          )}
        </div>
      </aside>
      
    </div>
  );
}
