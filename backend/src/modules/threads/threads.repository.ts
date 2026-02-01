import { query } from "../../db/db.js";
import { BadRequestError, NotFoundError } from "../../lib/errors.js";
import {
  Category,
  CategoryRow,
  mapCategoryRow,
  mapThreadDetailRow,
  mapThreadSummaryRow,
  ThreadDetail,
  ThreadDetailRow,
  ThreadListFilter,
  ThreadSummary,
  ThreadSummaryRow,
} from "./threads.types.js";

export function parseThreadListFilter(queryObj: {
  page?: unknown;
  pageSize?: unknown;
  category?: unknown;
  q?: unknown;
  sort?: unknown;
}): ThreadListFilter {
  const page = Number(queryObj.page) || 1;
  const rawPageSize = Number(queryObj.pageSize) || 20;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 50);

  const categorySlug =
    typeof queryObj.category === "string" && queryObj.category.trim()
      ? queryObj.category.trim()
      : undefined;

  const search =
    typeof queryObj.q === "string" && queryObj.q.trim()
      ? queryObj.q.trim()
      : undefined;

  const sort: "new" | "old" = queryObj.sort === "old" ? "old" : "new";

  return {
    page,
    pageSize,
    search,
    sort,
    categorySlug,
  };
}

export async function listCategories(): Promise<Category[]> {
  const result = await query<CategoryRow>(
    `
        SELECT id, slug, name, description
        FROM categories
        ORDER BY name ASC
    `
  );

  return result.rows.map(mapCategoryRow);
}

export async function createdThread(params: {
  categorySlug: string;
  authorUserId: number;
  title: string;
  body: string;
}): Promise<ThreadDetail> {
  const { categorySlug, authorUserId, title, body } = params;

  const categoryRes = await query<{ id: number }>(
    `
        SELECT id
        FROM categories
        WHERE slug = $1
        LIMIT 1
        `,
    [categorySlug]
  );

  if (categoryRes.rows.length === 0) {
    throw new BadRequestError("Invalid category");
  }

  const categoryId = categoryRes.rows[0].id;

  const insertRes = await query<{ id: number }>(
    `
        INSERT INTO threads (category_id, author_user_id, title, body)
        values ($1, $2, $3, $4)
        RETURNING id
        `,
    [categoryId, authorUserId, title, body]
  );

  const threadId = insertRes.rows[0].id;

  return getThreadById(threadId);
}

export async function getThreadById(id: number): Promise<ThreadDetail> {
  const result = await query<ThreadDetailRow>(
    `
        SELECT
          t.id,
          t.title,
          t.body,
          t.created_at,
          t.updated_at,
          c.slug AS category_slug,
          c.name AS category_name,
          u.display_name AS author_display_name,
          u.handle AS author_handle
        FROM threads t
        JOIN categories c ON c.id = t.category_id
        JOIN users u ON u.id = t.author_user_id
        WHERE t.id = $1
        LIMIT 1
        `,
    [id]
  );

  const row = result.rows[0];

  if (!row) {
    throw new NotFoundError("Thread not found");
  }

  return mapThreadDetailRow(row);
}

export async function listThreads(
  filter: ThreadListFilter
): Promise<ThreadSummary[]> {
  const { page, pageSize, categorySlug, sort, search } = filter;

  const conditions: string[] = [];

  const params: unknown[] = [];

  let idx = 1;

  if (categorySlug) {
    conditions.push(`c.slug = $${idx++}`);
    params.push(categorySlug);
  }

  if (search) {
    conditions.push(`(t.title ILIKE $${idx} OR t.body ILIKE $${idx})`);

    params.push(`%${search}%`);

    idx++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const orderClause =
    sort === "old" ? "ORDER BY t.created_at ASC" : "ORDER BY t.created_at DESC";

  const offset = (page - 1) * pageSize;

  params.push(pageSize, offset);

  const result = await query<ThreadSummaryRow>(
    `
    SELECT 
      t.id,
      t.title,
      t.body,
      LEFT(REGEXP_REPLACE(t.body, '<[^>]*>', '', 'g'), 200) AS excerpt,
      t.created_at,
      COALESCE((SELECT COUNT(*) FROM thread_reactions tr WHERE tr.thread_id = t.id), 0)::integer AS like_count,
      COALESCE((SELECT COUNT(*) FROM replies r WHERE r.thread_id = t.id), 0)::integer AS reply_count,
      c.slug AS category_slug,
      c.name AS category_name,
      u.display_name AS author_display_name,
      u.handle AS author_handle
    FROM threads t
    JOIN categories c ON c.id = t.category_id
    JOIN users u ON u.id = t.author_user_id
    ${whereClause}
    ${orderClause}
    LIMIT $${idx++} OFFSET $${idx}
    `,
    params
  );

  return result.rows.map(mapThreadSummaryRow);
}

// Get user's own threads
export async function getUserThreads(params: {
  userId: number;
  page: number;
  pageSize: number;
}): Promise<ThreadSummary[]> {
  const offset = (params.page - 1) * params.pageSize;

  const result = await query<ThreadSummaryRow>(
    `
    SELECT 
      t.id,
      t.title,
      t.body,
      t.created_at,
      t.updated_at,
      t.author_user_id,
      u.handle as author_handle,
      c.name as category_name,
      c.slug as category_slug,
      COUNT(DISTINCT r.id) as reply_count,
      COUNT(DISTINCT tr.id) as like_count
    FROM threads t
    LEFT JOIN users u ON u.id = t.author_user_id
    LEFT JOIN categories c ON c.slug = t.category_slug
    LEFT JOIN replies r ON r.thread_id = t.id
    LEFT JOIN thread_reactions tr ON tr.thread_id = t.id AND tr.reaction_type = 'like'
    WHERE t.author_user_id = $1
    GROUP BY t.id, u.id, c.id
    ORDER BY t.created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [params.userId, params.pageSize, offset]
  );

  return result.rows.map(mapThreadSummaryRow);
}

// Update thread
export async function updateThread(params: {
  threadId: number;
  title: string;
  body: string;
}): Promise<ThreadDetail> {
  const result = await query<ThreadDetailRow>(
    `
    UPDATE threads
    SET title = $1, body = $2, updated_at = NOW()
    WHERE id = $3
    RETURNING 
      id,
      title,
      body,
      category_slug,
      author_user_id,
      created_at,
      updated_at
    `,
    [params.title, params.body, params.threadId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError("Thread not found");
  }

  const threadRow = result.rows[0];

  // Fetch author info
  const authorResult = await query<{ id: number; handle: string }>(
    `SELECT id, handle FROM users WHERE id = $1`,
    [threadRow.author_user_id]
  );

  const author = authorResult.rows[0];

  return {
    id: threadRow.id,
    title: threadRow.title,
    body: threadRow.body,
    category: {
      slug: threadRow.category_slug,
      name: threadRow.category_slug, // placeholder
    },
    author: {
      id: author.id,
      handle: author.handle,
    },
    createdAt: threadRow.created_at,
    updatedAt: threadRow.updated_at,
    likeCount: 0,
    replyCount: 0,
    viewerHasLikedThisPostOrNot: false,
  };
}

// Delete thread
export async function deleteThread(threadId: number): Promise<void> {
  // Delete thread reactions first
  await query(`DELETE FROM thread_reactions WHERE thread_id = $1`, [threadId]);

  // Delete replies first
  await query(`DELETE FROM replies WHERE thread_id = $1`, [threadId]);

  // Delete the thread
  const result = await query(`DELETE FROM threads WHERE id = $1`, [threadId]);

  if (result.rowCount === 0) {
    throw new NotFoundError("Thread not found");
  }
}
