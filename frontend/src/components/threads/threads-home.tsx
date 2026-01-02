"use client";

import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Category, ThreadSummary } from "@/types/thread";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, MessageCircle, Heart, ArrowRight, ChevronDown } from "lucide-react";
import { Badge } from "../ui/badge";

// Category color mapping
const getCategoryColor = (slug: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    general: {
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
    },
    help: {
      bg: "bg-green-500/10",
      text: "text-green-700 dark:text-green-400",
      border: "border-green-200 dark:border-green-800",
    },
    "q-a": {
      bg: "bg-yellow-500/10",
      text: "text-yellow-700 dark:text-yellow-400",
      border: "border-yellow-200 dark:border-yellow-800",
    },
    showcase: {
      bg: "bg-pink-500/10",
      text: "text-pink-700 dark:text-pink-400",
      border: "border-pink-200 dark:border-pink-800",
    },
  };
  return colors[slug] || colors.general;
};

// Skeleton loader component
function ThreadSkeleton() {
  return (
    <Card className="border-border/50 bg-card animate-pulse">
      <CardContent className="pt-6 pb-6 space-y-4">
        <div className="h-3 bg-muted rounded w-20"></div>
        <div className="h-6 bg-muted rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
        <div className="flex gap-4 pt-2">
          <div className="h-4 bg-muted rounded w-16"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
      </CardContent>
    </Card>
  );
}

// Format time ago
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ThreadsHomePage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") ?? "all"
  );
  const [sortBy, setSortBy] = useState<"new" | "old">(
    (searchParams.get("sort") as "new" | "old") ?? "new"
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [overflowThreads, setOverflowThreads] = useState<Set<string>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<Record<string, HTMLDivElement>>(new Map());

  // Load categories and initial threads
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setPage(1);

        const [extractCategories, extractThreads] = await Promise.all([
          apiGet<Category[]>(apiClient, "/api/threads/categories"),
          apiGet<ThreadSummary[]>(apiClient, "/api/threads/threads", {
            params: {
              category:
                activeCategory && activeCategory !== "all"
                  ? activeCategory
                  : undefined,
              sort: sortBy,
              page: 1,
              pageSize: 10,
            },
          }),
        ]);

        if (!isMounted) return;

        setCategories(extractCategories);
        setThreads(extractThreads);
        setHasMore(extractThreads.length >= 10);
      } catch (error) {
        console.log(error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
  }, [apiClient, activeCategory, sortBy]);

  // Infinite scroll handler
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;

      const moreThreads = await apiGet<ThreadSummary[]>(
        apiClient,
        "/api/threads/threads",
        {
          params: {
            category:
              activeCategory && activeCategory !== "all"
                ? activeCategory
                : undefined,
            sort: sortBy,
            page: nextPage,
            pageSize: 10,
          },
        }
      );

      setThreads((prev) => [...prev, ...moreThreads]);
      setPage(nextPage);
      setHasMore(moreThreads.length >= 10);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [apiClient, activeCategory, sortBy, page, hasMore, isLoadingMore]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore, isLoading]);

  const handleCategoryChange = (categorySlug: string) => {
    setActiveCategory(categorySlug);
    const params = new URLSearchParams();
    if (categorySlug !== "all") {
      params.set("category", categorySlug);
    }
    params.set("sort", sortBy);
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (sort: "new" | "old") => {
    setSortBy(sort);
    const params = new URLSearchParams();
    if (activeCategory !== "all") {
      params.set("category", activeCategory);
    }
    params.set("sort", sort);
    router.push(`?${params.toString()}`);
  };

  const toggleExpandThread = (threadId: string) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  // Check for content overflow using ResizeObserver
  useEffect(() => {
    const checkOverflows = () => {
      const newOverflowSet = new Set<string>();

      contentRefs.current.forEach((element, threadId) => {
        if (element) {
          const isOverflowing = element.scrollHeight > element.clientHeight + 2;
          if (isOverflowing) {
            newOverflowSet.add(threadId);
          }
        }
      });

      setOverflowThreads(newOverflowSet);
    };

    const resizeObserver = new ResizeObserver(() => {
      checkOverflows();
    });

    // Observe all content elements
    contentRefs.current.forEach((element) => {
      if (element) {
        resizeObserver.observe(element);
      }
    });

    // Initial check
    setTimeout(checkOverflows, 0);

    return () => resizeObserver.disconnect();
  }, [threads]);

  const setContentRef = useCallback(
    (threadId: string, element: HTMLDivElement | null) => {
      if (element) {
        const map = new Map(contentRefs.current);
        map.set(threadId, element);
        contentRefs.current = map;
      }
    },
    []
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Soft gradient header */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent rounded-full"></div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center gap-3 flex-1">
          {/* Category Filter */}
          <select
            value={activeCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as "new" | "old")}
            className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="new">Latest</option>
            <option value="old">Oldest</option>
          </select>
        </div>

        {/* Post Thread Button */}
        <Link href="/threads/new">
          <Button className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all rounded-lg">
            <Plus className="w-4 h-4 mr-2" />
            Post Thread
          </Button>
        </Link>
      </div>

      {/* Threads List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <ThreadSkeleton />
            <ThreadSkeleton />
            <ThreadSkeleton />
          </>
        ) : threads.length === 0 ? (
          <Card className="border-dashed border-border/50 bg-card/30">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No threads found. Be the first to start a discussion!
              </p>
              <Link href="/threads/new">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Thread
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {threads.map((thread) => {
              const categoryColor = getCategoryColor(thread.category.slug);
              const isExpanded = expandedThreads.has(thread.id);
              const hasOverflow = overflowThreads.has(thread.id);

              return (
                <Card
                  key={thread.id}
                  className="group cursor-pointer border-border/50 bg-card transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:scale-[1.005] rounded-xl backdrop-blur-sm overflow-hidden"
                >
                  <CardContent className="pt-6 pb-5 space-y-4">
                    {/* Category and Author Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Color-coded category pill */}
                        <Badge
                          variant="outline"
                          className={`${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border} text-[12px] font-semibold whitespace-nowrap`}
                        >
                          {thread.category.name}
                        </Badge>
                        {/* Author */}
                        <span className="text-sm font-semibold text-foreground truncate">
                          by @{thread?.author?.handle || "anonymous"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                        {timeAgo(thread.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {thread.title}
                    </h3>

                    {/* Rich Content Body with Images - Fixed Height Container */}
                    <div
                      className={`relative overflow-hidden transition-all duration-300 ${
                        isExpanded ? "max-h-none" : "max-h-56"
                      }`}
                      ref={(el) => setContentRef(thread.id, el)}
                    >
                      <div
                        className="text-sm leading-relaxed text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: thread.body }}
                        style={{
                          // Limit image heights while maintaining aspect ratio
                          "--tw-prose-img-max-height": "12rem",
                        } as React.CSSProperties}
                      />
                    </div>

                    {/* View More / View Less Button */}
                    {hasOverflow && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleExpandThread(thread.id);
                        }}
                        className="flex items-center gap-2 text-primary font-semibold text-sm hover:text-primary/80 transition-colors py-2"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-4 h-4 rotate-180" />
                            View Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            View More
                          </>
                        )}
                      </button>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 pt-3 border-t border-border/30 text-xs text-muted-foreground/80 font-medium">
                      <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>{thread.replyCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                        <Heart className="w-4 h-4" />
                        <span>{thread.likeCount || 0}</span>
                      </div>
                      <Link href={`threads/${thread.id}`} className="ml-auto">
                        <div className="flex items-center gap-1.5 text-primary font-semibold group-hover:gap-2 transition-all cursor-pointer">
                          View Discussion
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="py-8 text-center">
              {isLoadingMore && (
                <>
                  <ThreadSkeleton />
                  <ThreadSkeleton />
                </>
              )}
              {!hasMore && threads.length > 0 && (
                <p className="text-sm text-muted-foreground">No more threads to load</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ThreadsHomePage;
