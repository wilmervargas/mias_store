import { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { CarritoProvider, useCarrito } from './context/CarritoContext';
import Navbar from './components/Navbar';
import Tienda from './pages/Tienda';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import ReciboPedido from './components/ReciboPedido';

function AppContent() {
  const { isDark } = useTheme();
  const carrito = useCarrito();
  const { tasa } = useCurrency();

  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [checkoutAbierto, setCheckoutAbierto] = useState(false);
  const [pedido, setPedido] = useState(null);

  const iniciarCheckout = () => {
    setCarritoAbierto(false);
    setCheckoutAbierto(true);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
      <div>
        <Navbar onAbrirCarrito={() => setCarritoAbierto(true)} />
        <Tienda />

        <CartDrawer
          abierto={carritoAbierto}
          onClose={() => setCarritoAbierto(false)}
          carrito={carrito}
          tasaDolar={tasa}
          onIniciarCheckout={iniciarCheckout}
        />

        <CheckoutModal
          abierto={checkoutAbierto}
          onClose={() => setCheckoutAbierto(false)}
          carrito={carrito}
          tasaDolar={tasa}
          onPedidoExitoso={(nuevoPedido) => setPedido(nuevoPedido)}
        />

        <ReciboPedido pedido={pedido} onClose={() => setPedido(null)} />
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <CarritoProvider>
          <AppContent />
        </CarritoProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
