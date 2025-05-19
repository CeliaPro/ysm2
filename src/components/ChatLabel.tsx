"use client";
import assets from '../assets/assets';
import Image from 'next/image';
import { useAppContext } from '../context/AppContext'; // Assurez-vous que le contexte est importé correctement
import axios from 'axios';
import toast from 'react-hot-toast';

interface ChatLabelProps {
  openMenu: {
    id: string | number;
    open: boolean;
  };
  setOpenMenu: React.Dispatch<React.SetStateAction<{
    id: string | number;
    open: boolean;
  }>>;
  id: string;
  title: string;
}

const ChatLabel: React.FC<ChatLabelProps> = ({ openMenu, setOpenMenu, id, title }) => {
    
  const {fetchUsersConversations, setSelectedConversation, conversations} = useAppContext(); 
  const selectConversation = () => {
    const conversationData = conversations.find((conv) => conv.id === id);
    setSelectedConversation(conversationData);
    // console.log(conversationData)
  }

  const renameHandler = async () => {
    try {
      const newName = prompt('Enter new name ');
      if (!newName) return 
      const {data} = await axios.post('/api/chat/rename', {
        conversationId: id , title: newName})
      if (data.success) {
        fetchUsersConversations(); // Met à jour la liste des conversations
        setOpenMenu({id: 0, open: false}); // Ferme le menu après le renommage
        toast.success (data.message)
      }
      else {
        toast.error(data.message)
      }
    }catch (error) {
      toast.error(error.message);
    }
  } 

  const deleteHandler = async () => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this conversation?');
      if (!confirmDelete) return;
      const {data} = await axios.post('/api/chat/delete', {conversationId: id})
      if (data.success) {
        fetchUsersConversations(); // Met à jour la liste des conversations
        setOpenMenu({id: 0, open: false}); // Ferme le menu après la suppression
        toast.success(data.message)
      }
      else {
        toast.error(data.message)
      }
    }catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <>
      <div
        onClick={selectConversation}
        className="flex items-center justify-between p-2 text-white/80 hover:bg-white/10 rounded-lg text-sm group cursor-pointer"
      >
        <p className="truncate max-w-[80%]">{title}</p>
        <div
          onClick={(error) => {
            error.stopPropagation(); // Empêche la propagation de l'événement de clic
            setOpenMenu({ id, open: !openMenu.open });
          }}
          className="group relative flex items-center justify-center h-6 w-6 hover:bg-black/80 rounded-lg"
        >
          <Image
            src={assets.three_dots}
            alt=""
            className={`w-5 ${openMenu.id ===id && openMenu.open ? '' : 'hidden'} group-hover:block`}
          />
          <div
            className={`absolute ${
              openMenu.id === id && openMenu.open ? 'block' : 'hidden'
            } -right-36 top-6 bg-gray-700 rounded-xl w-max p-2 z-50`}>

            <div onClick={renameHandler} className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg">
              <Image className="w-5" src={assets.edite_icone} alt="" />
              <p>Rename</p>
            </div>
            <div onClick={deleteHandler} className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg">
              <Image className="w-5" src={assets.delete_icone} alt="" />
              <p>Delete</p>
            </div>

          </div>
        </div>
      </div>

    {/* POPUP Modal pour uploder les documents a embider */}

    </>
  );
};

export default ChatLabel;

