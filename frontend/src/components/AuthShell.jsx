import { motion } from "framer-motion";

function AuthShell({ title, subtitle, highlights = [], children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4 py-8 sm:px-8"
    >
      <div className="absolute inset-0">
        <div className="absolute top-[-150px] left-[-100px] w-[600px] h-[600px] bg-indigo-600/15 blur-3xl rounded-full animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-150px] right-[-100px] w-[600px] h-[600px] bg-cyan-500/10 blur-3xl rounded-full animate-[pulse_12s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_35%)]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl rounded-[32px] sm:rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden grid lg:grid-cols-2">
        <div className="p-8 sm:p-12 xl:p-16 flex flex-col justify-center text-white border-b lg:border-b-0 lg:border-r border-white/10">
          <img src="/logo.png" alt="TeamPulse logo" className="w-14 h-14 rounded-2xl object-cover shadow-lg mb-8" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{title}</h1>
          <p className="mt-6 text-slate-300 text-base sm:text-lg leading-relaxed max-w-lg">
            {subtitle}
          </p>

          <div className="mt-10 space-y-4">
            {highlights.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 text-sm sm:text-base">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 sm:p-12 xl:p-16 flex flex-col justify-center min-h-[560px]">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export default AuthShell;
