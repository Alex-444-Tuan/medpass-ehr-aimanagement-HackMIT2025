import Sidebar from './Sidebar';
import { useState, useRef } from "react";

const EHR = () => {
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const [audioURL, setAudioURL] = useState("");
    const [demoEHR, setDemoEHR] = useState("");

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioURL(URL.createObjectURL(blob));

        // Gửi blob lên backend
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");

        const result = await fetch("http://localhost:8000/voice-to-EHR", {
            method: "POST",
            body: formData,
        });
        const data = await result.json();
        setDemoEHR(data.EHR);
        };

        mediaRecorderRef.current.start();
        setRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        setRecording(false);
    };

    const confirmEHR = async () => {
        const formData = new FormData();
        formData.append("EHR", demoEHR);

    await fetch("http://localhost:8000/confirm-EHR", {
            method: "POST",
            body: formData,
    });
    setDemoEHR("");
    }

    return (
        <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 bg-primaryWhite">
            <div>
            <button onClick={startRecording} disabled={recording}>Start</button>
            <button onClick={stopRecording} disabled={!recording}>Stop</button>
            {audioURL && <audio src={audioURL} controls />}
            {demoEHR &&
            <div>
                <h1>Speech to Text</h1>
                <textarea
                    rows="10"
                    cols="50"
                    value={demoEHR}
                    onChange={(e) => setDemoEHR(e.target.value)}
                ></textarea>
                <br />
                <button onClick={confirmEHR}>Confirm & Save</button>
            </div>
            }
            </div>
        </div>
        </div>
    );
};
export default EHR;