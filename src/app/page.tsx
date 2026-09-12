"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RefreshCcw, Coffee, Sun, Settings, Volume2, VolumeX, Sprout, Heart, CheckCircle2, Circle, Plus, Trash2, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WORK_MESSAGES = [
  "Güzel bir seans oldu. Şimdi biraz nefes alma vakti.",
  "Emeğin için teşekkürler. Molayı hak ettin.",
  "Odaklandın, iyi hissettirdi değil mi? Şimdi dinlen.",
  "Bir seans daha tamamlandı. Kendine iyi bak.",
];

const BREAK_MESSAGES = [
  "Mola bitti. Hazır olduğunda devam edebilirsin, acelesi yok.",
  "Umarım dinlenebilmişsindir. İstediğin an başlayabilirsin.",
  "Nefesin düzene girdiyse, küçük bir adım daha atalım mı?",
];

const QUOTES = [
  "Küçük adımlar da adımdır.",
  "Bugün yapabildiğin kadarı yeterli.",
  "Dinlenmek de üretkenliğin bir parçası.",
  "Bir bardak çay, biraz sabır ve devam.",
  "Kendine nazik davran, ilerleme ilerlemedir.",
  "Acele etmeden, sırayla, adım adım.",
];

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export default function CozyPomodoro() {
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);

  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [message, setMessage] = useState<string | null>(null);

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
      const savedBest = localStorage.getItem("cozyBestStreak");
      const savedTotal = localStorage.getItem("cozyTotalFocused");
      const savedTodos = localStorage.getItem("cozyTodos");
      if (savedBest) setBestStreak(parseInt(savedBest, 10));
      if (savedTotal) setTotalFocused(parseInt(savedTotal, 10));
      if (savedTodos) setTodos(JSON.parse(savedTodos));
      setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem("cozyBestStreak", bestStreak.toString());
    localStorage.setItem("cozyTotalFocused", totalFocused.toString());
    localStorage.setItem("cozyTodos", JSON.stringify(todos));
  }, [bestStreak, totalFocused, todos]);

  // Soft two-note chime, played gently on every transition
  const playChime = useCallback((low: boolean) => {
    if (isMuted) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();

      const notes = low ? [392.0, 523.25] : [523.25, 659.25]; // G4->C5 or C5->E5, warm and soft

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.18 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.9);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.9);
      });
    } catch {
      console.log("Audio not supported");
    }
  }, [isMuted]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    if (mode === "work") {
      setMode("break");
      setTimeLeft(breakDuration);

      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      playChime(false);
      setMessage(WORK_MESSAGES[Math.floor(Math.random() * WORK_MESSAGES.length)]);
      setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    } else {
      setMode("work");
      setTimeLeft(workDuration);
      playChime(true);
      setMessage(BREAK_MESSAGES[Math.floor(Math.random() * BREAK_MESSAGES.length)]);
    }
  }, [mode, streak, bestStreak, breakDuration, workDuration, playChime]);

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

  const currentDuration = mode === "work" ? workDuration : breakDuration;
  const progressPercentage = ((currentDuration - timeLeft) / currentDuration) * 100;
  const isPaused = !isRunning && timeLeft !== currentDuration;

  // Todo Functions
  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now().toString(), text: newTodo, done: false }]);
      setNewTodo("");
    }
  };
  const toggleTodo = (id: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };
  const deleteTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row items-center justify-center transition-colors duration-700 font-sans relative ${
        mode === "work"
          ? "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 text-stone-700 dark:from-stone-950 dark:via-orange-950/40 dark:to-stone-900 dark:text-amber-100"
          : "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 text-stone-700 dark:from-stone-950 dark:via-teal-950/40 dark:to-stone-900 dark:text-emerald-100"
      }`}
    >
      {/* Soft dot texture */}
      <div
        className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-700 opacity-[0.15] dark:opacity-[0.08] ${
          mode === "work" ? "bg-[radial-gradient(#c2703d_1px,transparent_1px)]" : "bg-[radial-gradient(#3d8c74_1px,transparent_1px)]"
        } [background-size:32px_32px]`}
      />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 h-2 w-full bg-black/5 dark:bg-white/5 z-50">
        <motion.div
          className={`h-full ${mode === "work" ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-emerald-400 to-teal-400"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      {/* Top Navbar Tools */}
      <div className="fixed top-6 right-6 flex items-center gap-3 z-50">
        <button
          onClick={() => setPlayLofi(!playLofi)}
          className={`p-3 rounded-full transition-colors border backdrop-blur-sm shadow-sm ${
            playLofi
              ? "bg-amber-400/80 text-white border-amber-300"
              : "bg-white/60 hover:bg-white/80 border-stone-200 dark:bg-stone-800/60 dark:hover:bg-stone-800/80 dark:border-stone-700"
          }`}
          title="Sakin müzik"
        >
          <Headphones className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-full bg-white/60 hover:bg-white/80 backdrop-blur-sm transition-colors border border-stone-200 shadow-sm dark:bg-stone-800/60 dark:hover:bg-stone-800/80 dark:border-stone-700"
          title="Bildirim sesleri"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          disabled={isRunning}
          className="p-3 rounded-full bg-white/60 hover:bg-white/80 backdrop-blur-sm transition-colors border border-stone-200 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed dark:bg-stone-800/60 dark:hover:bg-stone-800/80 dark:border-stone-700"
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
            className="fixed bottom-6 right-6 z-50 rounded-2xl overflow-hidden shadow-xl border border-stone-200 dark:border-stone-700"
          >
            <iframe
              width="250" height="140"
              src="https://www.youtube.com/embed/lTRiuFIWV54?rel=0"
              title="Sakin müzik"
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
              className="absolute top-0 bg-white/95 backdrop-blur-lg border border-stone-200 p-6 rounded-3xl shadow-xl w-full max-w-md z-50 text-stone-700 dark:bg-stone-900/95 dark:border-stone-700 dark:text-amber-50"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
                <Settings className="w-5 h-5" /> Ayarlar
              </h2>
              <div className="flex gap-4 mb-6">
                <button onClick={() => applySettings(25, 5)} className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl font-medium transition-colors dark:bg-stone-800 dark:hover:bg-stone-700 dark:border-stone-600">Kısa</button>
                <button onClick={() => applySettings(50, 10)} className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl font-medium transition-colors dark:bg-stone-800 dark:hover:bg-stone-700 dark:border-stone-600">Orta</button>
                <button onClick={() => applySettings(90, 15)} className="flex-1 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl font-medium transition-colors dark:bg-stone-800 dark:hover:bg-stone-700 dark:border-stone-600">Uzun</button>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-amber-400 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors">Kapat</button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center gap-3 mb-6 text-xl font-medium tracking-wide"
          >
            {mode === "work" ? (
              <><Sun className={`w-6 h-6 text-amber-500 ${isRunning ? "animate-pulse" : ""}`} /> Odaklanma Zamanı</>
            ) : (
              <><Coffee className="w-6 h-6 text-teal-500" /> Mola Zamanı</>
            )}
          </motion.div>
        </AnimatePresence>

        {!isRunning && mode === "work" && (
          <div className="mb-6 w-full max-w-xs mx-auto">
            <input
              type="text"
              placeholder="Bugün neye odaklanmak istersin?"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full bg-transparent border-b-2 border-stone-300 focus:border-amber-400 text-center text-xl pb-2 outline-none transition-colors placeholder:text-stone-400 text-stone-700 dark:border-stone-700 dark:focus:border-amber-400 dark:text-amber-50 dark:placeholder:text-stone-600"
            />
          </div>
        )}

        {isRunning && taskName && mode === "work" && (
          <div className="mb-6 text-lg font-medium text-stone-600 bg-white/60 px-6 py-2 rounded-full backdrop-blur-sm border border-stone-200 dark:text-amber-100 dark:bg-stone-800/60 dark:border-stone-700">
            Odak: <span className="text-stone-800 dark:text-white">{taskName}</span>
          </div>
        )}

        <div className="relative mb-10">
          <motion.div
            className="text-8xl md:text-[11rem] font-bold tracking-tighter tabular-nums leading-none drop-shadow-sm"
            animate={{ scale: isRunning ? [1, 1.01, 1] : 1 }}
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
                className="text-lg md:text-xl font-medium px-6 py-4 rounded-2xl border shadow-sm backdrop-blur-md w-full bg-white/70 border-amber-200 text-stone-700 dark:bg-stone-800/70 dark:border-stone-700 dark:text-amber-50"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={toggleTimer}
            className={`flex items-center gap-2 px-8 py-4 rounded-full text-xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-md ${
              isRunning
                ? "bg-white/70 text-stone-600 hover:bg-white/90 border border-stone-200 dark:bg-stone-800/70 dark:text-amber-100 dark:border-stone-700"
                : "bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500"
            }`}
          >
            {isRunning ? (
              <><Pause className="fill-current w-5 h-5" /> Duraklat</>
            ) : (
              <><Play className="fill-current w-5 h-5" /> {isPaused ? "Devam Et" : "Başla"}</>
            )}
          </button>

          <button
            onClick={resetTimer}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-4 rounded-full bg-white/50 text-stone-500 font-bold hover:bg-white/80 hover:text-stone-700 transition-all backdrop-blur-sm border border-stone-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-stone-800/50 dark:text-amber-200 dark:hover:bg-stone-800/80 dark:border-stone-700"
          >
            <RefreshCcw className="w-5 h-5" /> Sıfırla
          </button>
        </div>

        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-sm text-stone-500 font-medium bg-white/50 p-4 rounded-2xl backdrop-blur-sm border border-stone-200/70 dark:bg-stone-800/50 dark:border-stone-700/70 dark:text-amber-200">
          <div className="flex flex-col items-center gap-1">
            <Sprout className="w-5 h-5 text-emerald-500" />
            <span>Seri: {streak}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Heart className="w-5 h-5 text-rose-400" />
            <span>En İyi: {bestStreak}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Coffee className="w-5 h-5 text-amber-500" />
            <span>Toplam: {formatHours(totalFocused)}s</span>
          </div>
        </div>

        {/* Motivational Quote */}
        {!isRunning && (
          <div className="mt-10 text-sm text-stone-500 italic bg-white/40 px-6 py-3 rounded-full backdrop-blur-sm border border-stone-200/70 dark:bg-stone-800/40 dark:border-stone-700/70 dark:text-amber-200/80">
            &quot;{currentQuote}&quot;
          </div>
        )}
      </main>

      {/* Sidebar: To-do List */}
      <aside className="w-full md:w-80 h-auto md:h-screen bg-white/50 backdrop-blur-md border-l border-stone-200/70 p-6 flex flex-col md:overflow-y-auto mt-12 md:mt-0 z-10 dark:bg-stone-900/50 dark:border-stone-700/70">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-stone-700 dark:text-amber-50">
          Görevler <span className="text-sm font-normal text-stone-400 dark:text-amber-200/60">({todos.filter((t) => t.done).length}/{todos.length})</span>
        </h3>

        <div className="flex gap-2 mb-6">
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="Yeni görev ekle..."
            className="flex-1 bg-white/70 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 outline-none focus:border-amber-300 transition-colors shadow-sm dark:bg-stone-800/70 dark:border-stone-700 dark:text-amber-50 dark:focus:border-amber-400"
          />
          <button onClick={addTodo} className="bg-amber-100 hover:bg-amber-200 p-3 rounded-xl text-amber-700 transition-colors border border-amber-200 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-amber-200 dark:border-stone-700">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          <AnimatePresence>
            {todos.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex items-center gap-3 bg-white/60 p-4 rounded-xl border transition-all shadow-sm group dark:bg-stone-800/60 ${
                  t.done ? "border-stone-200/60 opacity-60 dark:border-stone-700/50" : "border-stone-200 hover:border-amber-300 hover:shadow-md dark:border-stone-700 dark:hover:border-amber-500/50"
                }`}
              >
                <button onClick={() => toggleTodo(t.id)} className={`transition-colors ${t.done ? "text-emerald-500" : "text-stone-400 hover:text-emerald-400"}`}>
                  {t.done ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                <span className={`flex-1 text-left ${t.done ? "line-through text-stone-400" : "text-stone-700 dark:text-amber-50"}`}>
                  {t.text}
                </span>
                <button onClick={() => deleteTodo(t.id)} className="text-stone-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity dark:text-stone-600">
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {todos.length === 0 && (
            <div className="text-center text-stone-400 mt-10 bg-white/40 p-6 rounded-2xl border border-dashed border-stone-300 dark:bg-stone-800/40 dark:border-stone-700 dark:text-amber-200/50">
              Henüz görev yok. Küçük bir adımla başlayabilirsin.
            </div>
          )}
        </div>
      </aside>

    </div>
  );
}
