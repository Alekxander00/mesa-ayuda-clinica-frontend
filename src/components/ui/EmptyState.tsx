// frontend/src/components/ui/EmptyState.tsx
interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
  }
  
  export default function EmptyState({ 
    icon = '📭', 
    title, 
    description, 
    action 
  }: EmptyStateProps) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4 opacity-50">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        {description && (
          <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
        )}
        {action && <div className="flex justify-center">{action}</div>}
      </div>
    );
  }