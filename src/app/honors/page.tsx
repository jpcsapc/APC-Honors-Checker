"use client"
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator, Zap } from "lucide-react";
import { TermTable } from '../../components/TermTable';
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";

// Memoized TermTable to prevent unnecessary re-renders
const MemoizedTermTable = React.memo(TermTable);

interface RowData {
  subjectCode: string;
  unit: number;
  grade: string;
  honorPoints: number;
}

interface YearStats {
  gpa: number;
  totalUnits: number;
  rGrades: number;
  eligible: string;
}

// Lite Mode: per-year general averages (3 terms each)
interface LiteYearData {
  term1: string;
  term2: string;
  term3: string;
  units1: string;
  units2: string;
  units3: string;
}

function calcLiteStats(data: LiteYearData, showUnits: boolean): { gpa: number; eligible: string; totalUnits: number } {
  const t1 = parseFloat(data.term1);
  const t2 = parseFloat(data.term2);
  const t3 = parseFloat(data.term3);

  const u1 = parseFloat(data.units1) || 0;
  const u2 = parseFloat(data.units2) || 0;
  const u3 = parseFloat(data.units3) || 0;
  const totalUnits = u1 + u2 + u3;

  const values = [t1, t2, t3].filter(v => !isNaN(v) && v > 0);
  if (values.length === 0) return { gpa: 0, eligible: '-', totalUnits };

  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  let eligible: string;
  if (avg >= 3.0 && avg <= 4.0) {
    if (!showUnits || totalUnits >= 36) eligible = "Yes";
    else eligible = "No, not enough units (need 36)";
  } else {
    eligible = "No";
  }

  return { gpa: avg, eligible, totalUnits };
}

// ── Lite Mode row: Grade input (wider) + Units input (narrow) side by side ──
function LiteTermRow({
  termNum,
  yearKey,
  gradeValue,
  unitsValue,
  onGradeChange,
  onUnitsChange,
  onKeyDown,
  showUnits,
}: {
  termNum: number;
  yearKey: string;
  gradeValue: string;
  unitsValue: string;
  onGradeChange: (v: string) => void;
  onUnitsChange: (v: string) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "grade" | "units",
    termNum: number,
    yearKey: string
  ) => void;
  showUnits: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Term label */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Term {termNum}
      </p>

      {/* Grade + Units side by side */}
      <div className="flex items-end gap-2">
        {/* Grade — wider */}
        <div className="flex flex-col gap-1 flex-1">
          <label
            htmlFor={`lite-${yearKey}-grade-${termNum}`}
            className="text-xs text-muted-foreground font-medium"
          >
            Grade
          </label>
          <input
            id={`lite-${yearKey}-grade-${termNum}`}
            type="number"
            step="0.01"
            min="0"
            max="5"
            value={gradeValue}
            onChange={e => onGradeChange(e.target.value)}
            onKeyDown={e => onKeyDown(e, "grade", termNum, yearKey)}
            placeholder="0.00"
            className="
              w-full rounded-md border border-input bg-background px-3 py-1.5
              text-sm text-foreground shadow-sm
              placeholder:text-muted-foreground/50
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              transition-colors
            "
          />
        </div>

        {/* Units — narrow pill */}
        <AnimatePresence>
          {showUnits && (
            <motion.div
              initial={{ opacity: 0, width: 0, x: 10 }}
              animate={{ opacity: 1, width: 56, x: 0 }}
              exit={{ opacity: 0, width: 0, x: 10 }}
              className="flex flex-col gap-1 overflow-hidden"
            >
              <label
                htmlFor={`lite-${yearKey}-units-${termNum}`}
                className="text-xs text-muted-foreground font-medium whitespace-nowrap"
              >
                Units
              </label>
              <input
                id={`lite-${yearKey}-units-${termNum}`}
                type="number"
                step="1"
                min="0"
                value={unitsValue}
                onChange={e => onUnitsChange(e.target.value)}
                onKeyDown={e => onKeyDown(e, "units", termNum, yearKey)}
                placeholder="0"
                className="
                  w-full rounded-md border border-input bg-background px-2 py-1.5
                  text-sm text-center text-foreground shadow-sm
                  placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  transition-colors
                "
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function HonorsCalcu() {
  const [termsData, setTermsData] = React.useState<Record<string, RowData[]>>({});
  const [liteMode, setLiteMode] = React.useState(true);
  const [showUnits, setShowUnits] = React.useState(false);
  const [liteData, setLiteData] = React.useState<Record<string, LiteYearData>>({
    "Year 1": { term1: "", term2: "", term3: "", units1: "", units2: "", units3: "" },
    "Year 2": { term1: "", term2: "", term3: "", units1: "", units2: "", units3: "" },
    "Year 3": { term1: "", term2: "", term3: "", units1: "", units2: "", units3: "" },
    "Year 4": { term1: "", term2: "", term3: "", units1: "", units2: "", units3: "" },
  });

  const termsDataRef = React.useRef(termsData);
  termsDataRef.current = termsData;

  // Load persisted data – falls back to the old Latin Honors page data for one-time migration
  React.useEffect(() => {
    try {
      const savedData = localStorage.getItem("honorsTermsData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (typeof parsedData === 'object' && !Array.isArray(parsedData) && parsedData !== null) {
          setTermsData(parsedData);
        }
      } else {
        // One-time migration: import data entered on the old Latin Honors page
        const legacyData = localStorage.getItem("latinHonorsTermsData");
        if (legacyData) {
          const parsedData = JSON.parse(legacyData);
          if (typeof parsedData === 'object' && !Array.isArray(parsedData) && parsedData !== null) {
            setTermsData(parsedData);
          }
        }
      }
      const savedLite = localStorage.getItem("honorsLiteData");
      if (savedLite) {
        const parsedLite = JSON.parse(savedLite);
        if (typeof parsedLite === 'object' && parsedLite !== null) {
          setLiteData(parsedLite);
        }
      }
      const savedLiteMode = localStorage.getItem("honorsLiteMode");
      if (savedLiteMode !== null) setLiteMode(JSON.parse(savedLiteMode));
    } catch (error) {
      console.error("Failed to parse honors data from localStorage", error);
    }
  }, []);

  // Persist full mode data
  const persistTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      localStorage.setItem("honorsTermsData", JSON.stringify(termsData));
    }, 300);
    return () => { if (persistTimerRef.current) clearTimeout(persistTimerRef.current); };
  }, [termsData]);

  React.useEffect(() => {
    localStorage.setItem("honorsLiteData", JSON.stringify(liteData));
  }, [liteData]);

  React.useEffect(() => {
    localStorage.setItem("honorsLiteMode", JSON.stringify(liteMode));
  }, [liteMode]);

  const handleTermChange = React.useCallback((term: string, rows: RowData[]) => {
    setTermsData(prev => ({ ...prev, [term]: rows }));
  }, []);

  const handleLiteChange = React.useCallback((year: string, field: keyof LiteYearData, value: string) => {
    setLiteData(prev => ({
      ...prev,
      [year]: { ...prev[year], [field]: value },
    }));
  }, []);

  const handleLiteKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "grade" | "units",
    termNum: number,
    yearKey: string
  ) => {
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!keys.includes(e.key)) return;

    e.preventDefault();

    let nextId = "";

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      if (type === "grade") {
        nextId = `lite-${yearKey}-units-${termNum}`;
      } else if (termNum < 3) {
        nextId = `lite-${yearKey}-grade-${termNum + 1}`;
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      if (type === "units") {
        nextId = `lite-${yearKey}-grade-${termNum}`;
      } else if (termNum > 1) {
        nextId = `lite-${yearKey}-units-${termNum - 1}`;
      }
    }

    if (nextId) {
      const el = document.getElementById(nextId) as HTMLInputElement;
      if (el) { el.focus(); el.select(); }
    }
  };

  const tableLayout = React.useMemo(() => [
    ["Year 1 Term 1", "Year 1 Term 2", "Year 1 Term 3"],
    ["Year 2 Term 1", "Year 2 Term 2", "Year 2 Term 3"],
    ["Year 3 Term 1", "Year 3 Term 2", "Year 3 Term 3"],
    ["Year 4 Term 1", "Year 4 Term 2", "Year 4 Term 3"],
  ], []);

  const handleEdge = (
    direction: "up" | "down" | "left" | "right",
    fromTerm: string,
    fromRow: number,
    fromCol: number
  ) => {
    const termsData = termsDataRef.current;
    const termRowIndex = tableLayout.findIndex(row => row.includes(fromTerm));
    const termColIndex = tableLayout[termRowIndex]?.indexOf(fromTerm) ?? -1;

    let nextTermName = "";
    let nextCellRow = fromRow;
    let nextCellCol = fromCol;

    if (direction === "left" && fromCol === 0) {
      if (termColIndex > 0) { nextTermName = tableLayout[termRowIndex][termColIndex - 1]; nextCellCol = 2; }
    } else if (direction === "right" && fromCol === 2) {
      if (termColIndex < tableLayout[termRowIndex].length - 1) { nextTermName = tableLayout[termRowIndex][termColIndex + 1]; nextCellCol = 0; }
    } else if (direction === "up" && fromRow === 0) {
      if (termRowIndex > 0) { nextTermName = tableLayout[termRowIndex - 1][termColIndex]; const targetRows = termsData[nextTermName] || []; nextCellRow = Math.max(0, targetRows.length - 1); }
    } else if (direction === "down" && fromRow === (termsData[fromTerm]?.length || 0) - 1) {
      if (termRowIndex < tableLayout.length - 1) { nextTermName = tableLayout[termRowIndex + 1][termColIndex]; nextCellRow = 0; }
    }

    if (nextTermName) {
      const nextTermRows = termsData[nextTermName] || [];
      if (nextTermRows.length > 0 && nextCellRow >= nextTermRows.length) nextCellRow = nextTermRows.length - 1;
      if (nextCellRow < 0 || nextTermRows.length === 0) nextCellRow = 0;
      const nextCellId = `cell-${nextTermName}-${nextCellRow}-${nextCellCol}`;
      const targetInput = document.getElementById(nextCellId) as HTMLInputElement;
      if (targetInput) { targetInput.focus(); targetInput.select(); }
    }
  };

  const yearStats = React.useMemo(() => {
    const groupedByYear: Record<string, RowData[][]> = {};
    Object.entries(termsData).forEach(([term, rows]) => {
      if (!Array.isArray(rows)) return;
      const year = term.split(' ').slice(0, 2).join(' ');
      if (!groupedByYear[year]) groupedByYear[year] = [];
      groupedByYear[year].push(rows);
    });

    const nextYearStats: Record<string, YearStats> = {};
    Object.entries(groupedByYear).forEach(([year, termRows]) => {
      const all = termRows.flat();
      const valid = all.filter(row => {
        if (!row) return false;
        const isNatSer = (row.subjectCode || '').toUpperCase().startsWith('NATSER');
        if (isNatSer) return false;
        return row.subjectCode.trim() !== '' && row.grade.trim() !== '' && row.unit > 0;
      });

      if (valid.length === 0) { nextYearStats[year] = { gpa: 0, totalUnits: 0, rGrades: 0, eligible: '-' }; return; }

      const totalHonorPoints = valid.reduce((sum, r) => sum + r.honorPoints, 0);
      const totalUnits = valid.reduce((sum, r) => sum + Number(r.unit), 0);
      const gpa = totalUnits > 0 ? totalHonorPoints / totalUnits : 0;
      const rGrades = valid.filter(r => (r.grade || '').toUpperCase() === 'R').length;

      const hasEnoughUnits = totalUnits >= 36;
      const hasTooManyRs = rGrades > 2;
      let eligible: string;
      if (!hasEnoughUnits) eligible = "No, not enough units (need 36)";
      else if (hasTooManyRs) eligible = "No, more than 2 R grades";
      else if (gpa >= 3.0 && gpa <= 4.0) eligible = "Yes";
      else eligible = "No";

      nextYearStats[year] = { gpa, totalUnits, rGrades, eligible };
    });

    return nextYearStats;
  }, [termsData]);

  // Derive Latin Honors result from per-year stats — same logic as the former Latin Honors page
  const latinHonorsSummary = React.useMemo(() => {
    const yearsWithData = Object.values(yearStats).filter(s => s.totalUnits > 0);
    if (yearsWithData.length === 0) return { overallGPA: "0.00", latinHonor: "-" };

    const rawAverageGPA = yearsWithData.reduce((sum, s) => sum + s.gpa, 0) / yearsWithData.length;
    const totalUnits = yearsWithData.reduce((sum, s) => sum + s.totalUnits, 0);
    const totalRGrades = yearsWithData.reduce((sum, s) => sum + s.rGrades, 0);
    
    // Check for any failing grades (0.0)
    const hasFailingGrade = Object.values(termsDataRef.current).some(term => 
      term.some(row => row.grade === "0.0" || row.grade === "0")
    );

    let latinHonor: string;
    
    // Basic eligibility requirements (use raw GPA for decisions)
    if (rawAverageGPA < 3.0) latinHonor = "No, CGPA below 3.0";
    else if (hasFailingGrade) latinHonor = "No, has failing grade (0.0)";
    else if (totalRGrades > 6) latinHonor = "No, more than 6 R grades";
    // Honors classification (per official APC policy) — raw values, no rounding
    else if (rawAverageGPA >= 3.80) latinHonor = "Summa Cum Laude";
    else if (rawAverageGPA >= 3.60) latinHonor = "Magna Cum Laude";
    else if (rawAverageGPA >= 3.40) latinHonor = "Cum Laude";
    else latinHonor = "Academic Distinction";

    return { overallGPA: truncateToDecimals(rawAverageGPA, 4).toFixed(4), latinHonor };
  }, [yearStats, termsDataRef]);

  const liteStats = React.useMemo(() => {
    const stats: Record<string, { gpa: number; eligible: string; totalUnits: number }> = {};
    Object.entries(liteData).forEach(([year, data]) => {
      stats[year] = calcLiteStats(data, showUnits);
    });
    return stats;
  }, [liteData, showUnits]);

  const liteLatinHonorsSummary = React.useMemo(() => {
    const yearsWithData = Object.values(liteStats).filter(s => s.gpa > 0);
    if (yearsWithData.length === 0) return { overallGPA: "0.00", latinHonor: "-" };

    const rawAverageGPA = yearsWithData.reduce((sum, s) => sum + s.gpa, 0) / yearsWithData.length;

    let latinHonor: string;
    if (rawAverageGPA < 3.0) latinHonor = "No, CGPA below 3.0";
    else if (rawAverageGPA >= 3.80) latinHonor = "Summa Cum Laude";
    else if (rawAverageGPA >= 3.60) latinHonor = "Magna Cum Laude";
    else if (rawAverageGPA >= 3.40) latinHonor = "Cum Laude";
    else latinHonor = "Academic Distinction";

    return { overallGPA: truncateToDecimals(rawAverageGPA, 4).toFixed(4), latinHonor };
  }, [liteStats]);

  const topSummaryYearKey = "Year 1";

  return (
    <div className="min-h-screen bg-background">
      <Header title="Grades Calculator" backHref="/" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Calculator className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-normal text-foreground mb-4">Grades Calculator</h1>
          <p className="text-muted-foreground text-lg">
            <AnimatePresence mode="wait">
              <motion.span
                key={liteMode ? "lite" : "full"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {liteMode ? (
                  <>Enter your general average for a school year</>
                ) : (
                  <>
                    Enter subjects and grades for each term per academic year <br />
                    You can just use the arrow keys on your keyboard for easier navigation ^^ <br />
                    (Click on an input box first then you can use the arrow keys!)
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </p>

          {/* Lite Mode Toggle */}
          <div className="flex items-center justify-center gap-2.5 mt-6">
            <button
              role="checkbox"
              aria-checked={liteMode}
              onClick={() => setLiteMode(prev => !prev)}
              className={`
                relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center
                rounded border-2 transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                ${liteMode
                  ? 'bg-foreground border-foreground'
                  : 'bg-background border-input hover:border-foreground/50'
                }
              `}
            >
              {liteMode && (
                <svg
                  className="h-3 w-3 text-background"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <label
              onClick={() => setLiteMode(prev => !prev)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Lite Mode
            </label>
          </div>
        </div>

        {/* Year Summary */}
        <div className="flex justify-center mb-10">
          <AnimatePresence mode="wait">
            {liteMode ? (
              <motion.div
                layout
                key="lite-stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-0 flex-wrap justify-center items-center p-6 rounded-xl border bg-card/50 shadow-sm"
              >
                <div className="flex flex-col items-center px-8 py-2 border-r border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Overall GPA</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {liteLatinHonorsSummary.overallGPA}
                  </p>
                </div>
                <div className="flex flex-col items-center px-8 py-2">
                  <p className="text-sm text-muted-foreground mb-1">Latin Honor</p>
                  <p className="text-3xl font-bold tracking-tight text-primary">
                    {liteLatinHonorsSummary.latinHonor}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="full-stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-0 flex-wrap justify-center items-center p-6 rounded-xl border bg-card/50 shadow-sm"
              >
                <div className="flex flex-col items-center px-8 py-2 border-r border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Overall GPA</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {latinHonorsSummary.overallGPA}
                  </p>
                </div>
                <div className="flex flex-col items-center px-8 py-2">
                  <p className="text-sm text-muted-foreground mb-1">Latin Honor</p>
                  <p className="text-3xl font-bold tracking-tight text-primary">
                    {latinHonorsSummary.latinHonor}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <hr className="mb-10 border-border/100" />

        <div className="space-y-12">
          {[1, 2, 3, 4].map((yearNum) => {
            const yearKey = `Year ${yearNum}`;
            return (
              <motion.section
                key={yearKey}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mt-12"
              >
                <h2 className="text-2xl font-semibold mb-6 text-center">{yearKey}</h2>

                <AnimatePresence mode="wait">
                  {liteMode ? (
                    /* Lite Mode: 3 term inputs (grade + units inline) */
                    <motion.div
                      key="lite-view"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-center"
                    >
                      <div className="rounded-lg border bg-card p-6 shadow-sm w-full max-w-lg">
                        <div className="flex items-center justify-between mb-5">
                          <p className="text-sm font-medium text-foreground">
                            General Average per Term
                          </p>
                          <div className="flex items-center gap-2">
                            <label htmlFor={`show-units-toggle-${yearKey}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                              Include Units?
                            </label>
                            <input
                              id={`show-units-toggle-${yearKey}`}
                              type="checkbox"
                              checked={showUnits}
                              onChange={e => setShowUnits(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-input text-foreground focus:ring-ring cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          {[1, 2, 3].map(num => (
                            <LiteTermRow
                              key={num}
                              termNum={num}
                              yearKey={yearKey}
                              gradeValue={liteData[yearKey]?.[`term${num}` as keyof LiteYearData] || ""}
                              unitsValue={liteData[yearKey]?.[`units${num}` as keyof LiteYearData] || ""}
                              onGradeChange={v => handleLiteChange(yearKey, `term${num}` as keyof LiteYearData, v)}
                              onUnitsChange={v => handleLiteChange(yearKey, `units${num}` as keyof LiteYearData, v)}
                              onKeyDown={handleLiteKeyDown}
                              showUnits={showUnits}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* Full Mode: term tables */
                    <motion.div
                      key="full-view"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="grid md:grid-cols-3 gap-4 justify-center"
                    >
                      <MemoizedTermTable
                        term={`${yearKey} Term 1`}
                        initialRows={termsData[`${yearKey} Term 1`]}
                        onStatsChange={handleTermChange}
                        onEdge={handleEdge}
                      />
                      <MemoizedTermTable
                        term={`${yearKey} Term 2`}
                        initialRows={termsData[`${yearKey} Term 2`]}
                        onStatsChange={handleTermChange}
                        onEdge={handleEdge}
                      />
                      <MemoizedTermTable
                        term={`${yearKey} Term 3`}
                        initialRows={termsData[`${yearKey} Term 3`]}
                        onStatsChange={handleTermChange}
                        onEdge={handleEdge}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {((liteMode && liteStats[yearKey]?.gpa > 0) || (!liteMode && yearStats[yearKey])) && (
                  <div className="flex flex-wrap justify-center mt-6 gap-4">
                    <div className="rounded-lg border bg-card px-6 py-4 shadow-sm text-center min-w-[140px]">
                      <p className="text-sm text-muted-foreground mb-1">{liteMode ? "Average GPA" : "Current GPA"}</p>
                      <p className="text-2xl font-bold text-foreground">
                        {liteMode 
                          ? liteStats[yearKey].gpa.toFixed(2)
                          : yearStats[yearKey].gpa.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card px-6 py-4 shadow-sm text-center min-w-[140px]">
                      <p className="text-sm text-muted-foreground mb-1">Eligible for Honors</p>
                      <p className="text-2xl font-bold text-foreground">
                        {liteMode 
                          ? liteStats[yearKey].eligible
                          : yearStats[yearKey].eligible}
                      </p>
                    </div>
                  </div>
                )}

                {yearNum < 4 && <hr className="my-12 border-border/100" />}
              </motion.section>
            );
          })}
        </div>

      </main>
      <Footer />
    </div>
  );
}

// Truncate a number to `decimals` places without rounding (e.g. 3.7999 -> 3.79)
function truncateToDecimals(num: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return Math.trunc(num * factor) / factor;
}