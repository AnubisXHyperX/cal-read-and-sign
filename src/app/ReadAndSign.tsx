"use client";

import React, { useRef, useState } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { forwardRef } from "react";
import "@react-pdf-viewer/core/lib/styles/index.css";
import ReactSignatureCanvas from "react-signature-canvas";

// Wrap Signature Canvas with forwardRef
const SignatureCanvas = forwardRef<ReactSignatureCanvas, any>((props, ref) => <ReactSignatureCanvas ref={ref} {...props} />);

export default function ReadAndSign() {
  const [pdfFile] = useState("/sample.pdf"); // Path to the PDF file
  const [fullName, setFullName] = useState(""); // Input for full name
  const [id, setId] = useState(""); // Input for ID
  const sigCanvasRef = useRef<any>(null); // Ref for the signature canvas

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear(); // Clear the signature canvas
    } else {
      console.error("Signature canvas ref is not defined.");
    }
  };

  const resetForm = () => {
    setFullName(""); // Clear full name input
    setId(""); // Clear ID input
    clearSignature(); // Clear the signature canvas
  };

  const savePDF = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      alert("Please provide a signature before saving.");
      return;
    }

    if (!fullName || !id) {
      alert("Please provide both your full name and ID.");
      return;
    }

    try {
      // Capture the signature as an image
      const signatureDataURL = sigCanvasRef.current.toDataURL("image/png");

      // Send the signature, full name, ID, and original PDF filename to the server
      const response = await fetch("/api/save-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: signatureDataURL,
          fileName: "sample.pdf", // Replace with your actual file name
          fullName,
          id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`PDF sent successfully.`);

        // Clear the form after successfully sending the PDF
        resetForm();
      } else {
        const error = await response.json();
        console.error("Error saving PDF:", error);
        if (error.error === "Daily limit of 2 PDFs reached") {
          alert("Daily limit of 2 PDFs reached. Please try again tomorrow.");
        } else {
          alert("An error occurred while saving the PDF. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error generating or saving PDF:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Read and Sign</h1>

      {/* PDF Viewer */}
      <div className="border border-gray-300 p-4 rounded mb-6 pdf-viewer">
        <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js">
          <Viewer fileUrl={pdfFile} />
        </Worker>
      </div>

      {/* Full Name and ID Inputs */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full border border-gray-300 p-2 rounded mb-4"
        />
        <label className="block mb-2 font-semibold">ID</label>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter your ID"
          className="w-full border border-gray-300 p-2 rounded"
        />
      </div>

      {/* Signature Canvas */}
      <div className="mb-6 items-center">
        <h2 className="text-lg font-semibold mb-2">Signature</h2>
        <SignatureCanvas
          ref={sigCanvasRef}
          penColor="black"
          canvasProps={{
            width: 345,
            height: 150,
            className: "border border-gray-300 rounded",
          }}
        />
        <button
          onClick={clearSignature}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Clear
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={savePDF}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Send
      </button>
    </div>
  );
}