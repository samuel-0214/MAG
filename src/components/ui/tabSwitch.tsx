import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';

interface CommonTabsProps {
  items: string[];
  onSelect: (item: string) => void;
  ariaLabel?: string;
  variant?: 'default' | 'range';
  value?: string;
}

const CommonTabs: React.FC<CommonTabsProps> = ({ items, onSelect, ariaLabel, variant = 'default', value }) => {
  const listClassName =
    variant === 'range'
      ? 'flex justify-between rounded-md w-full gap-2'
      : 'flex rounded-md border border-neutral-600 p-2 w-fit';

  const triggerClassName =
    variant === 'range'
      ? 'flex-1 justify-center gap-2 rounded px-3 py-1 text-sm font-normal border-[1px] data-[state=active]:border-neutral-800 data-[state=active]:bg-foreground/10'
      : 'flex-1 justify-center gap-2 rounded px-3 py-[2px] text-sm font-normal border-transparent border-[1px] data-[state=active]:border-neutral-600 data-[state=active]:bg-foreground/10';

  return (
    <Tabs.Root
      value={value} // Changed from defaultValue to value
      onValueChange={onSelect} // Add onValueChange to handle tab changes
      className='mx-auto w-full whitespace-nowrap'
    >
      <Tabs.List
        className={listClassName}
        aria-label={ariaLabel}
      >
        {items.map((item) => (
          <Tabs.Trigger
            key={item}
            className={triggerClassName}
            value={item}
          >
            {item}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
};

export default CommonTabs;
