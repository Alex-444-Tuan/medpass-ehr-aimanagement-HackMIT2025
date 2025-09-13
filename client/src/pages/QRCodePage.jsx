import Sidebar from './Sidebar';
const QRCodePage = () => {
    return (
        <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 bg-primaryWhite flex items-center justify-center">
            <div className="bg-blue2 rounded-2xl" style={{height: '33vh', width: '33vh'}}></div>
        </div>
        </div>
    );
};
export default QRCodePage;