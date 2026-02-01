"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet, createBrowserApiClient, apiDelete, apiPost } from "@/lib/api-client";
import { ThreadSummary } from "@/types/thread";
import { ArrowLeft, Edit2, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

function MyThreadsPage() {
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  // Load user's threads
  useEffect(() => {
    let isMounted = true;

    async function loadThreads() {
      if (!userId) return;

      try {
        setIsLoading(true);
        const userThreads = await apiGet<ThreadSummary[]>(apiClient, "/api/threads/my-threads", {
          params: {
            page: 1,
            pageSize: 20,
          },
        });

        if (!isMounted) return;
        setThreads(userThreads);
      } catch (error) {
        console.error("Error loading threads:", error);
        toast.error("Failed to load your threads");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadThreads();

    return () => {
      isMounted = false;
    };
  }, [apiClient, userId]);

  // Start editing a thread
  const startEdit = (thread: ThreadSummary) => {
    setEditingThreadId(thread.id);
    setEditTitle(thread.title);
    setEditBody(thread.body);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingThreadId(null);
    setEditTitle("");
    setEditBody("");
  };

  // Save edited thread
  const saveEdit = useCallback(
    async (threadId: string) => {
      if (!editTitle.trim() || !editBody.trim()) {
        toast.error("Title and body are required");
        return;
      }

      try {
        setIsSubmitting(true);

        await apiPost(apiClient, `/api/threads/threads/${threadId}`, {
          title: editTitle,
          body: editBody,
          categorySlug: threads.find((t) => t.id === threadId)?.category.slug,
        });

        // Update local state
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadId
              ? { ...thread, title: editTitle, body: editBody }
              : thread
          )
        );

        setEditingThreadId(null);
        toast.success("Thread updated successfully!");
      } catch (error) {
        console.error("Error updating thread:", error);
        toast.error("Failed to update thread");
      } finally {
        setIsSubmitting(false);
      }
    },
    [apiClient, threads, editTitle, editBody]
  );

  // Delete thread
  const deleteThreadHandler = useCallback(
    async (threadId: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this thread? This action cannot be undone."
      );
      if (!confirmed) return;

      try {
        setDeletingThreadId(threadId);
        await apiDelete(apiClient, `/api/threads/threads/${threadId}`);

        setThreads((prev) => prev.filter((t) => t.id !== threadId));
        toast.success("Thread deleted successfully!");
      } catch (error) {
        console.error("Error deleting thread:", error);
        toast.error("Failed to delete thread");
      } finally {
        setDeletingThreadId(null);
      }
    },
    [apiClient]
  );

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10">
        <p className="text-sm text-muted-foreground">Please sign in to view your threads</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">My Threads</h1>
        </div>
        <Link href="/threads/new">
          <Button className="gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" />
            New Thread
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your threads...</p>
          </div>
        </div>
      ) : threads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't created any threads yet</p>
            <Link href="/threads/new">
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4" />
                Create Your First Thread
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <Card
              key={thread.id}
              className="border-green-500/20 bg-gradient-to-br from-card/80 via-card/60 to-green-500/5 hover:border-green-500/40 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {editingThreadId === thread.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Thread title..."
                          className="text-lg font-bold"
                        />
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-xl mb-2">{thread.title}</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-2 py-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded">
                            {thread.category.name}
                          </span>
                          <span>{thread.replyCount} replies</span>
                          <span>{thread.likeCount} likes</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {editingThreadId === thread.id ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => saveEdit(thread.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(thread)}
                        className="gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteThreadHandler(thread.id)}
                        disabled={deletingThreadId === thread.id}
                        className="gap-1"
                      >
                        {deletingThreadId === thread.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              {/* Thread Body */}
              <CardContent className="space-y-3">
                {editingThreadId === thread.id ? (
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    placeholder="Thread content..."
                    className="w-full min-h-40 p-3 border border-input rounded-md bg-background text-foreground text-sm resize-none"
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {thread.body.replace(/<[^>]*>/g, "")}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground/60">
                    {new Date(thread.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {!editingThreadId && (
                    <Link href={`/threads/${thread.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 dark:text-green-400 hover:text-green-700"
                      >
                        View Discussion →
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyThreadsPage;
