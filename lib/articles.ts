import fs from "fs"
import matter from "gray-matter"
import path from "path"
import moment from "moment"
import { remark } from "remark"
import html from "remark-html"

import type { ArticleItem } from "@/types"

const articlesDirectory = path.join(process.cwd(), "articles")

export const getSortedArticles = (): ArticleItem[] => {
  const fileNames = fs.readdirSync(articlesDirectory)

  const allArticlesData = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, "")

    const fullPath = path.join(articlesDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, "utf-8")

    const matterResult = matter(fileContents)

    return {
      id,
      title: matterResult.data.title,
      date: matterResult.data.date,
      category: matterResult.data.category,
    }
  })

  return allArticlesData.sort((a, b) => {
    const format = "DD-MM-YYYY"
    const dateOne = moment(a.date, format)
    const dateTwo = moment(b.date, format)
    if (dateOne.isBefore(dateTwo)) {
      return -1
    } else if (dateTwo.isAfter(dateOne)) {
      return 1
    } else {
      return 0
    }
  })
}

export const getCategorisedArticles = (): Record<string, ArticleItem[]> | null => {
  const sortedArticles = getSortedArticles()
  if (!sortedArticles || sortedArticles.length === 0) return null

  const categorised: Record<string, ArticleItem[]> = {}
  for (const article of sortedArticles) {
    const category = article.category || "Uncategorized"
    if (!categorised[category]) categorised[category] = []
    categorised[category].push(article)
  }
  return categorised
}

export const getArticleData = async (
  slug: string
): Promise<ArticleItem & { contentHtml: string }> => {
  const fullPath = path.join(articlesDirectory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, "utf-8")

  const matterResult = matter(fileContents)

  const processedContent = await remark().use(html, { sanitize: false }).process(matterResult.content)
  const contentHtml = processedContent.toString()

  return {
    id: slug,
    title: matterResult.data.title,
    date: matterResult.data.date,
    category: matterResult.data.category,
    contentHtml,
  }
}
