import Sidebar from './Sidebar';
import QRCode from "react-qr-code";
import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";

const QRCodePage = () => {
    const [CriticalSummary, setCriticalSummary] = useState("No data");
    const [pdfUrl, setPdfUrl] = useState("");
    useEffect(() => {
        const fetchExisting = async () => {
            try {
            const res = await fetch("http://localhost:8000/load-categories");
            const data = await res.json();

            if (data.critical_summary) setCriticalSummary(data.critical_summary);

            } catch (err) {
            console.error("Error loading categories:", err);
            }
        };

        fetchExisting();
    }, []);

    useEffect(() => {
        const fetchExisting = async () => {
        try {
            const res = await fetch("http://localhost:8000/update-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: CriticalSummary }),
            });
            const data = await res.json();
            setPdfUrl(data.pdf_url);
        } catch (err) {
            console.error("Error loading PDF:", err);
        }
        };

        fetchExisting();
    }, []);

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 bg-primaryWhite flex items-center justify-center">
                <div
                    className="rounded-2xl flex flex-col items-center justify-center"
                    style={{
                        height: '50%',
                        border: '8px solid #2D427A',
                        background: '#C9EBF9',
                        minWidth: '340px',
                        padding: '2rem'
                    }}
                >
                    <h2 className="text-primaryDark mb-6 font-bold" style={{ fontSize: '2rem' }}>
                        Scan to view PDF
                    </h2>
                    {pdfUrl && <QRCode value={pdfUrl} size={256} />}
                </div>
            </div>
        </div>
    );
};

export default QRCodePage;