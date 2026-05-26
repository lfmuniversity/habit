import React, { useEffect, useMemo, useState } from 'react';

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
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, habits: defaultHabits };
      }
    } catch (error) {
      console.warn('Local storage reset:', error);
    }
    return { habits: defaultHabits, logs: {}, todayMood: 'ok' };
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

  function updateSelectedDay(updater) {
    setState((prev) => {
      const current = prev.logs[selectedDay] || { habits: {}, mood: 'ok', note: '' };
      return {
        ...prev,
        logs: {
          ...prev.logs,
          [selectedDay]: updater(current),
        },
      };
    });
  }

  function toggleHabit(id) {
    updateSelectedDay((current) => ({
      ...current,
      habits: { ...current.habits, [id]: !current.habits?.[id] },
    }));
  }

  function setMood(id) {
    updateSelectedDay((current) => ({ ...current, mood: id }));
  }

  function setNote(value) {
    updateSelectedDay((current) => ({ ...current, note: value }));
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
    <main className="app-shell">
      <div className="glow glow-green" />
      <div className="glow glow-blue" />
      <div className="container">
        <header className="topbar">
          <div>
            <p className="eyebrow">{selectedDay === today ? 'Oggi' : formatLongDate(selectedDay)}</p>
            <h1>Habit Tracker</h1>
          </div>
          <div className="app-icon">✦</div>
        </header>

        <section className="hero-card">
          <div className="hero-row">
            <div>
              <p className="hero-label">Completamento</p>
              <div className="hero-percent">{completionRate}%</div>
            </div>
            <div className="daily-score">{completedToday}/{dailyTarget}</div>
          </div>
          <div className="progress"><div style={{ width: `${completionRate}%` }} /></div>
          <p className="hero-text">{completionRate >= 100 ? 'Target centrato. Giornata chiusa bene.' : 'Ti bastano 3 check al giorno. Niente perfezione, solo costanza.'}</p>
        </section>

        <section className="mini-grid">
          <MiniStat icon="🔥" label="Week" value={totalWeekChecks} />
          <MiniStat icon="🎯" label="Top" value={bestHabit?.emoji || '-'} />
          <MiniStat icon="📈" label="Mood" value={getMoodEmoji(todayLog.mood)} />
        </section>

        <section className="section-block">
          <div className="section-title-row">
            <div>
              <h2>Abitudini</h2>
              <p>Modifica il giorno selezionato</p>
            </div>
            <button className="pill-button" onClick={resetSelectedDay}>↻ Reset</button>
          </div>
          <div className="habit-list">
            {state.habits.map((habit) => {
              const active = !!selectedLog.habits?.[habit.id];
              return (
                <button key={habit.id} className={`habit-card ${active ? 'active' : ''}`} onClick={() => toggleHabit(habit.id)}>
                  <div className="habit-left">
                    <div className="habit-emoji">{habit.emoji}</div>
                    <div>
                      <h3>{habit.name}</h3>
                      <p>Goal: {habit.goal}x settimana</p>
                    </div>
                  </div>
                  <div className="check-badge">{active ? '✓' : '+'}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="section-block">
          <h2>Mood</h2>
          <div className="mood-grid">
            {moods.map((mood) => {
              const active = selectedLog.mood === mood.id;
              return (
                <button key={mood.id} className={`mood-card ${active ? 'active' : ''}`} onClick={() => setMood(mood.id)}>
                  <span>{mood.emoji}</span>
                  <strong>{mood.label}</strong>
                </button>
              );
            })}
          </div>
        </section>

        <section className="section-block">
          <h2>Nota</h2>
          <textarea value={selectedLog.note || ''} onChange={(event) => setNote(event.target.value)} placeholder="Cosa salvo di oggi? Cosa posso migliorare domani?" />
        </section>

        <section className="section-block">
          <div className="section-title-row">
            <div>
              <h2>Calendario</h2>
              <p>{calendarMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="month-actions">
              <button onClick={() => changeMonth(-1)}>‹</button>
              <button onClick={() => changeMonth(1)}>›</button>
            </div>
          </div>
          <div className="calendar-card">
            <div className="weekdays">{['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid">
              {monthDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} />;
                const log = state.logs[day];
                const count = state.habits.filter((habit) => log?.habits?.[habit.id]).length;
                const score = Math.min(Math.round((count / dailyTarget) * 100), 100);
                const isSelected = day === selectedDay;
                const isToday = day === today;
                return (
                  <button key={day} onClick={() => setSelectedDay(day)} className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}>
                    <strong>{Number(day.slice(-2))}</strong>
                    <small>{score}%</small>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="history-card">
          <div className="history-header">
            <div>
              <p>Storico giorno</p>
              <h2>{formatLongDate(selectedDay)}</h2>
            </div>
            <span>{selectedScore}%</span>
          </div>
          {selectedCompleted.length > 0 ? (
            <div className="chips">
              {selectedCompleted.map((habit) => <span key={habit.id}>{habit.emoji} {habit.name}</span>)}
            </div>
          ) : <p className="empty-copy">Nessuna abitudine registrata in questo giorno.</p>}
          <div className="note-box"><strong>Mood</strong> {getMoodEmoji(selectedLog.mood)}</div>
          <div className="note-box muted">{selectedLog.note ? `“${selectedLog.note}”` : 'Nessuna nota salvata.'}</div>
        </section>

        <section className="week-card">
          <h2>Ultimi 7 giorni</h2>
          <div className="last-days">
            {last7Days.map((day) => {
              const count = state.habits.filter((habit) => state.logs[day]?.habits?.[habit.id]).length;
              const intensity = Math.min(count / dailyTarget, 1);
              return (
                <div key={day}>
                  <p>{formatShortDay(day)}</p>
                  <span style={{ opacity: 0.35 + intensity * 0.65 }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className="weekly-bars">
            {weeklyStats.map((habit) => (
              <div key={habit.id} className="bar-row">
                <div><span>{habit.emoji} {habit.name}</span><strong className={habit.reached ? 'green' : ''}>{habit.count}/{habit.goal}</strong></div>
                <div className="bar"><span style={{ width: `${Math.min((habit.count / habit.goal) * 100, 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <footer>Built with momentum ✨</footer>
      </div>
    </main>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="mini-card">
      <div>{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
