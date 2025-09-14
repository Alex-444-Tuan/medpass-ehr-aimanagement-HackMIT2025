import Sidebar from './Sidebar';
import { useState, useRef, useEffect } from "react";
import EHRCardDetail from '../components/EHRCardDetail';

const EHR = () => {
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const [audioURL, setAudioURL] = useState("");
    const [demoEHR, setDemoEHR] = useState("");
    // set up all the data for EHR cards here
    const [CriticalSummary, setCriticalSummary] = useState("does not have data yet");
    const [VisitHistory, setVisitHistory] = useState("does not have data yet");
    const [LabAndImaging, setLabAndImaging] = useState("does not have data yet");
    const [ProceduresAndSurgeries, setProceduresAndSurgeries] = useState("does not have data yet");
    const [FullDocs, setFullDocs] = useState("does not have data yet");
    const [selectedCard, setSelectedCard] = useState("");
    const [titleOfSelectedCard, setTitleOfSelectedCard] = useState("");
    //set up description for EHR cards here
    const [descriptionOfCS, setDescriptionOfCS] = useState("");
    const [descriptionOfVH, setDescriptionOfVH] = useState("");
    const [descriptionOfLI, setDescriptionOfLI] = useState("");
    const [descriptionOfPS, setDescriptionOfPS] = useState("");
    const [descriptionOfFD, setDescriptionOfFD] = useState("");
    //set up title for EHR cards here
    const [titleOfCS, setTitleOfCS] = useState("Critical Summary");
    const [titleOfVH, setTitleOfVH] = useState("Visit History");
    const [titleOfLI, setTitleOfLI] = useState("Lab & Imaging");
    const [titleOfPS, setTitleOfPS] = useState("Procedures & Surgeries");
    const [titleOfFD, setTitleOfFD] = useState("Full Docs");

    useEffect(() => {
        setDescriptionOfCS("Contains the most important medical information about the patient at a glance: allergies, current medications, chronic conditions, and emergency contacts.");
        setDescriptionOfVH("A timeline of the patient\’s past medical visits and admissions.");
        setDescriptionOfLI("Recent test results and imaging reports.");
        setDescriptionOfPS("Records of operations and medical procedures the patient has undergone.");
        setDescriptionOfFD("Full medical documents and notes.");
    }, []);

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

    const onCLickCard = (id) => {
        if (id === "CriticalSummary") {
            setSelectedCard(CriticalSummary);
            setTitleOfSelectedCard("Critical Summary");
        } else if (id === "VisitHistory") {
            setSelectedCard(VisitHistory);
            setTitleOfSelectedCard("Visit History");
        } else if (id === "LabAndImaging") {
            setSelectedCard(LabAndImaging);
            setTitleOfSelectedCard("Lab & Imaging");
        } else if (id === "ProceduresAndSurgeries") {
            setSelectedCard(ProceduresAndSurgeries);
            setTitleOfSelectedCard("Procedures & Surgeries");
        } else if (id === "FullDocs") {
            setSelectedCard(FullDocs);
            setTitleOfSelectedCard("Full Docs");
        }
    }

    const onCloseCard = () => {
        setSelectedCard("");
        setTitleOfSelectedCard("");
    }

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
        <div className="flex h-screen bg-primaryDark">
        <Sidebar />
        <div className="flex justify-center items-start flex-[1_0_0] self-stretch rounded-[20px] mt-2 mb-2 bg-primaryWhite">
            <div className="flex flex-col items-center gap-[10px] flex-[1_0_0] self-stretch px-[30px] pt-[50px]">
                <div className="flex items-start gap-[10px] self-stretch pr-[50px] pl-[10px] py-[10px]">
                    <button className="bg-primaryDark hover:bg-blue1 disabled:bg-primaryDark disabled:opacity-50 text-white font-medium py-2 px-4 rounded" onClick={startRecording} disabled={recording}>{recording ? "Recording 🔴" : "Record"}</button>
                    <button className="bg-primaryDark hover:bg-blue1 disabled:bg-primaryDark disabled:opacity-50 text-white font-medium py-2 px-4 rounded" onClick={stopRecording} disabled={!recording}>Generate EHR</button>
                    {audioURL && <audio src={audioURL} controls />}
                </div>
                <div className="flex flex-col items-center gap-[10px] flex-[1_0_0] px-[10px] overflow-y-auto">
                    <EHRCardDetail title={titleOfCS} onClick={() => onCLickCard("CriticalSummary")} description={descriptionOfCS} />
                    <EHRCardDetail title={titleOfVH} onClick={() => onCLickCard("VisitHistory")} description={descriptionOfVH} />
                    <EHRCardDetail title={titleOfLI} onClick={() => onCLickCard("LabAndImaging")} description={descriptionOfLI} />
                    <EHRCardDetail title={titleOfPS} onClick={() => onCLickCard("ProceduresAndSurgeries")} description={descriptionOfPS} />
                    <EHRCardDetail title={titleOfFD} onClick={() => onCLickCard("FullDocs")} description={descriptionOfFD} />
                </div>
            </div>
            <div className="flex flex-col items-center gap-[10px] self-stretch w-[380px] py-[10px]">
                <h1 className="text-[20px] font-bold">calendar</h1>
            </div>

            {
            selectedCard &&
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50">
                <div className=" flex w-[506px] bg-primaryDark items-center justify-center text-white font-medium py-2 px-4">
                    {titleOfSelectedCard}
                </div>
                <div className="h-[714px] w-[505px] bg-white border shadow p-4 overflow-y-auto">
                    {selectedCard}
                </div>
                <button className="w-[506px] bg-primaryDark hover:bg-blue1 disabled:bg-primaryDark text-white font-medium py-2 px-4" onClick={onCloseCard}>Close</button>
            </div>
            }

            
            
            {demoEHR &&
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50">
                <div className=" flex w-[506px] bg-primaryDark items-center justify-center text-white font-medium py-2 px-4">
                    Review EHR
                </div>
                <textarea
                    className="h-[714px] w-[505px] bg-white border shadow"
                    value={demoEHR}
                    onChange={(e) => setDemoEHR(e.target.value)}
                ></textarea>
                <button className="w-[506px] bg-primaryDark hover:bg-blue1 disabled:bg-primaryDark text-white font-medium py-2 px-4" onClick={confirmEHR}>Confirm & Save</button>
            </div>
            }
        </div>
        </div>
    );
};
export default EHR;