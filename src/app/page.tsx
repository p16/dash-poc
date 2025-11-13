import { CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
      <h1 className="text-4xl font-bold">Scrape and Compare</h1>
      <p className="mt-4 text-lg text-gray-600">Competitive intelligence platform</p>
    </main>
  );
}

