import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          Sageloop
        </h1>
        <p className="text-2xl text-gray-600 dark:text-gray-400 mb-2">
          Intelligent Prompt Engineering
        </p>
        <p className="mt-2 text-gray-500 dark:text-gray-500 mb-8">
          A platform built for PMs who need to rapidly build and test AI prompts
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Get Started
          <svg
            className="ml-2 -mr-1 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
