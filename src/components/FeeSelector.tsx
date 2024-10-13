'use client';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import React, { ElementRef, useEffect, useRef, useState } from 'react';
import { useWindowSize } from 'usehooks-ts';

const FeeSelector = ({
  currentFee,
  setFeeTier,
  fees,
  disabled,
}: {
  currentFee: string;
  setFeeTier: (c: string) => void;
  fees: string[];
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const [popoverWidth, setPopoverWidth] = useState(0);
  const buttonRef = useRef<ElementRef<'button'>>(null);

  const { width = 0 } = useWindowSize({ debounceDelay: 300 });

  useEffect(() => {
    if (buttonRef.current) {
      setPopoverWidth(buttonRef.current.clientWidth);
    }
  }, [buttonRef, width]);

  return (
    <Popover
      open={open}
      onOpenChange={() => (disabled ? undefined : setOpen(!open))}
    >
      <PopoverTrigger
        asChild
        disabled={disabled}
        className='disabled:cursor-wait '
      >
        <Button
          disabled={disabled}
          ref={buttonRef}
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='flex-1 justify-start gap-2 px-3 text-sm font-normal ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed'
        >
          {currentFee}
          {'%'} {'fee tier'}
          <ChevronDown className='ml-auto h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={'p-0'}
        style={{ width: popoverWidth }}
      >
        <Command className='max-h-[80svh]'>
          <CommandList>
            <CommandEmpty>No Fee found.</CommandEmpty>

            <CommandGroup>
              {fees.map((fee, index) => {
                return (
                  <CommandItem
                    // value={fee}
                    key={index}
                    onSelect={() => {
                      setFeeTier(fee);
                      setOpen(false);
                    }}
                    className='flex cursor-pointer gap-2'
                  >
                    <span>
                      {fee}
                      {'%'} {'fee tier'}
                    </span>

                    {/* <Check className={cn('ml-auto h-4 w-4', fee === currentFee ? 'opacity-100' : 'opacity-0')} /> */}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default FeeSelector;
