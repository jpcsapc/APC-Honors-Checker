"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Target, TrendingUp, Award, Info, ChevronDown, GraduationCap, School } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// ── College Latin Honor Tiers ──
const COLLEGE_TIERS = [
  { key: "summa", label: "Summa Cum Laude", min: 3.80, max: 4.00, color: "text-amber-600 dark:text-amber-400" },
  { key: "magna", label: "Magna Cum Laude", min: 3.60, max: 3.79, color: "text-blue-600 dark:text-blue-400" },
  { key: "cum", label: "Cum Laude", min: 3.40, max: 3.59, color: "text-emerald-600 dark:text-emerald-400" },
  { key: "distinction", label: "Academic Distinction", min: 3.00, max: 3.39, color: "text-violet-600 dark:text-violet-400" },
] as const

// ── SHS Honor Tiers ──
const SHS_TIERS = [
  { key: "highest", label: "With Highest Honors", min: 97.00, max: 100.00, color: "text-amber-600 dark:text-amber-400" },
  { key: "high", label: "With High Honors", min: 93.00, max: 96.99, color: "text-blue-600 dark:text-blue-400" },
  { key: "honors", label: "With Honors", min: 88.00, max: 92.99, color: "text-emerald-600 dark:text-emerald-400" },
] as const

type Mode = "college" | "shs"

interface GoalResult {
  requiredGrade: number
  possible: boolean
  targetHonor: string
  targetMin: number
  remainingYears: number
  currentAvg: number
  completedYears: number
}

function truncateToDecimals(num: number, decimals: number) {
  const factor = Math.pow(10, decimals)
  return Math.trunc(num * factor) / factor
}

export default function HonorsGoalPage() {
  const [mode, setMode] = React.useState<Mode>("college")

  // ── College State ──
  const [collegeHonor, setCollegeHonor] = React.useState<string>("magna")
  const [collegeYear, setCollegeYear] = React.useState(2)
  const [collegeGPAs, setCollegeGPAs] = React.useState(["", "", "", ""])

  // ── SHS State ──
  const [shsHonor, setShsHonor] = React.useState<string>("high")
  const [shsYear, setShsYear] = React.useState(2) // 1 = Grade 11, 2 = Grade 12
  const [shsAverages, setShsAverages] = React.useState(["", ""])

  const [result, setResult] = React.useState<GoalResult | null>(null)
  const [showHowItWorks, setShowHowItWorks] = React.useState(false)

  // Reset result on mode switch
  React.useEffect(() => { setResult(null) }, [mode])

  // Derived config based on mode
  const isCollege = mode === "college"
  const tiers = isCollege ? COLLEGE_TIERS : SHS_TIERS
  const selectedHonor = isCollege ? collegeHonor : shsHonor
  const totalYears = isCollege ? 4 : 2
  const currentYear = isCollege ? collegeYear : shsYear
  const maxGrade = isCollege ? 4.0 : 100.0
  const gradeUnit = isCollege ? "GPA" : "%"
  const gradeDecimals = isCollege ? 4 : 2

  const grades = isCollege ? collegeGPAs : shsAverages
  const setGrades = isCollege
    ? (fn: (prev: string[]) => string[]) => setCollegeGPAs(fn)
    : (fn: (prev: string[]) => string[]) => setShsAverages(fn)

  const yearLabels = isCollege
    ? ["Year 1", "Year 2", "Year 3", "Year 4"]
    : ["Grade 11", "Grade 12"]

  const yearButtonLabels = isCollege
    ? ["1st Year", "2nd Year", "3rd Year", "4th Year"]
    : ["Grade 11", "Grade 12"]

  const handleGradeChange = (index: number, value: string) => {
    if (value === "" || (/^\d*\.?\d*$/.test(value) && (parseFloat(value) <= maxGrade || value.endsWith(".")))) {
      setGrades(prev => {
        const next = [...prev]
        next[index] = value
        return next
      })
    }
  }

  const handleYearChange = (year: number) => {
    if (isCollege) setCollegeYear(year)
    else setShsYear(year)
    setResult(null)
  }

  const handleHonorChange = (key: string) => {
    if (isCollege) setCollegeHonor(key)
    else setShsHonor(key)
    setResult(null)
  }

  const calculate = () => {
    const tier = tiers.find(t => t.key === selectedHonor)
    if (!tier) return

    const completed: number[] = []
    for (let i = 0; i < currentYear - 1; i++) {
      const val = parseFloat(grades[i])
      if (!isNaN(val) && val >= 0 && val <= maxGrade) completed.push(val)
    }

    if (completed.length === 0) {
      setResult({
        requiredGrade: tier.min, possible: tier.min <= maxGrade,
        targetHonor: tier.label, targetMin: tier.min,
        remainingYears: totalYears, currentAvg: 0, completedYears: 0,
      })
      return
    }

    const sumPast = completed.reduce((a, b) => a + b, 0)
    const remaining = totalYears - completed.length
    const required = remaining > 0 ? (totalYears * tier.min - sumPast) / remaining : 0
    const currentAvg = sumPast / completed.length

    setResult({
      requiredGrade: truncateToDecimals(required, gradeDecimals),
      possible: required <= maxGrade && required >= 0,
      targetHonor: tier.label, targetMin: tier.min,
      remainingYears: remaining,
      currentAvg: truncateToDecimals(currentAvg, gradeDecimals),
      completedYears: completed.length,
    })
  }

  const completedCount = grades.filter((g, i) => i < currentYear - 1 && g.trim() !== "").length
  const hasInput = completedCount > 0 || currentYear === 1

  const pageTitle = isCollege ? "Latin Goal Calculator" : "Honor Goal Calculator"
  const pageDesc = isCollege
    ? "Find out what grades you need in your remaining years to achieve your target Latin Honor."
    : "Find out what general average you need in your remaining year to achieve your target Academic Excellence Award."

  // Difficulty gauge thresholds
  const getDifficultyColor = (val: number) => {
    if (isCollege) {
      if (val <= 3.0) return "bg-emerald-500"
      if (val <= 3.5) return "bg-amber-500"
      if (val <= 3.8) return "bg-orange-500"
      return "bg-red-500"
    }
    if (val <= 88) return "bg-emerald-500"
    if (val <= 93) return "bg-amber-500"
    if (val <= 97) return "bg-orange-500"
    return "bg-red-500"
  }

  const disclaimer = isCollege
    ? <>Note: Graduation honors also require no failing grades (0.0), no more than 6 R grades, and 70% residency at APC (Section 4.2.2). Use the <a href="/honors" className="underline hover:text-foreground">College Grades Calculator</a> for full eligibility checks.</>
    : <>Note: Academic Excellence Awards also require no final subject grade lower than 85.00 in any subject (DepEd Order No. 36, s. 2016). Use the <a href="/honors-shs" className="underline hover:text-foreground">SHS Grades Calculator</a> for full eligibility checks.</>

  return (
    <div className="min-h-screen bg-background">
      <Header title={pageTitle} backHref="/" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="mb-10 pl-6 border-l-[3px] border-primary">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-8 w-8 text-primary" />
            <AnimatePresence mode="wait">
              <motion.h1
                key={pageTitle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-4xl font-medium tracking-tight text-foreground leading-tight"
              >
                {pageTitle}
              </motion.h1>
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-lg text-muted-foreground max-w-lg"
            >
              {pageDesc}
            </motion.p>
          </AnimatePresence>
        </section>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
            <button
              onClick={() => setMode("college")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                mode === "college"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GraduationCap className="h-4 w-4" />
              College
            </button>
            <button
              onClick={() => setMode("shs")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                mode === "shs"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <School className="h-4 w-4" />
              Senior High School
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 1: Choose Goal */}
            <Card className="mb-6 shadow-sm">
              <CardContent className="pt-6">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Step 1: Choose Your Goal
                </h2>
                <div className={cn("grid gap-3", tiers.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4")}>
                  {tiers.map(tier => (
                    <button
                      key={tier.key}
                      onClick={() => handleHonorChange(tier.key)}
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
                          layoutId={`honor-indicator-${mode}`}
                          className="absolute inset-0 rounded-lg border-2 border-primary"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <p className={cn("text-sm font-semibold mb-1", tier.color)}>{tier.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {tier.min.toFixed(2)} – {tier.max.toFixed(2)} {gradeUnit}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Where Are You Now? */}
            <Card className="mb-6 shadow-sm">
              <CardContent className="pt-6">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Step 2: Where Are You Now?
                </h2>
                <div className="mb-5">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    {isCollege ? "I am currently a:" : "I am currently in:"}
                  </Label>
                  <div className={cn("grid gap-3", isCollege ? "grid-cols-4" : "grid-cols-2")}>
                    {yearButtonLabels.map((label, i) => (
                      <button
                        key={i}
                        onClick={() => handleYearChange(i + 1)}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all duration-200",
                          "hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                          currentYear === i + 1
                            ? "border-primary bg-primary/5 dark:bg-primary/10 text-foreground"
                            : "border-border bg-card text-muted-foreground"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {currentYear > 1 && (
                  <div className="space-y-4 mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Enter your {isCollege ? "yearly GPA" : "general average"} for each completed year:
                    </p>
                    <div className={cn("grid gap-4", isCollege ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1")}>
                      {grades.map((g, i) => {
                        if (i >= currentYear - 1) return null
                        return (
                          <div key={i} className="space-y-1.5">
                            <Label htmlFor={`grade-${mode}-${i}`} className="text-xs font-semibold text-muted-foreground uppercase">
                              {yearLabels[i]} {isCollege ? "GPA" : "Average"}
                            </Label>
                            <Input
                              id={`grade-${mode}-${i}`}
                              type="text"
                              placeholder={isCollege ? "e.g. 3.50" : "e.g. 90.50"}
                              value={g}
                              onChange={e => handleGradeChange(i, e.target.value)}
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

            {/* Calculate */}
            <div className="flex justify-center mb-8">
              <Button
                onClick={calculate}
                disabled={currentYear > 1 && !hasInput}
                className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform text-sm font-semibold"
              >
                <Target className="h-4 w-4 mr-2" />
                Calculate Required {isCollege ? "GPA" : "Average"}
              </Button>
            </div>

            {/* Result */}
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={`${result.targetHonor}-${result.requiredGrade}`}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <Card className={cn(
                    "shadow-md border-2 mb-8",
                    result.possible ? "border-primary/30" : "border-red-400/40 dark:border-red-600/40"
                  )}>
                    <CardContent className="pt-6">
                      <div className="text-center mb-6">
                        <p className="text-sm text-muted-foreground mb-2">
                          To graduate with <span className="font-semibold text-foreground">{result.targetHonor}</span>
                          {result.completedYears > 0 && (
                            <> (current avg: <span className="font-semibold text-foreground">{result.currentAvg.toFixed(gradeDecimals)}{!isCollege && "%"}</span>)</>
                          )}
                        </p>

                        {result.possible ? (
                          <>
                            <p className="text-5xl font-bold text-foreground tracking-tight mb-1">
                              {result.requiredGrade.toFixed(gradeDecimals)}{!isCollege && "%"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              required average {isCollege ? "GPA" : "general average"} across your remaining{" "}
                              <span className="font-semibold text-foreground">
                                {result.remainingYears} year{result.remainingYears !== 1 ? "s" : ""}
                              </span>
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-4xl font-bold text-red-500 dark:text-red-400 tracking-tight mb-2">Not Possible</p>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                              You would need {isCollege ? "a GPA" : "an average"} of{" "}
                              <span className="font-semibold text-foreground">{result.requiredGrade.toFixed(gradeDecimals)}{!isCollege && "%"}</span>{" "}
                              for the remaining {result.remainingYears} year{result.remainingYears !== 1 ? "s" : ""},{" "}
                              which exceeds the maximum of {maxGrade.toFixed(isCollege ? 2 : 0)}.
                            </p>
                          </>
                        )}
                      </div>

                      {/* Difficulty Gauge */}
                      {result.possible && (
                        <div className="mt-6 pt-6 border-t border-border">
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-3 text-center">Difficulty</p>
                          <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={cn("absolute top-0 left-0 h-full rounded-full", getDifficultyColor(result.requiredGrade))}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((result.requiredGrade / maxGrade) * 100, 100)}%` }}
                              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                            />
                          </div>
                          <div className="flex justify-between mt-1.5">
                            <span className="text-[10px] text-muted-foreground">Comfortable</span>
                            <span className="text-[10px] text-muted-foreground">Very Challenging</span>
                          </div>
                        </div>
                      )}

                      {/* What-If */}
                      <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-3 text-center">
                          What-If: All Honor Tiers
                        </p>
                        <div className={cn("grid gap-3", tiers.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4")}>
                          {tiers.map(tier => {
                            let sumPast = 0
                            for (let i = 0; i < currentYear - 1; i++) {
                              const v = parseFloat(grades[i])
                              if (!isNaN(v)) sumPast += v
                            }
                            const remaining = totalYears - result.completedYears
                            const needed = remaining > 0
                              ? truncateToDecimals((totalYears * tier.min - sumPast) / remaining, gradeDecimals)
                              : 0
                            const isPossible = needed <= maxGrade && needed >= 0

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
                                  {isPossible ? `${needed.toFixed(2)}${!isCollege ? "%" : ""}` : "—"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {isPossible ? `${gradeUnit} needed` : "Not reachable"}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Disclaimer */}
                      <p className="text-[10px] text-muted-foreground/70 text-center mt-6 leading-relaxed max-w-md mx-auto">
                        {disclaimer}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* How It Works */}
        <div className="mb-8">
          <button
            onClick={() => setShowHowItWorks(prev => !prev)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            <Info className="h-4 w-4" />
            How does this work?
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", showHowItWorks && "rotate-180")} />
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
                        This calculator uses the <strong className="text-foreground">simple year-average method</strong>, consistent
                        with the main {isCollege ? "College" : "SHS"} Grades Calculator. Each academic year carries equal weight
                        ({isCollege ? "25%" : "50%"}).
                      </p>
                      <div className="bg-muted/50 p-4 rounded-lg border space-y-2">
                        <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Formula</p>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded block">
                          Required {isCollege ? "GPA" : "Average"} = ({totalYears} × Target {isCollege ? "CGPA" : "Average"} − Sum of Completed Year {isCollege ? "GPAs" : "Averages"}) ÷ Remaining Years
                        </code>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg border space-y-2">
                        <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                          {isCollege ? "Additional Requirements (Section 4.2.2)" : "Additional Requirements (DepEd Order No. 36)"}
                        </p>
                        <ul className="text-xs space-y-1 list-disc pl-4">
                          {isCollege ? (
                            <>
                              <li>No failing grade (0.0) in all courses</li>
                              <li>No more than six (6) &quot;R&quot; or repeat grades</li>
                              <li>Completed 70% or more of curriculum courses at APC</li>
                            </>
                          ) : (
                            <>
                              <li>No final subject grade lower than 85.00 in any subject</li>
                              <li>General Average of at least 88.00</li>
                            </>
                          )}
                        </ul>
                      </div>
                      <p className="text-xs italic text-muted-foreground/80">
                        Note: This is an approximation. Use the main {isCollege ? "College" : "SHS"} Grades Calculator for precise results.
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
