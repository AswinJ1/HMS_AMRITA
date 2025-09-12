// app/(dashboard)/student/stayback/page.tsx

import { StaybackForm } from "@/components/forms/stayback-form"

export default function StaybackRequestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <a
            href="/student"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Dashboard
          </a>
        </div>
        <StaybackForm />
      </div>
    </div>
  )
}