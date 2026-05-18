import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/useAuth";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const userRole = user?.role?.toUpperCase() || "USER";

  const navItems = [
    {
      path: "/dashboard",
      label: "Дашборд",
      icon: LayoutDashboard,
      roles: ["ADMIN", "MANAGER", "USER"],
    },
    {
      path: "/leagues",
      label: "Лиги",
      icon: Trophy,
      roles: ["ADMIN", "MANAGER", "USER"],
    },
    {
      path: "/teams",
      label: "Команды",
      icon: Users,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      path: "/matches",
      label: "Матчи",
      icon: Calendar,
      roles: ["ADMIN", "MANAGER", "USER"],
    },
    { path: "/admin", label: "Админ-панель", icon: Settings, roles: ["ADMIN"] },
  ];

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole),
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary rounded-lg text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary">
              ⚽ Football Manager
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.name} • {user?.role}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-danger hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
