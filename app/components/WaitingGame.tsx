"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GameState = "ready" | "playing" | "gameover";

interface Props {
  active: boolean;
}

const GRAVITY = 0.62;
const JUMP_POWER = -8.6;
const GROUND_Y = 96;
const PLAYER_X = 36;
const PLAYER_SIZE = 20;
const OBSTACLE_WIDTH = 14;

export default function WaitingGame({ active }: Props) {
  const [gameState, setGameState] = useState<GameState>("ready");
  const [playerY, setPlayerY] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [obstacleX, setObstacleX] = useState(260);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const rafRef = useRef<number | null>(null);
  const scoreCarryRef = useRef(0);
  const playerYRef = useRef(0);
  const velocityYRef = useRef(0);
  const obstacleXRef = useRef(260);
  const scoreRef = useRef(0);
  const bestScoreRef = useRef(0);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("ai-company-waiting-game-best") ?? "0");
      if (Number.isFinite(saved) && saved > 0) {
        setBestScore(saved);
        bestScoreRef.current = saved;
      }
    } catch {
      // ignore
    }
  }, []);

  const obstacleHeight = useMemo(() => 22 + (score % 3) * 6, [score]);

  const resetGame = () => {
    setGameState(active ? "playing" : "ready");
    setPlayerY(0);
    setVelocityY(0);
    setObstacleX(260);
    setScore(0);
    playerYRef.current = 0;
    velocityYRef.current = 0;
    obstacleXRef.current = 260;
    scoreRef.current = 0;
    scoreCarryRef.current = 0;
  };

  const jump = () => {
    if (!active) return;
    if (gameState === "gameover") {
      resetGame();
      return;
    }
    if (gameState === "ready") {
      setGameState("playing");
      setVelocityY(JUMP_POWER);
      velocityYRef.current = JUMP_POWER;
      return;
    }
    if (playerYRef.current === 0) {
      setVelocityY(JUMP_POWER);
      velocityYRef.current = JUMP_POWER;
    }
  };

  useEffect(() => {
    if (!active) {
      setGameState("ready");
      setPlayerY(0);
      setVelocityY(0);
      setObstacleX(260);
      setScore(0);
      playerYRef.current = 0;
      velocityYRef.current = 0;
      obstacleXRef.current = 260;
      scoreRef.current = 0;
      scoreCarryRef.current = 0;
      return;
    }
    resetGame();
  }, [active]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      jump();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, gameState]);

  useEffect(() => {
    if (!active || gameState !== "playing") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    let last = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(1.8, (now - last) / 16.67);
      last = now;

      const nextVelocity = velocityYRef.current + GRAVITY * delta;
      const nextY = Math.max(0, playerYRef.current - nextVelocity * delta);
      const groundedVelocity = nextY === 0 && nextVelocity > 0 ? 0 : nextVelocity;
      playerYRef.current = nextY;
      velocityYRef.current = groundedVelocity;
      setPlayerY(nextY);
      setVelocityY(groundedVelocity);

      const speed = (4.8 + Math.min(scoreRef.current, 20) * 0.12) * delta;
      let nextX = obstacleXRef.current - speed;

      if (nextX < -OBSTACLE_WIDTH) {
        nextX = 260 + Math.random() * 90;
        scoreCarryRef.current += 1;
        scoreRef.current = scoreCarryRef.current;
        setScore(scoreCarryRef.current);
      }

      obstacleXRef.current = nextX;
      setObstacleX(nextX);

      const currentObstacleHeight = 22 + (scoreRef.current % 3) * 6;
      const playerBottom = GROUND_Y - playerYRef.current;
      const playerTop = playerBottom - PLAYER_SIZE;
      const obstacleLeft = nextX;
      const obstacleRight = nextX + OBSTACLE_WIDTH;
      const obstacleTop = GROUND_Y - currentObstacleHeight;
      const hitX = PLAYER_X + PLAYER_SIZE - 4 >= obstacleLeft && PLAYER_X + 4 <= obstacleRight;
      const hitY = playerBottom >= obstacleTop && playerTop <= GROUND_Y;

      if (hitX && hitY) {
        setGameState("gameover");
        const nextBest = Math.max(bestScoreRef.current, scoreCarryRef.current);
        bestScoreRef.current = nextBest;
        setBestScore(nextBest);
        try {
          localStorage.setItem("ai-company-waiting-game-best", String(nextBest));
        } catch {
          // ignore
        }
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [active, gameState]);

  return (
    <div
      style={{
        border: "3px solid rgba(49, 64, 95, 0.16)",
        borderRadius: 18,
        background: "linear-gradient(180deg, #e4f8ff 0%, #fdf8ef 100%)",
        boxShadow: "0 6px 0 rgba(49,64,95,0.08)",
        padding: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#7f57f1", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Waiting Game
          </div>
          <div style={{ fontSize: 12, color: "#51617c", fontWeight: 700 }}>
            `Space` でジャンプ
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, fontWeight: 900, color: "#23324f" }}>
          <div>Score {score}</div>
          <div style={{ color: "#f97316" }}>Best {bestScore}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={jump}
        style={{
          width: "100%",
          marginBottom: 10,
          border: "3px solid #31405f",
          borderRadius: 12,
          background: active ? "#fff8f1" : "#f6f2ea",
          color: "#23324f",
          padding: "8px 10px",
          fontSize: 12,
          fontWeight: 900,
          cursor: active ? "pointer" : "not-allowed",
          boxShadow: "0 4px 0 rgba(49,64,95,0.08)",
        }}
        disabled={!active}
      >
        {gameState === "gameover" ? "もう一回遊ぶ" : "ジャンプする"}
      </button>

      <div
        style={{
          position: "relative",
          height: 132,
          overflow: "hidden",
          borderRadius: 14,
          border: "3px solid #31405f",
          background: "linear-gradient(180deg, #7ad8ff 0%, #c7f1ff 58%, #d9f0bf 58%, #d9f0bf 100%)",
          boxShadow: "inset 0 -8px 0 rgba(69, 120, 42, 0.12)",
        }}
      >
        <div style={{ position: "absolute", top: 14, left: 34, width: 42, height: 12, borderRadius: 999, background: "#fff", boxShadow: "18px 0 0 #fff, 9px -6px 0 #fff" }} />
        <div style={{ position: "absolute", top: 24, right: 40, width: 32, height: 10, borderRadius: 999, background: "#fff", boxShadow: "16px 0 0 #fff" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 18, height: 18, background: "linear-gradient(180deg, #4eb752 0%, #37983b 100%)", borderTop: "3px solid #87df70" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 20, background: "linear-gradient(180deg, #d38a4a 0%, #b86a35 100%)", borderTop: "3px solid #f5b36c" }} />

        <div
          style={{
            position: "absolute",
            left: PLAYER_X,
            bottom: GROUND_Y - playerY - PLAYER_SIZE,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
            borderRadius: 4,
            background: "linear-gradient(180deg, #ff6e62 0%, #ff9b90 100%)",
            border: "3px solid #31405f",
            boxShadow: playerY > 0 ? "0 6px 0 rgba(49,64,95,0.10)" : "0 4px 0 rgba(49,64,95,0.14)",
          }}
        >
          <div style={{ position: "absolute", left: 4, top: 4, width: 8, height: 8, background: "#fff8f1", borderRadius: 2 }} />
        </div>

        <div
          style={{
            position: "absolute",
            left: obstacleX,
            bottom: GROUND_Y - obstacleHeight,
            width: OBSTACLE_WIDTH,
            height: obstacleHeight,
            borderRadius: "6px 6px 0 0",
            background: "linear-gradient(180deg, #7bd95d 0%, #2fa84f 100%)",
            border: "3px solid #31405f",
            boxSizing: "border-box",
          }}
        />

        {!active && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,248,241,0.68)", fontSize: 12, fontWeight: 900, color: "#51617c" }}>
            実行中だけ遊べます
          </div>
        )}

        {active && gameState === "ready" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#23324f" }}>
            Spaceでスタート
          </div>
        )}

        {active && gameState === "gameover" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,248,241,0.45)", color: "#23324f" }}>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 4 }}>Game Over</div>
            <div style={{ fontSize: 11, fontWeight: 800 }}>Spaceでもう一回</div>
          </div>
        )}
      </div>
    </div>
  );
}
