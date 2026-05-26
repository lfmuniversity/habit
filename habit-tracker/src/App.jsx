import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Flame, Plus, RotateCcw, Sparkles, Target, TrendingUp } from 'lucide-react';

const defaultHabits = [
  { id: 'run', name: 'Corsa', emoji: '🏃', goal: 3 },
  { id: 'gym', name: 'Palestra', emoji: '🏋️', goal: 2 },
  { id: 'walk', name: 'Camminata', emoji: '🚶', goal: 2 },
  { id: 'mobility', name: 'Mobilità', emoji: '🧘', goal: 2 },
  { id: 'food', name: 'Dieta', emoji: '🥗', goal: 5 },
  { id: 'sleep', name: 'Sonno', emoji: '🌙', goal: 6 },
];

const moods = [
  { id: 'low', label: 'Scarico', emoji: '😵‍💫' },
  { id: 'ok', label: 'Ok', emoji: '🙂' },
  { id: 'good', label: 'Bene', emoji: '🔥' },
];

const storageKey = 'mbare-habit-tracker-v2';
const dailyTarget = 3;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

function formatShortDay(dateKey) {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short' });
}

function formatLongDate(dateKey) {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getMonthDays(anchorDate) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < mondayOffset; i++) days.push(null);
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

function getMoodEmoji(id) {
  return moods.find((mood) => mood.id === id)?.emoji || '🙂';
}

export default function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, habits: defaultHabits };
    }
    return { habits: defaultHabits, logs: {}, todayNote: '', todayMood: 'ok' };
  });

  const today = getTodayKey();
  const last7Days = getLast7Days();
  const [selectedDay, setSelectedDay] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const todayLog = state.logs[today] || { habits: {}, mood: state.todayMood, note: '' };
  const selectedLog = state.logs[selectedDay] || { habits: {}, mood: 'ok', note: '' };
  const monthDays = getMonthDays(calendarMonth);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const completedToday = state.habits.filter((habit) => todayLog.habits?.[habit.id]).length;
  const completionRate = Math.min(Math.round((completedToday / dailyTarget) * 100), 100);

  const weeklyStats = useMemo(() => {
    return state.habits.map((habit) => {
      const count = last7Days.filter((day) => state.logs[day]?.habits?.[habit.id]).length;
      return { ...habit, count, reached: count >= habit.goal };
    });
  }, [state, last7Days]);

  const totalWeekChecks = weeklyStats.reduce((sum, item) => sum + item.count, 0);
  const bestHabit = [...weeklyStats].sort((a, b) => b.count - a.count)[0];
  const selectedCompleted = state.habits.filter((habit) => selectedLog.habits?.[habit.id]);
  const selectedScore = Math.min(Math.round((selectedCompleted.length / dailyTarget) * 100), 100);

  function toggleHabit(id) {
    setState((prev) => ({
      ...prev,
      logs: {
        ...prev.logs,
        [selectedDay]: {
          ...prev.logs[selectedDay],
          habits: {
            ...(prev.logs[selectedDay]?.habits || {}),
            [id]: !prev.logs[selectedDay]?.habits?.[id],
          },
          mood: prev.logs[selectedDay]?.mood || 'ok',
          note: prev.logs[selectedDay]?.note || '',
        },
      },
    }));
  }

  function setMood(id) {
    setState((prev) => ({
      ...prev,
      logs: {
        ...prev.logs,
        [selectedDay]: {
          ...prev.logs[selectedDay],
          habits: prev.logs[selectedDay]?.habits || {},
          mood: id,
          note: prev.logs[selectedDay]?.note || '',
        },
      },
    }));
  }

  function setNote(value) {
    setState((prev) => ({
      ...prev,
      logs: {
        ...prev.logs,
        [selectedDay]: {
          ...prev.logs[selectedDay],
          habits: prev.logs[selectedDay]?.habits || {},
          mood: prev.logs[selectedDay]?.mood || 'ok',
          note: value,
        },
      },
    }));
  }

  function resetSelectedDay() {
    setState((prev) => {
      const nextLogs = { ...prev.logs };
      delete nextLogs[selectedDay];
      return { ...prev, logs: nextLogs };
    });
  }

  function changeMonth(direction) {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  }

  return (
    <div className="app">
      <div className="glow glow-green" />
      <div className="glow glow-blue" />
      <div className="glow glow-purple" />
      <main className="shell">
        <header className="header">
          <div>
            <p className="eyebrow">{selectedDay === today ? 'Oggi' : formatLongDate(selectedDay)}</p>
            <h1>Habit Tracker</h1>
          </div>
          <div className="app-icon"><Sparkles size={20} /></div>
        </header>

        <motion.section className="hero-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="hero-top">
            <div>
              <p>Completamento</p>
              <div className="percentage">{completionRate}%</div>
            </div>
            <div className="daily-badge">{completedToday}/{dailyTarget}</div>
          </div>
          <div className="progress"><div style={{ width: `${completionRate}%` }} /></div>
          <p className="hero-copy">{completionRate >= 100 ? 'Target centrato. Giornata chiusa bene.' : 'Ti bastano 3 check al giorno. Niente perfezione, solo costanza.'}</p>
        </motion.section>

        <section className="stats-grid">
          <MiniStat icon={<Flame />} label="Week" value={totalWeekChecks} />
          <MiniStat icon={<Target />} label="Top" value={bestHabit?.emoji || '-'} />
          <MiniStat icon={<TrendingUp />} label="Mood" value={getMoodEmoji(todayLog.mood)} />
        </section>

        <SectionTitle title="Abitudini" subtitle="Modifica il giorno selezionato" action={<button onClick={resetSelectedDay} className="reset-btn"><RotateCcw size={16} /> Reset</button>} />
        <section className="habit-list">
          {state.habits.map((habit) => {
            const active = !!selectedLog.habits?.[habit.id];
            return (
              <button key={habit.id} onClick={() => toggleHabit(habit.id)} className={`habit-card ${active ? 'active' : ''}`}>
                <div className="habit-left">
                  <div className="emoji-box">{habit.emoji}</div>
                  <div><strong>{habit.name}</strong><span>Goal: {habit.goal}x settimana</span></div>
                </div>
                <div className="check-circle">{active ? <Check size={20} /> : <Plus size={20} />}</div>
              </button>
            );
          })}
        </section>

        <SectionTitle title="Mood" />
        <section className="mood-grid">
          {moods.map((mood) => {
            const active = selectedLog.mood === mood.id;
            return <button key={mood.id} onClick={() => setMood(mood.id)} className={`mood-card ${active ? 'active' : ''}`}><span>{mood.emoji}</span><strong>{mood.label}</strong></button>;
          })}
        </section>

        <SectionTitle title="Nota" />
        <textarea className="note" value={selectedLog.note || ''} onChange={(event) => setNote(event.target.value)} placeholder="Cosa salvo di oggi? Cosa posso migliorare domani?" />

        <SectionTitle title="Calendario" subtitle={calendarMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })} action={<div className="month-actions"><button onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button><button onClick={() => changeMonth(1)}><ChevronRight size={18} /></button></div>} />
        <section className="calendar-card">
          <div className="weekdays">{['L','M','M','G','V','S','D'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {monthDays.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;
              const log = state.logs[day];
              const count = state.habits.filter((habit) => log?.habits?.[habit.id]).length;
              const score = Math.min(Math.round((count / dailyTarget) * 100), 100);
              const isSelected = day === selectedDay;
              const isToday = day === today;
              return <button key={day} onClick={() => setSelectedDay(day)} className={`day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}><strong>{Number(day.slice(-2))}</strong><span>{score}%</span></button>;
            })}
          </div>
        </section>

        <section className="history-card">
          <div className="history-head"><div><p>Storico giorno</p><h2>{formatLongDate(selectedDay)}</h2></div><strong>{selectedScore}%</strong></div>
          {selectedCompleted.length > 0 ? <div className="chips">{selectedCompleted.map((habit) => <span key={habit.id}>{habit.emoji} {habit.name}</span>)}</div> : <p className="empty">Nessuna abitudine registrata in questo giorno.</p>}
          <div className="mood-line"><span>Mood</span> {getMoodEmoji(selectedLog.mood)}</div>
          <p className="saved-note">{selectedLog.note ? `“${selectedLog.note}”` : 'Nessuna nota salvata.'}</p>
        </section>

        <SectionTitle title="Ultimi 7 giorni" icon={<CalendarDays size={20} />} />
        <section className="week-card">
          <div className="last-days">
            {last7Days.map((day) => {
              const count = state.habits.filter((habit) => state.logs[day]?.habits?.[habit.id]).length;
              const intensity = Math.min(count / dailyTarget, 1);
              return <div key={day}><p>{formatShortDay(day)}</p><span style={{ opacity: 0.35 + intensity * 0.65 }}>{count}</span></div>;
            })}
          </div>
          <div className="weekly-bars">
            {weeklyStats.map((habit) => <div key={habit.id} className="bar-row"><div><span>{habit.emoji} {habit.name}</span><b className={habit.reached ? 'reached' : ''}>{habit.count}/{habit.goal}</b></div><div className="bar"><span style={{ width: `${Math.min((habit.count / habit.goal) * 100, 100)}%` }} /></div></div>)}
          </div>
        </section>
        <footer>Built with momentum ✨</footer>
      </main>
    </div>
  );
}

function SectionTitle({ title, subtitle, action, icon }) {
  return <div className="section-title"><div>{icon}{<h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function MiniStat({ icon, label, value }) {
  return <div className="mini-stat"><div>{React.cloneElement(icon, { size: 20 })}</div><strong>{value}</strong><span>{label}</span></div>;
}
