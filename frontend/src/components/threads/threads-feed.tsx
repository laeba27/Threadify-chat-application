"use client";

import { apiGet, createBrowserApiClient, apiPost, apiDelete } from "@/lib/api-client";
import { ThreadSummary } from "@/types/thread";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "../ui/card";
import { MessageCircle, Heart, ArrowRight, ChevronDown, Sparkles, Send, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";

// Category color mapping with enhanced gradients
const getCategoryColor = (slug: string) => {
  const colors: Record<string, { bg: string; text: string; border: string; gradient: string; dot: string }> = {
    general: {
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      gradient: "from-blue-500/20 to-blue-500/0",
      dot: "bg-blue-500",
    },
    help: {
      bg: "bg-green-500/10",
      text: "text-green-700 dark:text-green-400",
      border: "border-green-200 dark:border-green-800",
      gradient: "from-green-500/20 to-green-500/0",
      dot: "bg-green-500",
    },
    "q-a": {
      bg: "bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      gradient: "from-amber-500/20 to-amber-500/0",
      dot: "bg-amber-500",
    },
    showcase: {
      bg: "bg-pink-500/10",
      text: "text-pink-700 dark:text-pink-400",
      border: "border-pink-200 dark:border-pink-800",
      gradient: "from-pink-500/20 to-pink-500/0",
      dot: "bg-pink-500",
    },
  };
  return colors[slug] || colors.general;
};

// Enhanced skeleton loader component
function ThreadSkeleton() {
  return (
    <Card className="border border-border/40 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:border-border/60 transition-colors duration-300 overflow-hidden">
      <CardContent className="pt-6 pb-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-6 bg-gradient-to-r from-muted to-muted/50 rounded-full w-20 animate-pulse"></div>
            <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-3 bg-gradient-to-r from-muted to-muted/50 rounded w-16 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-gradient-to-r from-muted to-muted/50 rounded w-4/5 animate-pulse"></div>
          <div className="h-5 bg-gradient-to-r from-muted to-muted/50 rounded w-3/4 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded animate-pulse"></div>
          <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded w-5/6 animate-pulse"></div>
        </div>
        <div className="flex gap-6 pt-4">
          <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded w-28 ml-auto animate-pulse"></div>
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

interface ThreadsFeedProps {
  activeCategory: string;
  sortBy: "new" | "old";
}

export function ThreadsFeed({ activeCategory, sortBy }: ThreadsFeedProps) {
  const { getToken } = useAuth();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [overflowThreads, setOverflowThreads] = useState<Set<string>>(new Set());
  const [likedThreads, setLikedThreads] = useState<Set<string>>(new Set());
  const [commentingThreadId, setCommentingThreadId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likeLoading, setLikeLoading] = useState<Set<string>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<Record<string, HTMLDivElement>>(new Map());

  // Load initial threads
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setPage(1);

        const extractThreads = await apiGet<ThreadSummary[]>(apiClient, "/api/threads/threads", {
          params: {
            category: activeCategory && activeCategory !== "all" ? activeCategory : undefined,
            sort: sortBy,
            page: 1,
            pageSize: 10,
          },
        });

        if (!isMounted) return;

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

      const moreThreads = await apiGet<ThreadSummary[]>(apiClient, "/api/threads/threads", {
        params: {
          category: activeCategory && activeCategory !== "all" ? activeCategory : undefined,
          sort: sortBy,
          page: nextPage,
          pageSize: 10,
        },
      });

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

    contentRefs.current.forEach((element) => {
      if (element) {
        resizeObserver.observe(element);
      }
    });

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

  // Handle like action
  const handleLike = useCallback(
    async (threadId: string) => {
      if (likeLoading.has(threadId)) return;

      const isLiked = likedThreads.has(threadId);
      const newLikedThreads = new Set(likedThreads);

      if (isLiked) {
        newLikedThreads.delete(threadId);
      } else {
        newLikedThreads.add(threadId);
      }

      // Optimistic update
      setLikedThreads(newLikedThreads);
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? { ...thread, likeCount: (thread.likeCount || 0) + (isLiked ? -1 : 1) }
            : thread
        )
      );

      try {
        setLikeLoading((prev) => new Set(prev).add(threadId));

        if (isLiked) {
          // Unlike - use DELETE
          await apiDelete(apiClient, `/api/threads/threads/${threadId}/like`);
        } else {
          // Like - use POST
          await apiPost(apiClient, `/api/threads/threads/${threadId}/like`, {});
        }

        toast.success(isLiked ? "Unliked!" : "Liked! 💓");
      } catch (error) {
        console.error("Like error:", error);
        toast.error("Failed to update like");

        // Revert optimistic update
        setLikedThreads(likedThreads);
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadId
              ? { ...thread, likeCount: (thread.likeCount || 0) + (isLiked ? 1 : -1) }
              : thread
          )
        );
      } finally {
        setLikeLoading((prev) => {
          const newSet = new Set(prev);
          newSet.delete(threadId);
          return newSet;
        });
      }
    },
    [apiClient, likedThreads, likeLoading]
  );

  // Handle comment submission
  const handleSubmitComment = useCallback(
    async (threadId: string) => {
      if (!commentText.trim() || isSubmittingComment) return;

      try {
        setIsSubmittingComment(true);

        await apiPost(apiClient, `/api/threads/threads/${threadId}/replies`, {
          body: commentText,
        });

        // Update reply count optimistically
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadId
              ? { ...thread, replyCount: (thread.replyCount || 0) + 1 }
              : thread
          )
        );

        setCommentText("");
        setCommentingThreadId(null);
        toast.success("Comment added! 🎉");
      } catch (error) {
        console.error("Comment error:", error);
        toast.error("Failed to add comment");
      } finally {
        setIsSubmittingComment(false);
      }
    },
    [apiClient, commentText, isSubmittingComment]
  );

  return (
    <div className="flex-1 space-y-4  ">
      {isLoading ? (
        <>
          <ThreadSkeleton />
          <ThreadSkeleton />
          <ThreadSkeleton />
        </>
      ) : threads.length === 0 ? (
        <Card className="border border-dashed border-border/50 bg-gradient-to-br from-muted/20 to-muted/5 backdrop-blur-sm overflow-hidden">
          <CardContent className="py-16 px-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Sparkles className="w-8 h-8 text-primary/60" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No threads yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to start a discussion! Create a thread to share your thoughts with the community.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {threads.map((thread, index) => {
            const categoryColor = getCategoryColor(thread.category.slug);
            const isExpanded = expandedThreads.has(thread.id);
            const hasOverflow = overflowThreads.has(thread.id);

            const avatarColors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-green-500", "bg-orange-500", "bg-red-500"];
            const avatarColor = avatarColors[thread.author?.id?.charCodeAt(0) % avatarColors.length || 0];
            const initials = (thread?.author?.handle || "A").substring(0, 2).toUpperCase();

            return (
              <div
                key={thread.id}
                className="group animate-in fade-in duration-500"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <Card className="relative border border-green-500/20 bg-gradient-to-br from-card/80 via-card/60 to-green-500/5 backdrop-blur-lg transition-all duration-300 hover:border-green-500/40 hover:shadow-2xl hover:shadow-green-500/10 hover:scale-[1.01] rounded-xl overflow-hidden group-hover:from-card group-hover:to-green-500/10">
                  {/* Gradient accent on top - Green theme */}
                  <div className={`absolute inset-0 h-1 bg-gradient-to-r from-green-500/40 via-emerald-500/40 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                  <CardContent className="pt-5 pb-5 space-y-3">
                    {/* ===== HEADER SECTION ===== */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Avatar + Metadata */}
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* User Avatar */}
                        <div className={`w-9 h-9 ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-md flex-shrink-0 mt-0.5`}>
                          {initials}
                        </div>

                        {/* Category Badge & Author */}
                        <div className="flex-1 min-w-0 space-y-1">
                        {/* Category Badge */}
                          <Badge
                            variant="outline"
                            className={`${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border} text-[10px] font-semibold whitespace-nowrap px-2 py-0.5 inline-flex bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/30`}
                          >
                            <span className={`w-1 h-1 rounded-full ${categoryColor.dot} mr-1.5 inline-block flex-shrink-0`}></span>
                            {thread.category.name}
                          </Badge>
                          {/* Author Name */}
                          <p className="text-xs font-medium text-foreground/70 leading-tight">
                            <span className="font-semibold text-foreground">@{thread?.author?.handle || "anon"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Timestamp */}
                      <div className="text-xs font-medium text-muted-foreground/60 whitespace-nowrap flex-shrink-0 px-1.5 py-0.5 bg-muted/30 rounded-md backdrop-blur-sm border border-muted/40">
                        {timeAgo(thread.createdAt)}
                      </div>
                    </div>

                    {/* ===== PRIMARY CONTENT SECTION ===== */}
                    <div className="space-y-2">
                      {/* Title - Strong contrast and reduced line height */}
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-tight">
                        {thread.title}
                      </h3>

                      {/* Rich Content Body - Optimized preview */}
                      <div
                        className={`relative overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-none" : "max-h-40"}`}
                        ref={(el) => setContentRef(thread.id, el)}
                      >
                        <div
                          className="text-xs leading-relaxed text-muted-foreground prose prose-xs dark:prose-invert max-w-none [&_p]:m-0 [&_p]:mb-1 [&_img]:rounded-lg [&_img]:my-2 [&_img]:max-h-40 [&_a]:text-primary [&_a]:hover:underline"
                          dangerouslySetInnerHTML={{ __html: thread.body }}
                          style={{
                            "--tw-prose-img-max-height": "10rem",
                          } as React.CSSProperties}
                        />

                        {/* Gradient fade overlay for preview truncation */}
                        {!isExpanded && hasOverflow && (
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/95 via-card/60 to-card/0 pointer-events-none"></div>
                        )}
                      </div>

                      {/* View More / View Less Button - Compact */}
                      {hasOverflow && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpandThread(thread.id);
                          }}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-xs transition-all duration-200 py-0.5 px-1 rounded hover:bg-primary/5 active:bg-primary/10 group/expand"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown className="w-3.5 h-3.5 rotate-180 transition-transform group-hover/expand:scale-125" />
                              <span>Less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover/expand:scale-125" />
                              <span>More</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* ===== ENGAGEMENT SECTION ===== */}
                    <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-border/15">
                      {/* Stats - Creative funky buttons with green theme */}
                      <div className="flex items-center gap-1.5">
                        {/* Comment Button - Creative popup */}
                        <button
                          onClick={() =>
                            setCommentingThreadId(commentingThreadId === thread.id ? null : thread.id)
                          }
                          className="group/comment inline-flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-all duration-300 py-1.5 px-2 rounded-lg hover:bg-green-500/15 active:bg-green-500/25 relative border border-transparent hover:border-green-500/30"
                        >
                          <div className="relative">
                            <MessageCircle className={`w-4 h-4 transition-all duration-200 group-hover/comment:scale-110 ${commentingThreadId === thread.id ? "text-blue-500" : "group-hover/comment:text-blue-500"}`} />
                            {(thread.replyCount || 0) > 0 && (
                              <span className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-green-500/40">
                                {thread.replyCount}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Like Button - Funky animated heart with red */}
                        <button
                          onClick={() => handleLike(thread.id)}
                          disabled={likeLoading.has(thread.id)}
                          className={`group/like inline-flex items-center gap-1.5 transition-all duration-300 py-1.5 px-2 rounded-lg relative border ${
                            likedThreads.has(thread.id)
                              ? "text-red-500 bg-red-500/15 border-red-500/40"
                              : "text-muted-foreground/60 hover:text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                          } active:bg-red-500/25 disabled:opacity-50`}
                        >
                          <div className="relative">
                            <Heart
                              className={`w-4 h-4 transition-all duration-300 ${
                                likedThreads.has(thread.id)
                                  ? "fill-current scale-110 animate-pulse"
                                  : "group-hover/like:scale-110"
                              }`}
                            />
                            {likeLoading.has(thread.id) && (
                              <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-red-500"></span>
                            )}
                          </div>
                          {(thread.likeCount || 0) > 0 && (
                            <span className={`text-xs font-bold transition-all duration-300 ${likedThreads.has(thread.id) ? "text-red-500" : ""}`}>
                              {thread.likeCount}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* CTA - Green accent theme */}
                      <Link href={`threads/${thread.id}`}>
                        <div className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-semibold text-xs hover:text-green-700 dark:hover:text-green-300 transition-all duration-200 py-1 px-2 rounded border border-transparent hover:border-green-500/40 hover:bg-green-500/5 active:bg-green-500/15 group/cta">
                          View
                          <ArrowRight className="w-3 h-3 transition-transform group-hover/cta:translate-x-0.5" />
                        </div>
                      </Link>
                    </div>

                    {/* ===== COMMENT MODAL SECTION ===== */}
                    {commentingThreadId === thread.id && (
                      <div className="mt-3 p-3 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-blue-500/5 rounded-lg border border-green-500/30 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg shadow-green-500/10">
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-8 h-8 ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground">Your Comment</div>
                            <div className="flex items-end gap-2">
                              <Input
                                type="text"
                                placeholder="Share your thoughts... ✨"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitComment(thread.id);
                                  }
                                }}
                                disabled={isSubmittingComment}
                                className="text-xs h-8 py-1 bg-white/50 dark:bg-card/50 border border-green-500/40 rounded-md focus:border-green-500/70 focus:ring-1 focus:ring-green-500/30 transition-all"
                              />
                              <button
                                onClick={() => handleSubmitComment(thread.id)}
                                disabled={!commentText.trim() || isSubmittingComment}
                                className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-md hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/send"
                              >
                                <Send className={`w-3.5 h-3.5 transition-transform group-hover/send:scale-110 ${isSubmittingComment ? "animate-pulse" : ""}`} />
                              </button>
                              <button
                                onClick={() => setCommentingThreadId(null)}
                                className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all duration-200"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {/* Infinite scroll trigger with enhanced loading state */}
          <div ref={observerTarget} className="py-12">
            {isLoadingMore && (
              <div className="space-y-4">
                <ThreadSkeleton />
                <ThreadSkeleton />
              </div>
            )}
            {!hasMore && threads.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm font-medium text-muted-foreground">✨ You've reached the end</p>
                <p className="text-xs text-muted-foreground/70 mt-1">No more threads to load</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
