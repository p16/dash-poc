# Front-End Implementation Guide

This guide provides step-by-step instructions for developers to implement the UI/UX specification defined in `front-end-spec.md`.

---

## Table of Contents

1. [Setup & Dependencies](#setup--dependencies)
2. [Design System Configuration](#design-system-configuration)
3. [Component Implementation Order](#component-implementation-order)
4. [Screen-by-Screen Implementation](#screen-by-screen-implementation)
5. [Testing Strategy](#testing-strategy)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Setup & Dependencies

### 1. Install shadcn/ui

```bash
npx shadcn-ui@latest init
```

**Configuration prompts:**
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Import alias: @/components

### 2. Install Required shadcn/ui Components

```bash
# Core components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add separator
```

### 3. Install Additional Dependencies

```bash
npm install lucide-react         # Icons
npm install @tanstack/react-table # Advanced table features (optional)
npm install date-fns             # Date formatting
```

### 4. Configure Tailwind with Brand Colors

Edit `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#4F46E5", // Indigo-600
          foreground: "#FFFFFF",
          hover: "#4338CA", // Indigo-700
        },
        success: {
          DEFAULT: "#10B981", // Green-500
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber-500
          foreground: "#FFFFFF",
        },
        error: {
          DEFAULT: "#EF4444", // Red-500
          foreground: "#FFFFFF",
        },
        // ... rest of shadcn defaults
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

### 5. Add Inter Font to Next.js

Edit `src/app/layout.tsx`:

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

---

## Design System Configuration

### Global CSS Variables

Add to `src/app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Brand colors */
    --primary: 239 68% 58%; /* #4F46E5 in HSL */
    --primary-hover: 239 67% 51%; /* #4338CA in HSL */
    --success: 158 64% 52%; /* #10B981 */
    --warning: 38 92% 50%; /* #F59E0B */
    --error: 0 84% 60%; /* #EF4444 */

    /* Neutrals */
    --background: 210 20% 98%; /* #F9FAFB */
    --foreground: 217 33% 17%; /* #111827 */

    /* Spacing */
    --container-padding: 2rem;
    --section-spacing: 2rem;
  }
}

@layer components {
  .container-custom {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}
```

---

## Component Implementation Order

Implement components in this dependency order:

### Phase 1: Foundation (Day 1)
1. ✅ **DashboardHeader** - Used on all pages
2. ✅ **Breadcrumbs** - Used on all non-home pages
3. ✅ **DataFreshnessBanner** - Used on dashboard home

### Phase 2: Dashboard Home (Day 2-3)
4. ✅ **ScrapeStatusCard** - Dashboard widget
5. ✅ **AnalysisDisplay** - Dashboard widget (reusable)
6. ✅ **QuickActionCard** - Dashboard navigation
7. ✅ **Dashboard Home Page** - Compose all above

### Phase 3: Comparison Page (Day 4-5)
8. ✅ **BrandSelector** - Dropdown component
9. ✅ **ComparisonResults** - Results display
10. ✅ **RecentAnalysesList** - History sidebar
11. ✅ **Custom Comparison Page** - Compose all above

### Phase 4: Plans Table (Day 6)
12. ✅ **PlanFilterBar** - Filter controls
13. ✅ **PlanDataTable** - Sortable table
14. ✅ **Plan Data Page** - Compose above

### Phase 5: Supporting Pages (Day 7)
15. ✅ **Login Page** - Authentication
16. ✅ **Dedicated Analysis Page** - Detail view
17. ✅ **Mobile Fallback** - Unsupported device message

---

## Screen-by-Screen Implementation

### 1. Dashboard Header Component

**File:** `src/components/dashboard/DashboardHeader.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function DashboardHeader() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Compare', href: '/dashboard/comparison' },
    { label: 'Plans', href: '/dashboard/plans' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-custom flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">
            Scrape & Compare
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>
    </header>
  )
}
```

---

### 2. Data Freshness Banner

**File:** `src/components/dashboard/DataFreshnessBanner.tsx`

```typescript
import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DataFreshnessBannerProps {
  lastScrapedAt: Date | null
}

export function DataFreshnessBanner({ lastScrapedAt }: DataFreshnessBannerProps) {
  if (!lastScrapedAt) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No data available. Run a scrape to get started.
        </AlertDescription>
      </Alert>
    )
  }

  const hoursSinceLastScrape =
    (Date.now() - lastScrapedAt.getTime()) / (1000 * 60 * 60)

  const isStale = hoursSinceLastScrape > 24
  const timeAgo = formatDistanceToNow(lastScrapedAt, { addSuffix: true })

  return (
    <Alert
      variant={isStale ? "default" : "default"}
      className={`mb-6 ${isStale ? 'border-warning bg-warning/10' : 'border-success bg-success/10'}`}
    >
      {isStale ? (
        <AlertCircle className="h-4 w-4 text-warning" />
      ) : (
        <CheckCircle2 className="h-4 w-4 text-success" />
      )}
      <AlertDescription className={isStale ? 'text-warning-foreground' : 'text-success-foreground'}>
        Last scraped {timeAgo}
        {isStale && ' - Consider running a fresh scrape'}
      </AlertDescription>
    </Alert>
  )
}
```

---

### 3. Scrape Status Card

**File:** `src/components/dashboard/ScrapeStatusCard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ScrapeStatusCardProps {
  planCount: number
  lastScrapedAt: Date | null
}

export function ScrapeStatusCard({ planCount, lastScrapedAt }: ScrapeStatusCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleScrape = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Scrape failed')
      }

      toast({
        title: "Scrape started",
        description: "Data collection is running in the background (5-10 minutes)",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start scrape. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Database className="mr-2 h-5 w-5" />
          Scrape Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-2xl font-bold">{planCount}</p>
          <p className="text-sm text-muted-foreground">Total plans in database</p>
        </div>

        {lastScrapedAt && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastScrapedAt.toLocaleString()}
          </p>
        )}

        <Button
          onClick={handleScrape}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Scrape Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

### 4. Analysis Display Component

**File:** `src/components/dashboard/AnalysisDisplay.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Analysis {
  id: string
  brandA: string
  brandB: string | null
  insights: string
  createdAt: Date
  isCached?: boolean
}

interface AnalysisDisplayProps {
  analysis: Analysis | null
}

export function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Analysis</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No analyses yet
          </p>
          <Link href="/dashboard/comparison">
            <Button>
              Run Your First Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Parse insights to show preview (first 3 points)
  const insightLines = analysis.insights.split('\n').filter(line => line.trim())
  const previewInsights = insightLines.slice(0, 3)

  const comparisonTitle = analysis.brandB
    ? `${analysis.brandA} vs ${analysis.brandB}`
    : `${analysis.brandA} vs All Competitors`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Latest Analysis</CardTitle>
          {analysis.isCached && (
            <Badge variant="outline" className="bg-success/10 text-success">
              Cached Result
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">{comparisonTitle}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            Generated {formatDistanceToNow(analysis.createdAt, { addSuffix: true })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Top Insights:</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {previewInsights.map((insight, idx) => (
              <li key={idx}>{insight}</li>
            ))}
          </ul>
        </div>

        <Link href={`/dashboard/analysis/${analysis.id}`}>
          <Button variant="outline" className="w-full">
            View Full Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
```

---

### 5. Dashboard Home Page

**File:** `src/app/dashboard/page.tsx`

```typescript
import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DataFreshnessBanner } from '@/components/dashboard/DataFreshnessBanner'
import { ScrapeStatusCard } from '@/components/dashboard/ScrapeStatusCard'
import { AnalysisDisplay } from '@/components/dashboard/AnalysisDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, BarChart3, Table2 } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

// Data fetching functions
async function getDashboardData() {
  // TODO: Replace with actual database queries
  const planCount = 356 // await db.query.plans.count()
  const lastScrapedAt = new Date() // await getLastScrapeTimestamp()
  const latestAnalysis = null // await getLatestAnalysis()

  return { planCount, lastScrapedAt, latestAnalysis }
}

function QuickActionCard({
  title,
  href,
  icon: Icon
}: {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <Icon className="mr-2 h-5 w-5 text-primary" />
              {title}
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  )
}

async function DashboardContent() {
  const { planCount, lastScrapedAt, latestAnalysis } = await getDashboardData()

  return (
    <>
      <DataFreshnessBanner lastScrapedAt={lastScrapedAt} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <ScrapeStatusCard
            planCount={planCount}
            lastScrapedAt={lastScrapedAt}
          />
        </div>
        <div className="lg:col-span-2">
          <AnalysisDisplay analysis={latestAnalysis} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickActionCard
            title="Compare Brands"
            href="/dashboard/comparison"
            icon={BarChart3}
          />
          <QuickActionCard
            title="Browse Plans"
            href="/dashboard/plans"
            icon={Table2}
          />
        </div>
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48 lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  )
}
```

---

### 6. Custom Comparison Page

**File:** `src/app/dashboard/comparison/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs'

const BRANDS = [
  'O2', 'Vodafone', 'Three', 'EE', 'Sky', 'Tesco', 'Smarty', 'Giffgaff'
]

export default function ComparisonPage() {
  const [brandA, setBrandA] = useState<string>('')
  const [brandB, setBrandB] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleCompare = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandA, brandB }),
      })

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Comparison failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isValid = brandA && brandB && brandA !== brandB

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container-custom py-8">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Brand Comparison' }
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Panel: Comparison Tool */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle>Comparison Tool</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Brand A
                  </label>
                  <Select value={brandA} onValueChange={setBrandA}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map(brand => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <span className="text-2xl text-muted-foreground">↕</span>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Brand B
                  </label>
                  <Select value={brandB} onValueChange={setBrandB}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map(brand => (
                        <SelectItem
                          key={brand}
                          value={brand}
                          disabled={brand === brandA}
                        >
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCompare}
                  disabled={!isValid || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Compare Brands'
                  )}
                </Button>

                {/* Recent Analyses */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Recent Analyses</h3>
                  {/* TODO: Fetch and display recent comparisons */}
                  <p className="text-xs text-muted-foreground">
                    No recent comparisons
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-2">
            {!results && !isLoading && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    Select two brands and click Compare to see insights
                  </p>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <Card>
                <CardContent className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing data... This may take 4-5 minutes
                  </p>
                </CardContent>
              </Card>
            )}

            {results && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {brandA} vs {brandB}
                    </CardTitle>
                    {results.isCached && (
                      <Badge variant="outline" className="bg-success/10">
                        Cached Result
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {results.insights}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
```

---

### 7. Plan Data Table Page

**File:** `src/app/dashboard/plans/page.tsx`

```typescript
import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { PlanDataTable } from '@/components/dashboard/PlanDataTable'
import { Skeleton } from '@/components/ui/skeleton'

async function getPlans() {
  // TODO: Replace with actual database query
  // return await db.query.plans.findMany()
  return []
}

async function PlansContent() {
  const plans = await getPlans()

  return (
    <Card>
      <div className="p-4 border-b flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {plans.length} plans
        </p>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <PlanDataTable data={plans} />
    </Card>
  )
}

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container-custom py-8">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Plan Data' }
        ]} />

        <h1 className="text-3xl font-bold my-6">Plan Data</h1>

        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <PlansContent />
        </Suspense>
      </main>
    </div>
  )
}
```

**File:** `src/components/dashboard/PlanDataTable.tsx`

```typescript
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Plan {
  id: string
  brand: string
  name: string
  dataAllowance: string
  price: number
  contractLength: number
  features: string[]
}

interface PlanDataTableProps {
  data: Plan[]
}

export function PlanDataTable({ data }: PlanDataTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No plan data available. Run a scrape to collect data.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Brand</TableHead>
            <TableHead>Plan Name</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Contract</TableHead>
            <TableHead>Features</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.brand}</TableCell>
              <TableCell>{plan.name}</TableCell>
              <TableCell>{plan.dataAllowance}</TableCell>
              <TableCell>£{plan.price.toFixed(2)}</TableCell>
              <TableCell>{plan.contractLength} months</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

---

## Testing Strategy

### Unit Tests

```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

**Example test:** `src/components/dashboard/__tests__/ScrapeStatusCard.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ScrapeStatusCard } from '../ScrapeStatusCard'

describe('ScrapeStatusCard', () => {
  it('renders plan count correctly', () => {
    render(<ScrapeStatusCard planCount={356} lastScrapedAt={new Date()} />)
    expect(screen.getByText('356')).toBeInTheDocument()
  })

  it('triggers scrape on button click', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ) as jest.Mock

    render(<ScrapeStatusCard planCount={356} lastScrapedAt={new Date()} />)

    const button = screen.getByRole('button', { name: /scrape data/i })
    fireEvent.click(button)

    expect(global.fetch).toHaveBeenCalledWith('/api/scrape', {
      method: 'POST',
    })
  })
})
```

### Visual Testing (Optional)

```bash
npm install -D @storybook/react @storybook/addon-essentials
```

Create stories for each component in `*.stories.tsx` files.

---

## Common Patterns

### 1. Loading States

```typescript
import { Loader2 } from 'lucide-react'

{isLoading ? (
  <Loader2 className="h-4 w-4 animate-spin" />
) : (
  'Button Text'
)}
```

### 2. Empty States

```typescript
<div className="text-center py-12">
  <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
  <p className="text-muted-foreground mb-4">No data available</p>
  <Button>Take Action</Button>
</div>
```

### 3. Error Handling

```typescript
import { useToast } from '@/components/ui/use-toast'

const { toast } = useToast()

try {
  // ... operation
} catch (error) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive",
  })
}
```

### 4. Responsive Grid Layout

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

---

## Troubleshooting

### Issue: Tailwind classes not working

**Solution:** Ensure `content` paths in `tailwind.config.ts` match your file structure.

### Issue: shadcn/ui components not styled

**Solution:** Check that `globals.css` imports are in correct order and CSS variables are defined.

### Issue: Font not loading

**Solution:** Verify Next.js font optimization setup in `layout.tsx` and `tailwind.config.ts`.

### Issue: Fetch errors in development

**Solution:** Check `.env.local` has correct API URLs and database connection strings.

---

## Next Steps After Implementation

1. **Visual QA:** Compare implemented UI with wireframes in `front-end-spec.md`
2. **User Testing:** Get feedback from target personas (Pricing Analyst, Product Manager)
3. **Performance Audit:** Run Lighthouse to verify <3s load time goal
4. **Accessibility Review:** Add ARIA labels and keyboard navigation (post-MVP)
5. **Mobile Support:** Implement responsive mobile views (post-MVP)

---

**Questions or Issues?**

Refer to:
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Next.js Documentation](https://nextjs.org/docs)
- Project UX Specification: `docs/front-end-spec.md`
