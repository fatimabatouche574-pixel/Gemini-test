import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Smile, 
  Brain, 
  Coins, 
  User, 
  ChevronRight, 
  RotateCcw, 
  Skull,
  Activity,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Award,
  Zap
} from 'lucide-react';
import { GameState, Gender, Attributes, LifeEvent, Choice } from './types';
import { generateBirthEvent, generateYearlyEvent } from './services/geminiService';

const INITIAL_ATTRIBUTES: Attributes = {
  health: 80,
  happiness: 80,
  intelligence: 50,
  looks: 50,
  wealth: 10,
};

const EVENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  neutral: <Info className="text-blue-400" size={18} />,
  positive: <Sparkles className="text-yellow-400" size={18} />,
  negative: <TrendingDown className="text-red-400" size={18} />,
  choice: <Zap className="text-purple-400" size={18} />,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupGender, setSetupGender] = useState<Gender>(Gender.MALE);
  const [showStats, setShowStats] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  useEffect(() => {
    if (gameState?.logs.length) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [gameState?.logs]);

  const startGame = async () => {
    if (!setupName.trim()) return;
    setLoading(true);
    try {
      const birthEvent = await generateBirthEvent(setupName, setupGender);
      setGameState({
        name: setupName,
        gender: setupGender,
        age: 0,
        attributes: { ...INITIAL_ATTRIBUTES },
        logs: [birthEvent],
        isGameOver: false,
      });
    } catch (error) {
      console.error("Failed to start game:", error);
    } finally {
      setLoading(false);
    }
  };

  const ageUp = async () => {
    if (!gameState || gameState.isGameOver || gameState.currentChoiceEvent) return;
    setLoading(true);
    try {
      const nextAge = gameState.age + 1;
      const event = await generateYearlyEvent(nextAge, gameState.attributes);
      
      let newAttributes = { ...gameState.attributes };
      
      // Apply passive aging effects
      if (nextAge > 60) newAttributes.health -= Math.floor((nextAge - 60) / 5);
      if (nextAge > 80) newAttributes.health -= 5;

      // Apply event impact if not a choice
      if (event.type !== 'choice' && event.impact) {
        Object.keys(event.impact).forEach((key) => {
          const attrKey = key as keyof Attributes;
          newAttributes[attrKey] = Math.max(0, Math.min(100, newAttributes[attrKey] + (event.impact![attrKey] || 0)));
        });
      }

      // Check for death
      let isGameOver = false;
      let deathReason = '';
      if (newAttributes.health <= 0) {
        isGameOver = true;
        deathReason = "你因健康状况恶化而离开了人世。";
      } else if (nextAge > 100 && Math.random() > 0.7) {
        isGameOver = true;
        deathReason = "你寿终正寝，平静地离开了。";
      }

      setGameState(prev => ({
        ...prev!,
        age: nextAge,
        attributes: newAttributes,
        logs: [...prev!.logs, event],
        isGameOver,
        deathReason,
        currentChoiceEvent: event.type === 'choice' ? event : undefined
      }));
    } catch (error) {
      console.error("Failed to age up:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (choice: Choice) => {
    if (!gameState || !gameState.currentChoiceEvent) return;

    const newAttributes = { ...gameState.attributes };
    Object.keys(choice.impact).forEach((key) => {
      const attrKey = key as keyof Attributes;
      newAttributes[attrKey] = Math.max(0, Math.min(100, newAttributes[attrKey] + (choice.impact[attrKey] || 0)));
    });

    const outcomeEvent: LifeEvent = {
      id: Math.random().toString(36).substr(2, 9),
      age: gameState.age,
      title: "选择结果",
      description: choice.outcomeDescription,
      type: 'neutral',
    };

    setGameState(prev => ({
      ...prev!,
      attributes: newAttributes,
      logs: [...prev!.logs, outcomeEvent],
      currentChoiceEvent: undefined
    }));
  };

  const resetGame = () => {
    setGameState(null);
    setSetupName('');
  };

  const lifeProgress = useMemo(() => {
    if (!gameState) return 0;
    return Math.min(100, (gameState.age / 100) * 100);
  }, [gameState?.age]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4 font-serif relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#5A5A40]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#5A5A40]/10 rounded-full blur-3xl" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl max-w-md w-full border border-white/50 relative z-10"
        >
          <div className="flex justify-center mb-8">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 bg-[#5A5A40] rounded-3xl flex items-center justify-center text-white shadow-lg shadow-[#5A5A40]/20"
            >
              <Activity size={40} />
            </motion.div>
          </div>
          <h1 className="text-5xl text-center mb-2 text-[#1A1A1A] font-bold tracking-tight">命运</h1>
          <p className="text-center text-[#5A5A40] mb-10 italic text-lg">你的选择，你的生活。</p>
          
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="block text-xs font-sans uppercase tracking-[0.2em] text-[#5A5A40]/60 font-bold ml-1">姓名</label>
              <input 
                type="text" 
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="输入你的名字..."
                className="w-full p-5 rounded-2xl bg-[#F5F5F0] border border-transparent focus:border-[#5A5A40]/20 focus:bg-white outline-none transition-all font-sans text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-sans uppercase tracking-[0.2em] text-[#5A5A40]/60 font-bold ml-1">性别</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.values(Gender).map((g) => (
                  <button
                    key={g}
                    onClick={() => setSetupGender(g)}
                    className={`py-4 rounded-2xl text-sm font-sans font-bold transition-all border ${
                      setupGender === g 
                      ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-lg shadow-[#5A5A40]/20' 
                      : 'bg-white text-[#5A5A40] border-[#5A5A40]/10 hover:border-[#5A5A40]/30 hover:bg-[#F5F5F0]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={startGame}
              disabled={loading || !setupName.trim()}
              className="w-full py-5 bg-[#5A5A40] text-white rounded-2xl font-sans font-bold uppercase tracking-[0.15em] hover:bg-[#4A4A30] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-[#5A5A40]/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>开始旅程 <Sparkles size={18} /></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col font-serif selection:bg-[#5A5A40]/10">
      {/* Header Stats */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#5A5A40]/5 p-5 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">{gameState.name}</h2>
                <span className="px-2 py-0.5 bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] font-sans font-bold rounded-full uppercase tracking-wider">
                  {gameState.gender}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#5A5A40]/60 italic">
                <Calendar size={14} />
                <span>{gameState.age} 岁</span>
              </div>
            </div>
            <div className="flex gap-5">
              <StatIcon icon={<Heart size={20} />} value={gameState.attributes.health} color="text-red-500" label="健康" />
              <StatIcon icon={<Smile size={20} />} value={gameState.attributes.happiness} color="text-yellow-500" label="幸福" />
              <StatIcon icon={<Coins size={20} />} value={gameState.attributes.wealth} color="text-emerald-600" label="财富" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <StatBar label="智力" value={gameState.attributes.intelligence} icon={<Brain size={14} />} color="bg-blue-500" />
            <StatBar label="颜值" value={gameState.attributes.looks} icon={<User size={14} />} color="bg-pink-500" />
          </div>

          {/* Life Progress Bar */}
          <div className="mt-6 h-1 bg-[#F5F5F0] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${lifeProgress}%` }}
              className="h-full bg-[#5A5A40]/30"
            />
          </div>
        </div>
      </div>

      {/* Game Log */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl mx-auto w-full pb-40">
        <AnimatePresence initial={false}>
          {gameState.logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`p-8 rounded-[32px] shadow-sm relative overflow-hidden group transition-all hover:shadow-md ${
                log.type === 'positive' ? 'bg-gradient-to-br from-white to-green-50/30 border border-green-100' :
                log.type === 'negative' ? 'bg-gradient-to-br from-white to-red-50/30 border border-red-100' :
                'bg-white border border-[#5A5A40]/5'
              }`}
            >
              {/* Event Type Icon Indicator */}
              <div className="absolute top-6 right-8 opacity-40 group-hover:opacity-100 transition-opacity">
                {EVENT_TYPE_ICONS[log.type] || EVENT_TYPE_ICONS.neutral}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#F5F5F0] flex items-center justify-center text-[10px] font-sans font-bold text-[#5A5A40]">
                  {log.age}
                </div>
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#5A5A40]/40 font-bold">
                  {log.age === 0 ? "出生" : `${log.age} 岁`}
                </span>
                {log.age % 10 === 0 && log.age > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-sans font-bold rounded-full uppercase tracking-wider">
                    <Award size={10} /> 里程碑
                  </span>
                )}
              </div>
              
              <h3 className="text-2xl mb-3 text-[#1A1A1A] font-bold tracking-tight">{log.title}</h3>
              <p className="text-[#5A5A40] leading-relaxed text-lg">{log.description}</p>
              
              {log.impact && Object.keys(log.impact).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(log.impact).map(([key, val]) => {
                    const numericVal = val as number;
                    return numericVal !== 0 && (
                      <span key={key} className={`text-[10px] font-sans font-bold px-2 py-1 rounded-lg ${numericVal > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {key === 'health' ? '健康' : key === 'happiness' ? '幸福' : key === 'intelligence' ? '智力' : key === 'wealth' ? '财富' : '颜值'} 
                        {numericVal > 0 ? `+${numericVal}` : numericVal}
                      </span>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {gameState.isGameOver && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="p-12 bg-[#1A1A1A] text-white rounded-[48px] text-center space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Skull size={64} className="mx-auto text-red-500/80" />
            </motion.div>
            <h2 className="text-5xl font-bold tracking-tighter">终点</h2>
            <p className="italic text-gray-400 text-xl max-w-sm mx-auto leading-relaxed">{gameState.deathReason}</p>
            
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto pt-4">
              <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">享年</div>
                <div className="text-2xl font-bold">{gameState.age} 岁</div>
              </div>
              <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">最终财富</div>
                <div className="text-2xl font-bold">{gameState.attributes.wealth}</div>
              </div>
            </div>

            <div className="pt-8">
              <button 
                onClick={resetGame}
                className="px-10 py-4 bg-white text-[#1A1A1A] rounded-2xl font-sans font-bold uppercase tracking-[0.2em] hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto shadow-xl shadow-white/10"
              >
                <RotateCcw size={20} /> 开启新人生
              </button>
            </div>
          </motion.div>
        )}
        <div ref={logEndRef} className="h-20" />
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F5F5F0] via-[#F5F5F0] to-transparent z-30">
        <div className="max-w-2xl mx-auto">
          {gameState.currentChoiceEvent ? (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap size={14} className="text-purple-500" />
                <p className="text-center text-[10px] font-sans uppercase tracking-[0.3em] text-[#5A5A40] font-bold">请做出你的选择</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {gameState.currentChoiceEvent.choices?.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice)}
                    className="w-full p-6 bg-white border border-[#5A5A40]/10 rounded-3xl text-left hover:border-[#5A5A40]/40 hover:bg-[#5A5A40] hover:text-white transition-all group shadow-sm hover:shadow-xl active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-serif text-lg font-medium">{choice.text}</span>
                      <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : !gameState.isGameOver && (
            <button
              onClick={ageUp}
              disabled={loading}
              className="w-full py-6 bg-[#5A5A40] text-white rounded-[32px] font-sans font-bold uppercase tracking-[0.2em] hover:bg-[#4A4A30] active:scale-[0.98] transition-all shadow-2xl shadow-[#5A5A40]/30 flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>增长岁数 <ChevronRight size={24} /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatIcon({ icon, value, color, label }: { icon: React.ReactNode, value: number, color: string, label: string }) {
  return (
    <div className="flex flex-col items-center group cursor-help">
      <div className={`${color} mb-1 transition-transform group-hover:scale-110`}>{icon}</div>
      <span className="text-sm font-sans font-bold text-[#1A1A1A]">{value}</span>
      <span className="text-[8px] font-sans uppercase tracking-widest text-[#5A5A40]/40 font-bold mt-0.5">{label}</span>
    </div>
  );
}

function StatBar({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="space-y-2 group">
      <div className="flex justify-between items-center text-[10px] font-sans uppercase tracking-[0.15em] text-[#5A5A40]/60 font-bold">
        <div className="flex items-center gap-1.5">
          <span className="text-[#5A5A40]/40">{icon}</span> {label}
        </div>
        <span className="text-[#1A1A1A]">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#F5F5F0] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
