"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CalendarProps = {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | { from: Date; to: Date }
  onSelect?: (date: Date | Date[] | { from: Date; to: Date } | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  month?: Date
  onMonthChange?: (date: Date) => void
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
  month: controlledMonth,
  onMonthChange,
  ...props
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(controlledMonth || new Date())
  const month = controlledMonth || internalMonth

  const handleMonthChange = (newMonth: Date) => {
    if (onMonthChange) {
      onMonthChange(newMonth)
    } else {
      setInternalMonth(newMonth)
    }
  }

  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  ).getDay()

  const previousMonth = () => {
    const newMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1)
    handleMonthChange(newMonth)
  }

  const nextMonth = () => {
    const newMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    handleMonthChange(newMonth)
  }

  const isSelected = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    if (mode === "single" && selected instanceof Date) {
      return (
        date.getDate() === selected.getDate() &&
        date.getMonth() === selected.getMonth() &&
        date.getFullYear() === selected.getFullYear()
      )
    }
    if (mode === "multiple" && Array.isArray(selected)) {
      return selected.some(
        (d) =>
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
      )
    }
    return false
  }

  const handleDayClick = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day)

    if (disabled && disabled(date)) {
      return
    }

    if (mode === "single") {
      onSelect?.(date)
    } else if (mode === "multiple" && Array.isArray(selected)) {
      const isAlreadySelected = selected.some(
        (d) =>
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
      )
      if (isAlreadySelected) {
        onSelect?.(selected.filter((d) => !(
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        )))
      } else {
        onSelect?.([...selected, date])
      }
    }
  }

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    const isDisabled = disabled ? disabled(date) : false
    days.push(
      <Button
        key={day}
        variant={isSelected(day) ? "default" : "ghost"}
        className={cn(
          "h-9 w-9 p-0 font-normal",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => handleDayClick(day)}
        disabled={isDisabled}
      >
        {day}
      </Button>
    )
  }

  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={previousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="h-9 w-9 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
