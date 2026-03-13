"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    totalItems?: number
    pageSize?: number
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    pageSize = 10,
}: PaginationProps) {
    if (totalPages <= 1) return null

    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems ?? currentPage * pageSize)

    // Generate visible page numbers
    const pages: (number | "...")[] = []
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
        pages.push(1)
        if (currentPage > 3) pages.push("...")
        const rangeStart = Math.max(2, currentPage - 1)
        const rangeEnd = Math.min(totalPages - 1, currentPage + 1)
        for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
        if (currentPage < totalPages - 2) pages.push("...")
        pages.push(totalPages)
    }

    return (
        <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-xs text-muted-foreground">
                {totalItems != null ? (
                    <>Showing <span className="font-medium">{start}–{end}</span> of <span className="font-medium">{totalItems}</span></>
                ) : (
                    <>Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></>
                )}
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(1)}
                >
                    <ChevronsLeft className="size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <ChevronLeft className="size-3.5" />
                </Button>
                {pages.map((page, i) =>
                    page === "..." ? (
                        <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                    ) : (
                        <Button
                            key={page}
                            variant={page === currentPage ? "default" : "ghost"}
                            size="icon"
                            className="size-7 text-xs"
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </Button>
                    )
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <ChevronRight className="size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(totalPages)}
                >
                    <ChevronsRight className="size-3.5" />
                </Button>
            </div>
        </div>
    )
}
