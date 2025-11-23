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
    currentUrl: string
    timestamp: string
  }
}

interface GitHubIssueResponse {
  number: number
  html_url: string
}

// Map feedback types to GitHub labels
const FEEDBACK_TYPE_TO_LABEL: Record<string, string> = {
  bug: 'bug',
  feature: 'enhancement',
  general: 'question',
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: FeedbackRequest = await request.json()

    // Validate required fields
    if (!body.feedbackType || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
- **Page URL:** ${body.userContext.currentUrl}
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
      console.error('GitHub API error:', errorData)
      
      // Don't expose detailed GitHub errors to client
      return NextResponse.json(
        { error: 'Failed to create issue in tracking system' },
        { status: 500 }
      )
    }

    const issueData: GitHubIssueResponse = await githubResponse.json()

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
