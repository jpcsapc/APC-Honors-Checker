"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageSquare, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

interface UserContext {
  browser: string
  os: string
  screenResolution: string
  currentUrl: string
  timestamp: string
}

interface FormData {
  feedbackType: string
  subject: string
  message: string
  contactInfo: string
  consent: boolean
}

interface FormErrors {
  feedbackType?: string
  subject?: string
  message?: string
  consent?: string
}

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function FeedbackPage() {
  const [formData, setFormData] = useState<FormData>({
    feedbackType: '',
    subject: '',
    message: '',
    contactInfo: '',
    consent: false,
  })

  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [status, setStatus] = useState<SubmissionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [issueNumber, setIssueNumber] = useState<number | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Capture user context on component mount
  useEffect(() => {
    const getBrowserInfo = () => {
      const ua = navigator.userAgent
      let browserName = 'Unknown'
      
      if (ua.includes('Firefox')) browserName = 'Firefox'
      else if (ua.includes('Chrome')) browserName = 'Chrome'
      else if (ua.includes('Safari')) browserName = 'Safari'
      else if (ua.includes('Edge')) browserName = 'Edge'
      else if (ua.includes('Opera')) browserName = 'Opera'
      
      return browserName
    }

    const getOSInfo = () => {
      const ua = navigator.userAgent
      let osName = 'Unknown'
      
      if (ua.includes('Win')) osName = 'Windows'
      else if (ua.includes('Mac')) osName = 'macOS'
      else if (ua.includes('Linux')) osName = 'Linux'
      else if (ua.includes('Android')) osName = 'Android'
      else if (ua.includes('iOS')) osName = 'iOS'
      
      return osName
    }

    setUserContext({
      browser: getBrowserInfo(),
      os: getOSInfo(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString(),
    })
  }, [])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    let isValid = true

    if (!formData.feedbackType) {
      errors.feedbackType = 'Please select a feedback type'
      isValid = false
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required'
      isValid = false
    }

    if (!formData.message.trim()) {
      errors.message = 'Detailed message is required'
      isValid = false
    }

    if (formData.contactInfo.trim() && !formData.consent) {
      errors.consent = 'Please consent to be contacted if you provide contact information'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userContext,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setStatus('success')
      setIssueNumber(data.issueNumber)
      
      // Reset form
      setFormData({
        feedbackType: '',
        subject: '',
        message: '',
        contactInfo: '',
        consent: false,
      })
      setFormErrors({})
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (field !== 'contactInfo' && field !== 'consent' && formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

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
              <h1 className="text-sm text-muted-foreground">Submit Feedback</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-normal text-foreground mb-4">
            Submit Feedback
          </h1>
          <p className="text-muted-foreground text-lg">
            Help us improve by sharing your experience, reporting bugs, or suggesting features
          </p>
        </div>

        {/* Feedback Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Form</CardTitle>
            </CardHeader>
            <CardContent>
              {status === 'success' ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
                  <p className="text-muted-foreground mb-4">
                    Your feedback has been successfully submitted.
                  </p>
                  {issueNumber && (
                    <p className="text-sm text-muted-foreground mb-6">
                      Issue #{issueNumber} has been created in our tracking system.
                    </p>
                  )}
                  <Button onClick={() => setStatus('idle')} variant="outline">
                    Submit Another Feedback
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Feedback Type */}
                  <div className="space-y-2">
                    <Label htmlFor="feedbackType">
                      Feedback Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      id="feedbackType"
                      value={formData.feedbackType}
                      onChange={(e) => handleInputChange('feedbackType', e.target.value)}
                      disabled={status === 'submitting'}
                    >
                      <option value="">Select a type...</option>
                      <option value="bug">Bug Report</option>
                      <option value="feature">Feature Request</option>
                      <option value="general">General Comment</option>
                    </Select>
                    {formErrors.feedbackType && (
                      <p className="text-sm text-red-500">{formErrors.feedbackType}</p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Brief summary of your feedback"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      disabled={status === 'submitting'}
                      maxLength={100}
                    />
                    {formErrors.subject && (
                      <p className="text-sm text-red-500">{formErrors.subject}</p>
                    )}
                  </div>

                  {/* Detailed Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Detailed Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Please provide as much detail as possible. You can use markdown formatting."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      disabled={status === 'submitting'}
                      rows={8}
                      className="resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports Markdown formatting (e.g., **bold**, *italic*, `code`)
                    </p>
                    {formErrors.message && (
                      <p className="text-sm text-red-500">{formErrors.message}</p>
                    )}
                  </div>

                  {/* Contact Info (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="contactInfo">
                      Contact Information (Optional)
                    </Label>
                    <Input
                      id="contactInfo"
                      placeholder="Email or username for follow-up"
                      value={formData.contactInfo}
                      onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                      disabled={status === 'submitting'}
                    />
                    {formData.contactInfo.trim() && (
                      <div className="flex items-start gap-2 mt-2">
                        <Checkbox
                          id="consent"
                          checked={formData.consent}
                          onChange={(e) => handleInputChange('consent', (e.target as HTMLInputElement).checked)}
                          disabled={status === 'submitting'}
                        />
                        <Label htmlFor="consent" className="text-xs font-normal cursor-pointer">
                          I consent to be contacted regarding this feedback
                        </Label>
                      </div>
                    )}
                    {formErrors.consent && (
                      <p className="text-sm text-red-500">{formErrors.consent}</p>
                    )}
                  </div>

                  {/* User Context Display */}
                  {userContext && (
                    <div className="space-y-2">
                      <Label>System Information (Auto-captured)</Label>
                      <div className="bg-muted/50 rounded-md p-4 text-xs space-y-1">
                        <p><span className="font-medium">Browser:</span> {userContext.browser}</p>
                        <p><span className="font-medium">OS:</span> {userContext.os}</p>
                        <p><span className="font-medium">Screen:</span> {userContext.screenResolution}</p>
                        <p className="text-muted-foreground text-xs mt-2">
                          This information helps us diagnose issues more effectively
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {status === 'error' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-100">Submission Failed</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3">
                    <Link href="/">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={status === 'submitting'}
                      >
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="min-w-[120px]"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Feedback'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Information Box */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">What happens after submission?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-foreground flex-shrink-0">•</span>
                  <span>Your feedback is automatically converted into a GitHub Issue in our development repository</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground flex-shrink-0">•</span>
                  <span>You&apos;ll receive an issue number for reference and tracking purposes</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground flex-shrink-0">•</span>
                  <span>Our development team reviews all submissions and prioritizes based on impact and feasibility</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-foreground flex-shrink-0">•</span>
                  <span>If you provided contact information, we may reach out for clarification or updates</span>
                </li>
              </ul>
            </CardContent>
          </Card>
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
