
import { useState, useMemo, useCallback } from 'react';
import { getMonthDays, getWeekDays } from '../lib/calendar-utils';

export type CalendarView = 'month' | 'week' | 'day';

export const useCalendar = (initialDate = new Date(), language = 'en') => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>('month');

  // Month view data
  const weeks = useMemo(() => getMonthDays(currentDate), [currentDate]);
  
  // Week view data
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // Map app language code to BCP 47 locale
  const localeMap: Record<string, string> = { 
      en: 'en-US', 
      it: 'it-IT', 
      es: 'es-ES', 
      fr: 'fr-FR', 
      de: 'de-DE' 
  };
  const locale = localeMap[language] || 'en-US';

  const headerTitle = useMemo(() => {
    // Helper to capitalize first letter (some locales return lowercase months)
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    if (view === 'month') {
      const monthYear = currentDate.toLocaleString(locale, { month: 'long', year: 'numeric' });
      return cap(monthYear);
    }
    if (view === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      const startMonth = start.toLocaleString(locale, { month: 'short' });
      const endMonth = end.toLocaleString(locale, { month: 'short' });
      
      if (start.getFullYear() !== end.getFullYear()) {
          return `${cap(start.toLocaleString(locale, { month: 'short', day: 'numeric', year: 'numeric' }))} - ${cap(end.toLocaleString(locale, { month: 'short', day: 'numeric', year: 'numeric' }))}`;
      }
      if (startMonth === endMonth) {
        return `${cap(startMonth)} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${cap(startMonth)} ${start.getDate()} - ${cap(endMonth)} ${end.getDate()}, ${end.getFullYear()}`;
    }
    if (view === 'day') {
      const dateStr = currentDate.toLocaleString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      return cap(dateStr);
    }
    return '';
  }, [currentDate, view, weekDays, locale]);

  const goToNext = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (view === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (view === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else if (view === 'day') {
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate); // Keep selected date in sync
      }
      return newDate;
    });
  }, [view]);

  const goToPrevious = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (view === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (view === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else if (view === 'day') {
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate); // Keep selected date in sync
      }
      return newDate;
    });
  }, [view]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  return {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    weeks,
    weekDays,
    headerTitle,
    goToNext,
    goToPrevious,
    goToToday,
  };
};
