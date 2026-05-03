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
import { supabase } from './lib/supabase';

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
const INITIAL_GIFTS: GiftItem[] = [];

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
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      setIsUploading(true);
      try {
        const uploadedUrls: string[] = [];
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data, error } = await supabase.storage
            .from('presentes')
            .upload(filePath, file);

          if (error) {
            console.error("Erro ao fazer upload da imagem:", error);
          } else if (data) {
            const { data: publicUrlData } = supabase.storage
              .from('presentes')
              .getPublicUrl(data.path);
            
            uploadedUrls.push(publicUrlData.publicUrl);
          }
        }
        
        if (uploadedUrls.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            images: [...(prev.images || []), ...uploadedUrls].filter(Boolean)
          }));
        }
      } catch (err) {
        console.error("Error uploading image:", err);
      } finally {
        setIsUploading(false);
      }
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
              disabled={isUploading}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none transition-colors mb-2 disabled:opacity-50"
              onChange={handleImageChange}
            />
            {isUploading && <p className="text-xs text-blue-600 font-medium my-2">Fazendo upload das imagens...</p>}
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
                          src: "https://github.com/lucide-react/lucide/raw/main/icons/user.png", // Generic logo placeholder that looks like the one in the middle
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

// Supabase Client Imported Above

export default function App() {
  const [activeSection, setActiveSection] = useState('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [isLoadingGifts, setIsLoadingGifts] = useState(true);
  
  const [gifts, setGifts] = useState<GiftItem[]>(() => {
    const saved = localStorage.getItem('wedding_presentes');
    return saved ? JSON.parse(saved) : INITIAL_GIFTS;
  });

  useEffect(() => {
    const fetchGiftsAndMessages = async () => {
      try {
        const { data: giftsData, error: giftsError } = await supabase.from('presentes').select('*');
        if (giftsError) {
          console.error("Erro ao buscar presentes do Supabase:", giftsError);
        } else if (giftsData && giftsData.length > 0) {
          console.log("Dados recebidos do Supabase (gifts):", giftsData);
          
          const formattedGifts = giftsData.map((g: any) => {
            // Ajustar a URL da imagem caso não comece com http
            let imgUrl = g.image;
            if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
               const { data: publicUrlData } = supabase.storage.from('presentes').getPublicUrl(imgUrl);
               imgUrl = publicUrlData.publicUrl;
            }

            let imgs = g.images;
            if (imgs && Array.isArray(imgs)) {
               imgs = imgs.map((img: string) => {
                 if (img && !img.startsWith('http') && !img.startsWith('data:')) {
                    const { data: publicUrlData } = supabase.storage.from('presentes').getPublicUrl(img);
                    return publicUrlData.publicUrl;
                 }
                 return img;
               });
            }

            return {
              id: g.id,
              name: g.name,
              description: g.description,
              price: g.price,
              image: imgUrl,
              images: imgs,
              category: g.category,
              isReserved: g.is_reserved || g.isReserved || false,
              reservedBy: g.reserved_by || g.reservedBy
            };
          });
          setGifts(formattedGifts as GiftItem[]);
          localStorage.setItem('wedding_presentes', JSON.stringify(formattedGifts));
        }
        
        const { data: messagesData, error: messagesError } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
        if (messagesError) {
          console.error("Erro ao buscar recados do Supabase:", messagesError);
        } else if (messagesData && messagesData.length > 0) {
          // Map snake_case to camelCase if needed, but here we just align with GuestMessage
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

  const userEmail = "gabrielcalid@gmail.com"; // User's email from metadata
  const adminEmails = ["gabrielcalid@gmail.com", "josi.bio21@gmail.com"];

  // Automatically enable admin if user email matches
  useEffect(() => {
    // In a real app, we'd check session/auth, here we use the provided email context
    if (adminEmails.includes(userEmail)) {
      setIsAdmin(true); 
    }
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('wedding_presentes', JSON.stringify(gifts));
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
        const { error } = await supabase.from('presentes').update({
          name: updatedGift.name,
          description: updatedGift.description,
          price: updatedGift.price,
          image: updatedGift.image,
          images: updatedGift.images,
          category: updatedGift.category,
          is_reserved: updatedGift.isReserved,
          reserved_by: updatedGift.reservedBy
        }).eq('id', editingGift.id);
        if (error) console.error("Erro no Supabase update:", error);
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
        const { error } = await supabase.from('presentes').insert([{
          id: newGift.id,
          name: newGift.name,
          description: newGift.description,
          price: newGift.price,
          image: newGift.image,
          images: newGift.images,
          category: newGift.category,
          is_reserved: newGift.isReserved,
          reserved_by: newGift.reservedBy
        }]);
        if (error) console.error("Erro no Supabase insert:", error);
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
          const { error } = await supabase.from('presentes').update({ is_reserved: true, reserved_by: name }).eq('id', selectedItem.id);
          if (error) console.error("Erro ao reservar:", error);
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
      const { error } = await supabase.from('presentes').update({ is_reserved: false, reserved_by: null }).eq('id', id);
      if (error) console.error("Erro ao cancelar:", error);
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
      await supabase.from('presentes').delete().eq('id', id);
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
      
      {/* Background Decorations removed as requested */}
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
              className="w-full max-w-5xl flex flex-col items-center"
            >
              
              {activeSection === 'inicio' && (
                <div className="flex flex-col items-center space-y-12 max-w-2xl text-center px-4 mb-20 mt-4">
                  <div className="py-8">
                    <p className="text-2xl md:text-3xl font-melinda text-blue-900 leading-relaxed max-w-xl mx-auto">
                      "Onde quer que tu fores, irei eu; e onde quer que pousares à noite, ali pousarei eu; o teu povo será o meu povo, e o teu Deus o meu Deus."
                    </p>
                    <p className="mt-6 tracking-widest uppercase text-xs text-brand-gold font-bold">Rute 1:16</p>
                  </div>
                  
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent my-8" />
                  
                  <div className="bg-white/60 backdrop-blur-md px-12 py-10 rounded-[2rem] border border-white shadow-xl shadow-blue-900/5 text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-beige via-brand-gold to-brand-beige opacity-50"></div>
                     <p className="text-slate-400 uppercase tracking-[0.3em] text-[10px] font-bold mb-4">Contagem Regressiva</p>
                     <p className="text-slate-700 text-3xl font-light">
                       Faltam <span className="text-brand-gold font-bold text-4xl mx-1">{daysLeft}</span> dias
                     </p>
                     <p className="text-slate-500 text-sm mt-3 font-medium">para o nosso felizes para sempre</p>
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
                    <h2 className="text-4xl font-serif text-brand-ink mb-4">Deixe um Recado</h2>
                    <p className="text-slate-700">Seu carinho em palavras significa muito para nós.</p>
                  </div>

                  <div className="grid md:grid-cols-5 gap-12">
                    <div className="md:col-span-2">
                       <form onSubmit={handleMessageSubmit} className="bg-white p-8 rounded-3xl shadow-xl space-y-6 sticky top-24">
                         <div>
                           <label className="text-xs uppercase tracking-wider text-slate-600 font-bold block mb-2">Seu Nome</label>
                           <input 
                             required
                             className="w-full border-b-2 border-blue-200 p-2 focus:border-brand-gold outline-none transition-colors bg-transparent"
                             value={messageForm.name}
                             onChange={e => setMessageForm({...messageForm, name: e.target.value})}
                             placeholder="Como quer ser chamado?"
                           />
                         </div>
                         <div>
                           <label className="text-xs uppercase tracking-wider text-slate-600 font-bold block mb-2">Mensagem</label>
                           <textarea 
                             required
                             rows={4}
                             className="w-full border-2 border-blue-100 p-3 rounded-xl focus:border-brand-gold outline-none transition-colors bg-blue-50/30 resize-none"
                             value={messageForm.message}
                             onChange={e => setMessageForm({...messageForm, message: e.target.value})}
                             placeholder="Deixe aqui o seu recado de carinho..."
                           />
                         </div>
                         <button type="submit" className="w-full py-4 bg-brand-ink text-brand-beige font-semibold uppercase tracking-widest text-sm rounded-full hover:bg-brand-gold hover:text-white transition-all shadow-lg">
                           Enviar Recado
                         </button>
                       </form>
                    </div>
                    
                    <div className="md:col-span-3 space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                      {messages.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
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
                             <p className="text-slate-600 font-light leading-relaxed italic">"{msg.message}"</p>
                             <Heart className="absolute bottom-4 right-4 w-4 h-4 text-brand-gold/30 fill-brand-gold/10" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'presentes' && (
                <div className="w-full">
                  <div className="flex justify-between items-end mb-12 border-b border-blue-200 pb-8">
                     <h2 className="text-4xl font-serif text-brand-ink">Lista de Presentes</h2>
                     {isAdmin && (
                        <button 
                          onClick={() => { setEditingGift(null); setIsEditModalOpen(true); }}
                          className="bg-brand-gold text-white px-6 py-2 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:shadow-lg transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Novo Item
                        </button>
                      )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-12">
                     {gifts.map((item, idx) => (
                        <div key={item.id} className={`group flex flex-col w-full sm:w-[calc(50%-24px)] lg:w-[calc(33.333%-32px)] max-w-sm ${item.isReserved ? 'opacity-40' : ''}`}>
                           <Polaroid 
                             className="w-full aspect-square mb-6 p-2 pb-10 transition-transform group-hover:scale-105 group-hover:rotate-1" 
                             image={item.image}
                             images={item.images}
                             isReserved={item.isReserved}
                           >
                              {isAdmin && (
                                <div className="absolute top-2 right-2 flex gap-1 z-10">
                                  <button onClick={() => { setEditingGift(item); setIsEditModalOpen(true); }} className="p-1.5 bg-white shadow rounded-full"><Settings className="w-3 h-3" /></button>
                                  <button onClick={(e) => deleteGift(item.id, e)} className="p-1.5 bg-white shadow rounded-full text-red-500"><X className="w-3 h-3" /></button>
                                </div>
                              )}
                           </Polaroid>
                           <div className="text-center px-4">
                              <h3 className="text-xl font-serif text-brand-ink mb-1">{item.name}</h3>
                              <button 
                                onClick={() => isAdmin && (setEditingGift(item), setIsEditModalOpen(true))}
                                className={`text-brand-gold font-bold mb-4 italic block w-full text-center hover:scale-105 transition-transform ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                R$ {item.price.toLocaleString('pt-BR')}
                              </button>
                              {item.isReserved && isAdmin ? (
                                <div className="space-y-2">
                                  {item.reservedBy && (
                                    <p className="text-xs text-brand-ink font-bold border border-blue-200 rounded p-1">Reservado por: {item.reservedBy}</p>
                                  )}
                                  <button 
                                    onClick={() => cancelReserve(item.id)}
                                    className="w-full py-2 border-2 border-red-500 text-red-500 bg-white uppercase font-bold tracking-widest text-[10px] rounded-full hover:bg-red-500 hover:text-white transition-all"
                                  >
                                    Tirar Reserva
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  disabled={item.isReserved}
                                  onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}
                                  className={`w-full py-2 border-2 text-[10px] uppercase font-bold tracking-widest transition-all rounded-full ${item.isReserved ? 'border-gray-200 text-slate-500' : 'border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-white'}`}
                                >
                                  {item.isReserved ? 'Indisponível' : 'Presentear'}
                                </button>
                              )}
                           </div>
                        </div>
                     ))}

                     {/* Contribuição Livre */}
                     <div className="flex flex-col">
                        <Polaroid className="w-full aspect-square mb-6 p-2 pb-10 transition-transform hover:scale-105" rotation={2}>
                           <div className="w-full h-full bg-brand-gold/5 flex flex-col items-center justify-center p-8 text-center space-y-4">
                               <Heart className="w-8 h-8 text-brand-gold fill-brand-gold/20" />
                               <h3 className="text-xl font-serif text-brand-ink">Doação Livre</h3>
                               <input 
                                 type="number"
                                 placeholder="Valor R$"
                                 value={freeValue}
                                 onChange={e => setFreeValue(e.target.value)}
                                 className="w-full bg-white border border-blue-200 rounded-lg p-2 text-center text-sm outline-none focus:border-brand-gold"
                               />
                           </div>
                        </Polaroid>
                        <div className="text-center px-4">
                           <button 
                              onClick={() => { 
                                if (freeValue && parseFloat(freeValue) > 0) {
                                  setSelectedItem({ id: 'free', name: `Doação Livre`, price: parseFloat(freeValue) }); 
                                  setIsModalOpen(true); 
                                } else {
                                  alert('Por favor, informe um valor válido para a doação.');
                                }
                              }}
                              className="w-full py-3 bg-brand-gold text-white rounded-full text-[10px] uppercase font-bold tracking-widest hover:shadow-lg transition-all"
                           >
                              Presentear
                           </button>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {activeSection === 'confirmacao' && (
                <div className="w-full max-w-2xl py-12">
                   <div className="text-center mb-12">
                     <h2 className="text-4xl font-serif text-brand-ink mb-4">Confirme sua Presença</h2>
                     <p className="text-slate-700">Por favor, deixe-nos saber se você poderá celebrar este dia especial conosco.</p>
                   </div>
                   
                   <form onSubmit={handleRsvpSubmit} className="bg-white p-8 rounded-3xl shadow-xl space-y-6">
                     <div>
                       <label className="text-xs uppercase tracking-wider text-slate-600 font-bold block mb-2">Nome Completo</label>
                       <input 
                         required
                         className="w-full border-b-2 border-blue-200 p-2 focus:border-brand-gold outline-none transition-colors"
                         value={rsvpForm.name}
                         onChange={e => setRsvpForm({...rsvpForm, name: e.target.value})}
                         placeholder="Ex: João da Silva"
                       />
                     </div>
                     <div>
                       <label className="text-xs uppercase tracking-wider text-slate-600 font-bold block mb-2">Telefone com DDD</label>
                       <input 
                         required
                         className="w-full border-b-2 border-blue-200 p-2 focus:border-brand-gold outline-none transition-colors"
                         value={rsvpForm.phone}
                         onChange={e => setRsvpForm({...rsvpForm, phone: e.target.value})}
                         placeholder="(00) 00000-0000"
                       />
                     </div>
                     <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-blue-700 transition-colors">
                       Confirmar Presença
                     </button>
                   </form>

                   {isAdmin && (
                     <div className="mt-16 bg-white p-8 rounded-3xl shadow-xl border-2 border-brand-gold/20">
                       <h3 className="text-2xl font-serif text-brand-ink mb-6 flex items-center justify-between">
                         <span className="flex items-center gap-2"><UserCheck className="w-6 h-6 text-brand-gold"/> Lista de Confirmados</span>
                         <span className="text-sm font-sans bg-brand-gold text-white px-3 py-1 rounded-full">{rsvps.length}</span>
                       </h3>
                       <div className="space-y-4">
                         {rsvps.map(rsvp => (
                           <div key={rsvp.id} className="flex justify-between items-center border-b border-gray-50 pb-4">
                             <div>
                               <p className="font-bold text-brand-ink">{rsvp.name}</p>
                               <p className="text-xs text-slate-600">{rsvp.phone}</p>
                             </div>
                             <div className="flex items-center gap-3">
                               <button
                                 onClick={() => setRsvps(rsvps.map(r => r.id === rsvp.id ? { ...r, confirmed: !r.confirmed } : r))}
                                 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${rsvp.confirmed ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-700 bg-gray-100 hover:bg-gray-200'}`}
                               >
                                 {rsvp.confirmed ? <><Check className="w-3 h-3"/> Confirmado</> : <><X className="w-3 h-3"/> Pendente</>}
                               </button>
                               <button
                                 onClick={() => deleteRsvp(rsvp.id)}
                                 className="p-1.5 bg-gray-50 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                                 title="Remover"
                               >
                                 <X className="w-3 h-3" />
                               </button>
                             </div>
                           </div>
                         ))}
                         {rsvps.length === 0 && <p className="text-slate-600 text-center italic">Nenhum convidado confirmado ainda.</p>}
                       </div>
                     </div>
                   )}
                </div>
              )}

              {['sobre', 'casamento', 'fotos', 'recados'].includes(activeSection) && (
                <div className="py-24 text-center space-y-6">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <Calendar className="w-8 h-8 text-brand-gold opacity-30" />
                   </div>
                   <h2 className="text-4xl font-serif text-brand-ink">
                     {menuItems.find(i => i.id === activeSection)?.label}
                   </h2>
                   <p className="text-slate-600 italic">Esta seção está sendo preparada com muito amor.</p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Nav Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-8 right-8 z-[100] bg-brand-gold text-white p-4 rounded-full shadow-2xl active:scale-95 transition-transform"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsSidebarOpen(false)}
               className="fixed inset-0 bg-brand-ink/60 backdrop-blur-sm z-[110]"
            />
            <motion.div 
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               className="fixed top-0 right-0 h-full w-80 bg-brand-cream z-[120] p-12 flex flex-col"
            >
               <button onClick={() => setIsSidebarOpen(false)} className="self-end p-2 mb-12"><X className="w-8 h-8 text-slate-500" /></button>
               <nav className="flex flex-col gap-8">
                  {menuItems.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { setActiveSection(item.id); setIsSidebarOpen(false); }}
                      className={`text-2xl font-serif text-left flex items-center justify-between ${activeSection === item.id ? 'text-brand-gold' : 'text-slate-600'}`}
                    >
                      {item.label}
                      {activeSection === item.id && <Heart className="w-5 h-5 fill-brand-gold" />}
                    </button>
                  ))}
               </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Modals --- */}
      <PixModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleReserve}
        item={selectedItem} 
      />

      <EditModal 
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingGift(null); }}
        onSave={handleSaveGift}
        initialData={editingGift}
      />
    </div>
  );
}
