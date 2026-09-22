import React, { useMemo } from 'react';
import { formatDescriptionDropshippingStyle } from '../../lib/productSpecUtils';

interface FormattedProductDescriptionProps {
  description: string;
  className?: string;
}

export const FormattedProductDescription: React.FC<FormattedProductDescriptionProps> = ({
  description,
  className = '',
}) => {
  const formattedElements = useMemo(() => {
    if (!description || !description.trim()) {
      return [];
    }

    const cleanText = formatDescriptionDropshippingStyle(description);
    const rawParagraphs = cleanText.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);

    return rawParagraphs.map((para, paraIdx) => {
      const lines = para.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

      // If paragraph contains multiple lines (e.g. list of bullets or numbered points)
      if (lines.length > 1) {
        return (
          <div key={paraIdx} className="space-y-2">
            {lines.map((line, lineIdx) => renderLine(line, `${paraIdx}-${lineIdx}`))}
          </div>
        );
      }

      // Single line paragraph
      return renderLine(lines[0], `${paraIdx}-0`);
    });
  }, [description]);

  if (!description || !description.trim()) {
    return null;
  }

  return (
    <div className={`space-y-3.5 sm:space-y-4 text-gray-800 text-sm sm:text-base leading-relaxed sm:leading-7 ${className}`}>
      {formattedElements}
    </div>
  );
};

function renderLine(line: string, key: string): React.ReactNode {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 1. Hashtags (#remover, #blackdot, etc.)
  if (/^#[\w\u0980-\u09ff.]+/.test(trimmed)) {
    const tags = trimmed.split(/\s+/).filter(Boolean);
    return (
      <div key={key} className="flex flex-wrap gap-1.5 pt-1">
        {tags.map((tag, tIdx) => (
          <span
            key={tIdx}
            className="text-[11px] sm:text-xs font-semibold text-rose-600 bg-rose-50/70 border border-rose-200/50 px-2 py-0.5 rounded-lg"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  // 2. Section Heading (starts with 👉, ⚡, ✨, or ends with :- or :)
  const isHeading =
    /^(?:👉|⚡|✨|🔥|🌟|📦|🌸|💨|💡|📌)\s*/.test(trimmed) ||
    /^(?:মূল বৈশিষ্ট্য|প্রধান বৈশিষ্ট্য|বৈশিষ্ট্যসমূহ|ব্যবহারের ধাপ|ব্যবহারবিধি|What's Included|Specifications?|Features?)\b/i.test(trimmed) ||
    (trimmed.length < 50 && (trimmed.endsWith(':-') || trimmed.endsWith(':')));

  if (isHeading) {
    return (
      <p key={key} className="font-bold text-gray-950 text-sm sm:text-base pt-2">
        {renderBoldBeforeColon(trimmed)}
      </p>
    );
  }

  // 3. Numbered or Bullet points (e.g. "১. রঙের অপশন: ...", "1. Preparation: ...", "- ...", "• ...")
  const numberedMatch = trimmed.match(/^([১-৯\d]+\.|\-|\—|\•|\*)\s*(.*)$/);
  if (numberedMatch) {
    const bullet = numberedMatch[1];
    const rest = numberedMatch[2];

    return (
      <div key={key} className="flex items-start gap-2 pl-0.5 sm:pl-1">
        <span className="font-bold text-gray-900 shrink-0 select-none">{bullet}</span>
        <div className="flex-1 leading-relaxed sm:leading-7 text-gray-800">
          {renderBoldBeforeColon(rest)}
        </div>
      </div>
    );
  }

  // 4. English or Bengali Key-Value spec lines (e.g. "Color: White,Pink", "Material: ABS")
  const colonIdx = trimmed.indexOf(':');
  const bColonIdx = trimmed.indexOf('：');
  const splitIdx = colonIdx !== -1 ? colonIdx : bColonIdx;

  if (splitIdx > 1 && splitIdx < 35 && !trimmed.startsWith('http') && !trimmed.includes('http')) {
    const k = trimmed.slice(0, splitIdx).trim();
    const v = trimmed.slice(splitIdx + 1).trim();
    if (k && v) {
      return (
        <p key={key} className="leading-relaxed text-gray-800">
          <strong className="font-bold text-gray-950">{k}:</strong> {v}
        </p>
      );
    }
  }

  // 5. Default natural paragraph
  return (
    <p key={key} className="leading-relaxed sm:leading-7 text-gray-700 font-normal">
      {renderBoldBeforeColon(trimmed)}
    </p>
  );
}

/**
 * Helper that bolds any intro title before a colon if present (e.g. "রঙের অপশন: স্টাইলিশ...")
 */
function renderBoldBeforeColon(text: string): React.ReactNode {
  const colonIdx = text.indexOf(':');
  const bColonIdx = text.indexOf('：');
  const splitIdx = colonIdx !== -1 ? colonIdx : bColonIdx;

  // Only bold if colon is within the first 40 characters (likely a sub-title or label)
  if (splitIdx > 1 && splitIdx < 40 && !text.startsWith('http')) {
    const prefix = text.slice(0, splitIdx + 1);
    const suffix = text.slice(splitIdx + 1);
    return (
      <>
        <strong className="font-bold text-gray-950">{prefix}</strong>
        {suffix}
      </>
    );
  }

  return text;
}
