"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Plus, Sparkles, TrendingUp, ChevronDown } from "lucide-react";
import { Category } from "@/types/thread";

interface ThreadsSidebarProps {
  categories: Category[];
  activeCategory: string;
  sortBy: "new" | "old";
  threadsCount: number;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: "new" | "old") => void;
}

export function ThreadsSidebar({
  categories,
  activeCategory,
  sortBy,
  threadsCount,
  onCategoryChange,
  onSortChange,
}: ThreadsSidebarProps) {
  return (
    <aside className="w-full ">
      <div className="sticky top-4 space-y-6">
        {/* Header Section with Visual Depth */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/2 to-transparent border border-primary/10 backdrop-blur-xl p-6">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-4">
            {/* Title with Icon */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Threads
              </h1>
            </div>

            {/* Description */}
            <p className="text-xs text-foreground/60 leading-relaxed">
              Engage with the community. Share ideas, ask questions, and discover trending topics.
            </p>

            {/* New Thread Button */}
            <Link href="/threads/new" className="block">
              <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg gap-2 group">
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                New Thread
              </Button>
            </Link>

            {/* Stats */}
            <div className="pt-2 border-t border-primary/20">
              <p className="text-xs text-foreground/60">
                <span className="font-semibold text-foreground">{threadsCount}</span> {threadsCount === 1 ? "thread" : "threads"} active
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="space-y-4 p-5 rounded-2xl border border-border/40 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-lg">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Filters
          </h2>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wide">
              Category
            </label>
            <div className="relative group">
              <select
                value={activeCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border/60 bg-background/80 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all backdrop-blur-sm hover:border-border/80 appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Sort Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wide">
              Sort By
            </label>
            <div className="relative group">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as "new" | "old")}
                className="w-full px-3 py-2.5 rounded-lg border border-border/60 bg-background/80 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all backdrop-blur-sm hover:border-border/80 appearance-none cursor-pointer"
              >
                <option value="new">Latest First</option>
                <option value="old">Oldest First</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-border/50 to-transparent"></div>

          {/* Info Box */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-foreground/70">
              💡 <span className="font-medium">Tip:</span> Use filters to discover threads that interest you most.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2 p-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm">
          <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Quick Links</p>
          <div className="space-y-2">
            <Link
              href="/threads/my-threads"
              className="block text-xs text-primary hover:text-primary/80 transition-colors font-medium py-1.5 px-2 rounded hover:bg-primary/5"
            >
              → My Threads
            </Link>
            <Link
              href="/chat"
              className="block text-xs text-foreground/70 hover:text-foreground transition-colors font-medium py-1.5 px-2 rounded hover:bg-muted/50"
            >
              → Direct Messages
            </Link>
            <Link
              href="/profile"
              className="block text-xs text-foreground/70 hover:text-foreground transition-colors font-medium py-1.5 px-2 rounded hover:bg-muted/50"
            >
              → My Profile
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
