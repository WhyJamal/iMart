import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Пройти авторизацию",
        },
        { status: 401 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY не установлен",
        },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Изображение не было загружено",
        },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")

    const prompt = `
        This image contains a handwritten or printed list of products
        (a price list or inventory sheet).

        Extract each product's name, price, and quantity.

        Return ONLY a raw JSON array.

        Example:
        [
        {
            "name": "Product name",
            "price": 10000,
            "quantity": 2
        }
        ]

        Rules:
        - Extract every visible product.
        - Preserve the product name as accurately as possible.
        - If price is not visible, use 0.
        - If quantity is not visible, use 0.
        - price must be a number.
        - quantity must be a number.
        - Do not include markdown.
        - Do not include explanations.
        `

    const response = await fetch(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()

      console.error("Gemini error:", errorText)

      return NextResponse.json(
        {
          success: false,
          error: "Ошибка подключения к службе ИИ",
        },
        { status: 502 }
      )
    }

    const data = await response.json()

    const textOutput =
      data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textOutput) {
      console.error("Gemini empty response:", data)

      return NextResponse.json(
        {
          success: false,
          error: "ИИ не ответил",
        },
        { status: 502 }
      )
    }

    // 9. JSON parse
    const cleaned = textOutput
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    let parsed

    try {
      parsed = JSON.parse(cleaned)
    } catch (error) {
      console.error("JSON parse error:", error)
      console.error("AI output:", cleaned)

      return NextResponse.json(
        {
          success: false,
          error: "Результат ИИ в неправильном формате",
        },
        { status: 502 }
      )
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        {
          success: false,
          error: "Результат ИИ в неправильном формате",
        },
        { status: 502 }
      )
    }

    if (parsed.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "На картинке товар не найден",
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    })
  } catch (error) {
    console.error("OCR import error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Изображение не может быть обработано.",
      },
      { status: 500 }
    )
  }
}