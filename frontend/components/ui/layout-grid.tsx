"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Card = {
  id: number;
  content: JSX.Element | React.ReactNode | string;
  className: string;
  icon: JSX.Element;
  title: string;
  subtitle: string;
};

export const LayoutGrid = ({ cards }: { cards: Card[] }) => {
  const [selected, setSelected] = useState<Card | null>(null);
  const [lastSelected, setLastSelected] = useState<Card | null>(null);

  const handleClick = (card: Card) => {
    setLastSelected(selected);
    setSelected(card);
  };

  const handleOutsideClick = () => {
    setLastSelected(selected);
    setSelected(null);
  };

  return (
    <div className="w-full h-full p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto gap-6 relative min-h-[300px]">
      {cards.map((card, i) => (
        <div key={i} className={cn(card.className, "h-[200px] lg:h-[250px]")}>
          <motion.div
            onClick={() => handleClick(card)}
            className={cn(
              "relative overflow-hidden transition-all duration-300 group",
              selected?.id === card.id
                ? "rounded-2xl cursor-default absolute z-50 flex justify-center items-center flex-col shadow-[0_0_50px_rgba(6,182,212,0.3)] h-[300px] md:h-[400px] w-[90%] md:w-[600px] left-0 right-0 top-0 bottom-0 m-auto bg-slate-900 border-2 border-cyan-500/50"
                : lastSelected?.id === card.id
                ? "z-40 bg-slate-900/40 rounded-xl h-full w-full cursor-pointer hover:bg-slate-800/80 border border-cyan-500/20 hover:border-cyan-400/60 shadow-lg backdrop-blur-md"
                : "bg-slate-900/40 rounded-xl h-full w-full cursor-pointer hover:bg-slate-800/80 border border-cyan-500/20 hover:border-cyan-400/60 shadow-lg backdrop-blur-md"
            )}
            layoutId={`card-${card.id}`}
          >
            {selected?.id === card.id && <SelectedCard selected={selected} />}
            <IconComponent card={card} isSelected={selected?.id === card.id} />
          </motion.div>
        </div>
      ))}
      <motion.div
        onClick={handleOutsideClick}
        className={cn(
          "fixed inset-0 h-full w-full bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity",
          selected?.id ? "pointer-events-auto" : "pointer-events-none"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: selected?.id ? 1 : 0 }}
        exit={{ opacity: 0 }}
      />
    </div>
  );
};

const IconComponent = ({ card, isSelected }: { card: Card, isSelected: boolean }) => {
  return (
    <motion.div
      layoutId={`icon-${card.id}-icon`}
      className={cn(
        "absolute inset-0 h-full w-full flex flex-col items-center justify-center gap-4 transition-opacity",
        isSelected ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      )}
    >
      <div className="text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-transform duration-300 group-hover:scale-110 group-hover:text-cyan-300">
        {card.icon}
      </div>
      <div className="text-center px-4">
        <h3 className="text-3xl font-bold text-slate-50 transition-colors group-hover:text-cyan-50">{card.title}</h3>
        <p className="text-sm font-medium text-slate-400 mt-2">{card.subtitle}</p>
      </div>
    </motion.div>
  );
};

const SelectedCard = ({ selected }: { selected: Card | null }) => {
  return (
    <div className="bg-transparent h-full w-full flex flex-col justify-center items-center rounded-2xl relative z-[60] p-6 lg:p-10 text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 h-full w-full bg-slate-900 rounded-2xl -z-10"
      />
      <motion.div
        layoutId={`content-${selected?.id}`}
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: 20,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
          delay: 0.1,
        }}
        className="relative z-[70] flex flex-col items-center max-w-lg w-full"
      >
        <div className="text-cyan-400 mb-6 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-[1.5]">
          {selected?.icon}
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-slate-50 mb-4">{selected?.title}</h2>
        <div className="space-y-4">
          <p className="text-cyan-200/60 uppercase tracking-widest text-xs font-bold">{selected?.subtitle}</p>
          <div className="text-slate-300 text-base md:text-lg leading-relaxed">
            {selected?.content}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
