"use client"
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator, Zap } from "lucide-react";
import { TermTable } from '../../components/TermTable';
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";

// Memoized TermTable for full mode
const MemoizedTermTable = React.memo(TermTable);

interface RowData {
  subjectCode: string;
  unit: number;
  grade: string;
  honorPoints: number;
}

interface YearStats {
  gpa: number;
  totalHonorPoints: number;
  totalUnits: number;
  rGrades: number;
}

interface LiteYearInput {
  gpa: string;
  units: string;
}

// ── Lite Mode row for Latin Honors (one year per row/cell) ──
function LiteYearRow({
  yearNum,
  gradeValue,
  unitsValue,
  onGradeChange,
  onUnitsChange,
  onKeyDown,
  showUnits,
}: {
  yearNum: number;
  gradeValue: string;
  unitsValue: string;
  onGradeChange: (v: string) => void;
  onUnitsChange: (v: string) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "grade" | "units",
    yearNum: number
  ) => void;
  showUnits: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Year {yearNum}
      </p>

      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <label
            htmlFor={`lite-year-${yearNum}-grade`}
            className="text-xs text-muted-foreground font-medium"
          >
            GPA
          </label>
          <input
            id={`lite-year-${yearNum}-grade`}
            type="number"
            step="0.01"
            min="0"
            max="5"
            value={gradeValue}
            onChange={e => onGradeChange(e.target.value)}
            onKeyDown={e => onKeyDown(e, "grade", yearNum)}
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

        <AnimatePresence mode="popLayout">
          {showUnits && (
            <motion.div
              initial={{ opacity: 0, width: 0, x: 10 }}
              animate={{ opacity: 1, width: 64, x: 0 }}
              exit={{ opacity: 0, width: 0, x: 10 }}
              className="flex flex-col gap-1 overflow-hidden"
            >
              <label
                htmlFor={`lite-year-${yearNum}-units`}
                className="text-xs text-muted-foreground font-medium whitespace-nowrap"
              >
                Units
              </label>
              <input
                id={`lite-year-${yearNum}-units`}
                type="number"
                step="1"
                min="0"
                value={unitsValue}
                onChange={e => onUnitsChange(e.target.value)}
                onKeyDown={e => onKeyDown(e, "units", yearNum)}
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

export default function LatinHonorsCalculator() {
  const [termsData, setTermsData] = React.useState<Record<string, RowData[]>>({});
  const [liteMode, setLiteMode] = React.useState(true);
  const [showUnits, setShowUnits] = React.useState(false);
  const [liteData, setLiteData] = React.useState<Record<number, LiteYearInput>>({
    1: { gpa: "", units: "" },
    2: { gpa: "", units: "" },
    3: { gpa: "", units: "" },
    4: { gpa: "", units: "" },
  });

  const termsDataRef = React.useRef(termsData);
  termsDataRef.current = termsData;

  // Load persisted data
  React.useEffect(() => {
    try {
      const savedData = localStorage.getItem("latinHonorsTermsData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (typeof parsedData === 'object' && !Array.isArray(parsedData) && parsedData !== null) {
          setTermsData(parsedData);
        }
      }
      const savedLite = localStorage.getItem("latinHonorsLiteData");
      if (savedLite) {
        const parsedLite = JSON.parse(savedLite);
        if (typeof parsedLite === 'object' && parsedLite !== null) {
          setLiteData(parsedLite);
        }
      }
      const savedLiteMode = localStorage.getItem("latinHonorsLiteMode");
      if (savedLiteMode !== null) setLiteMode(JSON.parse(savedLiteMode));
    } catch (error) {
      console.error("Failed to parse latin honors data from localStorage", error);
    }
  }, []);

  // Persist data
  React.useEffect(() => {
    localStorage.setItem("latinHonorsTermsData", JSON.stringify(termsData));
  }, [termsData]);

  React.useEffect(() => {
    localStorage.setItem("latinHonorsLiteData", JSON.stringify(liteData));
  }, [liteData]);

  React.useEffect(() => {
    localStorage.setItem("latinHonorsLiteMode", JSON.stringify(liteMode));
  }, [liteMode]);

  const handleTermChange = React.useCallback((term: string, rows: RowData[]) => {
    setTermsData(prev => ({ ...prev, [term]: rows }));
  }, []);

  const handleLiteChange = (yearNum: number, field: keyof LiteYearInput, value: string) => {
    setLiteData(prev => ({
      ...prev,
      [yearNum]: { ...prev[yearNum], [field]: value },
    }));
  };

  const handleLiteKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "grade" | "units",
    yearNum: number
  ) => {
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();

    let nextId = "";
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      if (type === "grade") {
        nextId = showUnits ? `lite-year-${yearNum}-units` : (yearNum < 4 ? `lite-year-${yearNum + 1}-grade` : "");
      } else if (yearNum < 4) {
        nextId = `lite-year-${yearNum + 1}-grade`;
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      if (type === "units") {
        nextId = `lite-year-${yearNum}-grade`;
      } else if (yearNum > 1) {
        nextId = showUnits ? `lite-year-${yearNum - 1}-units` : `lite-year-${yearNum - 1}-grade`;
      }
    }

    if (nextId) {
      const el = document.getElementById(nextId) as HTMLInputElement;
      if (el) { el.focus(); el.select(); }
    }
  };

  const tableLayout = [
    ["Year 1 Term 1", "Year 1 Term 2", "Year 1 Term 3"],
    ["Year 2 Term 1", "Year 2 Term 2", "Year 2 Term 3"],
    ["Year 3 Term 1", "Year 3 Term 2", "Year 3 Term 3"],
    ["Year 4 Term 1", "Year 4 Term 2", "Year 4 Term 3"],
  ];

  const handleEdge = (
    direction: "up" | "down" | "left" | "right",
    fromTerm: string,
    fromRow: number,
    fromCol: number
  ) => {
    const termsData = termsDataRef.current;
    const termRowIndex = tableLayout.findIndex(row => row.includes(fromTerm));
    const termColIndex = tableLayout[termRowIndex].indexOf(fromTerm);

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
      const el = document.getElementById(nextCellId) as HTMLInputElement;
      if (el) { el.focus(); el.select(); }
    }
  };

  const results = React.useMemo(() => {
    if (liteMode) {
      const years = Object.values(liteData);
      const validGPA = years.map(y => parseFloat(y.gpa)).filter(v => !isNaN(v) && v > 0);
      const totalUnits = years.reduce((sum, y) => sum + (parseFloat(y.units) || 0), 0);
      
      const avgGPA = validGPA.length > 0 ? validGPA.reduce((a, b) => a + b, 0) / validGPA.length : 0;
      
      let eligible = "-";
      if (validGPA.length > 0) {
        if (showUnits && totalUnits < 144) {
          eligible = "No, not enough units (need 144)";
        } else if (avgGPA >= 3.85) {
          eligible = "Summa Cum Laude";
        } else if (avgGPA >= 3.70) {
          eligible = "Magna Cum Laude";
        } else if (avgGPA >= 3.50) {
          eligible = "Cum Laude";
        } else {
          eligible = "No Latin Honor";
        }
      }
      return { gpa: avgGPA.toFixed(2), latinHonor: eligible, units: totalUnits };
    } else {
      // Full Mode logic
      let totalHonorPoints = 0;
      let totalUnits = 0;
      let totalRGrades = 0;
      let yearCount = 0;

      const yearSums: Record<string, { points: number, units: number, rs: number }> = {};

      Object.entries(termsData).forEach(([term, rows]) => {
        const year = term.split(' ').slice(0, 2).join(' ');
        if (!yearSums[year]) yearSums[year] = { points: 0, units: 0, rs: 0 };
        
        rows.filter(r => {
          const isNatSer = (r.subjectCode || '').toUpperCase().startsWith('NATSER');
          return !isNatSer && r.subjectCode.trim() !== '' && r.grade.trim() !== '' && r.unit > 0;
        }).forEach(r => {
          yearSums[year].points += r.honorPoints;
          yearSums[year].units += Number(r.unit);
          if (r.grade.toUpperCase() === 'R') yearSums[year].rs += 1;
        });
      });

      const yearGPAs = Object.values(yearSums)
        .filter(y => y.units > 0)
        .map(y => y.points / y.units);
      
      const combinedUnits = Object.values(yearSums).reduce((s, y) => s + y.units, 0);
      const combinedRs = Object.values(yearSums).reduce((s, y) => s + y.rs, 0);
      const averageGPA = yearGPAs.length > 0 ? yearGPAs.reduce((a, b) => a + b, 0) / yearGPAs.length : 0;

      let eligible = "-";
      if (yearGPAs.length > 0) {
        if (combinedUnits < 144) eligible = "No, not enough units";
        else if (combinedRs > 8) eligible = "No, more than 8 R grades";
        else if (averageGPA >= 3.85) eligible = "Summa Cum Laude";
        else if (averageGPA >= 3.70) eligible = "Magna Cum Laude";
        else if (averageGPA >= 3.50) eligible = "Cum Laude";
        else eligible = "No Latin Honor";
      }

      return { gpa: averageGPA.toFixed(2), latinHonor: eligible, units: combinedUnits };
    }
  }, [liteMode, liteData, termsData, showUnits]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-sm text-muted-foreground">Latin Honors Calculator</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Calculator className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-normal text-foreground mb-4">Latin Honors Calculator</h1>
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
                  <>Enter your general average for each school year</>
                ) : (
                  <>Enter subjects and grades for all four years</>
                )}
              </motion.span>
            </AnimatePresence>
          </p>

          <div className="flex items-center justify-center gap-2.5 mt-6">
            <button
              role="checkbox"
              aria-checked={liteMode}
              onClick={() => setLiteMode(prev => !prev)}
              className={`relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${liteMode ? 'bg-foreground border-foreground' : 'bg-background border-input hover:border-foreground/50'}`}
            >
              {liteMode && <svg className="h-3 w-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </button>
            <label onClick={() => setLiteMode(prev => !prev)} className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
              <Zap className="h-3.5 w-3.5" /> Lite Mode
            </label>
          </div>
        </div>

        {/* Global Results at the top */}
        <div className="flex justify-center mb-12">
          <motion.div 
            layout 
            className="flex gap-4 flex-wrap justify-center items-center p-6 rounded-xl border bg-card/50 shadow-sm"
          >
            <motion.div layout className="flex flex-col items-center px-6 py-2 border-r border-border/50 last:border-0">
              <p className="text-sm text-muted-foreground mb-1">Overall GPA</p>
              <p className="text-3xl font-bold tracking-tight">{results.gpa}</p>
            </motion.div>
            
            <AnimatePresence mode="popLayout">
              {liteMode && showUnits && (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center px-6 py-2 border-r border-border/50 last:border-0"
                >
                  <p className="text-sm text-muted-foreground mb-1">Total Units</p>
                  <p className="text-3xl font-bold tracking-tight">{results.units}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout className="flex flex-col items-center px-6 py-2">
              <p className="text-sm text-muted-foreground mb-1">Latin Honor Status</p>
              <p className="text-3xl font-bold tracking-tight text-primary">{results.latinHonor}</p>
            </motion.div>
          </motion.div>
        </div>

        <hr className="mb-10 border-border/100" />

        <AnimatePresence mode="wait">
          {liteMode ? (
            <motion.div
              key="lite-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="rounded-xl border bg-card p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-medium">Yearly Performance</h3>
                  <div className="flex items-center gap-2">
                    <label htmlFor="latin-units-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">Include Units?</label>
                    <input
                      id="latin-units-toggle"
                      type="checkbox"
                      checked={showUnits}
                      onChange={e => setShowUnits(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-input text-foreground focus:ring-ring cursor-pointer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(num => (
                    <LiteYearRow
                      key={num}
                      yearNum={num}
                      gradeValue={liteData[num].gpa}
                      unitsValue={liteData[num].units}
                      onGradeChange={v => handleLiteChange(num, "gpa", v)}
                      onUnitsChange={v => handleLiteChange(num, "units", v)}
                      onKeyDown={handleLiteKeyDown}
                      showUnits={showUnits}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="full-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              {[1, 2, 3, 4].map(yNum => (
                <section key={yNum} className="space-y-8">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px bg-border flex-1" />
                    <h2 className="text-2xl font-semibold px-4">Year {yNum}</h2>
                    <div className="h-px bg-border flex-1" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(tNum => (
                      <MemoizedTermTable
                        key={`${yNum}-${tNum}`}
                        term={`Year ${yNum} Term ${tNum}`}
                        initialRows={termsData[`Year ${yNum} Term ${tNum}`]}
                        onStatsChange={handleTermChange}
                        onEdge={handleEdge}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="border-t pt-8 mt-24">
          <p className="text-center text-xs text-muted-foreground">
            Created by the Developers of JPCS - APC | Edwin Gumba Jr. (SS221) & Marwin John Gonzales (IT241)
          </p>
        </footer>
      </main>
    </div>
  );
}