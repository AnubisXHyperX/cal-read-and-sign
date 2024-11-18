import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

export const config = {
  api: {
    bodyParser: true, // Enable body parsing for JSON
  },
};

// Path to the user activity log
const logFilePath = path.join(process.cwd(), "userLogs.json");

// Utility to check and log user activity
async function checkAndLogUserActivity(userId: string) {
  // Load the log file or create it if it doesn't exist
  let logs: { [key: string]: { [key: string]: number } } = {};
  if (fs.existsSync(logFilePath)) {
    const fileContent = fs.readFileSync(logFilePath, "utf8");
    logs = JSON.parse(fileContent || "{}");
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Check the user's activity for today
  if (!logs[userId]) {
    logs[userId] = {};
  }
  if (!logs[userId][today]) {
    logs[userId][today] = 0;
  }

  // Check if the user has exceeded the limit
  if (logs[userId][today] >= 2) {
    return false;
  }

  // Increment the count and save the logs
  logs[userId][today] += 1;
  fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
  return true;
}

// Handle POST requests
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { signature, fileName, fullName, id } = body;

    // Validate input
    if (!signature || !fileName || !fullName || !id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check the user's daily limit
    const isAllowed = await checkAndLogUserActivity(id);
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "Daily limit of 2 PDFs reached" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Load the original PDF
    const filePath = path.join(process.cwd(), "public", fileName);
    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: "Original PDF not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const originalPdfBytes = fs.readFileSync(filePath);

    // Load the PDF using pdf-lib
    const pdfDoc = await PDFDocument.load(originalPdfBytes);

    // Get the first page of the PDF
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Decode the signature image
    const signatureBytes = Buffer.from(signature.split(",")[1], "base64");
    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    // Define the position and size for the signature
    const sigWidth = 150;
    const sigHeight = 50;
    const sigX = firstPage.getWidth() / 2 - sigWidth / 2;
    const sigY = 50; // Position 50px from the bottom

    // Draw the signature on the PDF
    firstPage.drawImage(signatureImage, {
      x: sigX,
      y: sigY,
      width: sigWidth,
      height: sigHeight,
    });

    // Generate the filename using ID, Name, and Date
    const date = new Date();
    const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const sanitizedFullName = fullName.replace(/\s+/g, "-").toLowerCase(); // Sanitize name
    const sanitizedId = id.replace(/\s+/g, "-").toLowerCase(); // Sanitize ID
    const signedFileName = `${sanitizedId}-${sanitizedFullName}-${formattedDate}.pdf`;
    const signedFilePath = path.join(process.cwd(), "signedDocuments", signedFileName);

    // Save the modified PDF
    const signedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(signedFilePath, signedPdfBytes);

    return new Response(JSON.stringify({ message: "PDF saved successfully!", fileName: signedFileName }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error saving PDF:", error);
    return new Response(JSON.stringify({ error: "Failed to save PDF" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}