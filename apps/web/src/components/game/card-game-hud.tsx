import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import BoardRow from "./board-row";
import DeckStack from "./deck-stack";
import HandRow from "./hand-row";
import PlayerProfile from "./player-profile";

const BOARD_SLOT_COUNT = 5;
const DECK_SIZE = 30;
const STARTING_HAND_COUNT = 6;
const DRAW_TRAVEL_MS = 520;
const DRAW_STAGGER_MS = 170;

type Side = "opponent" | "player";

type FlyingCard = {
  id: string;
  owner: Side;
  fromHeight: number;
  fromRotation: number;
  fromWidth: number;
  fromX: number;
  fromY: number;
  mirrored: boolean;
  phase: "idle" | "moving";
  toHeight: number;
  toRotation: number;
  toWidth: number;
  toX: number;
  toY: number;
};

function buildFlightTransform(card: FlyingCard) {
  const x = card.phase === "moving" ? card.toX : card.fromX;
  const y = card.phase === "moving" ? card.toY : card.fromY;
  const rotation = card.phase === "moving" ? card.toRotation : card.fromRotation;
  const flip = card.mirrored ? " scaleY(-1)" : "";

  return `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)${flip}`;
}

export default function CardGameHud() {
  const [opponentHandCount, setOpponentHandCount] = useState(0);
  const [playerHandCount, setPlayerHandCount] = useState(0);
  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);

  const hudRef = useRef<HTMLElement | null>(null);
  const opponentDeckRef = useRef<HTMLDivElement | null>(null);
  const playerDeckRef = useRef<HTMLDivElement | null>(null);
  const opponentHandRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playerHandRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timeoutIdsRef = useRef<number[]>([]);
  const animationFrameIdsRef = useRef<number[]>([]);
  const hasStartedRef = useRef(false);

  const activeDrawCounts = flyingCards.reduce(
    (counts, card) => {
      counts[card.owner] += 1;
      return counts;
    },
    { opponent: 0, player: 0 },
  );

  const opponentDeckCount = DECK_SIZE - opponentHandCount - activeDrawCounts.opponent;
  const playerDeckCount = DECK_SIZE - playerHandCount - activeDrawCounts.player;

  const createFlight = (owner: Side, index: number) => {
    const hudBounds = hudRef.current?.getBoundingClientRect();
    const deckNode = owner === "opponent" ? opponentDeckRef.current : playerDeckRef.current;
    const handNode = owner === "opponent" ? opponentHandRefs.current[index] : playerHandRefs.current[index];

    if (!hudBounds || !deckNode || !handNode) {
      return null;
    }

    const deckBounds = deckNode.getBoundingClientRect();
    const handBounds = handNode.getBoundingClientRect();
    const direction = owner === "opponent" ? 1 : -1;

    return {
      id: `${owner}-${index}-${performance.now()}`,
      owner,
      fromHeight: deckBounds.height,
      fromRotation: direction * (8 - index * 1.1),
      fromWidth: deckBounds.width,
      fromX: deckBounds.left - hudBounds.left,
      fromY: deckBounds.top - hudBounds.top,
      mirrored: owner === "opponent",
      phase: "idle" as const,
      toHeight: handBounds.height,
      toRotation: 0,
      toWidth: handBounds.width,
      toX: handBounds.left - hudBounds.left,
      toY: handBounds.top - hudBounds.top,
    };
  };

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const clearScheduledWork = () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      animationFrameIdsRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId));
      timeoutIdsRef.current = [];
      animationFrameIdsRef.current = [];
    };

    const settleCard = (owner: Side) => {
      if (owner === "opponent") {
        setOpponentHandCount((currentCount) => Math.min(currentCount + 1, STARTING_HAND_COUNT));
        return;
      }

      setPlayerHandCount((currentCount) => Math.min(currentCount + 1, STARTING_HAND_COUNT));
    };

    const launchDraw = (owner: Side, index: number) => {
      const flight = createFlight(owner, index);

      if (!flight) {
        settleCard(owner);
        return;
      }

      setFlyingCards((currentCards) => [...currentCards, flight]);

      const frameId = window.requestAnimationFrame(() => {
        setFlyingCards((currentCards) =>
          currentCards.map((card) =>
            card.id === flight.id
              ? {
                  ...card,
                  phase: "moving",
                }
              : card,
          ),
        );
      });
      animationFrameIdsRef.current.push(frameId);

      const settleTimeoutId = window.setTimeout(() => {
        setFlyingCards((currentCards) => currentCards.filter((card) => card.id !== flight.id));
        settleCard(owner);
      }, DRAW_TRAVEL_MS);
      timeoutIdsRef.current.push(settleTimeoutId);
    };

    const startDeal = () => {
      const opponentSlotsReady = opponentHandRefs.current
        .slice(0, STARTING_HAND_COUNT)
        .every(Boolean);
      const playerSlotsReady = playerHandRefs.current.slice(0, STARTING_HAND_COUNT).every(Boolean);

      if (
        !hudRef.current ||
        !opponentDeckRef.current ||
        !playerDeckRef.current ||
        !opponentSlotsReady ||
        !playerSlotsReady
      ) {
        const retryFrameId = window.requestAnimationFrame(startDeal);
        animationFrameIdsRef.current.push(retryFrameId);
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setOpponentHandCount(STARTING_HAND_COUNT);
        setPlayerHandCount(STARTING_HAND_COUNT);
        return;
      }

      for (let index = 0; index < STARTING_HAND_COUNT; index += 1) {
        const opponentTimeoutId = window.setTimeout(() => {
          launchDraw("opponent", index);
        }, index * DRAW_STAGGER_MS);
        timeoutIdsRef.current.push(opponentTimeoutId);

        const playerTimeoutId = window.setTimeout(() => {
          launchDraw("player", index);
        }, index * DRAW_STAGGER_MS + DRAW_STAGGER_MS / 2);
        timeoutIdsRef.current.push(playerTimeoutId);
      }
    };

    const initialFrameId = window.requestAnimationFrame(startDeal);
    animationFrameIdsRef.current.push(initialFrameId);

    return () => {
      clearScheduledWork();
    };
  }, []);

  return (
    <main
      ref={hudRef}
      className="table-felt relative isolate flex h-full items-center justify-center overflow-hidden px-2 py-2 sm:px-4 sm:py-4 lg:px-6 lg:py-5"
    >
      <div className="table-ring pointer-events-none absolute inset-3 rounded-[1.8rem] sm:inset-5 sm:rounded-[2rem] lg:inset-6" />
      <div className="pointer-events-none absolute inset-x-[14%] top-[7%] h-24 rounded-full bg-[radial-gradient(circle,_rgba(250,222,160,0.28),_rgba(250,222,160,0))] blur-3xl sm:h-28" />
      <div className="pointer-events-none absolute bottom-[5%] left-1/2 h-32 w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(102,203,174,0.18),_rgba(102,203,174,0))] blur-3xl sm:h-36 sm:w-[38rem]" />
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {flyingCards.map((card, index) => {
          const style: CSSProperties = {
            height: card.phase === "moving" ? card.toHeight : card.fromHeight,
            transform: buildFlightTransform(card),
            transition:
              "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), width 520ms cubic-bezier(0.22, 1, 0.36, 1), height 520ms cubic-bezier(0.22, 1, 0.36, 1)",
            width: card.phase === "moving" ? card.toWidth : card.fromWidth,
            zIndex: 30 + index,
          };

          return (
            <div
              key={card.id}
              aria-hidden
              className="card-slot card-slot-hidden absolute left-0 top-0 rounded-[1.4rem] shadow-[0_18px_30px_rgba(0,0,0,0.34)] will-change-transform"
              style={style}
            />
          );
        })}
      </div>

      <section className="relative z-10 grid h-full w-full gap-3 rounded-[1.8rem] border border-white/10 bg-black/20 px-3 py-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:px-4 sm:py-4 lg:grid-cols-[15rem_minmax(0,1fr)_15rem] lg:gap-6 lg:px-6 lg:py-5">
        <aside className="flex min-h-0 flex-col justify-between gap-3 rounded-[1.55rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)),linear-gradient(180deg,rgba(4,10,14,0.24),rgba(7,20,18,0.3))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-4">
          <PlayerProfile
            health={20}
            energy={6}
            initials="OP"
            name="Opponent"
            title="Shadow Binder"
          />
          <PlayerProfile
            health={18}
            energy={8}
            initials="YU"
            name="You"
            title="Sunsteel Captain"
          />
        </aside>

        <div className="relative grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-visible pt-8 sm:pt-10 lg:pt-12">
          <div className="pointer-events-none absolute inset-x-0 top-[-3.8rem] z-10 flex justify-center sm:top-[-4.7rem] lg:top-[-5.4rem]">
            <HandRow
              cardCount={opponentHandCount}
              slotCount={STARTING_HAND_COUNT}
              mirrored
              size="opponent"
              slotRefs={opponentHandRefs}
            />
          </div>

          <div className="mx-auto grid w-full max-w-[38rem] gap-3 self-center lg:max-w-[42rem] xl:max-w-[46rem]">
            <div className="grid gap-2 rounded-[1.55rem] border border-white/10 bg-black/18 px-2.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-3.5 sm:py-3.5 lg:px-4 lg:py-4">
              <BoardRow slotCount={BOARD_SLOT_COUNT} reversed size="compact" />
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-200/45 to-transparent" />

            <div className="grid gap-2 rounded-[1.55rem] border border-white/10 bg-black/18 px-2.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-3.5 sm:py-3.5 lg:px-4 lg:py-4">
              <BoardRow slotCount={BOARD_SLOT_COUNT} size="compact" />
            </div>
          </div>

          <div className="flex shrink-0 items-end justify-center gap-3 sm:gap-4">
            <HandRow
              cardCount={playerHandCount}
              slotCount={STARTING_HAND_COUNT}
              size="player"
              slotRefs={playerHandRefs}
            />
          </div>
        </div>

        <aside className="flex min-h-0 flex-col justify-between gap-3 rounded-[1.55rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)),linear-gradient(180deg,rgba(4,10,14,0.24),rgba(7,20,18,0.3))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-4">
          <DeckStack
            count={opponentDeckCount}
            label="Opponent Deck"
            cardRef={(node) => {
              opponentDeckRef.current = node;
            }}
          />
          <DeckStack
            count={playerDeckCount}
            label="Player Deck"
            cardRef={(node) => {
              playerDeckRef.current = node;
            }}
          />
        </aside>
      </section>
    </main>
  );
}
