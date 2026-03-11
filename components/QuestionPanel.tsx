import React, { useState, useEffect, useCallback } from 'react';
import { generateChGKQuestion, speakText } from '../services/gemini';
import { ChGKQuestion } from '../types';

const QuestionPanel: React.FC = () => {
  const [question, setQuestion] = useState<ChGKQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchQuestion = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setShowAnswer(false);
    try {
      const q = await generateChGKQuestion();
      setQuestion(q);
    } catch (err) {
      alert("Savol yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Agar foydalanuvchi biror matn maydonida yozayotgan bo'lsa, shortcut ishlamaydi
      const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (isTyping) return;

      if (e.key.toLowerCase() === 'n') {
        fetchQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchQuestion]);

  const handleSpeak = async () => {
    if (!question || isSpeaking) return;
    setIsSpeaking(true);
    try {
      await speakText(question.question);
    } catch (err) {
      console.error("TTS error:", err);
    } finally {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="w-full p-6 rounded-3xl neumorphic-flat lg:min-h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-secondary)' }}>AI Mashg'ulot</h2>
        <div className="flex gap-3">
          {question && !loading && (
            <button 
              onClick={handleSpeak}
              disabled={isSpeaking}
              className="w-10 h-10 rounded-full neumorphic-flat neumorphic-active flex items-center justify-center disabled:opacity-50 transition-all"
              style={{ color: 'var(--accent-color)' }}
              title="Ovozli o'qish"
            >
              <i className={`fa-solid ${isSpeaking ? 'fa-spinner fa-spin' : 'fa-volume-high'}`}></i>
            </button>
          )}
          <button 
            onClick={fetchQuestion}
            disabled={loading}
            className="px-6 py-2 rounded-full neumorphic-flat neumorphic-active font-semibold disabled:opacity-50"
            style={{ color: 'var(--accent-color)' }}
            title="Yangi savol yaratish (N)"
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>}
            Savol yaratish
          </button>
        </div>
      </div>

      {!question && !loading && (
        <p className="text-center py-8 italic" style={{ color: 'var(--text-muted)' }}>
          O'zingizni sinab ko'rish uchun Gemini AI orqali savol yarating
        </p>
      )}

      {loading && (
        <div className="flex flex-col items-center py-12">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Mantiqiy savol tayyorlanmoqda...</p>
        </div>
      )}

      {question && !loading && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-2xl neumorphic-inset">
            <p className="text-lg leading-relaxed font-medium" style={{ color: 'var(--text-color)' }}>
              {question.question}
            </p>
          </div>

          {showAnswer && (
            <div className="space-y-4 animate-slideUp">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <p className="text-sm font-bold uppercase mb-1" style={{ color: '#22c55e' }}>Javob:</p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>{question.answer}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--footer-bg)', border: '1px solid var(--footer-border)' }}>
                <p className="text-sm font-bold uppercase mb-1" style={{ color: 'var(--accent-color)' }}>Izoh:</p>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{question.explanation}</p>
              </div>
            </div>
          )}

          <button 
            onClick={() => setShowAnswer(!showAnswer)}
            className="w-full py-3 rounded-xl neumorphic-flat neumorphic-active font-bold tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            {showAnswer ? 'JAVOBNI BERKITISH' : 'JAVOBNI KO‘RISH'}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionPanel;