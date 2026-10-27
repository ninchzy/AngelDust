import { Navigate, Route, Routes } from 'react-router-dom';
import ShopPage from './pages/ShopPage.jsx';
import FavouritesPage from './pages/FavouritesPage.jsx';
import CartPage from './pages/CartPage.jsx';
import DiscountPage from './pages/DiscountPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ProductPage from './pages/ProductPage.jsx';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<ShopPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/favourites" element={<FavouritesPage />} />
            <Route path="/cart" element={<CartPage />} />
            {/* not linked in the menu — reached from the hero slider */}
            <Route path="/dark-lace" element={<DiscountPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
