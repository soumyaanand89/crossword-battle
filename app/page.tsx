// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";

type Word = {
  id: string;
  number: number;
  clue: string;
  answer: string;
  positions: [number, number][];
  direction: "across" | "down";
};

const GRID_SIZE = 10;

const WORDS: Word[] = [
  { id: "1A", number: 1, clue: "Brain of the computer", answer: "CPU", positions: [[0,0],[0,1],[0,2]], direction: "across" },
  { id: "2A", number: 2, clue: "Temporary memory", answer: "RAM", positions: [[0,6],[0,7],[0,8]], direction: "across" },
  { id: "3A", number: 3, clue: "Remote data storage", answer: "CLOUD", positions: [[2,0],[2,1],[2,2],[2,3],[2,4]], direction: "across" },
  { id: "4A", number: 4, clue: "Directs internet traffic", answer: "ROUTER", positions: [[4,0],[4,1],[4,2],[4,3],[4,4],[4,5]], direction: "across" },
  { id: "5A", number: 5, clue: "Software on phone", answer: "APP", positions: [[6,0],[6,1],[6,2]], direction: "across" },
  { id: "6A", number: 6, clue: "Programming language & coffee", answer: "JAVA", positions: [[8,0],[8,1],[8,2],[8,3]], direction: "across" },
];

const buildEmptyGrid = (): (string | null)[][] => {
  const grid = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(null)
  );
  WORDS.forEach(w => {
    w.positions.forEach(([r, c]) => {
      grid[r][c] = ""; // playable cell
    });
  });
  return grid;
};

export default function Page() {
  const [grid, setGrid] = useState<(string | null)[][]>(buildEmptyGrid);
  const [solvedBy, setSolvedBy] = useState<Record<string, "player" | "ai">>({});
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [chat, setChat] = useState<{ sender: "player" | "ai"; text: string }[]>([
    { sender: "ai", text: "Greetings, competitor. I am AlphaCross. Algorithms primed. Let us commence." }
  ]);

  const isWordSolved = (g: (string | null)[][], w: Word) =>
    w.positions.every(([r, c], i) => g[r][c]?.toUpperCase() === w.answer[i]);

  const handleInput = (row: number, col: number, val: string) => {
    const letter = val.toUpperCase().slice(-1);
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = letter;
    setGrid(newGrid);

    const newSolved: Record<string, "player" | "ai"> = { ...solvedBy };
    WORDS.forEach(w => {
      if (!newSolved[w.id] && isWordSolved(newGrid, w)) {
        newSolved[w.id] = "player";
        setPlayerScore(s => s + w.answer.length);
        setChat(c => [...c, { sender: "player", text: `I solved ${w.answer}!` }]);
      }
    });
    setSolvedBy(newSolved);
  };

  useEffect(() => {
    const unsolved = WORDS.filter(w => !solvedBy[w.id]);
    if (unsolved.length === 0) return;

    const timer = setTimeout(() => {
      const pick = unsolved[Math.floor(Math.random() * unsolved.length)];
      const newGrid = grid.map(r => [...r]);
      pick.positions.forEach(([r, c], i) => {
        newGrid[r][c] = pick.answer[i];
      });
      setGrid(newGrid);

      const newSolved: Record<string, "player" | "ai"> = { ...solvedBy, [pick.id]: "ai" };
      setSolvedBy(newSolved);
      setAiScore(s => s + pick.answer.length);
      setChat(c => [...c, { sender: "ai", text: `I claim ${pick.answer}.` }]);
    }, 6000);

    return () => clearTimeout(timer);
  }, [grid, solvedBy]);

  // Numbering for clue starts
  const numberMap: Record<string, number> = {};
  WORDS.forEach(w => {
    const [r, c] = w.positions[0];
    numberMap[`${r}-${c}`] = w.number;
  });

  return (
    <div className="min-h-screen p-6 flex flex-col items-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-2">Crossword Battle Arena</h1>
      <p className="mb-4 text-gray-600">Compete against an AI in a real-time crossword challenge!</p>

      {/* Scoreboard */}
      <div className="flex gap-12 mb-6">
        <div className="px-6 py-2 bg-gray-800 text-white rounded-lg">PLAYER {playerScore}</div>
        <div className="px-6 py-2 bg-gray-800 text-white rounded-lg">AI OPPONENT {aiScore}</div>
      </div>

      {/* Grid */}
      <div className="bg-white shadow-lg p-2">
        <div className="grid gap-0.5 bg-black" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 40px)` }}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              if (cell === null) {
                return <div key={`${r}-${c}`} className="w-10 h-10 bg-black"></div>;
              }
              return (
                <div key={`${r}-${c}`} className="relative w-10 h-10 bg-white border border-gray-400 flex items-center justify-center">
                  {numberMap[`${r}-${c}`] && (
                    <span className="absolute top-0 left-0 text-[10px] p-0.5">{numberMap[`${r}-${c}`]}</span>
                  )}
                  <input
                    type="text"
                    maxLength={1}
                    value={cell || ""}
                    onChange={(e) => handleInput(r, c, e.target.value)}
                    className="w-full h-full text-center font-bold focus:outline-none"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clues */}
      <div className="flex gap-12 mt-6 w-full max-w-3xl">
        <div className="flex-1 bg-white shadow p-4 rounded">
          <h2 className="font-semibold mb-2">Across</h2>
          {WORDS.filter(w => w.direction === "across").map(w => (
            <div key={w.id} className={`${solvedBy[w.id] ? "line-through text-gray-400" : ""}`}>
              <span className="font-mono mr-2">{w.number}</span>{w.clue}
            </div>
          ))}
        </div>
        <div className="flex-1 bg-white shadow p-4 rounded">
          <h2 className="font-semibold mb-2">Down</h2>
          {WORDS.filter(w => w.direction === "down").map(w => (
            <div key={w.id} className={`${solvedBy[w.id] ? "line-through text-gray-400" : ""}`}>
              <span className="font-mono mr-2">{w.number}</span>{w.clue}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="mt-6 w-full max-w-3xl bg-white border rounded-lg p-4 h-40 overflow-y-auto">
        {chat.map((m, i) => (
          <div key={i} className={`mb-1 ${m.sender === "ai" ? "text-blue-700" : "text-green-700"}`}>
            <strong>{m.sender.toUpperCase()}:</strong> {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}
