import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

export const runtime = "edge";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const EU_ISO3 = [
  "AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN",
  "FRA", "DEU", "GRC", "HUN", "IRL", "ITA", "LVA", "LTU", "LUX",
  "MLT", "NLD", "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE"
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hsCode = searchParams.get("hsCode");
    const country = searchParams.get("country");
    const quantityStr = searchParams.get("quantity");
    const quantity = parseInt(quantityStr || "0", 10);

    if (!hsCode || !country || isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid hsCode, country, or quantity parameter" },
        { status: 400 }
      );
    }

    if (!EU_ISO3.includes(country.toUpperCase())) {
      // CBAM only applies to EU
      return NextResponse.json({ cbamFeeTotal: 0, cbamFeePerUnit: 0, applies: false });
    }

    // Call Gemini to estimate CBAM
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert on the EU Carbon Border Adjustment Mechanism (CBAM).
      A company is exporting ${quantity} units of a product with HS Code ${hsCode} to the EU.
      Please estimate the total CBAM tax liability in EUR based on typical carbon emission intensities for this HS code.
      (Assume a default unit weight if necessary, e.g., 1kg per unit, and a current carbon price of approx 70 EUR/tonne).
      If this HS code is completely exempt from CBAM (not cement, iron, steel, aluminium, fertiliser, electricity, or hydrogen), return 0.
      
      Respond ONLY with a valid JSON object in this exact format, with no markdown formatting or other text:
      {"cbamFeeTotal": 123.45}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/```json/g, "").replace(/```/g, "");
    
    let cbamFeeTotal = 0;
    try {
      const parsed = JSON.parse(responseText);
      cbamFeeTotal = parsed.cbamFeeTotal || 0;
    } catch (e) {
      console.warn("Failed to parse CBAM response from Gemini:", responseText);
    }

    // Simple EUR to CAD hardcoded conversion for application (assume 1 EUR = 1.45 CAD)
    const cbamFeeTotalCad = cbamFeeTotal * 1.45;
    const cbamFeePerUnit = quantity > 0 ? cbamFeeTotalCad / quantity : 0;

    return NextResponse.json({
      cbamFeeTotal: cbamFeeTotalCad,
      cbamFeePerUnit,
      applies: cbamFeeTotalCad > 0,
      dataOrigin: "live"
    });
  } catch (error) {
    console.error("CBAM API Error:", error);
    return NextResponse.json({ cbamFeeTotal: 0, cbamFeePerUnit: 0, applies: false, dataOrigin: "structured-fallback" });
  }
}
