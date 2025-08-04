"use client"
import * as React from 'react';
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calculator } from "lucide-react"
import { ToggleLevelSelector } from '../../components/ToggleLevelSelector';
import { TermTable } from '../../components/TermTable';


import Link from "next/link"

export default function HonorsCalcu() {
  const [level, setLevel] = React.useState('college');
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-sm text-muted-foreground">Honors Calculator</h1>
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

        {/* Toggle Level Selector */}
        <ToggleLevelSelector value={level} onChange={setLevel} />

        {/* GPA Display */}
        <div className="flex justify-center mt-8 gap-4">
            <div className="border px-4 py-2 shadow-sm rounded">Current GPA: Test</div>
            <div className="border px-4 py-2 shadow-sm rounded">Eligible for Honors: testing one</div>
        </div>

        {/* Tables */}
         <div className="grid md:grid-cols-3 gap-4 mt-8 justify-center">
            <TermTable term="Term 1" level={level as 'shs' | 'college'} />
            <TermTable term="Term 2" level={level as 'shs' | 'college'} />
            <TermTable term="Term 3" level={level as 'shs' | 'college'} />
        </div>
    
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
