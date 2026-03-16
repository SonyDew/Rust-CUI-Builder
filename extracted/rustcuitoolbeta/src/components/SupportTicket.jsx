import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Send, Paperclip, X, Image as ImageIcon, Loader2, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './Tickets.css';

const SupportTicket = ({ ticketId, onClose }) => {
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState({});
    const [imagePreview, setImagePreview] = useState(null);
    const { user, isAdmin } = useAuth();
    const { sendNotification } = useNotifications();
    const { showToast } = useToast();
    const messagesEndRef = useRef(null);
    const channelRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (ticketId) {
            fetchTicketAndMessages();

            const channelId = `ticket_chat_${ticketId}`;
            if (channelRef.current) supabase.removeChannel(channelRef.current);

            const channel = supabase
                .channel(channelId)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${ticketId}`
                }, (payload) => {
                    setMessages(prev => {
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                    // Auto-clear typing indicator when a message arrives from that sender
                    if (payload.new.sender_id !== user.id) {
                        setTypingUsers(prev => ({ ...prev, [payload.new.sender_id]: false }));
                    }
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${ticketId}`
                }, (payload) => {
                    setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
                })
                .on('postgres_changes', {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${ticketId}`
                }, (payload) => {
                    setMessages(prev => prev.filter(m => m.id !== payload.old.id));
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tickets',
                    filter: `id=eq.${ticketId}`
                }, (payload) => {
                    setTicket(prev => {
                        if (JSON.stringify(prev) !== JSON.stringify(payload.new)) {
                            return payload.new;
                        }
                        return prev;
                    });
                })
                .on('broadcast', { event: 'typing' }, (payload) => {
                    const { userId, isTyping, role } = payload.payload;
                    if (userId !== user.id) {
                        setTypingUsers(prev => ({
                            ...prev,
                            [userId]: isTyping ? (role || 'user') : false
                        }));
                    }
                })
                .subscribe();

            channelRef.current = channel;

            return () => {
                supabase.removeChannel(channel);
                channelRef.current = null;
            };
        }
    }, [ticketId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchTicketAndMessages = async () => {
        try {
            setLoading(true);
            const { data: ticketData, error: ticketError } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', ticketId)
                .single();

            if (ticketError) throw ticketError;
            setTicket(ticketData);

            const { data: msgs, error: msgsError } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (msgsError) throw msgsError;
            setMessages(msgs || []);
        } catch (error) {
            console.error('Error fetching ticket data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTyping = () => {
        if (!channelRef.current) return;

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id, isTyping: true, role: isAdmin ? 'admin' : 'user' }
        });

        typingTimeoutRef.current = setTimeout(() => {
            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: { userId: user.id, isTyping: false, role: isAdmin ? 'admin' : 'user' }
                });
            }
        }, 3000);
    };

    const handleFileUpload = async (files) => {
        const uploadedUrls = [];
        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${ticketId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('ticket-files')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload failed:', uploadError);
                continue;
            }

            const { data } = supabase.storage.from('ticket-files').getPublicUrl(filePath);
            uploadedUrls.push(data.publicUrl);
        }
        return uploadedUrls;
    };

    const autoResize = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && attachments.length === 0) || uploading) return;

        if (!isAdmin && ticket?.status === 'closed') {
            showToast('This ticket is closed. You cannot send messages.', 'warning');
            return;
        }

        setUploading(true);
        try {
            let attachedUrls = [];
            if (attachments.length > 0) {
                attachedUrls = await handleFileUpload(attachments);
            }

            const { error } = await supabase
                .from('ticket_messages')
                .insert([{
                    ticket_id: ticketId,
                    sender_id: user.id,
                    message: newMessage,
                    attachments: attachedUrls
                }]);

            if (error) throw error;

            // Notify the other party about the reply
            const msgPreview = newMessage.length > 80 ? newMessage.substring(0, 80) + '...' : newMessage;
            if (isAdmin && ticket?.user_id && ticket.user_id !== user.id) {
                sendNotification(ticket.user_id, 'ticket_reply',
                    'Support replied to your ticket',
                    `New reply on "${ticket.subject || 'your ticket'}": "${msgPreview}"`,
                    { ticketId });
            } else if (!isAdmin && ticket?.claimed_by && ticket.claimed_by !== user.id) {
                sendNotification(ticket.claimed_by, 'ticket_reply',
                    'New reply on a support ticket',
                    `User replied on "${ticket.subject || 'a ticket'}": "${msgPreview}"`,
                    { ticketId });
            }

            setNewMessage('');
            setAttachments([]);
            if (textareaRef.current) textareaRef.current.style.height = '44px';

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: { userId: user.id, isTyping: false, role: isAdmin ? 'admin' : 'user' }
                });
            }

        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Failed to send message.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const activeTypers = Object.values(typingUsers).filter(v => v !== false);
    const isAnyoneTyping = activeTypers.length > 0;
    const typingLabel = activeTypers.includes('admin') ? 'Support is typing' : 'Someone is typing';
    const isClosed = ticket?.status === 'closed';

    const formatMessageDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getDateSeparator = (dateStr, prevDateStr) => {
        const date = new Date(dateStr);
        const prevDate = prevDateStr ? new Date(prevDateStr) : null;
        if (prevDate && date.toDateString() === prevDate.toDateString()) return null;

        const now = new Date();
        if (date.toDateString() === now.toDateString()) return 'Today';

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

        return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    };

    return (
        <div className="ticket-chat">
            {/* Header */}
            <div className="ticket-chat-header">
                <div className="ticket-chat-header-info">
                    <h3 className="ticket-chat-title">{ticket?.subject || 'Loading...'}</h3>
                    <div className="ticket-chat-meta">
                        <span className={`ticket-status-dot ticket-status-dot--${ticket?.status || 'pending'}`} />
                        <span className="ticket-chat-status">{ticket?.status}</span>
                        <span className="ticket-chat-divider">·</span>
                        <span className="ticket-chat-id">#{ticketId?.substring(0, 8)}</span>
                    </div>
                </div>
                <button onClick={onClose} className="ticket-chat-close" title="Close">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="ticket-chat-messages">
                {loading ? (
                    <div className="ticket-chat-loading">
                        <Loader2 className="animate-spin" size={24} />
                        <span>Loading conversation...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="ticket-chat-empty">
                        <Send size={32} />
                        <span>No messages yet. Start the conversation!</span>
                    </div>
                ) : messages.map((msg, idx) => {
                    const isOwn = msg.sender_id === user.id;
                    const separator = getDateSeparator(msg.created_at, idx > 0 ? messages[idx - 1].created_at : null);

                    return (
                        <React.Fragment key={msg.id || idx}>
                            {separator && (
                                <div className="ticket-chat-date-separator">
                                    <span>{separator}</span>
                                </div>
                            )}
                            <div className={`ticket-message ${isOwn ? 'ticket-message--own' : 'ticket-message--other'}`}>
                                <div className={`ticket-message-bubble ${isOwn ? 'ticket-message-bubble--own' : 'ticket-message-bubble--other'}`}>
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="ticket-message-attachments">
                                            {msg.attachments.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noreferrer"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setImagePreview(url);
                                                    }}
                                                >
                                                    <img src={url} alt="Attachment" className="ticket-message-image" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {msg.message && (
                                        <div className="ticket-message-text">{msg.message}</div>
                                    )}
                                </div>
                                <div className="ticket-message-time">
                                    {formatMessageDate(msg.created_at)}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}

                {isAnyoneTyping && (
                    <div className="ticket-typing-indicator">
                        <div className="ticket-typing-dots">
                            <span />
                            <span />
                            <span />
                        </div>
                        <span className="ticket-typing-text">{typingLabel}...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="ticket-chat-composer">
                {isClosed && !isAdmin ? (
                    <div className="ticket-chat-closed-banner">
                        <Lock size={16} />
                        <span>This ticket is closed. You cannot send messages.</span>
                    </div>
                ) : (
                    <>
                        {attachments.length > 0 && (
                            <div className="ticket-attachment-preview">
                                {attachments.map((file, i) => (
                                    <div key={i} className="ticket-attachment-chip">
                                        <ImageIcon size={12} />
                                        <span className="ticket-attachment-name">{file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}</span>
                                        <button className="ticket-attachment-remove" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <form onSubmit={sendMessage} className="ticket-chat-form">
                            <label className="ticket-attach-btn" title="Attach Image">
                                <Paperclip size={18} />
                                <input type="file" multiple accept="image/*" style={{ display: 'none' }}
                                    onChange={(e) => setAttachments([...attachments, ...Array.from(e.target.files)])} />
                            </label>
                            <textarea
                                ref={textareaRef}
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                    autoResize();
                                }}
                                placeholder="Type a message..."
                                className="ticket-chat-input"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(e);
                                    }
                                }}
                            />
                            <button type="submit" disabled={uploading} className="ticket-send-btn">
                                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Image Preview Modal */}
            {imagePreview && (
                <div className="ticket-image-preview-overlay" onClick={() => setImagePreview(null)}>
                    <button className="ticket-image-preview-close" onClick={() => setImagePreview(null)}>
                        <X size={20} />
                    </button>
                    <img src={imagePreview} alt="Preview" className="ticket-image-preview-img" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};

export default SupportTicket;
