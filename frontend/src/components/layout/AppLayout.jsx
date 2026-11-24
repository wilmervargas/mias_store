import Header from './Header';
import Footer from '../Footer';

export default function AppLayout({ children }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col text-plum-800 dark:text-cream-100">
      {/* Halos decorativos suaves */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-peach-200/50 blur-3xl dark:bg-blush-600/10" />
        <div className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-lavender-200/70 blur-3xl dark:bg-plum-600/30" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blush-300/25 blur-3xl dark:bg-blush-700/10" />
      </div>

      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
