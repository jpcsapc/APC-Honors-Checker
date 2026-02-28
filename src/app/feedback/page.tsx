"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessageSquare, CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

interface UserContext {
  browser: string
  os: string
  screenResolution: string
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

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error' | 'cooldown'

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
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(0)
  const [honeypot, setHoneypot] = useState('')

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
      timestamp: new Date().toISOString(),
    })

    // Check for existing cooldown
    const storedCooldown = localStorage.getItem('feedbackCooldown')
    if (storedCooldown) {
      const cooldownTime = parseInt(storedCooldown)
      if (Date.now() < cooldownTime) {
        setCooldownUntil(cooldownTime)
        setStatus('cooldown')
      } else {
        localStorage.removeItem('feedbackCooldown')
      }
    }
  }, [])

  // Cooldown timer
  useEffect(() => {
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000 / 60)
        setCooldownMinutes(remaining)
        
        if (remaining <= 0) {
          setCooldownUntil(null)
          setStatus('idle')
          localStorage.removeItem('feedbackCooldown')
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [cooldownUntil])

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
    } else if (formData.subject.trim().length > 100) {
      errors.subject = 'Subject must not exceed 100 characters'
      isValid = false
    }

    if (!formData.message.trim()) {
      errors.message = 'Detailed message is required'
      isValid = false
    } else if (formData.message.trim().length > 5000) {
      errors.message = 'Message must not exceed 5000 characters'
      isValid = false
    }

    // Check for repeated characters (spam detection)
    const repeatedCharsRegex = /(.)\1{10,}/
    if (repeatedCharsRegex.test(formData.message)) {
      errors.message = 'Message contains invalid repeated characters'
      isValid = false
    }

    // Check for excessive special characters
    const specialCharsCount = (formData.message.match(/[^a-zA-Z0-9\s.,!?;:'"()\-]/g) || []).length
    if (specialCharsCount > formData.message.length * 0.3) {
      errors.message = 'Message contains too many special characters'
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
    
    // Honeypot check (bot detection)
    if (honeypot !== '') {
      // Bot detected - show success but don't actually submit
      setStatus('success')
      setIssueNumber(9999)
      return
    }

    // Check cooldown
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const remainingMinutes = Math.ceil((cooldownUntil - Date.now()) / 1000 / 60)
      setErrorMessage(`Please wait ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} before submitting again.`)
      setStatus('error')
      return
    }

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
        if (response.status === 429) {
          // Rate limit from server
          setErrorMessage(data.error || 'Too many submissions. Please try again later.')
          setStatus('error')
          
          // Set client-side cooldown if server provides one
          if (data.resetIn) {
            const cooldown = Date.now() + (data.resetIn * 60 * 1000)
            setCooldownUntil(cooldown)
            localStorage.setItem('feedbackCooldown', cooldown.toString())
          }
          return
        }
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setStatus('success')
      setIssueNumber(data.issueNumber)
      
      // Set cooldown (3 minutes)
      const cooldown = Date.now() + (3 * 60 * 1000)
      setCooldownUntil(cooldown)
      localStorage.setItem('feedbackCooldown', cooldown.toString())
      
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
                  {issueNumber && issueNumber !== 9999 && (
                    <p className="text-sm text-muted-foreground mb-6">
                      Issue #{issueNumber} has been created in our tracking system.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mb-6">
                    You can submit another feedback in 3 minutes.
                  </p>
                  <Link href="/">
                    <Button variant="outline">
                      Return to Home
                    </Button>
                  </Link>
                </div>
              ) : status === 'cooldown' ? (
                <div className="text-center py-8">
                  <Clock className="h-16 w-16 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Please Wait</h2>
                  <p className="text-muted-foreground mb-4">
                    You can submit another feedback in {cooldownMinutes} minute{cooldownMinutes !== 1 ? 's' : ''}.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    This helps us prevent spam and ensures quality feedback.
                  </p>
                  <Link href="/">
                    <Button variant="outline">
                      Return to Home
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot Field (Hidden from users, visible to bots) */}
                  <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                    <Input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>
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
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.subject.length}/100 characters
                    </p>
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
                      maxLength={5000}
                      autoComplete="off"
                      spellCheck="true"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Supports Markdown formatting (e.g., **bold**, *italic*, `code`)</span>
                      <span>{formData.message.length}/5000</span>
                    </div>
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
          {status !== 'success' && status !== 'cooldown' && (
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
                    <span>Our development team reviews all submissions and prioritizes based on impact and feasibility</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground flex-shrink-0">•</span>
                    <span>If you provided contact information, we may reach out for clarification or updates</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> To prevent spam, you can submit feedback once every 3 minutes.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
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
