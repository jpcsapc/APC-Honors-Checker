"use client"
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator } from "lucide-react";
import { TermTable } from '../../components/TermTable';
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

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

export default function LatinHonorsCalculator() {
  const [termsData, setTermsData] = React.useState<Record<string, RowData[]>>({});
  const [yearStats, setYearStats] = React.useState<Record<string, YearStats>>({});
  const [overallGPA, setOverallGPA] = React.useState("0.00");
  const [latinHonor, setLatinHonor] = React.useState("-");

  const termsDataRef = React.useRef(termsData);
  termsDataRef.current = termsData;

  React.useEffect(() => {
    try {
      const savedData = localStorage.getItem("latinHonorsTermsData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (typeof parsedData === 'object' && !Array.isArray(parsedData) && parsedData !== null) {
          setTermsData(parsedData);
        }
      }
    } catch (error) {
      console.error("Failed to parse latinHonorsTermsData from localStorage", error);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem("latinHonorsTermsData", JSON.stringify(termsData));
  }, [termsData]);

  const handleTermChange = React.useCallback((term: string, rows: RowData[]) => {
    setTermsData(prev => ({
      ...prev,
      [term]: rows
    }));
  }, []);

  // Calculate year statistics from term statistics
  React.useEffect(() => {
    const newYearStats: Record<string, YearStats> = {};
    
    // Group terms by year
    const yearGroups: Record<string, RowData[][]> = {};
    Object.entries(termsData).forEach(([term, rows]) => {
      if (Array.isArray(rows)) {
        const year = term.split(' ')[0]; // Extract year from term name (e.g., "Year 1 Term 1" -> "Year 1")
        if (!yearGroups[year]) {
          yearGroups[year] = [];
        }
        yearGroups[year].push(rows);
      }
    });

    // Calculate year statistics
    Object.entries(yearGroups).forEach(([year, termRows]) => {
      const allRows = termRows.flat();
      const validRows = allRows.filter(row => {
        if (!row) return false;
        const isNatSer = (row.subjectCode || '').toUpperCase().startsWith('NATSER');
        if (isNatSer) return false;
        return row.subjectCode.trim() !== '' && row.grade.trim() !== '' && row.unit > 0;
      });

      if (validRows.length > 0) {
        const totalHonorPoints = validRows.reduce((sum, row) => sum + row.honorPoints, 0);
        const totalUnits = validRows.reduce((sum, row) => sum + Number(row.unit), 0);
        const gpa = totalUnits > 0 ? totalHonorPoints / totalUnits : 0;
        const totalRGrades = validRows.filter(row => row.grade.toUpperCase() === 'R').length;

        newYearStats[year] = {
          gpa: gpa,
          totalHonorPoints,
          totalUnits,
          rGrades: totalRGrades
        };
      }
    });

    setYearStats(newYearStats);
  }, [termsData]);

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

  // Recalculate overall results whenever yearStats changes so outputs are live
  

  const calculateLatinHonors = React.useCallback(() => {
    const years = Object.values(yearStats);

    if (years.length === 0) {
      setOverallGPA("0.00");
      setLatinHonor("-");
      return;
    }

    // Calculate overall GPA across all years
    const totalGPA = years.reduce((sum, year) => sum + year.gpa, 0);
    const averageGPA = totalGPA / years.length;

    // Calculate total units across all years
    const totalUnits = years.reduce((sum, year) => sum + year.totalUnits, 0);
    const hasEnoughUnits = totalUnits >= 144; // 144 units required for Latin honors (4 years * 36 units)

    // Calculate total R grades across all years
    const totalRGrades = years.reduce((sum, year) => sum + year.rGrades, 0);
    const hasTooManyRs = totalRGrades > 8; // Maximum 8 R grades allowed for Latin honors (2 per year * 4 years)

    setOverallGPA(averageGPA.toFixed(2));

    if (!hasEnoughUnits) {
      setLatinHonor("No, not enough units");
      return;
    }

    if (hasTooManyRs) {
      setLatinHonor("No, more than 8 R grades");
      return;
    }

    // Determine Latin honor based on GPA
    if (averageGPA >= 3.85) {
      setLatinHonor("Summa Cum Laude");
    } else if (averageGPA >= 3.70) {
      setLatinHonor("Magna Cum Laude");
    } else if (averageGPA >= 3.50) {
      setLatinHonor("Cum Laude");
    } else {
      setLatinHonor("No Latin Honor");
    }
  }, [yearStats]);

  // Recalculate overall results whenever yearStats changes so outputs are live
  React.useEffect(() => {
    calculateLatinHonors();
  }, [calculateLatinHonors]);

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
            <h1 className="text-sm text-muted-foreground">Latin Honors Calculator</h1>
            </div>
            <ThemeToggle />
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
          <h1 className="text-4xl font-normal text-foreground mb-4">
            Latin Honors Calculator
          </h1>
          <p className="text-muted-foreground text-lg">
            Calculate your 4-year academic performance for Latin honors <br />
            You can just use the arrow keys on your keyboard for easier navigation ^^ <br />
            (Click on an input box first then you can use the arrow keys!)
          </p>
        </div>


        {/* Overall Statistics Display */}
        <div className="flex justify-center mt-8 gap-4">
          <div className="border px-4 py-2 shadow-sm rounded">Overall GPA: {overallGPA}</div>
          <div className="border px-4 py-2 shadow-sm rounded">Latin Honor: {latinHonor}</div>
        </div>

        {/* Year 1 */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Year 1</h2>
          <div className="grid md:grid-cols-3 gap-4 justify-center">
            <TermTable 
              term="Year 1 Term 1" 
              initialRows={termsData["Year 1 Term 1"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
            <TermTable 
              term="Year 1 Term 2" 
              initialRows={termsData["Year 1 Term 2"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
            <TermTable 
              term="Year 1 Term 3" 
              initialRows={termsData["Year 1 Term 3"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
          </div>
          {/* Year 1 Summary */}
          {yearStats["Year 1"] && (
            <div className="flex justify-center mt-4 gap-4">
              <div className="border px-4 py-2 shadow-sm rounded bg-blue-50">
                Year 1 GPA: {yearStats["Year 1"].gpa.toFixed(2)}
              </div>
              <div className="border px-4 py-2 shadow-sm rounded bg-blue-50">
                Year 1 Units: {yearStats["Year 1"].totalUnits}
              </div>
            </div>
          )}
        </div>

        {/* Year 2 */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Year 2</h2>
          <div className="grid md:grid-cols-3 gap-4 justify-center">
            <TermTable 
              term="Year 2 Term 1" 
              initialRows={termsData["Year 2 Term 1"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
            <TermTable 
              term="Year 2 Term 2" 
              initialRows={termsData["Year 2 Term 2"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
            <TermTable 
              term="Year 2 Term 3" 
              initialRows={termsData["Year 2 Term 3"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
          </div>
          {/* Year 2 Summary */}
          {yearStats["Year 2"] && (
            <div className="flex justify-center mt-4 gap-4">
              <div className="border px-4 py-2 shadow-sm rounded bg-green-50">
                Year 2 GPA: {yearStats["Year 2"].gpa.toFixed(2)}
              </div>
              <div className="border px-4 py-2 shadow-sm rounded bg-green-50">
                Year 2 Units: {yearStats["Year 2"].totalUnits}
              </div>
            </div>
          )}
        </div>

        {/* Year 3 */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Year 3</h2>
          <div className="grid md:grid-cols-3 gap-4 justify-center">
            <TermTable 
              term="Year 3 Term 1" 
              initialRows={termsData["Year 3 Term 1"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
            <TermTable 
              term="Year 3 Term 2" 
              initialRows={termsData["Year 3 Term 2"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
            <TermTable 
              term="Year 3 Term 3" 
              initialRows={termsData["Year 3 Term 3"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
          </div>
          {/* Year 3 Summary */}
          {yearStats["Year 3"] && (
            <div className="flex justify-center mt-4 gap-4">
              <div className="border px-4 py-2 shadow-sm rounded bg-yellow-50">
                Year 3 GPA: {yearStats["Year 3"].gpa.toFixed(2)}
              </div>
              <div className="border px-4 py-2 shadow-sm rounded bg-yellow-50">
                Year 3 Units: {yearStats["Year 3"].totalUnits}
              </div>
            </div>
          )}
        </div>

        {/* Year 4 */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">Year 4</h2>
          <div className="grid md:grid-cols-3 gap-4 justify-center">
            <TermTable 
              term="Year 4 Term 1" 
              initialRows={termsData["Year 4 Term 1"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
            <TermTable 
              term="Year 4 Term 2" 
              initialRows={termsData["Year 4 Term 2"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
            <TermTable 
              term="Year 4 Term 3" 
              initialRows={termsData["Year 4 Term 3"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
          </div>
          {/* Year 4 Summary */}
          {yearStats["Year 4"] && (
            <div className="flex justify-center mt-4 gap-4">
              <div className="border px-4 py-2 shadow-sm rounded bg-purple-50">
                Year 4 GPA: {yearStats["Year 4"].gpa.toFixed(2)}
              </div>
              <div className="border px-4 py-2 shadow-sm rounded bg-purple-50">
                Year 4 Units: {yearStats["Year 4"].totalUnits}
              </div>
            </div>
          )}
        </div>

        {/* Results are calculated live as you edit terms; no manual button required. */}
    
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