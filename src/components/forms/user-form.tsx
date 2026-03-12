"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

const schema = z.object({
  email: z.string().email(),
  uid: z.string().min(1),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["STAFF", "HOSTEL", "SECURITY"]),
  department: z.string().optional(),
  hostelName: z.string().optional(),
})

type Form = z.infer<typeof schema>

export default function UserForm({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { role: "STAFF" },
  })

  const selectedRole = watch("role")

  async function onSubmit(data: Form) {
    setLoading(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to create user")
      toast.success("User created successfully")
      reset()
      setOpen(false)
      onCreated?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 size-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Add a Staff, Hostel Warden, or Security user account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
            <Select value={selectedRole} onValueChange={(v: any) => setValue("role", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="HOSTEL">Hostel Warden</SelectItem>
                <SelectItem value="SECURITY">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input {...register("name")} placeholder="John Doe" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UID</Label>
              <Input {...register("uid")} placeholder="UID123" />
              {errors.uid && <p className="text-xs text-destructive">{errors.uid.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input type="email" {...register("email")} placeholder="user@amrita.edu" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
            <Input type="password" {...register("password")} placeholder="Min 6 characters" />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {(selectedRole === "STAFF" || selectedRole === "SECURITY") && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</Label>
              <Input {...register("department")} placeholder="e.g. Computer Science" />
            </div>
          )}

          {selectedRole === "HOSTEL" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hostel Name</Label>
              <Input {...register("hostelName")} placeholder="e.g. Hostel A" />
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
            Create User
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
