"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

// Crossword Battle Arena – Sarcastic Bot Edition
// Single-file React component. TailwindCSS for styling.
// No backend required; AI bot is simulated with a sarcasm generator.
// You can wire real LLM calls by replacing `sarcasticReply()` and `botSolveDelayMs`.

// ----------------------- PUZZLE BANK -----------------------
// Simple 5x5 mini puzzles; across-only for fast gameplay.
const PUZZLES = [
  {
    id: "mini-apple-robot-india",
    rows: 5,
    cols: 5,
    blocks: [], // no blocks used; full-width words
    words: [
      { number: 1, row: 0, col: 0, answer: "APPLE", clue: "Keeps the doctor away (allegedly)" },
      { number: 2, row: 2, col: 0, answer: "ROBOT", clue: "Mechanized helper" },
      { number: 3, row: 4, col: 0, answer: "INDIA", clue: "Country with the Taj Mahal" },
    ],
  },
  {
    id: "mini-mango-laser-earth",
    rows: 5,
    cols: 5,
    blocks: [],
    words: [
      { number: 1, row: 0, col: 0, answer: "MANGO", clue: "The king of fruits (in summer)" },
      { number: 2, row: 2, col: 0, answer: "LASER", clue: "Intense light beam" },
      { number: 3, row: 4, col: 0, answer: "EARTH", clue: "Our home planet" },
    ],
  },
  {
    id: "mini-pearl-spice-river",
    rows: 5,
    cols: 5,
    blocks: [],
    words: [
      { number: 1, row: 0, col: 0, answer: "PEARL", clue: "Gem from an oyster" },
      { number: 2, row: 2, col: 0, answer: "SPICE", clue: "Adds heat to curry" },
      { number: 3, row: 4, col: 0, answer: "RIVER", clue: "Flows to the sea" },
    ],
  },
];

// ----------------------- BOT PERSONALITIES -----------------------
const BOT_NAMES = ["Snarky McByte", "Quipotron", "Sass-9000", "Irony Engine", "ZingBot"];

const SARCASM = [
  (msg) => `Wow, \"${msg}\". Bold strategy. Let's see if the dictionary agrees.`,
  () => `I solved that while buffering. You okay over there?`,
  () => `My circuits yawned. Can we pick up the pace?`,
  () => `I'll dumb down to 8-bit so it's fair.`,
  () => `Is Caps Lock your coach now, or just enthusiasm?`,
  () => `Spellcheck is filing a complaint.`,
  () => `Don’t worry, even humans make… choices.`,
  () => `Beep boop: that guess was… courageous.`,
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function sarcasticReply(userMsg, event = "chat") {
  const base = pick(SARCASM);
  if (event === "correct") return "Congrats, a correct answer. Alert the media.";
  if (event === "wrong") return "Close. Like, 'I can see it from here' close.";
  if (event === "botscored") return "And that, dear human, is how it's done.";
  return base(userMsg || "");
}

// ----------------------- UI HELPERS -----------------------
function ScoreBadge({ label, score, highlight = false }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow ${highlight ? "bg-black text-white" : "bg-white"}`}>
      <span className="text-sm opacity-70">{label}</span>
      <span className="font-bold text-xl tabular-nums">{score}</span>
    </div>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[min(640px,92vw)] rounded-2xl bg-white p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

// ----------------------- MAIN COMPONENT -----------------------
export default function CrosswordBattleArena() {
  const [seed, setSeed] = useState(() => Math.random().toString(36).slice(2));
  const puzzle = useMemo(() => pick(PUZZLES), [seed]);
  const [grid, setGrid] = useState(() => Array.from({ length: puzzle.rows }, () => Array(puzzle.cols).fill("")));
  const [solved, setSolved] = useState(() => new Set());
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [chat, setChat] = useState(() => [
    { who: "bot", text: `I am ${pick(BOT_NAMES)}. I'm here to battle and to judge. Mostly judge.` },
  ]);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState(puzzle.words[0].number);
  const [timeLeft, setTimeLeft] = useState(120); // seconds
  const [gameOver, setGameOver] = useState(false);
  const chatEndRef = useRef(null);

  // Derived maps
  const byNumber = useMemo(() => Object.fromEntries(puzzle.words.map(w => [w.number, w])), [puzzle]);
  const remaining = useMemo(() => puzzle.words.filter(w => !solved.has(w.number)), [puzzle, solved]);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(t);
  }, [gameOver]);

  useEffect(() => {
    if (timeLeft <= 0 && !gameOver) finishGame();
  }, [timeLeft, gameOver]);

  // Bot autosolve loop
  const botSolveDelayMs = 12000; // change for difficulty
  useEffect(() => {
    if (gameOver) return;
    if (remaining.length === 0) return;
    const h = setInterval(() => {
      if (remaining.length === 0) return;
      const target = pick(remaining);
      // Bot solves it
      setSolved(prev => new Set(prev).add(target.number));
      setBotScore(s => s + target.answer.length * 10);
      setChat(c => [...c, { who: "bot", text: `Solved ${target.number}A. ${sarcasticReply("", "botscored")}` }]);
      // Fill grid letters visually
      setGrid(g => {
        const gg = g.map(row => [...row]);
        for (let i = 0; i < target.answer.length; i++) {
          gg[target.row][target.col + i] = target.answer[i];
        }
        return gg;
      });
    }, botSolveDelayMs);
    return () => clearInterval(h);
  }, [remaining.length, gameOver, seed]);

  // NEW GAME
  function newGame() {
    setSeed(Math.random().toString(36).slice(2));
    const p = pick(PUZZLES);
    setSolved(new Set());
    setGrid(Array.from({ length: p.rows }, () => Array(p.cols).fill("")));
    setUserScore(0);
    setBotScore(0);
    setChat([{ who: "bot", text: `I'm ${pick(BOT_NAMES)} again. Try not to embarrass yourself this time.` }]);
    setInput("");
    setSelected(p.words[0].number);
    setTimeLeft(120);
    setGameOver(false);
  }

  function finishGame() {
    setGameOver(true);
    const verdict = userScore === botScore ? "It's a tie. How statistically average of us." : userScore > botScore ? "You win. Even I'm shocked." : "I win. Naturally.";
    setChat(c => [...c, { who: "bot", text: verdict }]);
  }

  function submitGuess(e) {
    e?.preventDefault();
    const word = byNumber[selected];
    if (!word) return;
    const guess = input.trim().toUpperCase();
    const correct = guess === word.answer;
    if (correct) {
      if (!solved.has(word.number)) {
        const newSolved = new Set(solved).add(word.number);
        setSolved(newSolved);
        setUserScore(s => s + word.answer.length * 10);
        setChat(c => [...c, { who: "me", text: guess }, { who: "bot", text: sarcasticReply(guess, "correct") }]);
        // fill letters
        setGrid(g => {
          const gg = g.map(row => [...row]);
          for (let i = 0; i < word.answer.length; i++) gg[word.row][word.col + i] = word.answer[i];
          return gg;
        });
        setInput("");
        // auto-select next remaining
        const rem = puzzle.words.find(w => !newSolved.has(w.number));
        if (rem) setSelected(rem.number);
        if (newSolved.size === puzzle.words.length) finishGame();
      }
    } else {
      setChat(c => [...c, { who: "me", text: guess || "(blank)" }, { who: "bot", text: sarcasticReply(guess, "wrong") }]);
    }
  }

  function sendChat(msg) {
    if (!msg.trim()) return;
    setChat(c => [...c, { who: "me", text: msg }]);
    setTimeout(() => {
      setChat(c => [...c, { who: "bot", text: sarcasticReply(msg, "chat") }]);
    }, 500);
  }

  // Render helpers
  function Cell({ r, c }) {
    const val = grid[r][c];
    return (
      <div className="size-12 border border-zinc-300 flex items-center justify-center text-xl font-semibold bg-white">
        {val}
      </div>
    );
  }

  function WordItem({ w }) {
    const isSolved = solved.has(w.number);
    const active = selected === w.number;
    return (
      <button onClick={() => setSelected(w.number)} className={`w-full text-left p-3 rounded-xl border transition shadow-sm ${active ? "border-black" : "border-zinc-200"} ${isSolved ? "bg-green-50" : "bg-white"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100">{w.number}A</span>
            <span className="font-medium">{w.clue}</span>
          </div>
          <div className="text-sm opacity-60">{w.answer.length} letters</div>
        </div>
        <div className="mt-1 text-sm opacity-70">
          {isSolved ? `Solved: ${w.answer}` : "Unsolved"}
        </div>
      </button>
    );
  }

  const currentWord = byNumber[selected];
  const progress = Math.round(((puzzle.words.length - remaining.length) / puzzle.words.length) * 100);
  const winner = gameOver ? (userScore > botScore ? "You" : userScore < botScore ? "Bot" : "Tie") : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black text-white grid place-items-center font-black">XB</div>
            <div>
              <h1 className="text-xl font-bold">Crossword Battle Arena</h1>
              <p className="text-xs opacity-60">Human vs. Sarcasm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreBadge label="You" score={userScore} highlight={userScore >= botScore} />
            <ScoreBadge label="Bot" score={botScore} highlight={botScore > userScore} />
            <div className="ml-2 px-3 py-2 rounded-2xl bg-white shadow text-sm font-semibold tabular-nums">
              ⏱ {Math.max(0, timeLeft)}s
            </div>
            <button onClick={newGame} className="ml-2 px-4 py-2 rounded-xl bg-black text-white shadow hover:opacity-90">New Game</button>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-6xl mx-auto px-4 mt-3">
        <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
          <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs opacity-60 mt-1">{puzzle.words.length - remaining.length} / {puzzle.words.length} solved</div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-2 gap-6">
        {/* Left: Grid & current input */}
        <section className="space-y-4">
          <div className="rounded-2xl bg-white shadow p-4">
            <div className="grid grid-cols-5 gap-0 w-fit mx-auto">
              {Array.from({ length: puzzle.rows }).map((_, r) => (
                <React.Fragment key={r}>
                  {Array.from({ length: puzzle.cols }).map((_, c) => (
                    <Cell key={`${r}-${c}`} r={r} c={c} />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm opacity-70">Selected: <span className="font-semibold">{currentWord?.number}A</span></div>
              <div className="text-sm opacity-70">Length: {currentWord?.answer.length}</div>
            </div>
            <div className="mt-2 font-medium">{currentWord?.clue}</div>
            <form onSubmit={submitGuess} className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={currentWord?.answer.length || 20}
                placeholder="Type your answer"
                className="flex-1 px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button className="px-4 py-2 rounded-xl bg-black text-white">Submit</button>
            </form>
          </div>

          <div className="rounded-2xl bg-white shadow p-4">
            <h3 className="text-sm font-semibold mb-2">Across</h3>
            <div className="space-y-2">
              {puzzle.words.map(w => (
                <WordItem key={w.number} w={w} />
              ))}
            </div>
          </div>
        </section>

        {/* Right: Chat */}
        <section className="rounded-2xl bg-white shadow p-4 flex flex-col">
          <h3 className="text-sm font-semibold">Live Chat</h3>
          <div className="mt-3 flex-1 overflow-auto space-y-2 pr-1">
            {chat.map((m, i) => (
              <div key={i} className={`max-w-[85%] p-3 rounded-2xl shadow ${m.who === "me" ? "ml-auto bg-zinc-900 text-white" : "bg-zinc-100"}`}>
                <div className="text-xs opacity-60 mb-1">{m.who === "me" ? "You" : "Bot"}</div>
                <div className="whitespace-pre-wrap leading-snug">{m.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Chat or type an answer, then press Send or Submit"
              className="flex-1 px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button onClick={() => { sendChat(input); setInput(""); }} className="px-4 py-2 rounded-xl bg-black text-white">Send</button>
          </div>
          <p className="text-xs opacity-60 mt-2">Tip: Use the input above to chat. Use the input on the left to submit answers.</p>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-8 opacity-60 text-xs">Made with ⚡ snark & React. Swap in your own LLM for the bot’s brain.</footer>

      {/* Game Over Modal */}
      <Modal open={gameOver} onClose={() => {}}>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Game Over</h2>
          <p className="mt-2 opacity-70">Time's up or all words solved.</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <ScoreBadge label="You" score={userScore} highlight={userScore >= botScore} />
            <ScoreBadge label="Bot" score={botScore} highlight={botScore > userScore} />
          </div>
          <div className="mt-4 text-lg font-semibold">
            {winner === "Tie" ? "It's a tie!" : winner ? `${winner} win${winner === "You" ? "" : "s"}!` : null}
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={newGame} className="px-5 py-2 rounded-xl bg-black text-white">Start New Game</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
