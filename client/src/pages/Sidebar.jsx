
import { Link, useLocation } from 'react-router-dom';
const Sidebar = () => {
    const { pathname } = useLocation();
    return (
    <div className="w-64 h-full bg-primaryDark flex flex-col py-8 px-4">
        <Link to="/ehr">
            <button
                className={`w-full text-primaryWhite py-3 mb-4 rounded transition
                    ${pathname === '/ehr' ? 'bg-blue1' : 'bg-transparent'}
                    hover:bg-blue1`}
            >
                EHR
            </button>
        </Link>
        <Link to="/ai-doctor">
            <button
                className={`w-full text-primaryWhite py-3 mb-4 rounded transition
                    ${pathname === '/ai-doctor' ? 'bg-blue1' : 'bg-transparent'}
                    hover:bg-blue1`}
            >
                AI Doctor
            </button>
        </Link>
        <Link to="/qrcode">
            <button
                className="w-full text-primaryWhite py-3 mb-4 rounded transition flex items-center justify-center bg-qrcodeRed hover:bg-qrcodeRedDim"
            >
                QR Code
            </button>
        </Link>
    </div>
    );
};
export default Sidebar;
