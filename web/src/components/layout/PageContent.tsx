interface PageContentProps {
  children: React.ReactNode;
  maxWidth?: 'full' | '6xl' | '7xl';
  className?: string;
}

const maxWidthClasses = {
  full: 'w-full',
  '6xl': 'w-full max-w-6xl',
  '7xl': 'w-full max-w-7xl'
};

export default function PageContent({ children, maxWidth = 'full', className = '' }: PageContentProps) {
  return (
    <main className={`flex-1 p-4 md:p-5 ${maxWidthClasses[maxWidth]} ${className}`}>
      {children}
    </main>
  );
}
