"use client"
import * as React from 'react';
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calculator } from "lucide-react"
// ToggleLevelSelector removed — level selector no longer used (course selection is inline)
import { TermTable } from '../../components/TermTable';


import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

interface TermStats {
  gpa: number;
  totalHonorPoints: number;
  totalUnits: number;
  rGrades: number;
}

export default function HonorsCalcu() {
  const [level] = React.useState('college');
  const [termStats, setTermStats] = React.useState<Record<string, TermStats>>({});
  const [currentGPA, setCurrentGPA] = React.useState("0.00");
  const [eligibleForHonors, setEligibleForHonors] = React.useState("-");

  const handleStatsChange = React.useCallback((term: string, stats: TermStats) => {
    setTermStats(prev => ({
      ...prev,
      [term]: stats
    }));
  }, []);

  const calculateHonors = React.useCallback(() => {
    const terms = Object.values(termStats);

    if (terms.length === 0) {
      setCurrentGPA("0.00");
      setEligibleForHonors("-");
      return;
    }

    // Calculate average GPA across all terms
    const totalGPA = terms.reduce((sum, term) => sum + term.gpa, 0); // Sum of GPAs
    const averageGPA = totalGPA / terms.length; // Calculate average GPA

    // Calculate total units across all terms
    const totalUnits = terms.reduce((sum, term) => sum + term.totalUnits, 0);
    const hasEnoughUnits = totalUnits >= 36; // 36 units required for honors

    // Calculate total R grades across all terms
    const totalRGrades = terms.reduce((sum, term) => sum + term.rGrades, 0);
    const hasTooManyRs = totalRGrades > 2; // Maximum 2 R grades allowed (2 or more is too many)

    setCurrentGPA(averageGPA.toFixed(2));

    if (!hasEnoughUnits){
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
  }, [termStats]);

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
              level={level as 'shs' | 'college'} 
              onStatsChange={handleStatsChange}
            />
            <TermTable 
              term="Term 2" 
              level={level as 'shs' | 'college'} 
              onStatsChange={handleStatsChange}
            />
            <TermTable 
              term="Term 3" 
              level={level as 'shs' | 'college'} 
              onStatsChange={handleStatsChange}
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
