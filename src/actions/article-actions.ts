// src/actions/article-actions.ts
'use server'

import { db as prisma } from '../services/db'
import { revalidatePath } from 'next/cache'

export interface ArticleItem {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  content: string
  category: string
  coverImageAssetId?: string | null
  coverImageAsset?: {
    id: string
    title: string
    fileUrl: string
    fileName: string
    fileType: string
    fileSize?: number | null
  } | null
  tags?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  authorName: string
  authorRole?: string | null
  readingTime: number
  isPublished: boolean
  isFeatured: boolean
  publishedAt?: Date | null
  viewCount: number
  createdAt: Date
  updatedAt: Date
}

function calculateReadingTime(htmlContent: string): number {
  if (!htmlContent) return 1
  // Strip HTML tags
  const text = htmlContent.replace(/<[^>]*>?/gm, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(words / 200)
  return Math.max(1, minutes)
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

/**
 * Mendapatkan daftar artikel yang telah dipublikasikan untuk halaman publik (/kabar)
 */
export async function getPublishedArticlesAction(options?: {
  page?: number
  limit?: number
  category?: string
  search?: string
}) {
  try {
    const page = Math.max(1, options?.page || 1)
    const limit = Math.min(50, options?.limit || 12)
    const skip = (page - 1) * limit
    const category = options?.category && options.category !== 'ALL' ? options.category : undefined
    const search = options?.search?.trim()

    const where: any = {
      isPublished: true
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [total, items, allPublished] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        include: {
          coverImageAsset: {
            select: {
              id: true,
              title: true,
              fileUrl: true,
              fileName: true,
              fileType: true,
              fileSize: true
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.article.findMany({
        where: { isPublished: true },
        select: { category: true }
      })
    ])

    // Hitung per kategori
    const categoryCounts: Record<string, number> = {}
    allPublished.forEach((art) => {
      categoryCounts[art.category] = (categoryCounts[art.category] || 0) + 1
    })

    return {
      success: true,
      items: items as ArticleItem[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + items.length < total,
      categoryCounts
    }
  } catch (error: any) {
    console.error('getPublishedArticlesAction error:', error)
    return {
      success: false,
      items: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
      hasMore: false,
      categoryCounts: {},
      error: error.message || 'Gagal memuat artikel.'
    }
  }
}

/**
 * Mendapatkan detail artikel berdasarkan slug untuk pembaca publik (/kabar/[slug])
 */
export async function getArticleBySlugAction(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        coverImageAsset: {
          select: {
            id: true,
            title: true,
            fileUrl: true,
            fileName: true,
            fileType: true,
            fileSize: true
          }
        }
      }
    })

    if (!article) {
      return { success: false, error: 'Artikel tidak ditemukan' }
    }

    // Ambil artikel terkait (rekomendasi bacaan)
    const related = await prisma.article.findMany({
      where: {
        isPublished: true,
        id: { not: article.id },
        category: article.category
      },
      include: {
        coverImageAsset: {
          select: {
            id: true,
            title: true,
            fileUrl: true,
            fileName: true,
            fileType: true
          }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: 3
    })

    // Jika terkait kurang dari 3, ambil dari kategori apa saja
    let finalRelated = related
    if (finalRelated.length < 3) {
      const more = await prisma.article.findMany({
        where: {
          isPublished: true,
          id: { notIn: [article.id, ...finalRelated.map((r) => r.id)] }
        },
        include: {
          coverImageAsset: {
            select: {
              id: true,
              title: true,
              fileUrl: true,
              fileName: true,
              fileType: true
            }
          }
        },
        orderBy: { publishedAt: 'desc' },
        take: 3 - finalRelated.length
      })
      finalRelated = [...finalRelated, ...more]
    }

    return {
      success: true,
      article: article as ArticleItem,
      relatedArticles: finalRelated as ArticleItem[]
    }
  } catch (error: any) {
    console.error('getArticleBySlugAction error:', error)
    return { success: false, error: error.message || 'Gagal memuat artikel.' }
  }
}

/**
 * Mendapatkan artikel untuk panel admin (/admin/artikel) dengan pagination real server-side
 */
export async function getAdminArticlesAction(options?: {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: 'ALL' | 'PUBLISHED' | 'DRAFT'
}) {
  try {
    const page = Math.max(1, options?.page || 1)
    const limit = Math.min(100, Math.max(1, options?.limit || 15))
    const skip = (page - 1) * limit
    const where: any = {}

    if (options?.category && options.category !== 'ALL') {
      where.category = options.category
    }

    if (options?.status === 'PUBLISHED') {
      where.isPublished = true
    } else if (options?.status === 'DRAFT') {
      where.isPublished = false
    }

    if (options?.search?.trim()) {
      const q = options.search.trim()
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } }
      ]
    }

    const [total, items, stats] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        include: {
          coverImageAsset: {
            select: {
              id: true,
              title: true,
              fileUrl: true,
              fileName: true,
              fileType: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.article.aggregate({
        _count: { id: true },
        _sum: { viewCount: true }
      })
    ])

    const [totalPublished, totalDraft, allCategories] = await Promise.all([
      prisma.article.count({ where: { isPublished: true } }),
      prisma.article.count({ where: { isPublished: false } }),
      prisma.article.findMany({
        select: { category: true },
        distinct: ['category']
      })
    ])

    return {
      success: true,
      items: items as ArticleItem[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + items.length < total,
      metrics: {
        totalArticles: stats._count.id || 0,
        totalPublished,
        totalDraft,
        totalViews: stats._sum.viewCount || 0
      },
      availableCategories: allCategories.map((c) => c.category)
    }
  } catch (error: any) {
    console.error('getAdminArticlesAction error:', error)
    return {
      success: false,
      items: [],
      total: 0,
      page: 1,
      limit: 15,
      totalPages: 0,
      hasMore: false,
      metrics: {
        totalArticles: 0,
        totalPublished: 0,
        totalDraft: 0,
        totalViews: 0
      },
      availableCategories: [],
      error: error.message || 'Gagal memuat daftar artikel admin.'
    }
  }
}

/**
 * Mendapatkan detail artikel by ID untuk form edit admin
 */
export async function getArticleByIdAction(id: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        coverImageAsset: {
          select: {
            id: true,
            title: true,
            fileUrl: true,
            fileName: true,
            fileType: true
          }
        }
      }
    })

    if (!article) return { success: false, error: 'Artikel tidak ditemukan.' }
    return { success: true, article: article as ArticleItem }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memuat artikel.' }
  }
}

/**
 * Menyimpan artikel baru dari form admin
 */
export async function createArticleAction(data: {
  title: string
  slug?: string | null
  excerpt?: string | null
  content: string
  category: string
  coverImageAssetId?: string | null
  tags?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  authorName?: string | null
  authorRole?: string | null
  isPublished?: boolean
  isFeatured?: boolean
}) {
  try {
    if (!data.title?.trim()) {
      return { success: false, error: 'Judul artikel wajib diisi.' }
    }
    if (!data.content?.trim()) {
      return { success: false, error: 'Konten artikel tidak boleh kosong.' }
    }

    // Tentukan slug
    let baseSlug = slugify(data.slug?.trim() || data.title)
    if (!baseSlug) baseSlug = `artikel-${Date.now()}`

    // Cek keunikan slug
    let finalSlug = baseSlug
    let counter = 1
    while (await prisma.article.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`
      counter++
    }

    const readingTime = calculateReadingTime(data.content)
    const isPublished = Boolean(data.isPublished)

    const article = await prisma.article.create({
      data: {
        title: data.title.trim(),
        slug: finalSlug,
        excerpt: data.excerpt?.trim() || null,
        content: data.content,
        category: data.category?.trim() || 'Kabar Kegiatan',
        coverImageAssetId: data.coverImageAssetId || null,
        tags: data.tags?.trim() || null,
        seoTitle: data.seoTitle?.trim() || null,
        seoDescription: data.seoDescription?.trim() || null,
        authorName: data.authorName?.trim() || 'Bagian Organisasi',
        authorRole: data.authorRole?.trim() || 'Tim Pembina Pelayanan Publik',
        readingTime,
        isPublished,
        isFeatured: Boolean(data.isFeatured),
        publishedAt: isPublished ? new Date() : null
      }
    })

    revalidatePath('/kabar')
    revalidatePath(`/kabar/${article.slug}`)
    revalidatePath('/admin/artikel')

    return { success: true, article }
  } catch (error: any) {
    console.error('createArticleAction error:', error)
    return { success: false, error: error.message || 'Gagal menyimpan artikel baru.' }
  }
}

/**
 * Memperbarui artikel yang sudah ada
 */
export async function updateArticleAction(
  id: string,
  data: {
    title: string
    slug?: string | null
    excerpt?: string | null
    content: string
    category: string
    coverImageAssetId?: string | null
    tags?: string | null
    seoTitle?: string | null
    seoDescription?: string | null
    authorName?: string | null
    authorRole?: string | null
    isPublished?: boolean
    isFeatured?: boolean
  }
) {
  try {
    const existing = await prisma.article.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: 'Artikel tidak ditemukan.' }
    }

    // Cek slug jika diubah
    let finalSlug = existing.slug
    if (data.slug && slugify(data.slug) !== existing.slug) {
      const candidate = slugify(data.slug)
      const conflict = await prisma.article.findFirst({
        where: { slug: candidate, id: { not: id } }
      })
      if (conflict) {
        return { success: false, error: `Slug "${candidate}" sudah digunakan artikel lain.` }
      }
      finalSlug = candidate
    }

    const readingTime = calculateReadingTime(data.content)
    const isPublished = Boolean(data.isPublished)
    const publishedAt = isPublished
      ? existing.publishedAt || new Date()
      : null

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: data.title.trim(),
        slug: finalSlug,
        excerpt: data.excerpt?.trim() || null,
        content: data.content,
        category: data.category?.trim() || 'Kabar Kegiatan',
        coverImageAssetId: data.coverImageAssetId || null,
        tags: data.tags?.trim() || null,
        seoTitle: data.seoTitle?.trim() || null,
        seoDescription: data.seoDescription?.trim() || null,
        authorName: data.authorName?.trim() || 'Bagian Organisasi',
        authorRole: data.authorRole?.trim() || 'Tim Pembina Pelayanan Publik',
        readingTime,
        isPublished,
        isFeatured: Boolean(data.isFeatured),
        publishedAt
      }
    })

    revalidatePath('/kabar')
    revalidatePath(`/kabar/${updated.slug}`)
    if (existing.slug !== updated.slug) {
      revalidatePath(`/kabar/${existing.slug}`)
    }
    revalidatePath('/admin/artikel')

    return { success: true, article: updated }
  } catch (error: any) {
    console.error('updateArticleAction error:', error)
    return { success: false, error: error.message || 'Gagal memperbarui artikel.' }
  }
}

/**
 * Menghapus artikel
 */
export async function deleteArticleAction(id: string) {
  try {
    const deleted = await prisma.article.delete({ where: { id } })
    revalidatePath('/kabar')
    revalidatePath(`/kabar/${deleted.slug}`)
    revalidatePath('/admin/artikel')
    return { success: true }
  } catch (error: any) {
    console.error('deleteArticleAction error:', error)
    return { success: false, error: error.message || 'Gagal menghapus artikel.' }
  }
}

/**
 * Toggle publikasi artikel secara cepat
 */
export async function togglePublishArticleAction(id: string, isPublished: boolean) {
  try {
    const existing = await prisma.article.findUnique({ where: { id } })
    if (!existing) return { success: false, error: 'Artikel tidak ditemukan.' }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? (existing.publishedAt || new Date()) : null
      }
    })

    revalidatePath('/kabar')
    revalidatePath(`/kabar/${updated.slug}`)
    revalidatePath('/admin/artikel')

    return { success: true, isPublished: updated.isPublished }
  } catch (error: any) {
    console.error('togglePublishArticleAction error:', error)
    return { success: false, error: error.message || 'Gagal mengubah status publikasi.' }
  }
}
