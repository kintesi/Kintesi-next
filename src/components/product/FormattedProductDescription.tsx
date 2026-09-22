import React, { useMemo } from 'react';

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

    // 1. Remove supplier / dropshipping URLs
    let cleanText = description
      .replace(/https?:\/\/(?:mohasagor|dropshipping)\S+/gi, '')
      .trim();

    // 2. Normalize emojis and section headings with clean double line break
    cleanText = cleanText
      .replace(/([^\n])\s*(👉|⚡|✨|🔥|🌟|📦|🌸|💨|💡|📌|🌼)/g, '$1\n\n$2 ')
      .replace(/(👉[^\n:]+[:：][-–—]*)\s*(?=[১-৯\d]\.|\-|\—|\•)/g, '$1\n');

    // 3. Sentence boundary ungluing (Bengali Dari or exclamation followed immediately by text)
    cleanText = cleanText
      .replace(/([।!?])(?=[A-Za-z\u0980-\u09ff])/g, '$1\n\n');

    // 4. Numbered list items glued together (e.g. '1. ', '2. ', '১. ')
    cleanText = cleanText
      .replace(/([^\n])\s*(?=[১-৯\d]+\.\s*)/g, '$1\n')
      .replace(/([^\n])(?=[১-৯\d]+\.(?=[A-Za-z\u0980-\u09ff]))/g, '$1\n');

    // 5. Dash / bullet items glued
    cleanText = cleanText
      .replace(/([।!?.:：\n])\s*[-–—]+\s*(?=[-–—•*]\s*)/g, '$1\n')
      .replace(/([।!?])\s*(?=[-–—•*]\s+)/g, '$1\n');

    // 6. Hashtags
    cleanText = cleanText
      .replace(/([^\n])\s*(?=#[\w\u0980-\u09ff])/g, '$1\n\n')
      .replace(/(#[\w\u0980-\u09ff.]+)\s*(?=[A-Za-z\u0980-\u09ff])/g, '$1\n\n');

    // 7. Comprehensive spec keys ungluing (Product size, Dimensions, Length, Chest, Material, Battery, etc.)
    const SPEC_KEYS = [
      'Product size', 'Product Size', 'Size', 'Sizes', 'Dimension', 'Dimensions',
      'Available Length', 'Length', 'Body / Chest', 'Body/Chest', 'Body', 'Chest', 'Flair', 'Gher', 'Hijab Size',
      'Material', 'Fabric', 'Color', 'Colors', 'Function', 'Count', 'Voltage', 'Power', 'Speed', 'Capacity', 'Model',
      'Band Wide', 'Band Width', 'Strap', 'Weight', 'Net Weight',
      'Battery capacity', 'Battery Capacity', 'Battery', 'Charging method', 'Charging Method', 'Charging time', 'Working time',
      'Warranty', 'Origin', 'Package included', 'Package includes', 'Package Content',
      'রঙের অপশন', 'রং', 'কালার', 'উপাদান', 'ফেব্রিক', 'মেটেরিয়াল', 'মেটেরিয়াল', 'ব্যাটারি ক্ষমতা', 'ব্যাটারি',
      'চার্জিং সিস্টেম', 'চার্জিং মেথড', 'সাইজ', 'দৈর্ঘ্য', 'লং', 'বডি', 'ঘের', 'ওজন', 'ওয়ারেন্টি'
    ];
    const specKeyPattern = SPEC_KEYS.map((k) => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
    const specRegex = new RegExp('([^\\n])\\s*(?:\\b|(?<=[a-z0-9\\u0980-\\u09ff)\\]!.?।]))(' + specKeyPattern + ')\\s*[:：]', 'gi');
    cleanText = cleanText.replace(specRegex, (match, p1, p2) => `${p1}\n${p2}: `);

    // 8. Semicolon lists in English instructions
    cleanText = cleanText.replace(/;\s*(?=[A-Z])/g, ';\n');

    // 3. Split into paragraphs by double newlines or single newlines
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
