"use client"

import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ArrowLeft, HelpCircle, BookOpen, Award } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export default function FAQPage() {
  const faqSections = [
    {
      title: "GPA & Academic Calculations",
      // icon: "📊",
      items: [
        {
          question: "How do I calculate my GPA?",
          answer: "To calculate your GPA, multiply each course grade by its credit units, sum all the results, and divide by the total number of credit units. For example: (3.5 × 3) + (4.0 × 3) + (3.0 × 3) = 31.5 ÷ 9 = 3.5 GPA."
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
          question: "Will my NATSER courses (NATSER1 and NATSER2) be included in my GPA calculation?",
          answer: "NATSER courses are not included in GPA calculations, as they are considered non-academic courses. However, it's best to consult your adviser or check the APC student handbook for more details."
        }
      ]
    },
    {
      title: "Academic Honors & Recognition",
      // icon: "🏆",
      items: [
        {
          question: "What is the difference between Latin Honors and Academic Honors?",
          answer: "Latin Honors (Cum Laude, Magna Cum Laude, Summa Cum Laude) are awarded based on overall GPA at graduation. Academic Honors are semester-based distinctions given to students with excellent performance in a specific term."
        },
        {
          question: "What GPA do I need for Dean's List?",
          answer: "Typically, you need a GPA of 3.5 or higher with no failing grades to qualify for the Dean's List. However, specific requirements may vary by institution and program."
        },
        {
          question: "Can I graduate with honors if I transfer credits?",
          answer: "Transfer credits are typically not included in GPA calculations for honors. Only courses taken at your current institution are usually considered for Latin honors eligibility."
        },
        {
          question: "What are the criteria for Senior High School Academic Excellence Awards?",
          answer: (
            <div className="space-y-4">
              <p>
                As per DepEd Order No. 36, s. 2016 (Policy Guidelines on Awards and Recognition for the K to 12 Basic Education Program) and Asia Pacific College Student Handbook, Academic Excellence Awards are given to students who have attained a General Average of at least 88.00 and no grade lower than 85.00 in all subject areas.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-2">
                <div className="p-3.5 bg-background rounded-lg border text-center">
                  <h4 className="font-semibold text-foreground text-sm mb-1">With Highest Honors</h4>
                  <p className="text-xs text-muted-foreground">General Average of</p>
                  <p className="text-lg font-bold text-primary">97.00 - 100.00</p>
                </div>
                <div className="p-3.5 bg-background rounded-lg border text-center">
                  <h4 className="font-semibold text-foreground text-sm mb-1">With High Honors</h4>
                  <p className="text-xs text-muted-foreground">General Average of</p>
                  <p className="text-lg font-bold text-primary">93.00 - 96.99</p>
                </div>
                <div className="p-3.5 bg-background rounded-lg border text-center">
                  <h4 className="font-semibold text-foreground text-sm mb-1">With Honors</h4>
                  <p className="text-xs text-muted-foreground">General Average of</p>
                  <p className="text-lg font-bold text-primary">88.00 - 92.99</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic mt-2">
                * Note: All awards require a Final Subject Grade of 85.00 or higher in all subjects.
              </p>
            </div>
          )
        }
      ]
    },
    {
      title: "Academic Standing & Policies",
      // icon: "📋",
      items: [
        {
          question: "How do I check my academic standing?",
          answer: "You can check your academic standing through your student portal or by consulting with your academic advisor. The standing is usually updated after each semester."
        },
        {
          question: "What is academic probation?",
          answer: "Academic probation is a warning status given to students whose GPA falls below the minimum requirement (usually 2.0). Students on probation must improve their grades to avoid suspension."
        },
        {
          question: "How often should I check my GPA?",
          answer: "It's recommended to check your GPA after each semester to track your academic progress and ensure you're on track to meet your goals."
        }
      ]
    },
    {
      title: "Academic Support & Resources",
      // icon: "🎓",
      items: [
        {
          question: "What resources are available for academic support?",
          answer: "Most institutions offer tutoring services, academic advising, study groups, and writing centers. Contact your student services office for available resources."
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header title="Frequently Asked Questions" backHref="/" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero — left-aligned with accent bar */}
        <section className="mb-12 pl-6 border-l-[3px] border-primary">
          <h1 className="text-4xl font-medium tracking-tight text-foreground leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Find answers to common questions about academic calculations, honor rules, and student guidelines.
          </p>
        </section>

        {/* Student Handbook Link Callout */}
        <div className="mb-12 p-5 bg-card border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground text-sm">APC Student Handbook</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                For official guidelines and policies, refer to the handbook. Calculations start from page 45, section 4.2.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <a 
              href="https://apc.edu.ph/wp-content/uploads/2024/09/Student-Handbook-2024_v2.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-transform rounded-md"
            >
              View Student Handbook (PDF)
            </a>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {faqSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground">
                  {section.title}
                </h2>
              </div>

              {/* Divider */}
              <div className="border-b border-border mb-3"></div>

              {/* Section Accordion */}
              <Accordion
                type="multiple"
                className="w-full"
              >
                {section.items.map((item, itemIndex) => (
                  <AccordionItem key={itemIndex} value={`section-${sectionIndex}-item-${itemIndex}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

      </main>
      <Footer />
    </div>
  )
} 