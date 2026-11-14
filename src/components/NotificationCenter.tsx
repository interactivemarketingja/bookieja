import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import { AppNotification } from '../types';
import { cn } from '../lib/utils';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    window.addEventListener('island-data-synced', fetchNotifications);
    
    // Auto-refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('island-data-synced', fetchNotifications);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchNotifications = () => {
    const data = dataService.getNotifications();
    setNotifications(data);
  };

  const handleMarkAsRead = (id: string) => {
    dataService.markNotificationAsRead(id);
    fetchNotifications();
  };

  const handleMarkAllAsRead = () => {
    dataService.markAllNotificationsAsRead();
    fetchNotifications();
  };

  const handleDelete = (id: string) => {
    dataService.deleteNotification(id);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="text-amber-500" size={16} />;
      case 'error': return <AlertTriangle className="text-rose-500" size={16} />;
      case 'success': return <CheckCircle2 className="text-emerald-500" size={16} />;
      default: return <Info className="text-brand-500" size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-2xl transition-all border shadow-sm",
          isOpen 
            ? "bg-brand-50 border-brand-200 text-brand-600" 
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        )}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-jamaica-black uppercase tracking-widest">Notifications</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  {unreadCount} Unread Messages
                </p>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                    title="Mark all as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={cn(
                        "p-4 transition-all hover:bg-slate-50 relative group",
                        !notification.isRead && "bg-brand-50/30"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 flex-shrink-0">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={cn(
                              "text-xs font-black tracking-tight leading-tight",
                              notification.isRead ? "text-slate-700" : "text-brand-900"
                            )}>
                              {notification.title}
                            </h4>
                            <span className="text-[8px] font-black text-slate-400 uppercase whitespace-nowrap">
                              {new Date(notification.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-3">
                            {!notification.isRead && (
                              <button 
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-[9px] font-black text-brand-600 uppercase tracking-widest hover:underline"
                              >
                                Mark as read
                              </button>
                            )}
                            {notification.link && (
                              <a 
                                href={notification.link}
                                className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors"
                              >
                                <ExternalLink size={10} />
                                View Details
                              </a>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(notification.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="text-slate-300" size={24} />
                  </div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">No notifications</h4>
                  <p className="text-[10px] text-slate-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                <button 
                  onClick={() => {
                    // Could navigate to a full notifications page
                    setIsOpen(false);
                  }}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors"
                >
                  View All Activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
