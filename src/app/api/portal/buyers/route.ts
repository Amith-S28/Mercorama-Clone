import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

export const runtime = "edge";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hsCode = searchParams.get("hsCode");
    const country = searchParams.get("country");
    const industry = searchParams.get("industry") || "your industry";

    if (!hsCode || !country) {
      return NextResponse.json(
        { error: "Missing hsCode or country parameter" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert global trade advisor. My client is an SME in the "${industry}" sector exporting a product with HS Code ${hsCode} to the country with ISO3 code ${country}.
      
      Please identify:
      1. Top 3 real, verifiable potential B2B buyers or distributors in this country.
      2. Top 2 real trade shows or industry associations relevant to this sector in this country.
      
      Return ONLY a valid JSON object in this exact format, with no markdown formatting or other text:
      {
        "buyers": [
          { "name": "Buyer Name", "type": "Distributor/Retailer/etc", "description": "Brief description" }
        ],
        "tradeShows": [
          { "name": "Show Name", "location": "City", "description": "Brief description" }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/```json/g, "").replace(/```/g, "");
    
    const parsed = JSON.parse(responseText);

    return NextResponse.json({
      buyers: parsed.buyers || [],
      tradeShows: parsed.tradeShows || [],
      dataOrigin: "live"
    });
  } catch (error) {
    console.error("Buyer Discovery API Error:", error);
    return NextResponse.json({ buyers: [], tradeShows: [], dataOrigin: "structured-fallback" });
  }
}
