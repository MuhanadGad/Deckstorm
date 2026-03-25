import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import BoardRow from "./board-row";
import DeckStack from "./deck-stack";
import GameCardFace, { type GameCardData } from "./game-card-face";
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

type DragState = {
  card: GameCardData;
  cardId: string;
  height: number;
  overPlayerField: boolean;
  pointerOffsetX: number;
  pointerOffsetY: number;
  rotation: number;
  targetIndex: number | null;
  width: number;
  x: number;
  y: number;
};

const PLAYER_STARTING_HAND: GameCardData[] = [
  {
    attack: 4,
    body: "On play: Draw 1 card. If this is your second action, gain 1 energy.",
    cost: 2,
    defense: 3,
    id: "sunsteel-scout",
    title: "Scout",
    type: "Vanguard",
  },
  {
    attack: 3,
    body: "Guard. Nearby allies in the FIELD gain +1 defense until your next turn.",
    cost: 3,
    defense: 5,
    id: "bastion-herald",
    title: "Herald",
    type: "Sentinel",
  },
  {
    attack: 5,
    body: "Quick strike. Deal 2 bonus damage if the target already took damage this round.",
    cost: 4,
    defense: 2,
    id: "ashfall-duelist",
    title: "Duelist",
    type: "Skirmisher",
  },
  {
    attack: 2,
    body: "Create a Spark in your HAND. Sparks cost 1 less and cycle when played.",
    cost: 1,
    defense: 4,
    id: "ember-scribe",
    title: "Scribe",
    type: "Invoker",
  },
  {
    attack: 6,
    body: "Heavy. At end of turn, fortify the leftmost ally on the FIELD for 2.",
    cost: 5,
    defense: 6,
    id: "ironroot-colossus",
    title: "Colossus",
    type: "Titan",
  },
  {
    attack: 1,
    body: "When discarded, return this to your HAND with +2 attack next turn.",
    cost: 2,
    defense: 1,
    id: "echo-wisp",
    title: "Wisp",
    type: "Spirit",
  },
];

function buildFlightTransform(card: FlyingCard) {
  const x = card.phase === "moving" ? card.toX : card.fromX;
  const y = card.phase === "moving" ? card.toY : card.fromY;
  const rotation = card.phase === "moving" ? card.toRotation : card.fromRotation;
  const flip = card.mirrored ? " scaleY(-1)" : "";

  return `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)${flip}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createEmptyField() {
  return Array.from({ length: BOARD_SLOT_COUNT }, () => null as GameCardData | null);
}

export default function CardGameHud() {
  const [opponentHandCount, setOpponentHandCount] = useState(0);
  const [playerHandCards, setPlayerHandCards] = useState<GameCardData[]>([]);
  const [playerFieldCards, setPlayerFieldCards] = useState<(GameCardData | null)[]>(
    createEmptyField,
  );
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [flyingCards, setFlyingCards] = useState<FlyingCard[]>([]);

  const hudRef = useRef<HTMLElement | null>(null);
  const opponentDeckRef = useRef<HTMLDivElement | null>(null);
  const playerDeckRef = useRef<HTMLDivElement | null>(null);
  const opponentHandRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playerHandRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playerFieldZoneRef = useRef<HTMLDivElement | null>(null);
  const playerFieldRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playerFieldCardsRef = useRef<(GameCardData | null)[]>(createEmptyField());
  const timeoutIdsRef = useRef<number[]>([]);
  const animationFrameIdsRef = useRef<number[]>([]);
  const hasStartedRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const activeDrawCounts = flyingCards.reduce(
    (counts, card) => {
      counts[card.owner] += 1;
      return counts;
    },
    { opponent: 0, player: 0 },
  );

  const playerHandCount = playerHandCards.length;
  const playerFieldCount = playerFieldCards.reduce(
    (count, card) => count + (card ? 1 : 0),
    0,
  );
  const opponentDeckCount = DECK_SIZE - opponentHandCount - activeDrawCounts.opponent;
  const playerDeckCount =
    DECK_SIZE - playerHandCount - playerFieldCount - activeDrawCounts.player;

  const syncDragState = (nextDragState: DragState | null) => {
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
  };

  const getPlayerFieldDropState = (clientX: number, clientY: number) => {
    const playerFieldZoneBounds = playerFieldZoneRef.current?.getBoundingClientRect();

    if (!playerFieldZoneBounds) {
      return { overPlayerField: false, targetIndex: null as number | null };
    }

    const dropPadding = 28;
    const overPlayerField =
      clientX >= playerFieldZoneBounds.left - dropPadding &&
      clientX <= playerFieldZoneBounds.right + dropPadding &&
      clientY >= playerFieldZoneBounds.top - dropPadding &&
      clientY <= playerFieldZoneBounds.bottom + dropPadding;

    if (!overPlayerField) {
      return { overPlayerField: false, targetIndex: null as number | null };
    }

    let targetIndex: number | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    playerFieldRefs.current.forEach((slotNode, index) => {
      if (!slotNode || playerFieldCardsRef.current[index]) {
        return;
      }

      const slotBounds = slotNode.getBoundingClientRect();
      const centerX = slotBounds.left + slotBounds.width / 2;
      const centerY = slotBounds.top + slotBounds.height / 2;
      const distance = (centerX - clientX) ** 2 + (centerY - clientY) ** 2;

      if (distance < closestDistance) {
        closestDistance = distance;
        targetIndex = index;
      }
    });

    return { overPlayerField, targetIndex };
  };

  const handlePlayerCardPointerDown = (
    card: GameCardData,
    _index: number,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if ((event.pointerType === "mouse" && event.button !== 0) || dragStateRef.current) {
      return;
    }

    const hudBounds = hudRef.current?.getBoundingClientRect();
    const cardBounds = event.currentTarget.getBoundingClientRect();

    if (!hudBounds) {
      return;
    }

    event.preventDefault();

    const pointerOffsetX = event.clientX - cardBounds.left;
    const pointerOffsetY = event.clientY - cardBounds.top;

    const updateDragPosition = (clientX: number, clientY: number) => {
      const dropState = getPlayerFieldDropState(clientX, clientY);

      syncDragState({
        card,
        cardId: card.id,
        height: cardBounds.height,
        overPlayerField: dropState.overPlayerField,
        pointerOffsetX,
        pointerOffsetY,
        rotation: clamp((clientX - (cardBounds.left + cardBounds.width / 2)) / 22, -9, 9),
        targetIndex: dropState.targetIndex,
        width: cardBounds.width,
        x: clientX - hudBounds.left - pointerOffsetX,
        y: clientY - hudBounds.top - pointerOffsetY,
      });
    };

    const clearListeners = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("blur", handlePointerCancel);
      document.body.style.removeProperty("user-select");
      dragCleanupRef.current = null;
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      updateDragPosition(moveEvent.clientX, moveEvent.clientY);
    };

    const handlePointerCancel = () => {
      clearListeners();
      syncDragState(null);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const dropState = getPlayerFieldDropState(upEvent.clientX, upEvent.clientY);
      const canPlayCard =
        dropState.targetIndex !== null &&
        !playerFieldCardsRef.current[dropState.targetIndex];

      clearListeners();

      if (canPlayCard) {
        setPlayerHandCards((currentCards) =>
          currentCards.filter((currentCard) => currentCard.id !== card.id),
        );
        setPlayerFieldCards((currentCards) => {
          const nextCards = [...currentCards];
          nextCards[dropState.targetIndex!] = card;
          return nextCards;
        });
      }

      syncDragState(null);
    };

    dragCleanupRef.current?.();
    dragCleanupRef.current = clearListeners;
    document.body.style.setProperty("user-select", "none");
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("blur", handlePointerCancel);

    updateDragPosition(event.clientX, event.clientY);
  };

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
    playerFieldCardsRef.current = playerFieldCards;
  }, [playerFieldCards]);

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
      dragCleanupRef.current?.();
    };

    const settleCard = (owner: Side) => {
      if (owner === "opponent") {
        setOpponentHandCount((currentCount) => Math.min(currentCount + 1, STARTING_HAND_COUNT));
        return;
      }

      setPlayerHandCards((currentCards) => {
        const nextCard = PLAYER_STARTING_HAND[currentCards.length];
        return nextCard ? [...currentCards, nextCard] : currentCards;
      });
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
        setPlayerHandCards(PLAYER_STARTING_HAND.slice(0, STARTING_HAND_COUNT));
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
              className="card-slot card-slot-hidden absolute left-0 top-0 rounded-[1rem] shadow-[0_18px_30px_rgba(0,0,0,0.34)] will-change-transform"
              style={style}
            />
          );
        })}
      </div>
      {dragState ? (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          <div
            aria-hidden
            className="absolute left-0 top-0 overflow-hidden rounded-[1.1rem] shadow-[0_36px_70px_rgba(0,0,0,0.34)]"
            style={{
              height: dragState.height,
              transform: `translate3d(${dragState.x}px, ${dragState.y}px, 0) rotate(${dragState.rotation}deg) scale(1.04)`,
              width: dragState.width,
            }}
          >
            <div className="card-slot card-slot-faceup h-full w-full overflow-hidden rounded-[inherit]">
              <GameCardFace card={dragState.card} />
            </div>
          </div>
        </div>
      ) : null}

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

            <div
              ref={playerFieldZoneRef}
              className={cn(
                "grid gap-2 rounded-[1.55rem] border border-white/10 bg-black/18 px-2.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-3.5 sm:py-3.5 lg:px-4 lg:py-4",
                dragState?.overPlayerField && "player-field-zone-active",
              )}
            >
              <BoardRow
                cards={playerFieldCards}
                dropActive={Boolean(dragState)}
                highlightedIndex={dragState?.targetIndex ?? null}
                slotCount={BOARD_SLOT_COUNT}
                size="compact"
                slotRefs={playerFieldRefs}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-end justify-center gap-3 sm:gap-4">
            <HandRow
              cards={playerHandCards}
              cardCount={playerHandCount}
              dockHoverEnabled={!dragState}
              draggedCardId={dragState?.cardId ?? null}
              onCardPointerDown={handlePlayerCardPointerDown}
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
