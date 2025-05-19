import React, { useState } from 'react';
import Image from 'next/image';
import assets from './../assets/assets';
import ChatLabel from './ChatLabel';
import {useClerk, UserButton} from '@clerk/nextjs';
import { useAppContext } from '../context/AppContext';

interface MenuState {
    id: string | number;
    open: boolean;
  }
  

interface SidebarProps {
    expand: boolean;
    setExpand: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ expand, setExpand }) => {
  const { openSignIn } = useClerk();
  const { user, conversations, createNewConversation } = useAppContext();
  const [openMenu, setOpenMenu] = useState<MenuState>({ id: 0, open: false });

    return (
        <div className={`flex flex-col justify-between bg-[#212327] pt-7 transition-all z-50 max-md:absolute max-md:h-screen ${expand ? 'p-4 w-64' : 'md:w-20 w-0 max-md:overflow-hidden'}` }>
            <div>
                <div className={`flex ${expand ? 'flex-row gap-10' : 'flex-col items-center gap-8'}`}>
                    <Image className={expand ? "w-35":"w-10"} src={expand ? assets.logo_text : assets.logo} alt='logo' />

                    <div 
                        onClick={() => (expand ? setExpand(false) : setExpand(true))}
                        className='group relative flex items-center justify-center 
                        hover:bg-gray-500/20 transition-all duration-300 h-9 w-12 px-2
                        rounded-lg cursor-pointer'>
                        <Image className="md:hidden" src={assets.sidebar} alt='menu' />
                        <Image className="hidden md:block w-12 " src={expand ? assets.colse_sidebar : assets.sidebar} alt='sidebar' onClick={() => (expand ? setExpand(false) : setExpand(true))} />
                        <div className={`absolute w-max ${expand ? 'left-1/2 -translate-x-1/2 top-12' : '-top-12 left-0'} opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none`} >
                            {expand ? 'Close sidebar ' : 'Open sidebar'}   
                            <div className={`w-3 h-3 absolute bg-black rotate-45 
                            ${expand ? "left-1/2 -top-1.5 -translate-x-1/2 " : "left-4 -bottom-1.5"}`}> </div>
                        </div>
                    </div>
                </div>

                <button onClick={() => createNewConversation('')} className={`mt-8 flex items-center justify-center cursor-pointer ${expand ? "bg-blue-500 hover:opacity-90 rounded-2xl gap-2 p-2.5 w-max" : "group relative h-9 w-9 mx-auto hover:bg-gray-500/30 rounded-lg"} `}>
                    <Image className={expand ? 'w-6': 'w-7'} src={expand ?assets.chat : assets.chat} alt='chat'/>
                
                    <div className="absolute w-max -top-12 -right-12 opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none">
                        New chat 
                        <div className='w-3 h-3 bg-black rotate-45 absolute left-4 -top-1.5 -translate-x-1/2'>
                        </div>
                    </div>
                    {expand && <p className="text-white text font-medium"> New chat</p>}
                    
                </button>

                <div className={`mt-8 text-white/25 text-sm ${expand ? 'block' : 'hidden'}`}>
                    <p className="my-1">Recents</p>
                    {conversations.map((conversation) => (
                        <div key={`chat-${conversation.id}`}>
                        <ChatLabel
                            title={conversation.title || 'New Chat'}
                            id={conversation.id}
                            openMenu={openMenu}
                            setOpenMenu={setOpenMenu}
                        />
                        </div>
                    ))}
                    </div>
                </div>

            <div>
                <div className={`flex items-center cursor-pointer group relative  ${expand ? "gap-3 text-white/80 text-sm p-2.5 border border-gray-700 rounded-lg hover:bg-white/10 cursor-pointer": "h-10 w-10 mx-auto hover:bg-gray-500/30 rounded-lg"} `}>
                    <Image  className={expand ? 'w-5' : 'w-6.5 mx-auto'} src={expand ? assets.setting : assets.setting} alt='settings' />
                    <div className={`absolute  -top-60 pb-8 ${!expand && "-right-40"} opacity-0 group-hover:opacity-100 hidden group-hover:block transition`} >
                        <div className="relative w-max bg-black text-white text-sm p-3 rounded-lg shadow-lg">
                            <Image src={assets.qrcode} alt='qrcode' className='w-44' />
                            <p> Scan to get YMS_BIM APP</p>
                            <div className={`w-3 h-3 absolute bg-black rotate-45 ${expand ? "right-1/2" : "left-4"} -bottom-1.5`}></div>
                        </div>
                    </div>
                    {expand && <><span> Get APP</span> <Image alt='icone' src={assets.new_icone} className=" w-5" /></>}
                </div>
                
                <div onClick={() => user ? null:openSignIn()}
                className={`flex items-center ${expand ? "hover:bg-white/10 rounded-lg" : "justify-center w-full"} gap-3 text-white/60 text-sm p-2 mt-2 cursor-pointer`}>
                    {   user?  <UserButton/>
                        : <Image src={assets.user_icone} alt="" className='w-7' />

                    }
                    {expand && <span>My Profile</span>}
                </div>
            </div>
        </div>
    )
}

export default Sidebar