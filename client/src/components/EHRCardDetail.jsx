import React from 'react'

const EHRCardDetail = ({title, data, onClick, description}) => {
  return (
    <button onClick={onClick} className="flex hover:bg-blue1 flex-col flex-shrink-0 items-start gap-[10px] w-[624px] h-[200px] p-5 rounded-[30px] bg-[#D9D9D9] shadow-[6px_6px_4px_0_rgba(0,0,0,0.25)]">
        <h1 className="text-black text-center font-inter text-[20px] not-italic font-bold leading-normal">{title}</h1>
        <p className="text-black text-left font-inter text-[20px] not-italic font-normal leading-normal">{description}</p>
    </button>
  )
}

export default EHRCardDetail