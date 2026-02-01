"use client";

import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Category } from "@/types/thread";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThreadsSidebar } from "./threads-sidebar";
import { ThreadsFeed } from "./threads-feed";

function ThreadsHomePage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [threadCount, setThreadCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") ?? "all"
  );
  const [sortBy, setSortBy] = useState<"new" | "old">(
    (searchParams.get("sort") as "new" | "old") ?? "new"
  );

  // Load categories on mount
  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const extractCategories = await apiGet<Category[]>(
          apiClient,
          "/api/threads/categories"
        );

        if (!isMounted) return;
        setCategories(extractCategories);
      } catch (error) {
        console.log(error);
      }
    }

    loadCategories();
  }, [apiClient]);

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

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-8 w-full">

      {/* Left Sidebar - Hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <ThreadsSidebar
          categories={categories}
          activeCategory={activeCategory}
          sortBy={sortBy}
          threadsCount={threadCount}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
        />
      </div>

      {/* Right Content Area - Threads Feed - takes remaining space */}
      <div className="flex-1 min-w-0">
        <ThreadsFeed activeCategory={activeCategory} sortBy={sortBy} />
      </div>
    </div>
  );
}

export default ThreadsHomePage;
