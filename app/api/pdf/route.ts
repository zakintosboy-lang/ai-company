import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { buildRetroPdfHtml, PdfData } from "@/lib/retro-pdf-template";

export async function POST(req: NextRequest) {
  let data: PdfData;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!data.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const html = buildRetroPdfHtml(data);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Googleフォントを待つためにネットワークアイドル
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="retro-plan.pdf"`,
      },
    });
  } catch (err) {
    console.error("[PDF] generation error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
