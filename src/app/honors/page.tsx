"use client"

import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft, HelpCircle, Calculator } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setOpenItem(openItem === index ? null : index)
  }

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
            <h1 className="text-sm text-muted-foreground">Frequently Asked Questions</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
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

        {/* Footer */}
        <footer className="border-t pt-8 mt-16">
          <p className="text-center text-xs text-muted-foreground">
            Created by the Developers of JPCS - APC | Edwin Gumba Jr. (SS221) & Marwin John Gonzales (IT241)
          </p>
        </footer>
      </main>
    </div>
  )
} 