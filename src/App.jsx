import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Flame, Plus, RotateCcw, Sparkles, Target, TrendingUp } from 'lucide-react'

const defaultHabits = [
  { id: 'run', name: 'Corsa', emoji: '🏃', goal: 3 },
  { id: 'gym', name: 'Palestra', emoji: '🏋️', goal: 2 },
  { id: 'walk', name: 'Camminata', emoji: '🚶', goal: 2 },
  { id: 'mobility', name: 'Mobilità', emoji: '🧘', goal: 2 },
  { id: 'food', name: 'Dieta', emoji: '🥗', goal: 5 },
  { id: 'sleep', name: 'Sonno', emoji: '🌙', goal: 6 },
]

const moods = [
  { id: 'low', label: 'Scarico', emoji: '😵‍💫' },
  { id: 'ok', label: 'Ok', emoji: '🙂' },
  { id: 'good', label: 'Bene', emoji: '🔥' },
]

const storageKey = 'mbare-habit-tracker-v2'
const dailyTarget = 3

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().slice(0, 10))
  }
  return days
}

function formatShortDay(dateKey) {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short' })
}

function formatLongDate(dateKey) {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function getMonthDays(anchorDate) {
  const year = anchorDate.getFullYear()
  const month = anchorDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const days = []
  for (let i = 0; i < mondayOffset; i++) days.push(null)
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    days.push(date.toISOString().slice(0, 10))
  }
  return days
}

function getMoodEmoji(id) {
  return moods.find((mood) => mood.id === id)?.emoji || '🙂'
}

function Button({ children, className = '', ...props }) {
  return <button className={className} {...props}>{children}</button>
}

export default function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return { ...parsed, habits: defaultHabits }
      } catch {
        localStorage.removeItem(storageKey)
      }
    }
    return { habits: defaultHabits, logs: {}, todayNote: '', todayMood: 'ok' }
  })

  const today = getTodayKey()
  const last7Days = getLast7Days()
  const [selectedDay, setSelectedDay] = useState(today)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const todayLog = state.logs[today] || { habits: {}, mood: state.todayMood, note: '' }
  const selectedLog = state.logs[selectedDay] || { habits: {}, mood: 'ok', note: '' }
  const monthDays = getMonthDays(calendarMonth)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state])

  const completedToday = state.habits.filter((habit) => todayLog.habits?.[habit.id]).length
  const completionRate = Math.min(Math.round((completedToday / dailyTarget) * 100), 100)

  const weeklyStats = useMemo(() => {
    return state.habits.map((habit) => {
      const count = last7Days.filter((day) => state.logs[day]?.habits?.[habit.id]).length
      return { ...habit, count, reached: count >= habit.goal }
    })
  }, [state, last7Days])

  const totalWeekChecks = weeklyStats.reduce((sum, item) => sum + item.count, 0)
  const bestHabit = [...weeklyStats].sort((a, b) => b.count - a.count)[0]
  const selectedCompleted = state.habits.filter((habit) => selectedLog.habits?.[habit.id])
  const selectedScore = Math.min(Math.round((selectedCompleted.length / dailyTarget) * 100), 100)

  function toggleHabit(id) {
    setState((prev) => ({
      ...prev,
      logs: {
        ...prev.logs,
        [selectedDay]: {
          ...prev.logs[selectedDay],
          habits: { ...(prev.logs[selectedDay]?.habits || {}), [id]: !prev.logs[selectedDay]?.habits?.[id] },
          mood: prev.logs[selectedDay]?.mood || 'ok',
          note: prev.logs[selectedDay]?.note || '',
        },
      },
    }))
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
    }))
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
    }))
  }

  function resetSelectedDay() {
    setState((prev) => {
      const nextLogs = { ...prev.logs }
      delete nextLogs[selectedDay]
      return { ...prev, logs: nextLogs }
    })
  }

  function changeMonth(direction) {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1))
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-zinc-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#34C759]/20 blur-3xl" />
        <div className="absolute top-44 -right-28 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-purple-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md px-5 py-7 pb-28">
        <header className="mb-7 flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold capitalize text-zinc-500">{selectedDay === today ? 'Oggi' : formatLongDate(selectedDay)}</p>
            <h1 className="text-[40px] font-black leading-none tracking-tight text-zinc-950">Habit Tracker</h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
            <Sparkles className="h-5 w-5 text-[#34C759]" />
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <section className="mb-4 overflow-hidden rounded-[34px] bg-zinc-950 text-white shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
            <div className="p-6">
              <div className="mb-7 flex items-start justify-between gap-5">
                <div>
                  <p className="mb-1 text-sm font-semibold text-white/55">Completamento</p>
                  <h2 className="text-[74px] font-black leading-none tracking-[-0.06em] text-[#30D158]">{completionRate}%</h2>
                </div>
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-white ring-1 ring-white/10">
                  {completedToday}/{dailyTarget}
                </div>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#30D158] to-[#34C759] transition-all duration-500" style={{ width: `${completionRate}%` }} />
              </div>
              <p className="mt-5 text-[15px] font-medium leading-relaxed text-white/70">
                {completionRate >= 100 ? 'Target centrato. Giornata chiusa bene.' : 'Ti bastano 3 check al giorno. Niente perfezione, solo costanza.'}
              </p>
            </div>
          </section>
        </motion.div>

        <div className="mb-7 grid grid-cols-3 gap-3">
          <MiniStat icon={<Flame />} label="Week" value={totalWeekChecks} />
          <MiniStat icon={<Target />} label="Top" value={bestHabit?.emoji || '-'} />
          <MiniStat icon={<TrendingUp />} label="Mood" value={getMoodEmoji(todayLog.mood)} />
        </div>

        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Abitudini</h2>
              <p className="text-sm font-medium text-zinc-500">Modifica il giorno selezionato</p>
            </div>
            <Button onClick={resetSelectedDay} className="rounded-full bg-white px-4 py-2 text-zinc-500 shadow-sm hover:bg-zinc-100 hover:text-zinc-900">
              <RotateCcw className="mr-2 inline h-4 w-4" /> Reset
            </Button>
          </div>

          <div className="space-y-3">
            {state.habits.map((habit) => {
              const active = !!selectedLog.habits?.[habit.id]
              return (
                <button key={habit.id} onClick={() => toggleHabit(habit.id)} className={`flex w-full items-center justify-between rounded-[30px] p-4 text-left shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all duration-300 active:scale-[0.98] ${active ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-950'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-[22px] text-2xl ${active ? 'bg-white/10' : 'bg-[#f5f5f7]'}`}>{habit.emoji}</div>
                    <div>
                      <p className="text-[17px] font-black leading-tight">{habit.name}</p>
                      <p className={`mt-1 text-sm font-semibold ${active ? 'text-white/55' : 'text-zinc-400'}`}>Goal: {habit.goal}x settimana</p>
                    </div>
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? 'bg-[#30D158] text-zinc-950' : 'bg-zinc-100 text-zinc-400'}`}>{active ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}</div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mb-7">
          <h2 className="mb-3 text-2xl font-black tracking-tight">Mood</h2>
          <div className="grid grid-cols-3 gap-3">
            {moods.map((mood) => {
              const active = selectedLog.mood === mood.id
              return (
                <button key={mood.id} onClick={() => setMood(mood.id)} className={`rounded-[28px] p-4 text-center shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all active:scale-[0.98] ${active ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-950'}`}>
                  <div className="text-3xl">{mood.emoji}</div>
                  <p className={`mt-2 text-sm font-black ${active ? 'text-white' : 'text-zinc-700'}`}>{mood.label}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mb-7">
          <h2 className="mb-3 text-2xl font-black tracking-tight">Nota</h2>
          <textarea value={selectedLog.note || ''} onChange={(event) => setNote(event.target.value)} placeholder="Cosa salvo di oggi? Cosa posso migliorare domani?" className="min-h-32 w-full resize-none rounded-[30px] border-0 bg-white p-5 text-[15px] font-medium leading-relaxed text-zinc-900 shadow-[0_10px_28px_rgba(0,0,0,0.06)] outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-[#34C759]/30" />
        </section>

        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Calendario</h2>
              <p className="text-sm font-medium capitalize text-zinc-500">{calendarMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => changeMonth(-1)} className="h-10 w-10 rounded-full bg-white p-0 text-zinc-600 shadow-sm hover:bg-zinc-100"><ChevronLeft className="mx-auto h-4 w-4" /></Button>
              <Button onClick={() => changeMonth(1)} className="h-10 w-10 rounded-full bg-white p-0 text-zinc-600 shadow-sm hover:bg-zinc-100"><ChevronRight className="mx-auto h-4 w-4" /></Button>
            </div>
          </div>

          <div className="rounded-[34px] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
            <div className="mb-3 grid grid-cols-7 gap-2 text-center text-[11px] font-black text-zinc-400">
              {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} />
                const log = state.logs[day]
                const count = state.habits.filter((habit) => log?.habits?.[habit.id]).length
                const score = Math.min(Math.round((count / dailyTarget) * 100), 100)
                const isSelected = day === selectedDay
                const isToday = day === today
                return (
                  <button key={day} onClick={() => setSelectedDay(day)} className={`aspect-square rounded-[18px] text-xs font-black transition-all duration-300 active:scale-95 ${isSelected ? 'bg-zinc-950 text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]' : isToday ? 'bg-[#E8F8EE] text-[#1F8F43]' : 'bg-[#f5f5f7] text-zinc-700'}`}>
                    <div>{Number(day.slice(-2))}</div>
                    <div className={`mt-0.5 text-[9px] ${isSelected ? 'text-white/65' : 'text-zinc-400'}`}>{score}%</div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mb-7">
          <div className="rounded-[34px] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold capitalize text-zinc-500">Storico giorno</p>
                <h2 className="text-xl font-black capitalize leading-tight">{formatLongDate(selectedDay)}</h2>
              </div>
              <div className="rounded-2xl bg-[#E8F8EE] px-4 py-2 text-sm font-black text-[#1F8F43]">{selectedScore}%</div>
            </div>
            {selectedCompleted.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedCompleted.map((habit) => <span key={habit.id} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-800">{habit.emoji} {habit.name}</span>)}
              </div>
            ) : <p className="mb-4 text-sm font-medium text-zinc-400">Nessuna abitudine registrata in questo giorno.</p>}
            <div className="mb-3 rounded-[24px] bg-[#f5f5f7] p-4 text-sm font-semibold text-zinc-700"><span className="mr-2 text-zinc-400">Mood</span><span>{getMoodEmoji(selectedLog.mood)}</span></div>
            {selectedLog.note ? <p className="rounded-[24px] bg-[#f5f5f7] p-4 text-sm font-medium leading-relaxed text-zinc-700">“{selectedLog.note}”</p> : <p className="rounded-[24px] bg-[#f5f5f7] p-4 text-sm font-medium text-zinc-400">Nessuna nota salvata.</p>}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-zinc-400" />
            <h2 className="text-2xl font-black tracking-tight">Ultimi 7 giorni</h2>
          </div>
          <div className="rounded-[34px] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
            <div className="mb-5 grid grid-cols-7 gap-2">
              {last7Days.map((day) => {
                const count = state.habits.filter((habit) => state.logs[day]?.habits?.[habit.id]).length
                const intensity = Math.min(count / dailyTarget, 1)
                return <div key={day} className="text-center"><p className="mb-2 text-xs font-bold capitalize text-zinc-400">{formatShortDay(day)}</p><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[16px] bg-[#E8F8EE] text-xs font-black text-[#1F8F43]" style={{ opacity: 0.35 + intensity * 0.65 }}>{count}</div></div>
              })}
            </div>
            <div className="space-y-4">
              {weeklyStats.map((habit) => <div key={habit.id}><div className="mb-2 flex justify-between text-sm font-bold"><span>{habit.emoji} {habit.name}</span><span className={habit.reached ? 'text-[#1F8F43]' : 'text-zinc-400'}>{habit.count}/{habit.goal}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-[#34C759]" style={{ width: `${Math.min((habit.count / habit.goal) * 100, 100)}%` }} /></div></div>)}
            </div>
          </div>
        </section>

        <footer className="mt-7 text-center text-xs font-semibold text-zinc-400">Built with momentum ✨</footer>
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="rounded-[28px] bg-white p-4 text-center shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-[18px] bg-[#f5f5f7] text-zinc-700">
        {React.cloneElement(icon, { className: 'h-5 w-5' })}
      </div>
      <p className="text-xl font-black text-zinc-950">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-zinc-400">{label}</p>
    </div>
  )
}
