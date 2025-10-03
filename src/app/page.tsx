import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Odyssey Feedback</h1>
        <p className="text-xl mb-8">
          Product feedback and user research platform for Club Med
        </p>

        <div className="flex gap-4 mb-8">
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Feedback</h2>
            <p className="text-gray-600">
              Collect and vote on product feedback from your team
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Roadmap</h2>
            <p className="text-gray-600">
              Share your product roadmap and communicate progress
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Research</h2>
            <p className="text-gray-600">
              Conduct user research, surveys, and usability testing
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
