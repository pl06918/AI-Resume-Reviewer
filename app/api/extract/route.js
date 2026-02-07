import mammoth from "mammoth";
import pdfParse from "pdf-parse";

function normalizeText(text) {
  return String(text || "").replace(/\u0000/g, "").trim();
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    const name = (file.name || "").toLowerCase();
    const bytes = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = normalizeText(bytes.toString("utf-8"));
    } else if (name.endsWith(".docx")) {
      const doc = await mammoth.extractRawText({ buffer: bytes });
      text = normalizeText(doc.value);
    } else if (name.endsWith(".pdf")) {
      const pdf = await pdfParse(bytes);
      text = normalizeText(pdf.text);
    } else {
      return Response.json({ error: "Unsupported file type." }, { status: 400 });
    }

    if (!text || text.length < 20) {
      return Response.json(
        { error: "Text extraction failed or document has too little text." },
        { status: 400 }
      );
    }

    return Response.json({ text });
  } catch (error) {
    return Response.json({ error: error.message || "Extraction failed." }, { status: 500 });
  }
}
