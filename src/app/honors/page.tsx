"use client"
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator } from "lucide-react";
import { TermTable } from '../../components/TermTable';
import Link from "next/link";

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

export default function HonorsCalcu() {
  const [termsData, setTermsData] = React.useState<Record<string, RowData[]>>({});

  const termsDataRef = React.useRef(termsData);
  termsDataRef.current = termsData;

  // Load persisted data
  React.useEffect(() => {
    try {
      const savedData = localStorage.getItem("honorsTermsData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (typeof parsedData === 'object' && !Array.isArray(parsedData) && parsedData !== null) {
          setTermsData(parsedData);
        }
      }
    } catch (error) {
      console.error("Failed to parse honorsTermsData from localStorage", error);
    }
  }, []);

  // Persist on change - debounced to avoid excessive localStorage writes
  const persistTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      localStorage.setItem("honorsTermsData", JSON.stringify(termsData));
    }, 300);

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [termsData]);

  const handleTermChange = React.useCallback((term: string, rows: RowData[]) => {
    setTermsData(prev => ({
      ...prev,
      [term]: rows
    }));
  }, []);

  // 4x3 layout for Year 1–4 - memoized to prevent recreation
  const tableLayout = React.useMemo(() => [
    ["Year 1 Term 1", "Year 1 Term 2", "Year 1 Term 3"],
    ["Year 2 Term 1", "Year 2 Term 2", "Year 2 Term 3"],
    ["Year 3 Term 1", "Year 3 Term 2", "Year 3 Term 3"],
    ["Year 4 Term 1", "Year 4 Term 2", "Year 4 Term 3"],
  ], []);

  // Arrow-key navigation between tables
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
      if (termColIndex > 0) {
        nextTermName = tableLayout[termRowIndex][termColIndex - 1];
        nextCellCol = 2; // Last editable column
      }
    } else if (direction === "right" && fromCol === 2) {
      if (termColIndex < tableLayout[termRowIndex].length - 1) {
        nextTermName = tableLayout[termRowIndex][termColIndex + 1];
        nextCellCol = 0; // First column
      }
    } else if (direction === "up" && fromRow === 0) {
      if (termRowIndex > 0) {
        nextTermName = tableLayout[termRowIndex - 1][termColIndex];
        const targetRows = termsData[nextTermName] || [];
        nextCellRow = Math.max(0, targetRows.length - 1);
      }
    } else if (direction === "down" && fromRow === (termsData[fromTerm]?.length || 0) - 1) {
      if (termRowIndex < tableLayout.length - 1) {
        nextTermName = tableLayout[termRowIndex + 1][termColIndex];
        nextCellRow = 0;
      }
    }

    if (nextTermName) {
      const nextTermRows = termsData[nextTermName] || [];
      if (nextTermRows.length > 0 && nextCellRow >= nextTermRows.length) {
        nextCellRow = nextTermRows.length - 1;
      }
      if (nextCellRow < 0 || nextTermRows.length === 0) {
        nextCellRow = 0;
      }

      const nextCellId = `cell-${nextTermName}-${nextCellRow}-${nextCellCol}`;
      const targetInput = document.getElementById(nextCellId) as HTMLInputElement;
      if (targetInput) {
        targetInput.focus();
        targetInput.select();
      }
    }
  };

  // Recompute per-year GPA and eligibility whenever termsData changes
  // Memoize to avoid recalculating if termsData object reference didn't change
  const yearStats = React.useMemo(() => {
    const groupedByYear: Record<string, RowData[][]> = {};
    Object.entries(termsData).forEach(([term, rows]) => {
      if (!Array.isArray(rows)) return;
      const year = term.split(' ').slice(0, 2).join(' '); // "Year X"
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

      if (valid.length === 0) {
        nextYearStats[year] = { gpa: 0, totalUnits: 0, rGrades: 0, eligible: '-' };
        return;
      }

      const totalHonorPoints = valid.reduce((sum, r) => sum + r.honorPoints, 0);
      const totalUnits = valid.reduce((sum, r) => sum + Number(r.unit), 0);
      const gpa = totalUnits > 0 ? totalHonorPoints / totalUnits : 0;
      const rGrades = valid.filter(r => (r.grade || '').toUpperCase() === 'R').length;

      // Honors (per-year) criteria: >=36 units, <=2 R grades, GPA between 3.0 and 4.0
      const hasEnoughUnits = totalUnits >= 36;
      const hasTooManyRs = rGrades > 2;
      let eligible: string;
      if (!hasEnoughUnits) eligible = "No, not enough units";
      else if (hasTooManyRs) eligible = "No, more than 2 R grades";
      else if (gpa >= 3.0 && gpa <= 4.0) eligible = "Yes";
      else eligible = "No";

      nextYearStats[year] = { gpa, totalUnits, rGrades, eligible };
    });

    return nextYearStats;
  }, [termsData]);

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
              <h1 className="text-sm text-muted-foreground">Honors Calculator</h1>
            </div>
          </div>
        </div>
      </header>


  {/* Main Content */}
  <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Calculator className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-normal text-foreground mb-4">Honors Calculator</h1>
          <p className="text-muted-foreground text-lg">Enter subjects and grades for each term per academic year</p>
        </div>
  <hr className="mb-10 border-border/100" />

        {/* Year Sections */}
        {[1,2,3,4].map((yearNum) => {
          const yearKey = `Year ${yearNum}`;
          return (
            <React.Fragment key={yearKey}>
              <section className="mt-12">
                <h2 className="text-2xl font-semibold mb-6 text-center">{yearKey}</h2>
                <div className="grid md:grid-cols-3 gap-4 justify-center">
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
                </div>

                {/* Year Summary */}
                {yearStats[yearKey] && (
                  <div className="flex justify-center mt-4 gap-4">
                    <div className="border px-4 py-2 shadow-sm rounded">Current GPA: {yearStats[yearKey].gpa.toFixed(2)}</div>
                    <div className="border px-4 py-2 shadow-sm rounded">Eligible for Honors: {yearStats[yearKey].eligible}</div>
                  </div>
                )}
              </section>
              {yearNum < 4 && <hr className="my-12 border-border/100" />}
            </React.Fragment>
          );
        })}

        {/* Footer */}
        <footer className="border-t pt-8 mt-16">
          <p className="text-center text-xs text-muted-foreground">
            Created by the Developers of JPCS - APC | Edwin Gumba Jr. (SS221) & Marwin John Gonzales (IT241)
          </p>
        </footer>
      </main>
    </div>
  );
}
