"use client";

import React, { useState, useRef, useEffect } from 'react'
import assets from '../app/assets/assets'
import Image from 'next/image'
import Markdown from 'react-markdown'
import toast from 'react-hot-toast'
import PlanningView from './PlanningView'; // adjust path if needed
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';


// Définition des types de rôles autorisés
const allowedRoles = ['USER', 'ASSISTANT'];

interface ExtractedSource {
raw: string;
fileName: string;
page: string;
sections: string;
}

 const extractAllSources = (content: string): ExtractedSource[]=> {
    if (!content) return []; // ✅ Sécurité ajoutée

    const sources = [];
    

    // 1️⃣ Cas : [Document: ..., Page: ..., Section: ...]
    const docMatches = [...content.matchAll(/\[Document:\s*(.+?\.pdf),\s*Page:\s*(\d+),\s*Section:\s*([0-9a-zA-Z.\- ]+)\]/gi)];
    for (const match of docMatches) {
        sources.push({
        raw: match[0],
        fileName: match[1].trim(),
        page: match[2].trim(),
        sections: match[3].trim(),
        });
    }

    // 2️⃣ Cas : Selon le document [FICHIER, pages ..., sections ...].
    const fullMatch = content.match(/(Selon le document\s+\[(.*?)\]\.)/i);
    if (fullMatch) {
        const inside = fullMatch[2];
        const fileMatch = inside.match(/([^\],]+\.pdf)/i);
        const pageMatch = inside.match(/pages?\s+([0-9,\s]+)/i);
        const sectionMatch = inside.match(/sections?\s+([0-9a-zA-Z.,\s\-et]+)/i);

        sources.push({
        raw: fullMatch[1],
        fileName: fileMatch?.[1]?.trim() || '',
        page: pageMatch?.[1]?.trim() || '',
        sections: sectionMatch?.[1]?.trim() || '',
        });
    }

    return sources;
    };



interface MessageProps {
  role: "USER" | "ASSISTANT";
  content: string;
}

const Message: React.FC<MessageProps> = ({ role, content }) => {

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null); // 'like', 'dislike', or null
   
    useEffect(() => {
            if (role === "ASSISTANT" && bottomRef.current) {
                bottomRef.current.scrollIntoView({ behavior: 'smooth' });
            }
            }, [content, role]);
    
    if (!content?.trim()) return null;

   
  

    // Si le rôle n'est pas autorisé, on ne rend pas le composant
    if (!allowedRoles.includes(role)) {
        return null;
    }

    const copyMessage = () => {
        navigator.clipboard.writeText(content)
        toast.success('Message copied to clipboard')
    }

    const handleEdit = () => {
        toast('Edit functionality coming soon')
    }

    const handleLike = () => {
        setFeedback(feedback === 'like' ? null : 'like');
    }

    const handleDislike = () => {
        setFeedback(feedback === 'dislike' ? null : 'dislike');
    }

    const isUser = role === 'USER';
    const sources = !isUser ? extractAllSources(content) : [];
    const markdownContent = sources.length > 0
        ? sources.reduce((text, src) => text.replace(src.raw, '').trim(), content)
        : content;


    return (
        <div className='flex flex-col items-center w-full max-w-3xl text-sm'>
            <div className={`flex flex-col w-full mb-8 ${isUser && 'items-end'}`}>
                <div className={`group relative flex max-w-2xl py-3 ${isUser ? 'bg-[#414158] px-5 rounded-bl-xl rounded-t-xl' : 'gap-3'}`}>
                    <div className={`opacity-0 group-hover:opacity-100 absolute ${isUser ? '-left-16 top-2.5' : 'left-9 -bottom-6'} transition-all`}>
                        <div className='flex items-center gap-2 opacity-70'>
                            {isUser ? (
                                <>
                                    <Image onClick={copyMessage} src={assets.copy_icone} alt="" className='w-4 cursor-pointer' />
                                    <Image onClick={handleEdit} src={assets.edit_text} alt="" className='w-4 cursor-pointer' />
                                </>
                            ) : (
                                <>
                                    <Image onClick={copyMessage} src={assets.copy_icone} alt="" className='w-4.5 cursor-pointer' />
                                    
                                    {/* Like Button */}
                                    <button
                                        onClick={handleLike}
                                        className={`p-1 hover:bg-white/10 rounded transition-colors ${
                                            feedback === 'like' ? 'text-green-400' : ''
                                        }`}
                                        aria-label="Like message"
                                    >
                                        <svg
                                            className={`w-4 h-4 ${feedback === 'like' ? 'fill-green-400' : 'fill-white/70'}`}
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
                                        </svg>
                                    </button>

                                    {/* Dislike Button */}
                                    <button
                                        onClick={handleDislike}
                                        className={`p-1 hover:bg-white/10 rounded transition-colors ${
                                            feedback === 'dislike' ? 'text-red-400' : ''
                                        }`}
                                        aria-label="Dislike message"
                                    >
                                        <svg
                                            className={`w-4 h-4 ${feedback === 'dislike' ? 'fill-red-400' : 'fill-white/70'} transform rotate-180`}
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    {isUser ? (
                    <span className="text-white/90">{content}</span>
                    ) : (
                    <>
                        <Image
                        src={assets.logo}
                        alt="Assistant"
                        className="h-9 w-9 p-1 border border-white/15 rounded-full"
                        />
                        <div className="space-y-4 w-full bg-[#2e2e3e] text-white rounded-xl p-4 shadow-lg">
                        <div className="prose prose-invert max-w-none">
                            {markdownContent ? (
                            <Markdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                            >
                                {markdownContent}
                            </Markdown>
                            ) : (
                            <p className="text-white/70 italic">⚠️ Aucun contenu à afficher (réponse vide).</p>
                            )}

                            {sources.length > 0 && (
                            <div className="mt-4 p-4 border-l-4 border-blue-500 bg-blue-100/10 text-white/90 rounded-md shadow-md text-sm space-y-2">
                                <div className="font-semibold text-white/90">📄 Sources documentaires :</div>
                                {sources.map((src, idx) => (
                                <div key={idx}>
                                    🗂 <span className="text-blue-300">Fichier :</span> <span className="italic">{src.fileName}</span><br />
                                    📄 <span className="text-blue-300">Page :</span> <span className="italic">{src.page}</span><br />
                                    🔢 <span className="text-blue-300">Section(s) :</span> <span className="italic">{src.sections}</span>
                                </div>
                                ))}
                            </div>
                            )}

                        </div>
                        {/* ✅ Affichage Planning si nécessaire */}
                        {content.includes("AI Planning Assistant") && <PlanningView />}
                        </div>
                        <div ref={bottomRef} />
                    </>
                    )}

                </div>
            </div>
        </div>
    )
}

export default React.memo(Message)
