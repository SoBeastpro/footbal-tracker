import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0">
        <Outlet /> {/* Здесь будут рендериться дочерние страницы */}
      </div>
    </div>
  );
};

export default MainLayout;