"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Search, Phone, Mail, Building2, Hash } from "lucide-react"
import RoleGuard from "@/components/auth/role-guard"
import Pagination from "@/components/pagination"
import { CLUBS } from "@/lib/clubs"

interface TeamMember {
    id: string
    name: string
    type: "Team Lead" | "Student"
    clubName: string
    hostelName: string
    roomNo: string
    phoneNumber: string
    email: string
    uid: string
    gender: string
}

const PAGE_SIZE = 10

export default function SecurityTeamDetailsPage() {
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [clubFilter, setClubFilter] = useState("ALL")
    const [search, setSearch] = useState("")
    const [selected, setSelected] = useState<TeamMember | null>(null)
    const [page, setPage] = useState(1)

    useEffect(() => {
        setLoading(true)
        const sp = new URLSearchParams()
        if (clubFilter && clubFilter !== "ALL") sp.set("club", clubFilter)
        if (search.trim()) sp.set("search", search.trim())
        fetch(`/api/security/team-details?${sp.toString()}`)
            .then((r) => r.json())
            .then((data) => setMembers(data.members || []))
            .finally(() => setLoading(false))
    }, [clubFilter, search])

    const totalPages = Math.ceil(members.length / PAGE_SIZE)
    const paginatedMembers = members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <RoleGuard allowedRoles={["SECURITY"]}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Team Details</h1>
                    <p className="text-sm text-muted-foreground">
                        View team lead and team member information for identity verification.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            className="pl-9 h-9"
                        />
                    </div>
                    <Select value={clubFilter} onValueChange={(v) => { setClubFilter(v); setPage(1) }}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="All clubs" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All clubs</SelectItem>
                            {CLUBS.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Members ({members.length})</CardTitle>
                        <CardDescription>Team leads and students in the system</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-4 space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
                        ) : members.length === 0 ? (
                            <div className="py-10 text-center">
                                <Users className="mx-auto size-8 text-muted-foreground/30" />
                                <p className="mt-2 text-sm text-muted-foreground">No members found</p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40">
                                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Name</TableHead>
                                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Type</TableHead>
                                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Club</TableHead>
                                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Hostel</TableHead>
                                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Room</TableHead>
                                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Phone</TableHead>
                                            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Detail</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedMembers.map((m) => (
                                            <TableRow key={m.id + m.type}>
                                                <TableCell className="text-sm font-medium">{m.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={m.type === "Team Lead" ? "default" : "outline"} className="text-[10px]">
                                                        {m.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{m.clubName}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{m.hostelName || "—"}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{m.roomNo || "—"}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{m.phoneNumber || "—"}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => setSelected(m)}>
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                    totalItems={members.length}
                                    pageSize={PAGE_SIZE}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Detail Dialog */}
                <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>{selected?.name}</DialogTitle>
                            <DialogDescription>
                                <Badge variant={selected?.type === "Team Lead" ? "default" : "outline"} className="text-[10px] mt-1">
                                    {selected?.type}
                                </Badge>
                            </DialogDescription>
                        </DialogHeader>
                        {selected && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Club</p>
                                        <p className="text-sm font-medium">{selected.clubName}</p>
                                    </div>
                                    {selected.hostelName && (
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1"><Building2 className="size-2.5" /> Hostel</p>
                                            <p className="text-sm font-medium">{selected.hostelName}</p>
                                        </div>
                                    )}
                                    {selected.roomNo && (
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1"><Hash className="size-2.5" /> Room</p>
                                            <p className="text-sm font-medium">{selected.roomNo}</p>
                                        </div>
                                    )}
                                    {selected.uid && (
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">UID</p>
                                            <p className="text-sm font-medium font-mono">{selected.uid}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 border-t pt-3">
                                    {selected.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="size-3.5 text-muted-foreground" />
                                            <span className="text-sm">{selected.email}</span>
                                        </div>
                                    )}
                                    {selected.phoneNumber && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="size-3.5 text-muted-foreground" />
                                            <span className="text-sm">{selected.phoneNumber}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </RoleGuard>
    )
}
