import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]); // Array: [{ id, title, message, type }]
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const addToast = (title, message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated && user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      socketInstance = io(socketUrl, {
        withCredentials: true,
      });

      socketInstance.on('connect', () => {
        console.log('Connected to websocket server');
        socketInstance.emit('join_room', user._id);
      });

      // Listen for notification push events
      socketInstance.on('new_notification', (data) => {
        console.log('Received real-time notification:', data);
        addToast(data.title, data.message, data.type);
      });

      setSocket(socketInstance);
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        console.log('Disconnected from websocket server');
      }
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, toasts, addToast, removeToast }}>
      {children}
      
      {/* Real-time Toast Notification overlay portal */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-card flex items-start gap-3 p-4 rounded-xl shadow-xl border border-teal-500/20 translate-y-0 transition-all duration-300 animate-bounce-short cursor-pointer"
            onClick={() => removeToast(toast.id)}
          >
            <div className="text-xl">
              {toast.type === 'appointment' && '📅'}
              {toast.type === 'prescription' && '📄'}
              {toast.type === 'payment' && '💳'}
              {toast.type === 'system' && '⚙️'}
              {toast.type === 'info' && '🔔'}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{toast.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};
