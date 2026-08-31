"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2 } from "lucide-react"
import { ProductImportPreview } from "./product-import-preview"

type ExtractedProduct = {
  name: string
  price: number
  quantity: number
}

export function PhotoImportButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Обработка выбора файла — фото уже сделано на телефоне заранее,
  // здесь просто выбираем файл из галереи/файловой системы
  async function handleFileChange(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const file = e.target.files?.[0]

  if (!file) return

  setIsLoading(true)
  setError(null)

  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(
      "/api/products/extract",
      {
        method: "POST",
        body: formData,
      }
    )

    const result = await response.json()

    console.log(result)

    if (!response.ok || !result.success) {
      setError(
        result.error ||
          "Произошла ошибка при обработке изображения."
      )
      return
    }

    setExtracted(result.data)
  } catch (err) {
    console.error("Image processing error:", err)

    setError(
      err instanceof Error
        ? err.message
        : "Произошла ошибка при обработке изображения."
    )
  } finally {
    setIsLoading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
}

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="photo-import-input"
      />
      <Button
        variant="outline"
        disabled={isLoading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Camera className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Чтение..." : "Загрузка через изображение"}
      </Button>

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}

      {extracted && (
        <ProductImportPreview
          items={extracted}
          onClose={() => setExtracted(null)}
        />
      )}
    </>
  )
}