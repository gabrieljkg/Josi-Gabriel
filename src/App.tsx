/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Gift, 
  Heart, 
  Home, 
  Copy, 
  Check, 
  QrCode, 
  X,
  Settings,
  Plus,
  Menu,
  Users,
  Calendar,
  Camera,
  MessageSquare,
  UserCheck,
  ChevronRight,
  Trash2
} from 'lucide-react';

// --- Types ---
interface GiftItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  isReserved?: boolean;
  reservedBy?: string;
}

interface RSVP {
  id: string;
  name: string;
  phone: string;
  confirmed: boolean;
  createdAt: string;
}

interface GuestMessage {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

// --- Data ---
const INITIAL_GIFTS: GiftItem[] = [
  {
    id: '1',
    name: 'Geladeira Inox',
    description: 'Nossa sonhada geladeira duplex para conservar nossos melhores momentos.',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1571175432230-01a2d1406d18?q=80&w=800&auto=format&fit=crop',
    category: 'Cozinha',
    isReserved: false
  },
  {
    id: '2',
    name: 'Sofá Retrátil',
    description: 'O lugar oficial das nossas maratonas de filmes e cochilos de domingo.',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
    category: 'Sala',
    isReserved: false
  },
];

const PIX_KEY = "63992613726";
const PIX_BASE_PAYLOAD = "00020126360014br.gov.bcb.pix0114+55639926137265204000053039865802BR5925JOSIVANIA PEREIRA DOS SAN6009Sao Paulo62290525REC69F28A22A95C23595148686";

function generatePixPayload(price?: number) {
  const base = "000201";
  const merchantAccount = "26360014br.gov.bcb.pix0114+5563992613726";
  const category = "52040000";
  const currency = "5303986";
  
  let amount = "";
  if (price && price > 0) {
    const priceStr = price.toFixed(2);
    amount = "54" + priceStr.length.toString().padStart(2, '0') + priceStr;
  }
  
  const country = "5802BR";
  const name = "5925JOSIVANIA PEREIRA DOS SAN";
  const city = "6009Sao Paulo";
  const txid = "62290525REC69F28A22A95C23595148686";
  
  const payload = base + merchantAccount + category + currency + amount + country + name + city + txid + "6304";
  
  // Calculate CRC16 CCITT
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  
  return payload + crcHex;
}
const WEDDING_DATE = new Date('2026-08-13T20:00:00');

// --- Components ---

const Polaroid = ({ children, className = "", image, images, rotation = 0, isReserved = false }: { children?: React.ReactNode, className?: string, image?: string, images?: string[], rotation?: number, isReserved?: boolean }) => {
  const displayImage = images && images.length > 0 ? images[0] : image;
  return (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1, rotate: rotation }}
    className={`bg-white p-4 pb-12 shadow-xl border border-blue-200 ${className} relative`}
  >
    <div className="bg-gray-100 aspect-square overflow-hidden relative">
      {displayImage && <img src={displayImage} className={`w-full h-full object-cover ${isReserved ? 'grayscale opacity-50' : ''}`} alt="Polaroid content" />}
      {!displayImage && children}
      {isReserved && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-ink/20">
          <div className="bg-white/90 px-4 py-2 rotate-[-15deg] shadow-lg border-2 border-brand-gold">
            <span className="text-brand-gold font-bold uppercase tracking-widest text-xs">Reservado</span>
          </div>
        </div>
      )}
    </div>
  </motion.div>
)};

const EditModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: Partial<GiftItem>) => void;
  initialData?: GiftItem | null;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    images: [] as string[],
    category: 'Geral',
    isReserved: false
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      Promise.all(
        files.map(file => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        }))
      ).then(newImages => {
        setFormData(prev => ({ 
          ...prev, 
          images: [...(prev.images || []), ...newImages].filter(Boolean)
        }));
      });
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        price: initialData.price,
        image: initialData.image,
        images: initialData.images || (initialData.image ? [initialData.image] : []),
        category: initialData.category,
        isReserved: initialData.isReserved || false
      });
    } else {
      setFormData({ name: '', description: '', price: 0, image: '', images: [], category: 'Geral', isReserved: false });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-ink/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-6"
      >
        <h3 className="text-2xl font-serif text-brand-ink">
          {initialData ? 'Editar Presente' : 'Novo Presente'}
        </h3>
        
        <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto px-1">
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-600 font-bold">Nome do Item</label>
            <input 
              className="w-full border-b-2 border-blue-200 p-2 focus:border-brand-gold outline-none transition-colors"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-600 font-bold">Descrição</label>
            <textarea 
              className="w-full border-b-2 border-blue-200 p-2 focus:border-brand-gold outline-none transition-colors h-20"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-600 font-bold">Valor (R$)</label>
              <input 
                type="number"
                className="w-full border-b-2 border-blue-200 p-2 focus:border-brand-gold outline-none transition-colors"
                value={formData.price}
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-600 font-bold">Categoria</label>
              <input 
                className="w-full border-b-2 border-blue-200 p-2 focus:border-brand-gold outline-none transition-colors"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input 
              type="checkbox" 
              id="reserved" 
              checked={formData.isReserved}
              onChange={e => setFormData({...formData, isReserved: e.target.checked})}
              className="w-4 h-4 text-brand-gold"
            />
            <label htmlFor="reserved" className="text-xs uppercase tracking-wider text-slate-600 font-bold cursor-pointer">Marcar como Reservado</label>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-600 font-bold block mb-2">Imagens do Produto</label>
            <input 
              type="file"
              accept="image/*"
              multiple
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none transition-colors mb-2"
              onChange={handleImageChange}
            />
            {formData.images && formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-blue-200 group">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-red-500 hover:text-white rounded-full transition-colors text-slate-700 opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {(!formData.images || formData.images.length === 0) && (
              <div className="mt-2 text-xs text-slate-400 font-medium italic">Nenhuma imagem selecionada.</div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="flex-1 py-3 bg-brand-ink text-white rounded-xl hover:bg-brand-gold transition-colors"
          >
            Salvar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PixModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  item 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (name: string) => void;
  item: { id: string; name: string; price?: number } | null 
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [giverName, setGiverName] = useState('');
  const [pixPayload, setPixPayload] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      setPixPayload(generatePixPayload(item.price));
    }
  }, [isOpen, item]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  useEffect(() => {
    if (!isOpen) {
      setGiverName('');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-ink/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-brand-beige/20 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-brand-gold fill-brand-gold" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-medium text-brand-ink">
                  Presentear com {item?.name}
                </h3>
                <p className="text-slate-700 text-sm">
                  Muito obrigado pelo carinho! Para concluir, use o PIX abaixo.
                </p>
              </div>

              <div className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-inner">
                  <div className="w-48 h-48 bg-white flex flex-col items-center justify-center border-2 border-brand-gold/30 rounded-lg overflow-hidden relative p-2">
                    {pixPayload ? (
                      <QRCodeCanvas 
                        value={pixPayload}
                        size={160}
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                          src: "https://github.com/lucide-react/lucide/raw/main/icons/user.png", // Generic logo placeholder
                          x: undefined,
                          y: undefined,
                          height: 30,
                          width: 30,
                          excavate: true,
                        }}
                      />
                    ) : (
                      <QrCode className="w-24 h-24 text-gray-200" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm py-1 text-center">
                      <span className="text-[8px] uppercase font-bold text-slate-600">QRCode Dinâmico (Valor: R$ {item?.price?.toFixed(2)})</span>
                    </div>
                  </div>
                </div>
                <div className="w-full space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold text-left mb-1">Chave PIX (Celular)</p>
                    <div className="flex items-center gap-2 bg-white border border-blue-200 p-2 rounded-lg w-full">
                      <code className="text-sm flex-1 font-mono text-brand-ink">{PIX_KEY}</code>
                      <button 
                        onClick={handleCopyKey}
                        className="p-1.5 hover:bg-brand-gold/10 rounded-md transition-colors"
                      >
                        {copiedKey ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-brand-gold" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 w-full">
                <p className="text-xs text-brand-beige italic">
                  Dica: Após o envio, se puder, nos mande o comprovante pelo WhatsApp para agradecermos!
                </p>

                <div className="w-full text-left">
                  <label className="text-xs uppercase tracking-wider text-slate-600 font-bold block mb-1">Seu Nome</label>
                  <input 
                    type="text"
                    required
                    placeholder="Como devemos lhe agradecer?"
                    value={giverName}
                    onChange={(e) => setGiverName(e.target.value)}
                    className="w-full border-b-2 border-blue-200 p-2 focus:border-brand-gold outline-none transition-colors"
                  />
                </div>

                <button 
                  onClick={() => {
                    if (giverName.trim()) {
                      onConfirm(giverName);
                    } else {
                      alert('Por favor, informe seu nome para sabermos quem nos presenteou!');
                    }
                  }}
                  className="w-full bg-brand-gold text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Confirmar Reserva do Presente
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import { createClient } from '@supabase/supabase-js';

import { supabase } from './lib/supabase';

export default function App() {
  const [activeSection, setActiveSection] = useState('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [isLoadingGifts, setIsLoadingGifts] = useState(true);
  
  const [gifts, setGifts] = useState<GiftItem[]>(() => {
    const saved = localStorage.getItem('wedding_gifts');
    return saved ? JSON.parse(saved) : INITIAL_GIFTS;
  });

  useEffect(() => {
    const fetchGiftsAndMessages = async () => {
      try {
        const { data: giftsData, error: giftsError } = await supabase.from('gifts').select('*');
        if (giftsError) {
          console.error("Erro ao buscar presentes do Supabase:", giftsError);
        } else if (giftsData && giftsData.length > 0) {
          setGifts(giftsData as GiftItem[]);
          localStorage.setItem('wedding_gifts', JSON.stringify(giftsData));
        }
        
        const { data: messagesData, error: messagesError } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
        if (messagesError) {
          console.error("Erro ao buscar recados do Supabase:", messagesError);
        } else if (messagesData && messagesData.length > 0) {
          const formattedMessages = messagesData.map((m: any) => ({
            id: m.id,
            name: m.name,
            message: m.message,
            createdAt: m.created_at || m.createdAt
          }));
          setMessages(formattedMessages);
          localStorage.setItem('wedding_messages', JSON.stringify(formattedMessages));
        }

        const { data: rsvpsData, error: rsvpsError } = await supabase.from('rsvps').select('*').order('created_at', { ascending: false });
        if (rsvpsError) {
          console.error("Erro ao buscar confirmações do Supabase:", rsvpsError);
        } else if (rsvpsData && rsvpsData.length > 0) {
          const formattedRsvps = rsvpsData.map((r: any) => ({
            id: r.id,
            name: r.name,
            phone: r.phone,
            confirmed: r.confirmed,
            createdAt: r.created_at || r.createdAt
          }));
          setRsvps(formattedRsvps);
          localStorage.setItem('wedding_rsvps', JSON.stringify(formattedRsvps));
        }

      } catch (err) {
        console.error("Erro carregando dados do Supabase:", err);
      } finally {
        setIsLoadingGifts(false);
      }
    };
    fetchGiftsAndMessages();
  }, []);

  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; price?: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  const [freeValue, setFreeValue] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [rsvps, setRsvps] = useState<RSVP[]>(() => {
    const saved = localStorage.getItem('wedding_rsvps');
    return saved ? JSON.parse(saved) : [];
  });
  const [rsvpForm, setRsvpForm] = useState({ name: '', phone: '' });

  const [messages, setMessages] = useState<GuestMessage[]>(() => {
    const saved = localStorage.getItem('wedding_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [messageForm, setMessageForm] = useState({ name: '', message: '' });

  const userEmail = "gabrielcalid@gmail.com"; 
  const adminEmails = ["gabrielcalid@gmail.com", "josi.bio21@gmail.com"];

  useEffect(() => {
    if (adminEmails.includes(userEmail)) {
      setIsAdmin(true); 
    }
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('wedding_gifts', JSON.stringify(gifts));
  }, [gifts]);

  useEffect(() => {
    localStorage.setItem('wedding_rsvps', JSON.stringify(rsvps));
  }, [rsvps]);

  useEffect(() => {
    localStorage.setItem('wedding_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const calculateDays = () => {
      const now = new Date();
      const difference = WEDDING_DATE.getTime() - now.getTime();
      setDaysLeft(Math.ceil(difference / (1000 * 60 * 60 * 24)));
    };
    calculateDays();
  }, []);

  const menuItems = [
    { id: 'inicio', label: 'Início' },
    { id: 'sobre', label: 'Sobre Nós' },
    { id: 'casamento', label: 'O Casamento' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'recados', label: 'Recados' },
    { id: 'confirmacao', label: 'Confirmação' },
    { id: 'presentes', label: 'Lista de Presentes' },
  ];

  const handleSaveGift = async (data: Partial<GiftItem>) => {
    const finalImage = (data.images && data.images.length > 0) ? data.images[0] : (data.image || 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=800&auto=format&fit=crop');
    
    if (editingGift) {
      const updatedGift = { ...editingGift, ...data, image: finalImage } as GiftItem;
      setGifts(gifts.map(g => g.id === editingGift.id ? updatedGift : g));
      try {
        await supabase.from('gifts').update(updatedGift).eq('id', editingGift.id);
      } catch (e) {
        console.error("Erro ao atualizar Supabase", e);
      }
    } else {
      const newGift: GiftItem = {
        id: Date.now().toString(),
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        image: finalImage,
        images: data.images || [],
        category: data.category || 'Geral',
        isReserved: false
      };
      setGifts([...gifts, newGift]);
      try {
        await supabase.from('gifts').insert([newGift]);
      } catch (e) {
        console.error("Erro ao inserir no Supabase", e);
      }
    }
    setIsEditModalOpen(false);
    setEditingGift(null);
  };

  const handleReserve = async (name: string) => {
    if (selectedItem?.id) {
      if (selectedItem.id !== 'free') {
        const updatedGifts = gifts.map(g => g.id === selectedItem.id ? { ...g, isReserved: true, reservedBy: name } : g);
        setGifts(updatedGifts);
        try {
          await supabase.from('gifts').update({ isReserved: true, reservedBy: name }).eq('id', selectedItem.id);
        } catch (e) {
          console.error("Erro ao reservar no Supabase", e);
        }
      }
    }
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const cancelReserve = async (id: string) => {
    const updatedGifts = gifts.map(g => g.id === id ? { ...g, isReserved: false, reservedBy: undefined } : g);
    setGifts(updatedGifts);
    try {
      await supabase.from('gifts').update({ isReserved: false, reservedBy: null }).eq('id', id);
    } catch (e) {
      console.error("Erro ao cancelar reserva no Supabase", e);
    }
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpForm.name || !rsvpForm.phone) return;
    
    const newRsvp: RSVP = {
      id: Date.now().toString(),
      ...rsvpForm,
      confirmed: true,
      createdAt: new Date().toISOString()
    };
    
    setRsvps([...rsvps, newRsvp]);
    
    try {
      await supabase.from('rsvps').insert([{ 
        id: newRsvp.id,
        name: newRsvp.name, 
        phone: newRsvp.phone, 
        confirmed: newRsvp.confirmed,
        created_at: newRsvp.createdAt
      }]);
    } catch (e) {
      console.error("Erro ao salvar no Supabase", e);
    }
    
    setRsvpForm({ name: '', phone: '' });
  };

  const deleteRsvp = async (id: string) => {
    setRsvps(rsvps.filter(r => r.id !== id));
    try {
      await supabase.from('rsvps').delete().eq('id', id);
    } catch (e) {
      console.error("Erro ao deletar RSVP no Supabase", e);
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageForm.name || !messageForm.message) return;

    const newMessage: GuestMessage = {
      id: Date.now().toString(),
      name: messageForm.name,
      message: messageForm.message,
      createdAt: new Date().toISOString()
    };
    
    setMessages([newMessage, ...messages]);
    try {
      await supabase.from('messages').insert([{
        id: newMessage.id,
        name: newMessage.name,
        message: newMessage.message,
        created_at: newMessage.createdAt
      }]);
    } catch (err) {
      console.error("Erro ao salvar recado no Supabase", err);
    }
    
    setMessageForm({ name: '', message: '' });
  };

  const deleteGift = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGifts(gifts.filter(g => g.id !== id));
    try {
      await supabase.from('gifts').delete().eq('id', id);
    } catch (e) {
      console.error("Erro ao deletar no Supabase", e);
    }
  };

  const deleteMessage = async (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
    try {
      await supabase.from('messages').delete().eq('id', id);
    } catch (e) {
      console.error("Erro ao deletar recado no Supabase", e);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream relative selection:bg-brand-gold selection:text-white overflow-x-hidden font-sans text-gray-600">
      
      <div className="relative flex min-h-screen z-10">
        
        {/* --- Sidebar Navigation --- */}
        <div className="w-80 p-12 flex flex-col hidden lg:flex">
          <div className="flex-1 space-y-12 mt-40">
            <nav className="space-y-0 text-right">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full group py-4 pr-4 flex items-center justify-end gap-3 border-b border-blue-200 transition-all font-medium h-16 ${
                    activeSection === item.id 
                      ? 'text-brand-gold italic' 
                      : 'text-slate-600 hover:text-brand-ink'
                  }`}
                >
                  <span className="uppercase tracking-widest text-xs">
                    {item.label}
                  </span>
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    activeSection === item.id ? 'bg-brand-gold' : 'bg-transparent group-hover:bg-blue-200'
                  }`}>
                    <Heart className={`w-4 h-4 -mt-1 -ml-1 ${activeSection === item.id ? 'text-brand-gold fill-brand-gold' : 'opacity-0'}`} />
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {adminEmails.includes(userEmail) && (
            <div className="mt-auto">
               <button 
                  onClick={() => setIsAdmin(!isAdmin)}
                  className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-all px-4 py-2 rounded-full border ${
                    isAdmin ? 'bg-brand-gold text-white border-brand-gold font-bold uppercase tracking-widest text-xs' : 'text-slate-500 border-blue-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Gestão do Casal
                </button>
            </div>
          )}
        </div>

        {/* --- Main Content --- */}
        <div className="flex-1 px-8 lg:px-24 py-12 flex flex-col items-center">
          
          {/* Header */}
          <header className="w-full lg:pr-[350px] text-left mb-16">
            <motion.h1 
               initial={{ y: -20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="text-6xl md:text-8xl font-melinda text-blue-900 mb-2"
            >
              Josi <span className="font-light mx-2">e</span> Gabriel
            </motion.h1>
            <p className="text-slate-600 uppercase tracking-[0.5em] text-sm md:text-base ml-2">
              13 de Agosto de 2026
            </p>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex-1 flex flex-col items-center justify-center lg:pr-[350px]"
            >
              
              {activeSection === 'inicio' && (
                <div className="w-full max-w-2xl py-12 px-4 text-center">
                  <div className="flex justify-center mb-8">
                     <div className="w-24 h-24 border border-blue-200 rounded-full flex items-center justify-center relative bg-white">
                        <Heart className="w-8 h-8 text-brand-gold absolute z-10" />
                        <div className="w-20 h-20 animate-[spin_10s_linear_infinite] border-t border-brand-gold/50 rounded-full absolute" />
                     </div>
                  </div>
                  <h2 className="text-3xl md:text-4xl text-brand-ink font-serif mb-6 leading-tight">
                    Com a benção de Deus<br />e alegria em nossos corações...
                  </h2>
                  <p className="max-w-xl mx-auto text-slate-500 mb-12 font-light">
                    O grande dia está chegando! Construímos esse site para compartilhar com você 
                    os detalhes do momento mais importante de nossas vidas.
                  </p>
                  
                  <div className="flex gap-4 sm:gap-8 justify-center">
                    <div className="text-center group">
                      <div className="bg-white/80 backdrop-blur-md w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex flex-col items-center justify-center shadow-lg border border-white mb-2 group-hover:-translate-y-1 transition-transform">
                        <div className="text-3xl sm:text-4xl font-light text-brand-gold">{daysLeft}</div>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Dias</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'sobre' && (
                <div className="w-full max-w-2xl py-12 px-4">
                  <div className="bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
                    
                    <h2 className="text-4xl md:text-5xl font-melinda text-brand-ink mb-8 text-center relative z-10">Nossa História</h2>
                    <div className="space-y-6 text-slate-600 leading-relaxed font-light text-center relative z-10 text-sm md:text-base">
                      <p>Nossa história começou muito antes do nosso primeiro encontro. Deus, em Sua bondade, escreveu cada detalhe do nosso caminho e nos uniu no tempo certo.</p>
                      <p>Uma certeza silenciosa de que deveria mandar uma mensagem, e aquela simples atitude mudou completamente nossas vidas.</p>
                      <p>Antes mesmo de qualquer promessa, já sentindo um pequeno pedaço do que viria da conexão inesperada, veio a decisão: orar juntos.</p>
                      <p>Em poucos dias, percebemos que compartilhamos muito mais do que gostos parecidos. Sonhamos parecido, acreditamos nas mesmas coisas, desejamos o mesmo futuro e carregamos os mesmos princípios no coração.</p>
                      <p>Cada conversa se tornava mais longa. A oração nos fortalecia, a sinceridade nos aproximava e o cuidado conquistava diariamente. Entre chamadas de vídeo no fim do dia, estudos da Bíblia, risadas, perguntas profundas e planos para o futuro, fomos entendendo que o amor também nasce na amizade, na admiração e na presença constante.</p>
                      <p>O primeiro encontro foi inesquecível. Parecia que o coração já reconhecia alguém que esperou por muito tempo. Cada abraço trouxe paz, cada olhar transmitia carinho e cada momento parecia confirmar aquilo que Deus já havia colocado em nossos corações.</p>
                      <p>Hoje olhamos para trás com gratidão por cada detalhe da nossa caminhada. Nada foi por acaso. Deus conduziu nossa história com amor, propósito e cuidado.</p>
                      <p>E agora, diante de uma nova etapa, seguimos escolhendo um ao outro todos os dias, construindo sonhos, fortalecendo nossa fé e colocando Deus sempre no centro de tudo aquilo que ainda iremos viver juntos.”</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'recados' && (
                <div className="w-full max-w-4xl py-12 px-4">
                  <div className="text-center mb-12">
                     <h2 className="text-4xl md:text-5xl font-melinda text-brand-ink mb-4">Deixe um Recado</h2>
                     <p className="text-slate-500 max-w-xl mx-auto font-light">Seu carinho será guardado para sempre com muito amor.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                      <div className="bg-white/80 p-8 rounded-3xl shadow-lg border border-blue-100 sticky top-12">
                        <form onSubmit={handleMessageSubmit} className="flex flex-col gap-4">
                          <div>
                            <input 
                              placeholder="Seu Nome" 
                              className="w-full bg-transparent border-b border-blue-200 p-3 focus:border-brand-gold outline-none transition-colors"
                              value={messageForm.name}
                              onChange={(e) => setMessageForm({...messageForm, name: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <textarea 
                              placeholder="Sua Mansagem" 
                              rows={4}
                              className="w-full bg-blue-50/50 rounded-xl border-none p-4 mt-2 focus:ring-2 focus:ring-brand-gold outline-none resize-none transition-shadow"
                              value={messageForm.message}
                              onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                              required
                            />
                          </div>
                          <button 
                            type="submit"
                            className="bg-brand-ink text-white py-4 rounded-xl mt-4 font-semibold hover:bg-brand-gold transition-colors shadow-sm tracking-wide text-sm"
                          >
                            Enviar Recado
                          </button>
                        </form>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                       <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pb-12 custom-scrollbar">
                      {messages.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Seja o primeiro a deixar uma mensagem!</p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-blue-50 relative group">
                             <div className="flex justify-between items-start mb-3">
                               <h4 className="font-bold text-brand-ink text-lg">{msg.name}</h4>
                               <div className="flex items-center gap-3">
                                 {isAdmin && (
                                   <button 
                                     onClick={() => deleteMessage(msg.id)}
                                     className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-md transition-colors"
                                     title="Excluir recado"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                 )}
                                 <span className="text-xs text-slate-400 font-mono">
                                   {new Date(msg.createdAt).toLocaleDateString('pt-BR')}
                                 </span>
                               </div>
                             </div>
                             <p className="text-slate-600 leading-relaxed italic border-l-2 border-brand-gold pl-4 text-sm">
                               "{msg.message}"
                             </p>
                          </div>
                        ))
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'confirmacao' && (
                <div className="w-full max-w-xl py-12 px-4">
                  <div className="bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white">
                    <div className="text-center mb-10">
                      <h2 className="text-4xl md:text-5xl font-melinda text-brand-ink mb-4">Confirmação</h2>
                      <p className="text-slate-500 max-w-sm mx-auto font-light text-sm">Por favor, confirme sua presença até o dia 13/07/2026. Mal podemos esperar para celebrar com você!</p>
                    </div>
                    
                    <form onSubmit={handleRsvpSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-ink ml-1">Nome Completo</label>
                        <input
                          type="text"
                          required
                          value={rsvpForm.name}
                          onChange={(e) => setRsvpForm({...rsvpForm, name: e.target.value})}
                          className="w-full border-b-2 border-blue-200 bg-transparent p-3 focus:border-brand-gold outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-ink ml-1">WhatsApp</label>
                        <input
                          type="tel"
                          required
                          value={rsvpForm.phone}
                          onChange={(e) => setRsvpForm({...rsvpForm, phone: e.target.value})}
                          className="w-full border-b-2 border-blue-200 bg-transparent p-3 focus:border-brand-gold outline-none transition-colors"
                        />
                      </div>
                      <div className="pt-6">
                        <button type="submit" className="w-full bg-brand-ink text-white py-4 rounded-xl font-bold tracking-widest text-sm uppercase hover:bg-brand-gold transition-colors shadow-lg">
                          Confirmar Presença
                        </button>
                      </div>
                    </form>

                    {isAdmin && (
                      <div className="mt-16 pt-8 border-t border-dashed border-gray-200">
                        <h4 className="font-bold text-center mb-6 text-brand-ink flex items-center justify-center gap-2">
                          <UserCheck className="w-5 h-5" /> 
                          Lista de Confirmados ({rsvps.length})
                        </h4>
                        <div className="space-y-3">
                          {rsvps.map((rsvp) => (
                            <div key={rsvp.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl text-sm border border-gray-100 group">
                              <div>
                                <span className="font-bold text-slate-700 block">{rsvp.name}</span>
                                <span className="text-slate-500 text-xs font-mono">{rsvp.phone}</span>
                              </div>
                              <button 
                                onClick={() => deleteRsvp(rsvp.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'presentes' && (
                <div className="w-full max-w-5xl py-12 px-4">
                  <div className="text-center mb-16">
                     <h2 className="text-4xl md:text-5xl font-melinda text-brand-ink mb-6">Lista de Presentes</h2>
                     <p className="text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
                       O nosso maior presente é poder celebrar com as pessoas que amamos! Mas se você quiser 
                       nos abençoar com algo a mais para nosso lar, selecionamos as opções abaixo:
                     </p>
                     
                     <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 mb-8">
                       <div className="h-px bg-blue-200 w-24 hidden sm:block"></div>
                       <div className="bg-white/80 backdrop-blur px-8 py-6 rounded-3xl shadow-sm border border-blue-50 text-left flex items-center gap-6 max-w-lg w-full">
                         <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                           <Gift className="w-8 h-8 text-brand-ink" />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-brand-ink uppercase tracking-wider mb-1">Deseja abençoar com outro valor?</p>
                            <p className="text-xs text-slate-500 mb-4">Você pode enviar qualquer quantia diretamente para nossa conta conjunta.</p>
                            <div className="flex items-center gap-2">
                               <span className="text-slate-400 font-bold">R$</span>
                               <input 
                                 type="number" 
                                 placeholder="50.00"
                                 className="w-24 bg-transparent border-b border-blue-200 text-brand-ink font-mono focus:border-brand-gold outline-none"
                                 value={freeValue}
                                 onChange={(e) => setFreeValue(e.target.value)}
                               />
                            </div>
                         </div>
                       </div>
                       <div className="h-px bg-blue-200 w-24 hidden sm:block"></div>
                     </div>
                     <button 
                       onClick={() => { 
                         if (freeValue && parseFloat(freeValue) > 0) {
                           setSelectedItem({ id: 'free', name: `Doação Livre`, price: parseFloat(freeValue) }); 
                           setIsModalOpen(true); 
                         } else {
                           alert('Por favor, informe um valor válido para a doação.');
                         }
                       }}
                       className="bg-brand-ink text-white px-8 py-3 rounded-full text-sm font-bold tracking-wider hover:bg-brand-gold transition-colors shadow-lg"
                     >
                       Gerar PIX
                     </button>
                  </div>

                  {isAdmin && (
                    <div className="flex justify-end mb-8">
                      <button 
                        onClick={() => {
                          setEditingGift(null);
                          setIsEditModalOpen(true);
                        }}
                        className="bg-brand-gold text-white px-6 py-3 rounded-full flex items-center gap-2 text-sm font-bold tracking-wider shadow-md hover:bg-brand-ink transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Presente
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-12">
                    {gifts.map(gift => (
                      <div key={gift.id} className="group flex flex-col h-full items-center">
                        <Polaroid 
                           image={gift.image}
                           images={gift.images}
                           isReserved={gift.isReserved}
                           className="w-full max-w-[320px] transition-transform duration-500 group-hover:-translate-y-2"
                        >
                        </Polaroid>
                        <div className="text-center px-4">
                          <span className="inline-block px-3 py-1 bg-white border border-blue-100 rounded-full text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-4 relative z-10 shadow-sm mb-3">
                            {gift.category}
                          </span>
                          <h3 className="text-xl font-bold text-brand-ink mb-2">{gift.name}</h3>
                          <p className="text-sm text-slate-500 font-light mb-4 line-clamp-2">{gift.description}</p>
                          <p className="font-mono text-lg text-brand-gold font-medium mb-6">R$ {gift.price?.toFixed(2)}</p>
                          
                          <div className="flex gap-2 justify-center w-full max-w-[320px]">
                            {gift.isReserved ? (
                              <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm border-2 border-gray-200">
                                Presenteado por {gift.reservedBy}
                              </div>
                            ) : (
                              <button 
                                onClick={() => { setSelectedItem(gift); setIsModalOpen(true); }}
                                className="flex-1 bg-brand-ink text-white py-3 rounded-xl font-bold hover:bg-brand-gold transition-colors text-sm tracking-wide"
                              >
                                Presentear
                              </button>
                            )}

                            {isAdmin && (
                              <div className="flex gap-2">
                                {gift.isReserved && (
                                  <button 
                                    onClick={() => cancelReserve(gift.id)}
                                    className="p-3 bg-white border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-white rounded-xl transition-colors font-bold text-xs uppercase"
                                    title="Desfazer Reserva"
                                  >
                                    Desfazer
                                  </button>
                                )}
                                <button 
                                  onClick={() => { setEditingGift(gift); setIsEditModalOpen(true); }}
                                  className="p-3 bg-white border border-blue-200 text-slate-600 rounded-xl hover:bg-blue-50 transition-colors"
                                  title="Editar"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={(e) => deleteGift(gift.id, e)}
                                  className="p-3 bg-white border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Footer App-like */}
          <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm lg:hidden z-50">
             <div className="bg-brand-ink/90 backdrop-blur-xl rounded-full px-6 py-4 flex items-center justify-between shadow-2xl border border-white/20">
                <button onClick={() => setActiveSection('inicio')} className={`p-2 transition-colors ${activeSection === 'inicio' ? 'text-brand-gold' : 'text-gray-400'}`}>
                   <Home className="w-5 h-5" />
                </button>
                <button onClick={() => setActiveSection('presentes')} className={`p-2 transition-colors ${activeSection === 'presentes' ? 'text-brand-gold' : 'text-gray-400'}`}>
                   <Gift className="w-5 h-5" />
                </button>
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 transition-colors text-gray-400 hover:text-white">
                   <Menu className="w-5 h-5" />
                </button>
             </div>
          </footer>

        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
         {isSidebarOpen && (
            <>
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-[100] lg:hidden"
               />
               <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="fixed right-0 top-0 bottom-0 w-80 bg-white z-[110] p-8 shadow-2xl lg:hidden flex flex-col"
               >
                  <button onClick={() => setIsSidebarOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full">
                     <X className="w-5 h-5 text-gray-500" />
                  </button>
                  
                  <div className="mt-16 space-y-2 flex-1">
                     {menuItems.map(item => (
                        <button 
                           key={item.id}
                           onClick={() => { setActiveSection(item.id); setIsSidebarOpen(false); }}
                           className={`w-full text-left py-4 px-4 rounded-2xl flex items-center justify-between ${
                              activeSection === item.id 
                                 ? 'bg-brand-ink text-brand-gold font-bold' 
                                 : 'text-slate-600 hover:bg-gray-50'
                           }`}
                        >
                           <span className="uppercase tracking-wider text-xs">{item.label}</span>
                           <ChevronRight className={`w-4 h-4 ${activeSection === item.id ? 'text-brand-gold' : 'text-gray-400'}`} />
                        </button>
                     ))}
                  </div>

                  {adminEmails.includes(userEmail) && (
                     <div className="pt-4 mt-auto border-t border-gray-100">
                        <button 
                           onClick={() => { setIsAdmin(!isAdmin); setIsSidebarOpen(false); }}
                           className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest ${
                              isAdmin ? 'bg-brand-gold text-white border-brand-gold' : 'border-gray-200 text-gray-500'
                           }`}
                        >
                           <Settings className="w-4 h-4" />
                           Painel de Gestão
                        </button>
                     </div>
                  )}
               </motion.div>
            </>
         )}
      </AnimatePresence>

      <PixModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleReserve}
        item={selectedItem} 
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGift(null);
        }}
        onSave={handleSaveGift}
        initialData={editingGift}
      />
    </div>
  );
}
