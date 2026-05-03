"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRightLeft, Award, TrendingUp } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

interface GradeData {
  apcGrade: number | string
  upGrade: number
  letterGrade: string
  percentageMin: number
  percentageMax: number
  description: string
  honorsLevel?: string
}

const gradeConversionTable: GradeData[] = [
  { apcGrade: 4.0, upGrade: 1.0, letterGrade: "A", percentageMin: 95, percentageMax: 100, description: "Excellent", honorsLevel: "Summa Cum Laude" },
  { apcGrade: 3.5, upGrade: 1.25, letterGrade: "A-", percentageMin: 94, percentageMax: 94, description: "Excellent", honorsLevel: "Magna Cum Laude" },
  { apcGrade: 3.0, upGrade: 1.5, letterGrade: "B+", percentageMin: 91, percentageMax: 93, description: "Very Good", honorsLevel: "Cum Laude" },
  { apcGrade: 2.75, upGrade: 1.75, letterGrade: "B", percentageMin: 88, percentageMax: 90, description: "Very Good" },
  { apcGrade: 2.5, upGrade: 2.0, letterGrade: "B-", percentageMin: 86, percentageMax: 87, description: "Good" },
  { apcGrade: 2.25, upGrade: 2.25, letterGrade: "C+", percentageMin: 83, percentageMax: 85, description: "Good" },
  { apcGrade: 2.0, upGrade: 2.5, letterGrade: "C", percentageMin: 80, percentageMax: 82, description: "Satisfactory" },
  { apcGrade: 1.75, upGrade: 2.75, letterGrade: "C-", percentageMin: 77, percentageMax: 79, description: "Satisfactory" },
  { apcGrade: 1.0, upGrade: 3.0, letterGrade: "D", percentageMin: 75, percentageMax: 76, description: "Pass" },
  { apcGrade: 0.0, upGrade: 4.0, letterGrade: "F", percentageMin: 0, percentageMax: 74, description: "Conditional" },
  { apcGrade: "R", upGrade: 5.0, letterGrade: "F", percentageMin: 0, percentageMax: 69, description: "Fail" },
]

export default function GradeConverterPage() {
  const [apcInput, setApcInput] = useState<string>("")
  const [upInput, setUpInput] = useState<string>("")
  const [percentageInput, setPercentageInput] = useState<string>("")
  const [convertedResult, setConvertedResult] = useState<GradeData | null>(null)
  const [inputType, setInputType] = useState<"apc" | "up" | "percentage" | null>(null)

  const findGradeByAPC = (grade: number | string): GradeData | null => {
    // Handle special grades
    if (typeof grade === "string") {
      if (grade.toUpperCase() === "R") {
        return { apcGrade: "R", upGrade: 5.0, letterGrade: "F", percentageMin: 0, percentageMax: 69, description: "Fail" }
      }
      return null
    }

    if (grade < 0) return null
    if (grade > 4.0) grade = 4.0
    
    // Find exact match or closest match
    let closest: GradeData | null = null
    let closestDiff = Infinity
    
    for (const row of gradeConversionTable) {
      if (typeof row.apcGrade === "number") {
        const diff = Math.abs(row.apcGrade - grade)
        if (diff < closestDiff) {
          closestDiff = diff
          closest = row
        }
      }
    }
    
    return closest
  }

  const findGradeByUP = (grade: number): GradeData | null => {
    if (grade < 1.0 || grade > 5.0) return null
    
    // Handle special grades
    if (grade === 4.0) {
      return { apcGrade: 0.0, upGrade: 4.0, letterGrade: "F", percentageMin: 0, percentageMax: 74, description: "Conditional" }
    }
    if (grade === 5.0) {
      return { apcGrade: "R", upGrade: 5.0, letterGrade: "F", percentageMin: 0, percentageMax: 69, description: "Fail" }
    }
    
    // Find exact match or closest match
    let closest: GradeData | null = null
    let closestDiff = Infinity
    
    for (const row of gradeConversionTable) {
      const diff = Math.abs(row.upGrade - grade)
      if (diff < closestDiff) {
        closestDiff = diff
        closest = row
      }
    }
    
    return closest
  }

  const findGradeByPercentage = (percentage: number): GradeData | null => {
    if (percentage < 0 || percentage > 100) return null
    
    for (const grade of gradeConversionTable) {
      if (percentage >= grade.percentageMin && percentage <= grade.percentageMax) {
        return grade
      }
    }
    
    return null
  }

  const handleApcConvert = () => {
    // Handle special grades
    if (apcInput.toUpperCase() === 'R') {
      const result = { apcGrade: "R", upGrade: 5.0, letterGrade: "F", percentageMin: 0, percentageMax: 69, description: "Fail" }
      setConvertedResult(result)
      setInputType("apc")
      setUpInput('5.0')
      setPercentageInput('< 70%')
      return
    }
    
    const grade = parseFloat(apcInput)
    if (isNaN(grade) || grade < 0 || grade > 4.0) {
      setConvertedResult(null)
      return
    }
    const result = findGradeByAPC(grade)
    setConvertedResult(result)
    setInputType("apc")
    if (result) {
      setUpInput(result.upGrade.toString())
      setPercentageInput(`${result.percentageMin}-${result.percentageMax}%`)
    }
  }

  const handleUpConvert = () => {
    const grade = parseFloat(upInput)
    if (isNaN(grade)) {
      setConvertedResult(null)
      return
    }
    const result = findGradeByUP(grade)
    setConvertedResult(result)
    setInputType("up")
    if (result) {
      setApcInput(result.apcGrade.toString())
      setPercentageInput(`${result.percentageMin}-${result.percentageMax}%`)
    }
  }

  const handlePercentageConvert = () => {
    const percentage = parseFloat(percentageInput)
    if (isNaN(percentage)) {
      setConvertedResult(null)
      return
    }
    const result = findGradeByPercentage(percentage)
    setConvertedResult(result)
    setInputType("percentage")
    if (result) {
      setApcInput(result.apcGrade.toString())
      setUpInput(result.upGrade.toString())
    }
  }

  const clearAll = () => {
    setApcInput("")
    setUpInput("")
    setPercentageInput("")
    setConvertedResult(null)
    setInputType(null)
  }

  const getDescriptionColor = (description: string): string => {
    const colors: Record<string, string> = {
      "Excellent": "text-green-600 dark:text-green-400",
      "Very Good": "text-emerald-600 dark:text-emerald-400",
      "Good": "text-blue-600 dark:text-blue-400",
      "Satisfactory": "text-teal-600 dark:text-teal-400",
      "Pass": "text-orange-600 dark:text-orange-400",
      "Conditional": "text-yellow-600 dark:text-yellow-400",
      "Fail": "text-red-600 dark:text-red-400",
    }
    return colors[description] || "text-muted-foreground"
  }

  const getHonorsBadge = (honorsLevel?: string) => {
    if (!honorsLevel) return null
    
    const badgeColors: Record<string, string> = {
      "Summa Cum Laude": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-300 dark:border-amber-700",
      "Magna Cum Laude": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border-purple-300 dark:border-purple-700",
      "Cum Laude": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-300 dark:border-blue-700",
    }

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeColors[honorsLevel]}`}>
        <Award className="h-3.5 w-3.5" />
        {honorsLevel}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-sm text-muted-foreground">Grade Converter</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-normal text-foreground mb-4">
            Grade Converter
          </h1>
          <p className="text-muted-foreground text-lg">
            Convert between APC (US-based), UP (Philippine-based), and Percentage grades
          </p>
        </div>

        {/* Converter Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Convert Your Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {/* APC Grade Input */}
                <div className="space-y-2">
                  <Label htmlFor="apcInput">APC Grade (0.0 - 4.0, R)</Label>
                  <Input
                    id="apcInput"
                    type="text"
                    placeholder="e.g., 3.5 or R"
                    value={apcInput}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      // Allow only numbers 0-4, decimals, and R
                      if (value === '' || value === 'R' || value === 'A.W.' || /^[0-4](\.\d{0,2})?$/.test(value)) {
                        setApcInput(value)
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApcConvert()}
                    autoComplete="off"
                  />
                  <Button 
                    onClick={handleApcConvert} 
                    className="w-full"
                    variant="outline"
                  >
                    Convert from APC
                  </Button>
                </div>

                {/* UP Grade Input */}
                <div className="space-y-2">
                  <Label htmlFor="upInput">UP Grade (1.0 - 5.0)</Label>
                  <Input
                    id="upInput"
                    type="text"
                    placeholder="e.g., 1.25"
                    value={upInput}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow only numbers 1-5 with decimals
                      if (value === '' || /^[1-5](\.\d{0,2})?$/.test(value)) {
                        setUpInput(value)
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpConvert()}
                    autoComplete="off"
                  />
                  <Button 
                    onClick={handleUpConvert} 
                    className="w-full"
                    variant="outline"
                  >
                    Convert from UP
                  </Button>
                </div>

                {/* Percentage Input */}
                <div className="space-y-2">
                  <Label htmlFor="percentageInput">Percentage (0 - 100)</Label>
                  <Input
                    id="percentageInput"
                    type="text"
                    placeholder="e.g., 95"
                    value={percentageInput}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow only numbers 0-100
                      if (value === '' || (/^\d{0,3}$/.test(value) && parseInt(value || '0') <= 100)) {
                        setPercentageInput(value)
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePercentageConvert()}
                    autoComplete="off"
                  />
                  <Button 
                    onClick={handlePercentageConvert} 
                    className="w-full"
                    variant="outline"
                  >
                    Convert from %
                  </Button>
                </div>
              </div>

              {/* Conversion Result */}
              {convertedResult && (
                <div className="mt-8 p-6 bg-muted/50 rounded-lg border-2 border-primary/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Conversion Result</h3>
                      <p className="text-sm text-muted-foreground">
                        Based on {inputType === "apc" ? "APC" : inputType === "up" ? "UP" : "Percentage"} grade input
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                      Clear
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">APC Grade (US-based)</p>
                        <p className="text-3xl font-bold">{convertedResult.apcGrade}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">UP Grade (Philippine-based)</p>
                        <p className="text-3xl font-bold">{convertedResult.upGrade}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Percentage Range</p>
                        <p className="text-3xl font-bold">
                          {convertedResult.percentageMin === 0 && convertedResult.percentageMax === 0
                            ? "—"
                            : convertedResult.percentageMin === convertedResult.percentageMax
                            ? `${convertedResult.percentageMin}%`
                            : `${convertedResult.percentageMin}–${convertedResult.percentageMax}%`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className={`text-2xl font-bold ${getDescriptionColor(convertedResult.description)}`}>
                          {convertedResult.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Honors Badge */}
                  {convertedResult.honorsLevel && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Honors Eligibility:</span>
                        {getHonorsBadge(convertedResult.honorsLevel)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comparison Chart */}
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-muted-foreground mb-2 italic">
            * Based on Asia Pacific College&apos;s Student Handbook
          </p>
          <Card>
            <CardHeader>
              <CardTitle>Grade Conversion Reference Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left p-3 font-semibold">APC Grade (US-Based)</th>
                      <th className="text-left p-3 font-semibold">Letter Grade</th>
                      <th className="text-left p-3 font-semibold">UP Grade (1.0–5.0)</th>
                      <th className="text-left p-3 font-semibold">Percentage</th>
                      <th className="text-left p-3 font-semibold">Description</th>
                      <th className="text-left p-3 font-semibold">Honors Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeConversionTable.map((grade, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3 font-medium">{typeof grade.apcGrade === "number" ? grade.apcGrade.toFixed(1) : grade.apcGrade}</td>
                        <td className="p-3 font-medium">{grade.letterGrade}</td>
                        <td className="p-3 font-medium">{grade.upGrade.toFixed(2)}</td>
                        <td className="p-3">
                          {`${grade.percentageMin}–${grade.percentageMax}%`}
                        </td>
                        <td className="p-3">
                          <span className={`font-semibold ${getDescriptionColor(grade.description)}`}>
                            {grade.description}
                          </span>
                        </td>
                        <td className="p-3">
                          {grade.honorsLevel ? getHonorsBadge(grade.honorsLevel) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Additional Information */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Honors Requirements
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><span className="font-semibold text-amber-600 dark:text-amber-400">Summa Cum Laude:</span> 4.0 APC / 1.00 UP (95–100%)</li>
                  <li><span className="font-semibold text-purple-600 dark:text-purple-400">Magna Cum Laude:</span> 3.5 APC / 1.25 UP (94–94%)</li>
                  <li><span className="font-semibold text-blue-600 dark:text-blue-400">Cum Laude:</span> 3.0 APC / 1.50 UP (91–93%)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="border-t pt-8 mt-16">
          <p className="text-center text-xs text-muted-foreground">
            Created by the Developers of JPCS - APC | Edwin Gumba Jr. (SS221) & Marwin John Gonzales (IT241)
          </p>
        </footer>
      </main>
    </div>
  )
}
