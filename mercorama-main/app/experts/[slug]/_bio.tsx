'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function ExpertBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const paras = bio.split('\n\n').filter(Boolean);
  const preview = paras[0];
  const rest = paras.slice(1);

  return (
    <div>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
        <p>{preview}</p>
        {expanded && rest.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {rest.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? <><ChevronUp className="h-3.5 w-3.5" />Show less</> : <><ChevronDown className="h-3.5 w-3.5" />Read more</>}
        </button>
      )}
    </div>
  );
}
