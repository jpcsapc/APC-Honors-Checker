"use client"

import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ArrowLeft, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function FAQPage() {
  const faqItems = [
    {
      question: "How do I calculate my GPA?",
      answer: "To calculate your GPA, multiply each course grade by its credit units, sum all the results, and divide by the total number of credit units. For example: (3.5 × 3) + (4.0 × 3) + (3.0 × 3) = 31.5 ÷ 9 = 3.5 GPA."
    },
    {
      question: "What is the difference between Latin Honors and Academic Honors?",
      answer: "Latin Honors (Cum Laude, Magna Cum Laude, Summa Cum Laude) are awarded based on overall GPA at graduation. Academic Honors are semester-based distinctions given to students with excellent performance in a specific term."
    },
    {
      question: "What GPA do I need for Dean's List?",
      answer: "Typically, you need a GPA of 3.5 or higher with no failing grades to qualify for the Dean's List. However, specific requirements may vary by institution and program."
    },
    {
      question: "How do I calculate my cumulative GPA?",
      answer: "Cumulative GPA is calculated using all courses taken throughout your academic career. Add up all quality points (grade × credit units) and divide by total credit units attempted."
    },
    {
      question: "What happens if I fail a course?",
      answer: "Failing a course typically results in 0 quality points, which significantly impacts your GPA. You may need to retake the course to improve your academic standing and meet graduation requirements."
    },
    {
      question: "How do I check my academic standing?",
      answer: "You can check your academic standing through your student portal or by consulting with your academic advisor. The standing is usually updated after each semester."
    },
    {
      question: "What is academic probation?",
      answer: "Academic probation is a warning status given to students whose GPA falls below the minimum requirement (usually 2.0). Students on probation must improve their grades to avoid suspension."
    },
    {
      question: "Can I graduate with honors if I transfer credits?",
      answer: "Transfer credits are typically not included in GPA calculations for honors. Only courses taken at your current institution are usually considered for Latin honors eligibility."
    },
    {
      question: "How often should I check my GPA?",
      answer: "It's recommended to check your GPA after each semester to track your academic progress and ensure you're on track to meet your goals."
    },
    {
      question: "What resources are available for academic support?",
      answer: "Most institutions offer tutoring services, academic advising, study groups, and writing centers. Contact your student services office for available resources."
    }
  ]

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
            <HelpCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-normal text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-lg">
            Find answers to common questions about academic calculations and honors
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          <Accordion
            type="single"
            collapsible
            className="w-full"
          >
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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