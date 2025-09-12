// app/(dashboard)/student/requests/page.tsx

import { RequestsTable } from "@/components/tables/requests-table"

export default function StudentRequestsPage() {
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
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">My Stayback Requests</h2>
          <RequestsTable />
        </div>
      </div>
    </div>
  )
}