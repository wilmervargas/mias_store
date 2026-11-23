const PantallaCarga = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-fuchsia-50 to-purple-100 px-4 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950">
    <div className="flex flex-col items-center gap-4">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-lg font-black text-white shadow-lg shadow-purple-500/30">
        MS
      </div>
      <div className="h-1.5 w-36 overflow-hidden rounded-full bg-purple-100 dark:bg-gray-800">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-pink-500 to-purple-600" />
      </div>
      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
        Verificando sesión...
      </p>
    </div>
  </div>
);

export default PantallaCarga;
