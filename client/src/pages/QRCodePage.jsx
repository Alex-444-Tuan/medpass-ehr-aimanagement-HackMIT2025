import Sidebar from './Sidebar';
import QRCode from "react-qr-code";

const QRCodePage = () => {
    const pdfUrl = "/mock_pdf.pdf";
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
                    <QRCode value={pdfUrl} size={256} />
                </div>
            </div>
        </div>
    );
};

export default QRCodePage;