"use client"

import { Button } from "@/components/ui/button"
import { Award, HelpCircle, MessageSquare, ArrowRightLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function FrontPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            APC Honors Checker
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero — left-aligned with accent bar */}
        <section className="mb-16 pl-6 border-l-[3px] border-primary">
          <h1 className="text-4xl font-medium tracking-tight text-foreground leading-tight">
            Asia Pacific College
            <br />
            Grades Calculator
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-lg">
            Calculate and track your academic standing, honors eligibility, and graduation requirements.
          </p>
        </section>

        {/* Primary tools — featured, larger */}
        <section className="mb-8">
          <div className="grid md:grid-cols-2 gap-5">
            {/* Grades Calculator — primary */}
            <Link href="/honors" className="group block">
              <div className="border border-border rounded-lg p-6 bg-card hover:border-primary/40 transition-colors h-full flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="h-5 w-5 text-primary shrink-0" />
                  <h2 className="text-lg font-medium text-foreground">Grades Calculator</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  Calculate your academic standing, honors eligibility, and latin honors eligibility based on your grades.
                </p>
                <div>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform">
                    Open Calculator
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Link>

            {/* SHS Calculator — primary */}
            <Link href="/honors-shs" className="group block">
              <div className="border border-border rounded-lg p-6 bg-card hover:border-primary/40 transition-colors h-full flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="h-5 w-5 text-primary shrink-0" />
                  <h2 className="text-lg font-medium text-foreground">SHS Grades Calculator</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  Calculate your academic standing and honors eligibility based on your grades for Senior High School.
                </p>
                <div>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform">
                    Open Calculator
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Secondary tools — smaller row */}
        <section className="mb-20">
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Grade Converter */}
            <Link href="/grade-converter" className="group block">
              <div className="border border-border rounded-lg p-5 bg-card hover:border-primary/40 transition-colors h-full">
                <div className="flex items-center gap-2.5 mb-2">
                  <ArrowRightLeft className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="text-sm font-medium text-foreground">Grade Converter</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Convert between APC, UP, and Percentage grading systems.
                </p>
              </div>
            </Link>

            {/* FAQs */}
            <Link href="/faqs" className="group block">
              <div className="border border-border rounded-lg p-5 bg-card hover:border-primary/40 transition-colors h-full">
                <div className="flex items-center gap-2.5 mb-2">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="text-sm font-medium text-foreground">FAQs</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Frequently asked questions and help documentation.
                </p>
              </div>
            </Link>

            {/* Feedback */}
            <Link href="/feedback" className="group block">
              <div className="border border-border rounded-lg p-5 bg-card hover:border-primary/40 transition-colors h-full">
                <div className="flex items-center gap-2.5 mb-2">
                  <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="text-sm font-medium text-foreground">Submit Feedback</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Share your experience, report bugs, or suggest new features.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-8">
          <p className="text-xs text-muted-foreground">
            Created by the Developers of JPCS - APC | Edwin Gumba Jr. (SS221) &amp; Marwin John Gonzales (IT241)
          </p>
        </footer>
      </main>
    </div>
  )
}
