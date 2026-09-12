import React, { useEffect, useRef } from 'react';
import { Copy, Check, ScrollText } from 'lucide-react';
import { Move } from '../types/chess';

interface MoveHistoryProps {
  history: Move[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = React.memo(({ history }) => {
  const [copied, setCopied] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group moves into pairs: [White Move, Black Move]
  const movePairs = React.useMemo(() => {
    const pairs: { turnNumber: number; white: Move; black?: Move }[] = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        turnNumber: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1],
      });
    }
    return pairs;
  }, [history]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  const generatePGN = () => {
    let pgn = '';
    movePairs.forEach(pair => {
      pgn += `${pair.turnNumber}. ${pair.white.san} ${pair.black ? pair.black.san + ' ' : ''}`;
    });
    return pgn.trim();
  };

  const handleCopyPGN = () => {
    const pgn = generatePGN();
    if (!pgn) return;
    navigator.clipboard.writeText(pgn).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <ScrollText className="w-4 h-4 text-amber-500" />
          <span>Move History</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
            {history.length} moves
          </span>
        </div>
        {history.length > 0 && (
          <button
            id="copy-pgn-btn"
            onClick={handleCopyPGN}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
            title="Copy PGN Notation"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>PGN</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Move list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-0.5 text-sm font-mono scrollbar-thin scrollbar-thumb-slate-700"
      >
        {movePairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-28 text-slate-500 text-xs italic">
            Moves will appear here as you play
          </div>
        ) : (
          movePairs.map(pair => (
            <div
              key={pair.turnNumber}
              className="flex items-center rounded px-2.5 py-1 hover:bg-slate-800/50 transition-colors"
            >
              <span className="w-9 text-slate-500 text-xs">{pair.turnNumber}.</span>
              <span className="flex-1 font-semibold text-slate-200">
                {pair.white.san}
              </span>
              <span className="flex-1 font-semibold text-slate-300">
                {pair.black ? pair.black.san : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
