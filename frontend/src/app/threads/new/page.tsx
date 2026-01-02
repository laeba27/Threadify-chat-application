"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Category, ThreadDetail } from "@/types/thread";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function NewThreadsPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [bodyValue, setBodyValue] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);

      try {
        const extractCats = await apiGet<Category[]>(
          apiClient,
          "/api/threads/categories"
        );

        if (!isMounted) return;

        setCategories(extractCats);

        if (extractCats.length > 0) {
          setCategorySlug(extractCats[0]?.slug || "");
        }
      } catch (e) {
        console.log(e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
  }, [apiClient]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log("Submit button clicked", { title, categorySlug, bodyValue });

    // Validation
    if (!title.trim()) {
      toast.error("Title required", { description: "Please enter a thread title" });
      return;
    }

    if (title.trim().length < 5) {
      toast.error("Title too short", { description: "Title must be at least 5 characters" });
      return;
    }

    if (!categorySlug) {
      toast.error("Category required", { description: "Please select a category" });
      return;
    }

    const cleanBody = bodyValue.replace(/<[^>]*>/g, "").trim();
    if (!cleanBody || cleanBody.length < 15) {
      toast.error("Description too short", { description: "Please write at least 15 characters in the description" });
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log("Sending API request with:", {
        title: title.trim(),
        body: bodyValue,
        categorySlug,
      });

      const response = await apiClient.post("/api/threads/threads", {
        title: title.trim(),
        body: bodyValue,
        categorySlug,
      });

      console.log("Success response:", response?.data);

      toast.success("New thread created successfully!", {
        description: "Your thread is now live!",
      });

      router.push("/");
    } catch (error: any) {
      console.error("Error creating thread:", error);
      const errorMsg = error?.response?.data?.error?.message || error?.message || "Failed to create thread";
      toast.error("Failed to create thread", {
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Start a new thread
        </h1>
      </div>

      <Card className="border-border/70 bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Thread Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-foreground"
                htmlFor="title"
              >
                Thread Title
              </label>
              <Input
                id="title"
                placeholder="Thread Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading || isSubmitting}
                className="border-border mt-3 bg-background/70 text-sm"
              />
              {title && title.length < 5 && (
                <p className="text-xs text-red-500">Must be at least 5 characters</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-foreground"
                htmlFor="categorySlug"
              >
                Category
              </label>
              <select
                id="categorySlug"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                disabled={isLoading || isSubmitting}
                className="h-10 mt-3 w-full rounded-md border border-border bg-background/70 px-3 text-sm text-foreground focus:outline focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select a category...</option>
                {categories.map((category) => (
                  <option value={category.slug} key={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-foreground"
                htmlFor="body"
              >
                Description
              </label>
              <RichTextEditor
                value={bodyValue}
                onChange={setBodyValue}
                disabled={isLoading || isSubmitting}
                placeholder="Write a detailed description for your thread..."
                rows={8}
              />
            </div>

            <CardFooter className="flex justify-end border-t border-border px-0 pt-5">
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => console.log("Button clicked")}
              >
                {isSubmitting ? "Submitting..." : "Publish Thread"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewThreadsPage;
