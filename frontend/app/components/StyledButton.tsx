export default function StyledButton({ children, onClick, disabled, className }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean, className?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`mt-8 px-6 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 ${className ?? ""}`}>
      {children}
    </button>
  );
}