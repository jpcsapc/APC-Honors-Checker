"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Award, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function FrontPage() {
  const calculatorCards = [
    {
      title: "Honors Calculator",
      description: "Calculate your academic standing and determine honors eligibility",
      icon: <Award className="h-5 w-5" />,
      href: "/honors",
    },
    {
      title: "Latin Honors Calculator",
      description: "Calculate Latin honors and academic distinctions",
      icon: <Calculator className="h-5 w-5" />,
      href: "/latin-honors",
    },
    {
      title: "FAQs",
      description: "Frequently Asked Questions and help documentation",
      icon: <HelpCircle className="h-5 w-5" />,
      href: "/faqs",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-sm text-muted-foreground">Main Page</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-normal text-foreground mb-4">
            Asia Pacific College
            <br />
            Grades Calculator
          </h1>
          <p className="text-muted-foreground text-lg">calculate and track your academic journey</p>
        </div>

        {/* Calculator Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {calculatorCards.map((card, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {card.icon}
                  {card.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {card.description}
                </p>
              </CardContent>

              <div className="p-6 pt-0">
                <Link href={card.href}>
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <footer className="border-t pt-8">
          <p className="text-center text-xs text-muted-foreground">
            Created by the Developers of JPCS - APC | Edwin Gumba Jr. (SS221) & Marwin John Gonzales (IT241)
          </p>
        </footer>
      </main>
    </div>
  )
}
