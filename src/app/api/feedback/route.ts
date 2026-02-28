import { NextRequest, NextResponse } from 'next/server'

interface FeedbackRequest {
  feedbackType: string
  subject: string
  message: string
  contactInfo?: string
  consent: boolean
  userContext: {
    browser: string
    os: string
    screenResolution: string
    timestamp: string
  }
}

interface GitHubIssueResponse {
  number: number
  html_url: string
}

// Simple in-memory rate limiting (for single server instances)
// For production with multiple servers, consider Redis or a database
const submissionTracker = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of submissionTracker.entries()) {
    if (now > data.resetTime) {
      submissionTracker.delete(ip)
    }
  }
}, 60 * 60 * 1000)

function checkRateLimit(ip: string): { allowed: boolean; resetIn?: number } {
  const now = Date.now()
  const windowMs = 3 * 60 * 1000 // 3 minute window
  const maxSubmissions = 1 // Max 1 submission per 3 minutes per IP

  const tracker = submissionTracker.get(ip)

  if (!tracker || now > tracker.resetTime) {
    // First submission or window expired
    submissionTracker.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true }
  }

  if (tracker.count >= maxSubmissions) {
    // Rate limit exceeded
    const resetIn = Math.ceil((tracker.resetTime - now) / 1000 / 60) // minutes
    return { allowed: false, resetIn }
  }

  // Increment count
  tracker.count++
  return { allowed: true }
}

// Map feedback types to GitHub labels
const FEEDBACK_TYPE_TO_LABEL: Record<string, string> = {
  bug: 'bug',
  feature: 'enhancement',
  general: 'question',
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP address
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown'

    // Check rate limit
    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        {
          error: `Too many submissions. Please try again in ${rateLimit.resetIn} minutes.`,
          code: 'RATE_LIMIT_EXCEEDED',
          resetIn: rateLimit.resetIn,
        },
        { status: 429 }
      )
    }

    // Parse request body
    const body: FeedbackRequest = await request.json()

    // Validate required fields
    if (!body.feedbackType || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Additional server-side content validation
    if (body.subject.trim().length > 100) {
      return NextResponse.json(
        { error: 'Subject must not exceed 100 characters' },
        { status: 400 }
      )
    }

    if (body.message.trim().length > 5000) {
      return NextResponse.json(
        { error: 'Message must not exceed 5000 characters' },
        { status: 400 }
      )
    }

    // Check for spam patterns
    const repeatedCharsRegex = /(.)\1{10,}/
    if (repeatedCharsRegex.test(body.message)) {
      return NextResponse.json(
        { error: 'Invalid content detected' },
        { status: 400 }
      )
    }

    // Validate consent if contact info provided
    if (body.contactInfo && !body.consent) {
      return NextResponse.json(
        { error: 'Consent required when providing contact information' },
        { status: 400 }
      )
    }

    // Sanitize inputs to prevent injection attacks
    const sanitizedSubject = body.subject.trim().substring(0, 100)
    const sanitizedMessage = body.message.trim()

    // Build issue body with user context
    const issueBody = `
${sanitizedMessage}

---

### System Information
- **Browser:** ${body.userContext.browser}
- **OS:** ${body.userContext.os}
- **Screen Resolution:** ${body.userContext.screenResolution}
- **Timestamp:** ${body.userContext.timestamp}

${body.contactInfo ? `### Contact Information\n${body.contactInfo}\n` : ''}

---
*This issue was automatically created via the feedback form.*
`

    // Determine label based on feedback type
    const label = FEEDBACK_TYPE_TO_LABEL[body.feedbackType] || 'question'

    // GitHub API configuration
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const GITHUB_OWNER = process.env.GITHUB_OWNER || 'jpcsapc'
    const GITHUB_REPO = process.env.GITHUB_REPO || 'APC-Honors-Checker'

    if (!GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN not configured')
      return NextResponse.json(
        { error: 'Server configuration error: GitHub token not set' },
        { status: 500 }
      )
    }

    // Create GitHub issue
    const githubResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'APC-Honors-Checker-Feedback-Bot',
        },
        body: JSON.stringify({
          title: `[Feedback] ${sanitizedSubject}`,
          body: issueBody,
          labels: [label, 'user-feedback'],
        }),
      }
    )

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json()
      console.error('GitHub API error:', {
        status: githubResponse.status,
        statusText: githubResponse.statusText,
        error: errorData
      })
      
      // Provide more helpful error message for common issues
      if (githubResponse.status === 403) {
        return NextResponse.json(
          { error: 'GitHub token lacks necessary permissions. Please check token scopes and organization settings.' },
          { status: 500 }
        )
      }
      
      // Don't expose detailed GitHub errors to client
      return NextResponse.json(
        { error: 'Failed to create issue in tracking system' },
        { status: 500 }
      )
    }

    const issueData: GitHubIssueResponse = await githubResponse.json()

    console.log(`Feedback submitted successfully: Issue #${issueData.number} created by IP ${ip}`)

    return NextResponse.json({
      success: true,
      issueNumber: issueData.number,
      issueUrl: issueData.html_url,
      message: 'Feedback submitted successfully',
    })

  } catch (error) {
    console.error('Feedback submission error:', error)
    
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your feedback' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
