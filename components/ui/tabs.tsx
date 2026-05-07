'use client';

import * as React from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
}

interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({ children, defaultValue, className = '', onValueChange }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  const handleSetActiveTab = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div className={`flex gap-0 border-b bg-card ${className}`}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

function TabsTrigger({ value, children, className = '', icon }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 ${
        isActive
          ? 'border-b-primary text-primary'
          : 'border-b-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
      } ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const { activeTab } = useTabs();

  if (activeTab !== value) return null;

  return <div className={className}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
