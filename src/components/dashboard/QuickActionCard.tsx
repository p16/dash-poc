import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export function QuickActionCard({
  title,
  icon: Icon,
  href,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <ArrowRight className="h-5 w-5 text-neutral-400 group-hover:text-primary transition-colors" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
