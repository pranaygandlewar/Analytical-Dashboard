import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

export default function CustomDatePicker({ value, onChange, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());
  
  const dropdownRef = useRef(null);

  // Synchronize when value changes externally
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
      setTempDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatFriendlyDate = (dateObj) => {
    if (!dateObj) return "Choose Date";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const dayName = days[dateObj.getDay()];
    const monthName = months[dateObj.getMonth()];
    const dateNum = dateObj.getDate();
    
    let suffix = "th";
    if (dateNum === 1 || dateNum === 21 || dateNum === 31) suffix = "st";
    else if (dateNum === 2 || dateNum === 22) suffix = "nd";
    else if (dateNum === 3 || dateNum === 23) suffix = "rd";
    
    return `${dayName}, ${dateNum}${suffix} ${monthName}`;
  };

  const year = tempDate.getFullYear();
  const month = tempDate.getMonth();

  const handlePrevMonth = () => {
    setTempDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setTempDate(new Date(year, month + 1, 1));
  };

  const getDaysInMonth = (y, m) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const days = [];
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 for Sunday
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // shift to start Monday

    const prevMonthDaysCount = getDaysInMonth(year, month - 1);
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDaysCount - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDaysCount - i)
      });
    }

    const currentMonthDaysCount = getDaysInMonth(year, month);
    for (let i = 1; i <= currentMonthDaysCount; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const selectDay = (date) => {
    setSelectedDate(date);
  };

  const handleChooseDate = () => {
    if (selectedDate) {
      // Format as YYYY-MM-DD
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dd = String(selectedDate.getDate()).padStart(2, "0");
      onChange(`${yyyy}-${mm}-${dd}`);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (value) {
      setSelectedDate(new Date(value));
      setTempDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
    setIsOpen(false);
  };

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl py-2.5 px-3.5 outline-none font-medium text-sm transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700/60"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={16} className="text-slate-400" />
          <span className="truncate">{selectedDate ? formatFriendlyDate(selectedDate) : "Select Date"}</span>
        </div>
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 left-0 mt-2 p-3.5 rounded-[20px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1E2540] shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 w-[280px] mx-auto md:w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="font-bold text-slate-800 dark:text-white text-sm">
              {monthsList[month]} {year}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
              <span key={day} className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase py-0.5">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {generateCalendarDays().map((cell, idx) => {
              const active = isSelected(cell.date);
              const today = isToday(cell.date);
              
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDay(cell.date)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-150 mx-auto ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                      : today
                      ? "border border-blue-600 text-blue-600 dark:text-blue-400"
                      : cell.isCurrentMonth
                      ? "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      : "text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleChooseDate}
              className="py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs transition shadow-lg shadow-blue-500/20"
            >
              Choose Date
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
