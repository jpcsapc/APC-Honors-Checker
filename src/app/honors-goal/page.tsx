"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Target, TrendingUp, Award, Info, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// ── Latin Honor Tiers ──
const HONOR_TIERS = [
  { key: "summa",      label: "Summa Cum Laude",     min: 3.80, max: 4.00, color: "text-amber-600 dark:text-amber-400" },
  { key: "magna",      label: "Magna Cum Laude",     min: 3.60, max: 3.79, color: "text-blue-600 dark:text-blue-400" },
  { key: "cum",        label: "Cum Laude",           min: 3.40, max: 3.59, color: "text-emerald-600 dark:text-emerald-400" },
  { key: "distinction", label: "Academic Distinction", min: 3.00, max: 3.39, color: "text-violet-600 dark:text-violet-400" },
] as const

type HonorKey = typeof HONOR_TIERS[number]["key"]

const TOTAL_YEARS = 4

interface YearGPA {
  gpa: string
  locked: boolean  // true = already completed, false = future
}

interface GoalResult {
  requiredGPA: number
  possible: boolean
  targetHonor: string
  targetMin: number
  remainingYears: number
  currentAvg: number
  completedYears: number
}

// ── Truncation helper (matches the main honors calculator) ──
function truncateToDecimals(num: number, decimals: number) {
  const factor = Math.pow(10, decimals)
  return Math.trunc(num * factor) / factor
}

export default function HonorsGoalPage() {
  const [selectedHonor, setSelectedHonor] = React.useState<HonorKey>("magna")
  const [currentYear, setCurrentYear] = React.useState<number>(2) // "I am a 2nd year" → Year 1 is completed
  const [yearGPAs, setYearGPAs] = React.useState<YearGPA[]>([
    { gpa: "", locked: true },
    { gpa: "", locked: false },
    { gpa: "", locked: false },
    { gpa: "", locked: false },
  ])
  const [result, setResult] = React.useState<GoalResult | null>(null)
  const [showHowItWorks, setShowHowItWorks] = React.useState(false)

  // When currentYear changes, update which year GPAs are locked (completed) vs open (future)
  React.useEffect(() => {
    setYearGPAs(prev => prev.map((y, i) => ({
      ...y,
      locked: i < currentYear - 1, // years before current are completed
      // Clear GPA for future years when switching
      gpa: i < currentYear - 1 ? y.gpa : "",
    })))
    setResult(null)
  }, [currentYear])

  const handleGPAChange = (index: number, value: string) => {
    // Allow empty, or valid decimal numbers 0-4
    if (value === "" || (/^\d*\.?\d*$/.test(value) && (parseFloat(value) <= 4.0 || value.endsWith(".")))) {
      setYearGPAs(prev => {
        const next = [...prev]
        next[index] = { ...next[index], gpa: value }
        return next
      })
    }
  }

  const calculate = () => {
    const tier = HONOR_TIERS.find(t => t.key === selectedHonor)
    if (!tier) return

    // Gather completed years with valid GPAs
    const completedYears: number[] = []
    for (let i = 0; i < currentYear - 1; i++) {
      const val = parseFloat(yearGPAs[i].gpa)
      if (!isNaN(val) && val >= 0 && val <= 4.0) {
        completedYears.push(val)
      }
    }

    if (completedYears.length === 0) {
      // No completed year data — treat as all future
      const requiredGPA = tier.min
      setResult({
        requiredGPA,
        possible: requiredGPA <= 4.0,
        targetHonor: tier.label,
        targetMin: tier.min,
        remainingYears: TOTAL_YEARS,
        currentAvg: 0,
        completedYears: 0,
      })
      return
    }

    const sumPast = completedYears.reduce((a, b) => a + b, 0)
    const remaining = TOTAL_YEARS - completedYears.length
    const requiredGPA = remaining > 0
      ? (TOTAL_YEARS * tier.min - sumPast) / remaining
      : 0 // all years completed — nothing remaining

    const currentAvg = sumPast / completedYears.length

    setResult({
      requiredGPA: truncateToDecimals(requiredGPA, 4),
      possible: requiredGPA <= 4.0 && requiredGPA >= 0,
      targetHonor: tier.label,
      targetMin: tier.min,
      remainingYears: remaining,
      currentAvg: truncateToDecimals(currentAvg, 4),
      completedYears: completedYears.length,
    })
  }

  const completedCount = yearGPAs.filter((y, i) => i < currentYear - 1 && y.gpa.trim() !== "").length
  const hasInput = completedCount > 0 || currentYear === 1

  return (
    <div className="min-h-screen bg-background">
      <Header title="Honor Goal Calculator" backHref="/" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="mb-12 pl-6 border-l-[3px] border-primary">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-medium tracking-tight text-foreground leading-tight">
              Honor Goal Calculator
            </h1>
          </div>
          <p className="mt-3 text-lg text-muted-foreground max-w-lg">
            Find out what grades you need in your remaining years to achieve your target Latin Honor.
          </p>
        </section>

        {/* Step 1: Select Latin Honor Target */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Step 1: Choose Your Goal
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {HONOR_TIERS.map(tier => (
                <button
                  key={tier.key}
                  onClick={() => { setSelectedHonor(tier.key); setResult(null) }}
                  className={cn(
                    "relative p-4 rounded-lg border-2 text-center transition-all duration-200",
                    "hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    selectedHonor === tier.key
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-border bg-card"
                  )}
                >
                  {selectedHonor === tier.key && (
                    <motion.div
                      layoutId="honor-indicator"
                      className="absolute inset-0 rounded-lg border-2 border-primary"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <p className={cn("text-sm font-semibold mb-1", tier.color)}>{tier.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {tier.min.toFixed(2)} – {tier.max.toFixed(2)} GPA
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Current Year */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Step 2: Where Are You Now?
            </h2>
            <div className="mb-5">
              <Label className="text-sm text-muted-foreground mb-2 block">
                I am currently a:
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(year => (
                  <button
                    key={year}
                    onClick={() => setCurrentYear(year)}
                    className={cn(
                      "py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all duration-200",
                      "hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      currentYear === year
                        ? "border-primary bg-primary/5 dark:bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {year === 1 ? "1st" : year === 2 ? "2nd" : year === 3 ? "3rd" : "4th"} Year
                  </button>
                ))}
              </div>
            </div>

            {/* Year GPA Inputs (for completed years only) */}
            {currentYear > 1 && (
              <div className="space-y-4 mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Enter your yearly GPA for each completed year:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {yearGPAs.map((y, i) => {
                    if (i >= currentYear - 1) return null // only show completed years
                    return (
                      <div key={i} className="space-y-1.5">
                        <Label htmlFor={`year-gpa-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">
                          Year {i + 1} GPA
                        </Label>
                        <Input
                          id={`year-gpa-${i}`}
                          type="text"
                          placeholder="e.g. 3.50"
                          value={y.gpa}
                          onChange={e => handleGPAChange(i, e.target.value)}
                          autoComplete="off"
                          className="text-center"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calculate Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={calculate}
            disabled={currentYear > 1 && !hasInput}
            className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform text-sm font-semibold"
          >
            <Target className="h-4 w-4 mr-2" />
            Calculate Required GPA
          </Button>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={`${result.targetHonor}-${result.requiredGPA}`}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Card className={cn(
                "shadow-md border-2 mb-8",
                result.possible
                  ? "border-primary/30"
                  : "border-red-400/40 dark:border-red-600/40"
              )}>
                <CardContent className="pt-6">
                  {/* Verdict */}
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      To graduate with <span className="font-semibold text-foreground">{result.targetHonor}</span>
                      {result.completedYears > 0 && (
                        <> (current avg: <span className="font-semibold text-foreground">{result.currentAvg.toFixed(4)}</span>)</>
                      )}
                    </p>

                    {result.possible ? (
                      <>
                        <p className="text-5xl font-bold text-foreground tracking-tight mb-1">
                          {result.requiredGPA.toFixed(4)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          required average GPA across your remaining{" "}
                          <span className="font-semibold text-foreground">
                            {result.remainingYears} year{result.remainingYears !== 1 ? "s" : ""}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-4xl font-bold text-red-500 dark:text-red-400 tracking-tight mb-2">
                          Not Possible
                        </p>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Based on your current grades, you would need a GPA of{" "}
                          <span className="font-semibold text-foreground">{result.requiredGPA.toFixed(4)}</span>{" "}
                          for the remaining {result.remainingYears} year{result.remainingYears !== 1 ? "s" : ""},{" "}
                          which exceeds the maximum possible GPA of 4.00.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Feasibility Gauge */}
                  {result.possible && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-3 text-center">
                        Difficulty
                      </p>
                      <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "absolute top-0 left-0 h-full rounded-full",
                            result.requiredGPA <= 3.0 ? "bg-emerald-500" :
                            result.requiredGPA <= 3.5 ? "bg-amber-500" :
                            result.requiredGPA <= 3.8 ? "bg-orange-500" :
                            "bg-red-500"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((result.requiredGPA / 4.0) * 100, 100)}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground">Comfortable</span>
                        <span className="text-[10px] text-muted-foreground">Very Challenging</span>
                      </div>
                    </div>
                  )}

                  {/* What-If Breakdown: show all honor tiers */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-3 text-center">
                      What-If: All Honor Tiers
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {HONOR_TIERS.map(tier => {
                        const sumPast = (() => {
                          let s = 0
                          for (let i = 0; i < currentYear - 1; i++) {
                            const v = parseFloat(yearGPAs[i].gpa)
                            if (!isNaN(v)) s += v
                          }
                          return s
                        })()
                        const remaining = TOTAL_YEARS - result.completedYears
                        const needed = remaining > 0
                          ? truncateToDecimals((TOTAL_YEARS * tier.min - sumPast) / remaining, 4)
                          : 0
                        const isPossible = needed <= 4.0 && needed >= 0

                        return (
                          <div
                            key={tier.key}
                            className={cn(
                              "p-3 rounded-lg border text-center",
                              isPossible ? "bg-card" : "bg-muted/40 opacity-60",
                              tier.key === selectedHonor && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            )}
                          >
                            <p className={cn("text-xs font-semibold mb-0.5", tier.color)}>{tier.label}</p>
                            <p className="text-lg font-bold text-foreground">
                              {isPossible ? needed.toFixed(2) : "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {isPossible ? "GPA needed" : "Not reachable"}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How It Works — collapsible */}
        <div className="mb-8">
          <button
            onClick={() => setShowHowItWorks(prev => !prev)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            <Info className="h-4 w-4" />
            How does this work?
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              showHowItWorks && "rotate-180"
            )} />
          </button>
          <AnimatePresence>
            {showHowItWorks && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <Card className="mt-4 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                      <p>
                        This calculator uses the <strong className="text-foreground">simple year-average method</strong>, which is consistent
                        with how the main College Grades Calculator computes CGPA. Each academic year carries equal weight (25%),
                        regardless of how many units you take.
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border space-y-2">
                        <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Formula</p>
                        <p>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            Required GPA = (4 × Target CGPA − Sum of Completed Year GPAs) ÷ Remaining Years
                          </code>
                        </p>
                      </div>
                      <p>
                        <strong className="text-foreground">Example:</strong> A 3rd-year student with Year 1 GPA = 3.20 and Year 2 GPA = 3.40
                        targeting Magna Cum Laude (3.60):
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <p className="text-xs">
                          Required = (4 × 3.60 − 6.60) ÷ 2 = <strong className="text-foreground">3.90</strong> per year
                        </p>
                      </div>
                      <p className="text-xs italic text-muted-foreground/80">
                        Note: This is an approximation. The actual CGPA calculation may differ slightly depending on credit-weighted computations. Use the main College Grades Calculator for the most precise results.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  )
}
