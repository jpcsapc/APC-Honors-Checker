"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Calculator, Award, HelpCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function FrontPage() {
  const calculatorCards = [
    {
      title: "Honors Calculator",
      description: "Calculate your academic standing and determine honors eligibility",
      icon: <Award className="h-6 w-6" />,
      href: "/honors",
    },
    {
      title: "Latin Honors Calculator",
      description: "Calculate Latin honors and academic distinctions",
      icon: <Calculator className="h-6 w-6" />,
      href: "/latin-honors",
    },
    {
      title: "FAQs",
      description: "Frequently Asked Questions and help documentation",
      icon: <HelpCircle className="h-6 w-6" />,
      href: "/faqs",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="text-sm font-medium tracking-wide text-primary">APC HONORS CHECKER</div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-6">
        <div className="text-center py-24">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-light text-foreground tracking-tight leading-tight">
              <span className="text-primary">Asia Pacific College</span>
              <br />
              <span className="text-foreground/70">Grades Calculator</span>
            </h1>
            <div className="w-16 h-px bg-primary/30 mx-auto"></div>
            <p className="text-muted-foreground text-lg font-light tracking-wide">
              Calculate and track your academic journey
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {calculatorCards.map((card, index) => (
            <Link key={index} href={card.href} className="group">
              <Card className="h-full border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                      <div className="text-foreground group-hover:text-primary transition-colors">{card.icon}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl font-medium text-foreground group-hover:text-primary tracking-tight transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

      <div className="flex justify-center mb-10">
          <a
            href="https://forms.office.com/r/0vGQMsjQxC"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 text-sm font-medium border border-gray-400 text-gray-600 rounded-md hover:bg-blue-50 transition"
          >
            Feedback Form
          </a>
        </div>


        <footer className="border-t border-border/40 py-12">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground tracking-wide">CREATED BY THE DEVELOPERS OF JPCS - APC</p>
            <p className="text-xs text-muted-foreground/70">Edwin Gumba Jr. (SS221) & Marwin John Gonzales (IT241)</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
