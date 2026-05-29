"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@streamflare/ui/lib/utils";
import { COUNTRIES } from "@streamflare/ui/lib/countries";
import { Button } from "@streamflare/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@streamflare/ui/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@streamflare/ui/components/ui/popover";

export interface CountryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function CountryCombobox({ value, onChange, id }: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || "Select country"}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country}
                  value={country}
                  onSelect={(v) => {
                    onChange(v);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4", value === country ? "opacity-100" : "opacity-0")} />
                  {country}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
