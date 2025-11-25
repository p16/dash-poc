import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';

export default function DesignSystemTest() {
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Test', href: '/dashboard/test' },
    { label: 'Design System' },
  ];

  return (
    <div className="container-custom py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Design System Foundation Test</h1>
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Typography (Inter Font)</h2>
        <p className="text-base mb-2">
          This is regular text using the Inter font family.
        </p>
        <p className="text-sm text-neutral-600">
          This is smaller text in neutral-600 color.
        </p>
      </section>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content with some example text.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Another Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>More content here.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Badges</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge>Default Badge</Badge>
          <Badge variant="secondary">Secondary Badge</Badge>
          <Badge variant="destructive">Destructive Badge</Badge>
          <Badge variant="outline">Outline Badge</Badge>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This is an info alert with an icon.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertDescription>
              This is a destructive alert.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Skeletons</h2>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Brand Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="h-20 bg-primary rounded" />
            <p className="text-sm font-medium">Primary (#4F46E5)</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded" style={{ backgroundColor: 'hsl(var(--success))' }} />
            <p className="text-sm font-medium">Success (#10B981)</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded" style={{ backgroundColor: 'hsl(var(--warning))' }} />
            <p className="text-sm font-medium">Warning (#F59E0B)</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 rounded" style={{ backgroundColor: 'hsl(var(--error))' }} />
            <p className="text-sm font-medium">Error (#EF4444)</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-background border rounded" />
            <p className="text-sm font-medium">Background (#F9FAFB)</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-foreground rounded" />
            <p className="text-sm font-medium">Foreground (#111827)</p>
          </div>
        </div>
      </section>
    </div>
  );
}
