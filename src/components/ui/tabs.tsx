import { NavLink } from 'react-router';

interface Tab {
  label: string;
  to: string;
}

interface TabsProps {
  tabs: Tab[];
}

export function Tabs({ tabs }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border mb-6">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
