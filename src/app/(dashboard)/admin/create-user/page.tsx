import React from 'react'
import UserForm from '@/components/forms/user-form'

const CreateUserPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New User</h1>
              <p className="text-muted-foreground mt-1">Add staff or hostel users to the system</p>
            </div>
            <nav className="text-sm text-muted-foreground">
              <a href="/admin" className="hover:text-foreground">Admin Dashboard</a>
              <span className="mx-2">/</span>
              <span className="text-foreground">Create User</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <UserForm />
      </div>
    </div>
  )
}

export default CreateUserPage
