import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, MessageSquare, ArrowLeft, Search, Clock, CheckCircle, XCircle, Inbox } from 'lucide-react';
import SupportTicket from './SupportTicket';
import { logActivity } from '../utils/activityLogger';
import Skeleton from './Skeleton';
import { useToast } from '../context/ToastContext';
import './Tickets.css';

const TicketCardSkeleton = () => (
    <div className="sv-card sv-card--skeleton">
        <div className="sv-card-top">
            <Skeleton variant="text" width="65%" height={16} />
            <Skeleton variant="rectangular" width={56} height={22} style={{ borderRadius: '12px' }} />
        </div>
        <div className="sv-card-bottom">
            <Skeleton variant="text" width="35%" height={12} />
            <Skeleton variant="text" width="22%" height={12} />
        </div>
    </div>
);

const SupportView = ({ user, showModal, hideModal }) => {
    const [tickets, setTickets] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchTickets();
        const sub = supabase.channel('tickets_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `user_id=eq.${user.id}` }, fetchTickets)
            .subscribe();
        return () => sub.unsubscribe();
    }, [user.id]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const createTicket = () => {
        let subject = '';
        showModal(
            <div className="modal-content glass-panel sv-create-modal">
                <h3 className="sv-create-modal-title">New Support Ticket</h3>
                <p className="sv-create-modal-desc">Describe your issue and we'll get back to you as soon as possible.</p>
                <input
                    type="text"
                    placeholder="Subject / Issue Summary"
                    className="glass-input sv-create-modal-input"
                    onChange={(e) => subject = e.target.value}
                    autoFocus
                />
                <div className="sv-create-modal-actions">
                    <button onClick={hideModal} className="glass-btn">Cancel</button>
                    <button className="glass-btn primary" onClick={async () => {
                        if (!subject) return;
                        try {
                            const { data, error } = await supabase
                                .from('tickets')
                                .insert([{ user_id: user.id, subject, status: 'pending' }])
                                .select()
                                .single();
                            if (error) throw error;

                            logActivity('CREATE_TICKET', `Created Ticket: ${subject} (${data.id})`, user?.email);

                            setActiveTicket(data);
                            hideModal();
                        } catch (err) {
                            showToast('Failed to create ticket', 'error');
                        }
                    }}>Create Ticket</button>
                </div>
            </div>
        );
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        const matchesSearch = !searchQuery || ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        open: tickets.filter(t => t.status === 'open').length,
        pending: tickets.filter(t => t.status === 'pending').length,
        closed: tickets.filter(t => t.status === 'closed').length
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (activeTicket) {
        return (
            <div className="sv-active-ticket">
                <button onClick={() => setActiveTicket(null)} className="sv-back-btn">
                    <ArrowLeft size={16} />
                    <span>Back to Tickets</span>
                </button>
                <div className="sv-active-ticket-chat">
                    <SupportTicket ticketId={activeTicket.id} onClose={() => setActiveTicket(null)} />
                </div>
            </div>
        );
    }

    return (
        <div className="sv-container">
            {/* Inline action bar */}
            <div className="sv-action-bar">
                <div className="sv-subtitle">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</div>
                <button className="glass-btn primary" onClick={createTicket}>
                    <Plus size={16} /> New Ticket
                </button>
            </div>

            {/* Quick Stats */}
            {tickets.length > 0 && (
                <div className="sv-quick-stats">
                    <div className="sv-stat sv-stat--open" onClick={() => setFilterStatus(filterStatus === 'open' ? 'all' : 'open')}>
                        <CheckCircle size={14} />
                        <span>{stats.open} Open</span>
                    </div>
                    <div className="sv-stat sv-stat--pending" onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}>
                        <Clock size={14} />
                        <span>{stats.pending} Pending</span>
                    </div>
                    <div className="sv-stat sv-stat--closed" onClick={() => setFilterStatus(filterStatus === 'closed' ? 'all' : 'closed')}>
                        <XCircle size={14} />
                        <span>{stats.closed} Closed</span>
                    </div>
                </div>
            )}

            {/* Search & Filter Bar */}
            {tickets.length > 0 && (
                <div className="sv-toolbar">
                    <div className="sv-search">
                        <Search size={15} className="sv-search-icon" />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="sv-search-input"
                        />
                    </div>
                    <div className="sv-filters">
                        {['all', 'open', 'pending', 'closed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`sv-filter-btn ${filterStatus === status ? 'sv-filter-btn--active' : ''}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Ticket List */}
            <div className="sv-list">
                {loading ? (
                    <div className="sv-grid">
                        {Array.from({ length: 4 }).map((_, i) => <TicketCardSkeleton key={i} />)}
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="sv-empty">
                        <div className="sv-empty-icon">
                            <Inbox size={40} />
                        </div>
                        <h3 className="sv-empty-title">No tickets yet</h3>
                        <p className="sv-empty-desc">Need help? Create a ticket and our team will assist you.</p>
                        <button className="glass-btn primary" onClick={createTicket}>
                            <Plus size={16} /> Create First Ticket
                        </button>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="sv-empty">
                        <div className="sv-empty-icon">
                            <Search size={40} />
                        </div>
                        <h3 className="sv-empty-title">No matches</h3>
                        <p className="sv-empty-desc">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="sv-grid">
                        {filteredTickets.map(ticket => (
                            <div
                                key={ticket.id}
                                onClick={() => {
                                    logActivity('OPEN_TICKET', `Viewed Ticket: ${ticket.subject} (${ticket.id})`, user?.email);
                                    setActiveTicket(ticket);
                                }}
                                className="sv-card"
                            >
                                <div className="sv-card-top">
                                    <div className="sv-card-subject">{ticket.subject}</div>
                                    <span className={`sv-card-badge sv-card-badge--${ticket.status}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <div className="sv-card-bottom">
                                    <div className="sv-card-id">
                                        <MessageSquare size={13} />
                                        <span>#{ticket.id.substring(0, 6)}</span>
                                    </div>
                                    <span className="sv-card-time">{timeAgo(ticket.updated_at)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportView;
