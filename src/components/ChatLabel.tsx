"use client";
import assets from '../app/assets/assets';
import Image from 'next/image';
import { useAppContext } from '../contexts/AppContext';
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
  isSelected?: boolean;
  onDelete?: () => void;
  deleting?: boolean; // <-- added
}

const ChatLabel: React.FC<ChatLabelProps> = ({
  openMenu,
  setOpenMenu,
  id,
  title,
  isSelected = false,
  onDelete,
  deleting = false,
}) => {
  const { fetchUsersConversations, setSelectedConversation, conversations } = useAppContext();

  const selectConversation = () => {
    const conversationData = conversations.find((conv) => conv.id === id);
    setSelectedConversation(conversationData || null);
  };

  const renameHandler = async () => {
    try {
      const newName = prompt('Enter new name');
      if (!newName) return;
      const { data } = await axios.post('/api/chat/rename', {
        conversationId: id, title: newName,
      });
      if (data.success) {
        fetchUsersConversations();
        setOpenMenu({ id: 0, open: false });
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error?.message || 'An unexpected error occurred.');
    }
  };

  // No deleteHandler here; only use onDelete from props

  return (
    <div
      onClick={selectConversation}
      className={`flex items-center justify-between p-2 rounded-lg text-sm group cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-blue-500/20 text-white border-l-2 border-blue-500'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      <p className="truncate max-w-[80%]">{title}</p>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenu({ id, open: !openMenu.open });
        }}
        className="group relative flex items-center justify-center h-6 w-6 hover:bg-black/80 rounded-lg"
      >
        <Image
          src={assets.three_dots}
          alt=""
          className={`w-5 ${openMenu.id === id && openMenu.open ? '' : 'hidden'} group-hover:block`}
        />
        <div
          className={`absolute ${
            openMenu.id === id && openMenu.open ? 'block' : 'hidden'
          } -right-36 top-6 bg-gray-700 rounded-xl w-max p-2 z-50`}
        >
          <div onClick={renameHandler} className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg">
            <Image className="w-5" src={assets.edite_icone} alt="" />
            <p>Renommer</p>
          </div>
          <button
            onClick={deleting ? undefined : onDelete}
            disabled={deleting}
            className={`flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg ${deleting ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{ pointerEvents: deleting ? "none" : "auto" }}
          >
            <Image className="w-5" src={assets.delete_icone} alt="" />
            <p>{deleting ? "Suppression..." : "Supprimer"}</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatLabel;
