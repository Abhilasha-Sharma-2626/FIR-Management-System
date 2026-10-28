import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function AccordionItem({ title, children, isOpen, onToggle, id }) {
  const contentId = `accordion-content-${id}`;
  const headerId = `accordion-header-${id}`;

  return (
    <div className="border-b border-borderSoft last:border-b-0 transition-colors">
      <h3>
        <button
          id={headerId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={onToggle}
          className="flex w-full items-center justify-between py-5 text-left font-display text-base md:text-lg font-semibold text-ink hover:text-navy transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 rounded-sm"
        >
          <span className="pr-4">{title}</span>
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ivory border border-borderSoft text-slate transition-transform duration-200 ${
              isOpen ? 'rotate-180 bg-navy text-white border-navy' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </span>
        </button>
      </h3>
      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 pb-5' : 'grid-rows-[0fr] opacity-0 pb-0 overflow-hidden'
        }`}
      >
        <div className="overflow-hidden text-sm md:text-base text-slate leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Accordion({ items, allowMultiple = false, className = '' }) {
  const [openIndices, setOpenIndices] = useState([0]); // First item open by default

  const handleToggle = (index) => {
    if (allowMultiple) {
      setOpenIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndices((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={`divide-y divide-borderSoft border-y border-borderSoft ${className}`}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          id={index}
          title={item.title}
          isOpen={openIndices.includes(index)}
          onToggle={() => handleToggle(index)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

export default Accordion;
