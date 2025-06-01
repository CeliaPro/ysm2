import { useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command"
import { X, ChevronDown } from "lucide-react"
import { Project } from "@/types/project"

interface MultiSelectComboboxProps {
  options: Project[]
  selected: string[]
  setSelected: React.Dispatch<React.SetStateAction<string[]>>
  placeholder?: string
}

function MultiSelectCombobox({
  options,
  selected,
  setSelected,
  placeholder = "Assign to projects...",
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // For keyboard navigation: close popover on blur
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`
            w-full text-left border rounded-md px-3 py-2 bg-background
            focus:outline-none focus:ring-2 focus:ring-blue-400
            flex items-center justify-between
          `}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="truncate">
            {selected.length > 0
              ? options
                  .filter((opt) => selected.includes(opt.id))
                  .map((opt) => opt.name)
                  .join(", ")
              : placeholder}
          </span>
          <ChevronDown className="ml-2 w-4 h-4 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]">
        <Command>
          <CommandInput
            ref={inputRef}
            placeholder="Search project..."
            value={search}
            onValueChange={setSearch}
            className="w-full border-b"
            autoFocus
          />
          <CommandList className="max-h-60 overflow-y-auto">
            {options
              .filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()))
              .map((opt) => (
                <CommandItem
                  key={opt.id}
                  onSelect={() => {
                    if (selected.includes(opt.id)) {
                      setSelected(selected.filter((id) => id !== opt.id))
                    } else {
                      setSelected([...selected, opt.id])
                    }
                  }}
                  // SOFT SELECT STYLE: no bg, only checkmark and font weight
                  className={`cursor-pointer flex items-center ${
                    selected.includes(opt.id)
                      ? "font-semibold text-blue-700"
                      : ""
                  }`}
                >
                  <span>{opt.name}</span>
                  {selected.includes(opt.id) && (
                    <span className="ml-auto text-xs text-blue-500">✔</span>
                  )}
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
      {/* Show selected projects as tags */}
      <div className="flex flex-wrap mt-2 gap-1">
        {options
          .filter((opt) => selected.includes(opt.id))
          .map((opt) => (
            <span
              key={opt.id}
              className="px-2 py-1 rounded bg-blue-500 text-white text-xs flex items-center gap-1"
            >
              {opt.name}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() =>
                  setSelected(selected.filter((id) => id !== opt.id))
                }
              />
            </span>
          ))}
      </div>
    </Popover>
  )
}

export default MultiSelectCombobox
