"use client";
import React, { useEffect, useMemo, useRef, useState, ReactNode } from "react";

// Crossword Battle Arena – GfG Puzzle #10 Edition (fixed for duplicate clue numbers)

// ----------------------- PUZZLE -----------------------
const PUZZLE = {
  id: "crossword-10",
  rows: 10,
  cols: 10,
  words: [
    // ACROSS
    { number: 1, row: 0, col: 0, answer: "TRIP", clue: "Excursion", direction: "across" },
    { number: 5, row: 0, col: 7, answer: "SAP", clue: "Tree fluid", direction: "across" },
    { number: 6, row: 1, col: 3, answer: "REACH", clue: "Boxer's stat", direction: "across" },
    { number: 7, row: 2, col: 0, answer: "BLUE", clue: "Spectrum color", direction: "across" },
    { number: 8, row: 3, col: 3, answer: "SWEEP", clue: "Use a broom", direction: "across" },
    { number: 11, row: 4, col: 0, answer: "FRESH", clue: "Mouthing off", direction: "across" },
    { number: 13, row: 5, col: 4, answer: "EDGE", clue: "Margin", direction: "across" },
    { number: 14, row: 6, col: 0, answer: "UNCLE", clue: "Remus, e.g.", direction: "across" },
    { number: 15, row: 7, col: 4, answer: "LATE", clue: "Recent", direction: "across" },
    { number: 17, row: 2, col: 7, answer: "IVY", clue: "Climbing plant", direction: "across" },
    { number: 19, row: 9, col: 0, answer: "ROBUST", clue: "Strong", direction: "across" },

    // DOWN
    { number: 2, row: 0, col: 1, answer: "RULER", clue: "King or Queen", direction: "down" },
    { number: 3, row: 0, col: 3, answer: "PRESS", clue: "Newspapers", direction: "down" },
    { number: 4, row: 0, col: 5, answer: "PAGE", clue: "Book unit", direction: "down" },
    { number: 5, row: 0, col: 7, answer: "SHIP", clue: "Model in a bottle", direction: "down" },
    { number: 9, row: 3, col: 4, answer: "WHEEL", clue: "Cart part", direction: "down" },
    { number: 10, row: 3, col: 6, answer: "EIGHT", clue: "Ice skating figure", direction: "down" },
    { number: 11, row: 4, col: 0, answer: "FOUR", clue: "Two squared", direction: "down" },
    { number: 12, row: 4, col: 2, answer: "EACH", clue: "Apiece", direction: "down" },
    { number: 16, row: 7, col: 5, answer: "ANT", clue: "Picnic pest", direction: "down" },
    { number: 18, row: 7, col: 7, answer: "END", clue: "Finish", direction: "down" },
    { number: 20, row: 2, col: 9, answer: "YEARLING", clue: "Animal one year old", direction: "down" },
  ],
};

// ----------------------- BOT PERSONALITIES -----------------------
const BOT_NAMES = ["Snarky McByte", "Quipotron", "Sass-9000", "Irony Engine", "ZingBot"];
const SARCASM = [
  (msg: string) => `Wow, "${msg}". Bold strategy. Let's see if the dictionary agrees.`,
  () => `I solved that while buffering. You okay over there?`,
  () => `My circuits yawned. Can we pick up the pace?`,
  () => `I'll dumb down to 8-bit so it's fair.`,
  () => `Is Caps Lock your coach now, or just enthusiasm?`,
  () => `Spellcheck is filing a complaint.`,
  () => `Don’t worry, even humans make… choices.`,
  () => `Beep boop: that guess was… courageous.`,
];
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function sarcasticReply(userMsg = "", event: string = "chat") {
  if (event === "correct") return "Congrats — correct answer. Try not to get a big head.";
  if (event === "wrong") return "Close, but no. Would you like a hint (not really)?";
  if (event === "botscored") return "And that, dear human, is how it's done.";
  const base = pick(SARCASM);
  return typeof base === "function" ? base(userMsg) : base;
}

// ----------------------- UI HELPERS -----------------------
interface ScoreBadgeProps { label: string; score: number; highlight?: boolean; }
function ScoreBadge({ label, score, highlight = false }: ScoreBadgeProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow ${highlight ? "bg-black text-white" : "bg-white"}`}>
      <span className="text-sm opacity-70">{label}</span>
      <span className="font-bold text-xl tabular-nums">{score}</span>
    </div>
  );
}
interface ModalProps { open: boolean; onClose: () => void; children: ReactNode; }
function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[min(640px,92vw)] rounded-2xl bg-white p-6 shadow-2xl">{children}</div>
    </div>
  );
}

// ----------------------- MAIN COMPONENT -----------------------
export default function CrosswordBattleArena() {
  const puzzle = useMemo(() => PUZZLE, []);
  const [grid, setGrid] = useState<string[][]>(() => Array.from({ length: puzzle.rows }, () => Array(puzzle.cols).fill("")));
  const [solved, setSolved] = useState<Set<string>>(() => new Set());
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [chat, setChat] = useState<{ who: "bot" | "me"; text: string }[]>(() => [
    { who: "bot", text: `I am ${pick(BOT_NAMES)}. I'm here to battle and to judge.` },
  ]);
  const [answerInput, setAnswerInput] = useState(""); // left answer box
  const [chatInput, setChatInput] = useState(""); // right chat box
  const [selected, setSelected] = useState<string>(() => `${puzzle.words[0].number}${puzzle.words[0].direction === "across" ? "A" : "D"}`);
  const [timeLeft, setTimeLeft] = useState(180); // seconds
  const [gameOver, setGameOver] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // maps
  const byId = useMemo(
    () => Object.fromEntries(puzzle.words.map(w => [`${w.number}${w.direction === "across" ? "A" : "D"}`, w])),
    [puzzle]
  );
  const remaining = useMemo(() => puzzle.words.filter(w => !solved.has(`${w.number}${w.direction === "across" ? "A" : "D"}`)), [puzzle, solved]);

  // compute used cells
  const usedCells = useMemo(() => {
    const s = new Set<string>();
    for (const w of puzzle.words) {
      for (let i = 0; i < w.answer.length; i++) {
        const r = w.direction === "down" ? w.row + i : w.row;
        const c = w.direction === "across" ? w.col + i : w.col;
        s.add(`${r}-${c}`);
      }
    }
    return s;
  }, [puzzle]);

  // autoscroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  // timer
  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [gameOver]);
  useEffect(() => { if (timeLeft <= 0 && !gameOver) finishGame(); }, [timeLeft, gameOver]);

  // bot autosolve
  const botSolveDelayMs = 15000;
  useEffect(() => {
    if (gameOver) return;
    if (remaining.length === 0) return;
    const id = setInterval(() => {
      if (remaining.length === 0) return;
      const target = pick(remaining);
      const idKey = `${target.number}${target.direction === "across" ? "A" : "D"}`;
      setSolved(prev => new Set(prev).add(idKey));
      setBotScore(s => s + target.answer.length * 10);
      setChat(c => [...c, { who: "bot", text: `Solved ${idKey}. ${sarcasticReply("", "botscored")}` }]);
      setGrid(g => {
        const gg = g.map(row => [...row]);
        if (target.direction === "across") for (let i = 0; i < target.answer.length; i++) gg[target.row][target.col + i] = target.answer[i];
        else for (let i = 0; i < target.answer.length; i++) gg[target.row + i][target.col] = target.answer[i];
        return gg;
      });
    }, botSolveDelayMs);
    return () => clearInterval(id);
  }, [remaining.length, gameOver]);

  function newGame() {
    setGrid(Array.from({ length: puzzle.rows }, () => Array(puzzle.cols).fill("")));
    setSolved(new Set());
    setUserScore(0);
    setBotScore(0);
    setChat([{ who: "bot", text: `I'm ${pick(BOT_NAMES)} again. Try not to embarrass yourself.` }]);
    setAnswerInput("");
    setChatInput("");
    setSelected(`${puzzle.words[0].number}${puzzle.words[0].direction === "across" ? "A" : "D"}`);
    setTimeLeft(180);
    setGameOver(false);
  }

  function finishGame() {
    setGameOver(true);
    const verdict = userScore === botScore ? "It's a tie." : userScore > botScore ? "You win!" : "Bot wins!";
    setChat(c => [...c, { who: "bot", text: verdict }]);
  }

  // submit answer
  function submitAnswer(e?: React.FormEvent) {
    e?.preventDefault?.();
    const word = byId[selected];
    if (!word) return;
    const guess = answerInput.trim().toUpperCase();
    if (!guess) return;
    if (guess === word.answer) {
      if (!solved.has(selected)) {
        const newSolved = new Set(solved).add(selected);
        setSolved(newSolved);
        setUserScore(s => s + word.answer.length * 10);
        setChat(c => [...c, { who: "bot", text: sarcasticReply(guess, "correct") }]);
        setGrid(g => {
          const gg = g.map(row => [...row]);
          if (word.direction === "across") for (let i = 0; i < word.answer.length; i++) gg[word.row][word.col + i] = word.answer[i];
          else for (let i = 0; i < word.answer.length; i++) gg[word.row + i][word.col] = word.answer[i];
          return gg;
        });
        setAnswerInput("");
        const rem = puzzle.words.find(w => !newSolved.has(`${w.number}${w.direction === "across" ? "A" : "D"}`));
        if (rem) setSelected(`${rem.number}${rem.direction === "across" ? "A" : "D"}`);
        if (newSolved.size === puzzle.words.length) finishGame();
      }
    } else {
      setChat(c => [...c, { who: "bot", text: sarcasticReply(guess, "wrong") }]);
      setAnswerInput("");
    }
  }

  function sendChat() {
    const msg = chatInput.trim();
    if (!msg) return;
    setChat(c => [...c, { who: "me", text: msg }]);
    setTimeout(() => setChat(c => [...c, { who: "bot", text: sarcasticReply(msg, "chat") }]), 500);
    setChatInput("");
  }

  // Cell renderer
  function Cell({ r, c }: { r: number; c: number }) {
    const val = grid[r][c];
    const start = puzzle.words.find(w => w.row === r && w.col === c);
    const isUsed = usedCells.has(`${r}-${c}`);
    return (
      <div className={`relative w-10 h-10 border border-zinc-300 flex items-center justify-center text-lg font-semibold ${isUsed ? "bg-white" : "bg-black"}`}>
        {start && <span className="absolute top-0 left-0 text-[10px] p-0.5 text-zinc-600">{start.number}</span>}
        {val}
      </div>
    );
  }

  function WordItem({ w }: { w: (typeof puzzle.words)[number] }) {
    const id = `${w.number}${w.direction === "across" ? "A" : "D"}`;
    const isSolved = solved.has(id);
    const active = selected === id;
    return (
      <button onClick={() => setSelected(id)} className={`w-full text-left p-3 rounded-xl border transition shadow-sm ${active ? "border-black" : "border-zinc-200"} ${isSolved ? "bg-green-50" : "bg-white"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100">{id}</span>
            <span className="font-medium">{w.clue}</span>
          </div>
          <div className="text-sm opacity-60">{w.answer.length} letters</div>
        </div>
        <div className="mt-1 text-sm opacity-70">{isSolved ? `Solved: ${w.answer}` : "Unsolved"}</div>
      </button>
    );
  }

  const currentWord = byId[selected];
  const progress = Math.round(((puzzle.words.length - remaining.length) / puzzle.words.length) * 100);
  const winner = gameOver ? (userScore > botScore ? "You" : userScore < botScore ? "Bot" : "Tie") : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900 p-4">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black text-white grid place-items-center font-black">XB</div>
          <div>
            <h1 className="text-xl font-bold">Crossword Battle Arena (10×10)</h1>
            <p className="text-xs opacity-60">Answer input (left) — Chat (right).</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge label="You" score={userScore} highlight={userScore >= botScore} />
          <ScoreBadge label="Bot" score={botScore} highlight={botScore > userScore} />
          <div className="ml-2 px-3 py-2 rounded-2xl bg-white shadow text-sm font-semibold tabular-nums">⏱ {Math.max(0, timeLeft)}s</div>
          <button onClick={newGame} className="ml-2 px-4 py-2 rounded-xl bg-black text-white">New Game</button>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
          <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs opacity-60 mt-1">{puzzle.words.length - remaining.length} / {puzzle.words.length} solved</div>
      </div>

      <main className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
        {/* Left */}
        <section className="space-y-4">
          <div className="rounded-2xl bg-white shadow p-4">
            <div className="grid grid-cols-10 gap-0 w-fit mx-auto">
              {Array.from({ length: puzzle.rows }).map((_, r) => (
                <React.Fragment key={r}>
                  {Array.from({ length: puzzle.cols }).map((_, c) => <Cell key={`${r}-${c}`} r={r} c={c} />)}
                </React.Fragment>
              ))}
            </div>
          </div>
          <form onSubmit={submitAnswer} className="rounded-2xl bg-white shadow p-4 flex gap-2">
            <input value={answerInput} onChange={e => setAnswerInput(e.target.value)} placeholder={currentWord ? `Answer for ${selected}` : "Select a clue"} className="flex-1 px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-black" />
            <button type="submit" className="px-4 py-2 rounded-xl bg-black text-white">Submit</button>
          </form>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white shadow p-4">
              <h2 className="font-bold mb-2">Across</h2>
              <div className="space-y-2">{puzzle.words.filter(w => w.direction === "across").map(w => <WordItem key={`${w.number}A`} w={w} />)}</div>
            </div>
            <div className="rounded-2xl bg-white shadow p-4">
              <h2 className="font-bold mb-2">Down</h2>
              <div className="space-y-2">{puzzle.words.filter(w => w.direction === "down").map(w => <WordItem key={`${w.number}D`} w={w} />)}</div>
            </div>
          </div>
        </section>

        {/* Right */}
        <section className="flex flex-col rounded-2xl bg-white shadow p-4">
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {chat.map((m, i) => (
              <div key={i} className={`px-3 py-2 rounded-xl max-w-[80%] ${m.who === "bot" ? "bg-zinc-100 self-start" : "bg-black text-white self-end"}`}>
                {m.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="mt-2 flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Chat with the bot…" className="flex-1 px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-black" />
            <button onClick={sendChat} className="px-4 py-2 rounded-xl bg-black text-white">Send</button>
          </div>
        </section>
      </main>

      {/* End Modal */}
      <Modal open={gameOver} onClose={() => {}}>
        <h2 className="text-xl font-bold mb-2">Game Over</h2>
        <p className="mb-4">Final Score: You {userScore} — Bot {botScore}</p>
        <p className="mb-4">{winner === "Tie" ? "It's a tie!" : `${winner} win${winner === "You" ? "" : "s"}!`}</p>
        <button onClick={newGame} className="px-4 py-2 rounded-xl bg-black text-white">Play Again</button>
      </Modal>
    </div>
  );
}
