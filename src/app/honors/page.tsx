"use client"
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator } from "lucide-react";
import { TermTable } from '../../components/TermTable';
import Link from "next/link";


interface RowData {
  subjectCode: string;
  unit: number;
  grade: string;
  honorPoints: number;
}

export default function HonorsCalcu() {
  const [termsData, setTermsData] = React.useState<Record<string, RowData[]>>({});
  const [currentGPA, setCurrentGPA] = React.useState("0.00");
  const [eligibleForHonors, setEligibleForHonors] = React.useState("-");

  const termsDataRef = React.useRef(termsData);
  termsDataRef.current = termsData;

  React.useEffect(() => {
    try {
      const savedData = localStorage.getItem("termsData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (typeof parsedData === 'object' && !Array.isArray(parsedData) && parsedData !== null) {
          setTermsData(parsedData);
        }
      }
    } catch (error) {
      console.error("Failed to parse termsData from localStorage", error);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem("termsData", JSON.stringify(termsData));
  }, [termsData]);

  const handleTermChange = React.useCallback((term: string, rows: RowData[]) => {
    setTermsData(prev => ({
      ...prev,
      [term]: rows
    }));
  }, []);

  const termLayout = [["Term 1", "Term 2", "Term 3"]];

  const handleEdge = (
    direction: "up" | "down" | "left" | "right",
    fromTerm: string,
    fromRow: number,
    fromCol: number
  ) => {
    const termsData = termsDataRef.current;
    const termRowIndex = termLayout.findIndex(row => row.includes(fromTerm));
    const termColIndex = termLayout[termRowIndex].indexOf(fromTerm);

    let nextTermName = "";
    let nextCellRow = fromRow;
    let nextCellCol = fromCol;

    if (direction === "left" && fromCol === 0) {
      if (termColIndex > 0) {
        nextTermName = termLayout[termRowIndex][termColIndex - 1];
        nextCellCol = 2; // Last editable column
      }
    } else if (direction === "right" && fromCol === 2) {
      if (termColIndex < termLayout[termRowIndex].length - 1) {
        nextTermName = termLayout[termRowIndex][termColIndex + 1];
        nextCellCol = 0; // First column
      }
    } else if (direction === "up" && fromRow === 0) {
      if (termRowIndex > 0) {
        nextTermName = termLayout[termRowIndex - 1][termColIndex];
        const targetRows = termsData[nextTermName] || [];
        nextCellRow = Math.max(0, targetRows.length - 1);
      }
    } else if (direction === "down" && fromRow === (termsData[fromTerm]?.length || 0) - 1) {
      if (termRowIndex < termLayout.length - 1) {
        nextTermName = termLayout[termRowIndex + 1][termColIndex];
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

  const calculateHonors = React.useCallback(() => {
    const termKeys = Object.keys(termsData);
    if (termKeys.length === 0) {
      setCurrentGPA("0.00");
      setEligibleForHonors("-");
      return;
    }

    const allTermStats = termKeys.map(term => {
      const rows = termsData[term];
      if (!Array.isArray(rows)) {
        return { gpa: 0, totalHonorPoints: 0, totalUnits: 0, rGrades: 0 };
      }
      const validRows = rows.filter(row => {
        const isNatSer = (row.subjectCode || '').toUpperCase().startsWith('NATSER');
        if (isNatSer) return false;
        return row.subjectCode.trim() !== '' && row.grade.trim() !== '' && row.unit > 0;
      });

      if (validRows.length === 0) {
        return { gpa: 0, totalHonorPoints: 0, totalUnits: 0, rGrades: 0 };
      }

      const totalHonorPoints = validRows.reduce((sum, row) => sum + row.honorPoints, 0);
      const totalUnits = validRows.reduce((sum, row) => sum + Number(row.unit), 0);
      const gpa = totalUnits > 0 ? totalHonorPoints / totalUnits : 0;
      const rGrades = validRows.filter(row => row.grade.toUpperCase() === 'R').length;

      return { gpa, totalHonorPoints, totalUnits, rGrades };
    });

    const totalGPA = allTermStats.reduce((sum, term) => sum + term.gpa, 0);
    const averageGPA = totalGPA / allTermStats.length;

    const totalUnits = allTermStats.reduce((sum, term) => sum + term.totalUnits, 0);
    const hasEnoughUnits = totalUnits >= 36;

    const totalRGrades = allTermStats.reduce((sum, term) => sum + term.rGrades, 0);
    const hasTooManyRs = totalRGrades > 2;

    setCurrentGPA(averageGPA.toFixed(2));

    if (!hasEnoughUnits) {
      setEligibleForHonors("No, not enough units");
      return;
    }

    if (hasTooManyRs) {
      setEligibleForHonors("No, more than 2 R grades");
      return;
    }

    if (averageGPA >= 3.0 && averageGPA <= 4.0) {
      setEligibleForHonors("Yes");
    } else {
      setEligibleForHonors("No");
    }
  }, [termsData]);

  // Run calculation automatically when termStats change
  React.useEffect(() => {
    calculateHonors();
  }, [calculateHonors]);
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
          <h1 className="text-4xl font-normal text-foreground mb-4">
            Honors Calculator
          </h1>
          <p className="text-muted-foreground text-lg">
            Input Subject and Grades Listed in the Table
          </p>
        </div>

  {/* Level selector removed — subject selection is inline in the tables */}

        {/* GPA Display */}
        <div className="flex justify-center mt-8 gap-4">
            <div className="border px-4 py-2 shadow-sm rounded">Current GPA: {currentGPA}</div>
            <div className="border px-4 py-2 shadow-sm rounded">Eligible for Honors: {eligibleForHonors}</div>
        </div>

        {/* Tables */}
         <div className="grid md:grid-cols-3 gap-4 mt-8 justify-center">
            <TermTable 
              term="Term 1" 
              initialRows={termsData["Term 1"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
            <TermTable 
              term="Term 2" 
              initialRows={termsData["Term 2"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
            <TermTable 
              term="Term 3" 
              initialRows={termsData["Term 3"]}
              onStatsChange={handleTermChange}
              onEdge={handleEdge}
            />
        </div>

        {/* Results update live as you edit terms; manual calculate button removed. */}
    
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
