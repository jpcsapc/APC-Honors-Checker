# APC Honors Checker

A Next.js application for calculating academic standing and determining honors eligibility for Asia Pacific College students.

## Features

- **Honors Calculator**: Calculate academic standing for Years 1-4 (12 terms total)
- **Latin Honors Calculator**: Calculate Latin honors (Cum Laude, Magna Cum Laude, Summa Cum Laude)
- **FAQs**: Comprehensive documentation about GPA calculations and honors requirements
- **Feedback System**: Submit bug reports, feature requests, or general comments directly to GitHub Issues
- **Dark Mode**: Full theme support with light/dark mode toggle
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jpcsapc/APC-Honors-Checker.git
cd APC-Honors-Checker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables (required for feedback system):
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your GitHub Personal Access Token:
```env
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=jpcsapc
GITHUB_REPO=APC-Honors-Checker
```

See [FEEDBACK_SYSTEM.md](./FEEDBACK_SYSTEM.md) for detailed setup instructions.

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── feedback/         # GitHub Issues API integration
│   ├── honors/               # Honors calculator (Years 1-4)
│   ├── latin-honors/         # Latin honors calculator
│   ├── faqs/                 # FAQ page
│   ├── feedback/             # Feedback submission form
│   ├── layout.tsx            # Root layout with theme provider
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
├── components/
│   ├── TermTable.tsx         # Reusable term table component
│   ├── theme-provider.tsx    # Theme context provider
│   ├── theme-toggle.tsx      # Dark mode toggle button
│   └── ui/                   # shadcn/ui components
└── lib/
    ├── collegeSubjects.json  # College subject definitions
    ├── shsSubjects.json      # Senior high school subjects
    └── utils.ts              # Utility functions
```

## Documentation

- [Feedback System Setup](./FEEDBACK_SYSTEM.md) - Complete guide for setting up GitHub integration
- [Component Documentation](#components) - Details about key components

## Technologies Used

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)
- **Icons**: [Lucide React](https://lucide.dev/)

## Key Features Explained

### Honors Calculator
- Multi-year tracking (Years 1-4, 3 terms each)
- Automatic GPA calculation per term and per year
- Honors eligibility determination (≥36 units, ≤2 R grades, GPA 3.0-4.0)
- NAT/SER course exclusion from GPA calculations
- LocalStorage persistence for data retention

### Grade Input System
- Validates grades: 0-4.0 numeric, R (fail), NG (no grade)
- Special handling for 0.0 grade
- Rejects invalid decimal formats (e.g., 1.0, 2.0 except 0.0)
- Debounced input for performance optimization
- Arrow key navigation between cells

### Feedback System
- Structured feedback collection (Bug/Feature/General)
- Automatic GitHub issue creation
- Auto-captured user context (browser, OS, screen resolution)
- Optional contact information with consent checkbox
- Real-time form validation
- Success confirmation with issue number

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [GitHub REST API](https://docs.github.com/en/rest)

## Contributing

Contributions are welcome! Please use the feedback system in the app to report bugs or suggest features.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in project settings:
   - `GITHUB_TOKEN` (mark as secret)
   - `GITHUB_OWNER`
   - `GITHUB_REPO`
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Digital Ocean App Platform
- Self-hosted with Docker

Ensure environment variables are configured in your deployment platform.

## License

This project is developed by Junior Philippine Computer Society - Asia Pacific College.

## Credits

Created by the Developers of JPCS - APC:
- Edwin Gumba Jr. (SS221)
- Marwin John Gonzales (IT241)

---

**Note**: This application is for educational purposes and should be used alongside official academic records.
