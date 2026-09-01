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

      Extract every visible product.

      Return ONLY a raw JSON array.

      Example:
      [
        {
          "name": "Хлеб белый",
          "price": 4000,
          "quantity": 20,
          "unit": "dona"
        }
      ]

      Rules:

      - Extract every visible product.
      - Preserve the product name as accurately as possible.
      - If price is not visible, use 0.
      - If quantity is not visible, use 0.
      - price must be a number.
      - quantity must be a number.

      The "unit" field MUST contain exactly ONE of these values:
      - "dona" — individual pieces/items
      - "quti" — box/package
      - "kg" — kilogram
      - "litr" — liter
      - "metr" — meter

      Unit rules:
      - Eggs, bread, individual bottles, individual items -> "dona"
      - Products explicitly sold as boxes/packages -> "quti"
      - Products sold by kilogram -> "kg"
      - Products sold by liters -> "litr"
      - Products sold by meters -> "metr"
      - If the unit cannot be determined, use "dona".

      Examples:
      "Рис 1 кг" -> unit: "kg"
      "Сахар 1 кг" -> unit: "kg"
      "Масло подсолнечное 1 л" -> unit: "litr"
      "Молоко 1 л" -> unit: "litr"
      "Хлеб белый" -> unit: "dona"
      "Яйца (10 шт)" -> unit: "quti" if the quantity represents packages of 10 eggs; otherwise "dona"
      "Вода 1,5 л" -> unit: "litr"

      Do not include markdown.
      Do not include explanations.
      Return ONLY valid JSON.
      `;

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