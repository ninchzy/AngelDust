import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ShopProvider } from './context/ShopContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import './style.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <ToastProvider>
                <CatalogProvider>
                    <AuthProvider>
                        <ShopProvider>
                            <UIProvider>
                                <App />
                            </UIProvider>
                        </ShopProvider>
                    </AuthProvider>
                </CatalogProvider>
            </ToastProvider>
        </BrowserRouter>
    </StrictMode>
);
