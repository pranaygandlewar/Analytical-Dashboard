import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import CommandPalette from "./CommandPalette";
import AIAssistant from "./AIAssistant";
import { Menu } from "lucide-react";
import api from "../services/api";

function AppLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Personalization settings
  const [companyName, setCompanyName] = useState("TeamPulse");
  const [companyLogo, setCompanyLogo] = useState("");
  const [accentColor, setAccentColor] = useState("");

  useEffect(() => {
    api.get("/workspace/settings")
      .then(res => {
        const settings = res.data;
        const nameSet = settings.find(s => s.key === "company_name")?.value || "TeamPulse";
        const logoSet = settings.find(s => s.key === "company_logo")?.value || "";
        const colorSet = settings.find(s => s.key === "accent_color")?.value || "";
        const faviconSet = settings.find(s => s.key === "company_favicon")?.value;

        setCompanyName(nameSet);
        setCompanyLogo(logoSet);
        setAccentColor(colorSet);

        // Dynamically customize Tab Title
        document.title = `${nameSet} Workspace`;

        // Dynamically customize Favicon link
        if (faviconSet) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.getElementsByTagName("head")[0].appendChild(link);
          }
          link.href = faviconSet;
        }
      })
      .catch(err => console.log("Personalization settings loader error", err));
  }, []);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-100 via-slate-100 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-6 lg:p-8 flex flex-col justify-center transition-all duration-300"
      style={accentColor ? { "--accent-color": accentColor } : {}}
    >
      
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-800 rounded-2xl px-5 py-4 mb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="h-10 w-10 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl flex items-center justify-center border dark:border-slate-700 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="h-6 w-6 rounded-lg object-cover" />
            ) : (
              <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">T</div>
            )}
            <span className="font-extrabold text-slate-900 dark:text-white text-base">{companyName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] w-full mx-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[28px] lg:rounded-[40px] shadow-2xl border border-white/60 dark:border-slate-800 flex overflow-hidden h-[calc(100vh-120px)] lg:h-[calc(100vh-64px)] relative">
        
        {/* Mobile Backdrop overlay */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          isMobileOpen={isMobileOpen} 
          setIsMobileOpen={setIsMobileOpen}
          companyName={companyName}
          companyLogo={companyLogo}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-40 bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-b border-white/20 dark:border-slate-800 px-4 sm:px-8 py-5">
            <Topbar />
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8">
            {children}
          </div>
        </div>
      </div>
      
      <CommandPalette />
      <AIAssistant />
    </div>
  );
}

export default AppLayout;