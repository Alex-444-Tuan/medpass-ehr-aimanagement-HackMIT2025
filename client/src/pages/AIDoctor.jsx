import Sidebar from './Sidebar';

const AIDoctor = () => {
    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 bg-primaryWhite">
                <iframe
                    src="http://localhost:8002"
                    title="AI Doctor Chat"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none'
                    }}
                />
            </div>
        </div>
    );
};

export default AIDoctor;
