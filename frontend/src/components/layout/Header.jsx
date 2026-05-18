const Header = ({ title }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
    </header>
  );
};

export default Header;