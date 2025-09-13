import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (data.token) {
        localStorage.setItem('token', data.token);
        navigate('/ehr');
        setError(data.error);
        }
    };

    const handleGoogleLogin = async (credentialResponse) => {
        const res = await fetch('http://localhost:4000/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
        });
        const data = await res.json();
        if (data.token) {
        localStorage.setItem('token', data.token);
        navigate('/ehr');
        } else {
        setError(data.error);
        }
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
        <div className="flex h-screen">
            <div className="w-1/2 bg-primaryDark"></div>
            <div className="w-1/2 bg-blue2 flex items-center justify-center">
            <div className="bg-primaryWhite rounded-2xl shadow-lg flex flex-col items-center justify-center" style={{height: '60%', width: '48%'}}>
                <h2 className="text-3xl font-bold mb-6">Log in</h2>
                <form onSubmit={handleLogin} className="w-full flex flex-col items-center">
                <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username"
                    className="mb-4 px-4 py-2 rounded w-4/5 border"
                />
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    className="mb-4 px-4 py-2 rounded w-4/5 border"
                />
                <button type="submit" className="bg-blue1 text-primaryWhite px-6 py-2 rounded mb-4 w-4/5">Log in</button>
                {error && <div className="text-red-500">{error}</div>}
                </form>
                <div className="mb-2 text-gray-500">or log with</div>
                <div className="w-4/5">
                <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => setError('Google login failed')}
                    width="100%"
                />
                </div>
            </div>
            </div>
        </div>
        </GoogleOAuthProvider>
    );
};

export default Login;
