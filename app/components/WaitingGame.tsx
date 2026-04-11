"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GameState = "ready" | "playing" | "gameover";

interface Props {
  active: boolean;
  size?: "small" | "large";
}

const GRAVITY = 0.62;
const JUMP_POWER = -8.6;
const GROUND_Y = 96;
const PLAYER_X = 36;
const PLAYER_SIZE = 20;
const OBSTACLE_WIDTH = 14;

export default function WaitingGame({ active, size = "small" }: Props) {
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
  const large = size === "large";
  const stageHeight = large ? 228 : 132;
  const scaledGroundY = large ? 170 : GROUND_Y;
  const scaledPlayerX = large ? 68 : PLAYER_X;
  const scaledPlayerSize = large ? 34 : PLAYER_SIZE;
  const scaledObstacleWidth = large ? 24 : OBSTACLE_WIDTH;
  const cloudScale = large ? 1.7 : 1;

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

      if (nextX < -scaledObstacleWidth) {
        nextX = 260 + Math.random() * 90;
        scoreCarryRef.current += 1;
        scoreRef.current = scoreCarryRef.current;
        setScore(scoreCarryRef.current);
      }

      obstacleXRef.current = nextX;
      setObstacleX(nextX);

      const currentObstacleHeight = 22 + (scoreRef.current % 3) * 6;
      const playerBottom = scaledGroundY - playerYRef.current;
      const playerTop = playerBottom - scaledPlayerSize;
      const obstacleLeft = nextX;
      const obstacleRight = nextX + scaledObstacleWidth;
      const obstacleTop = scaledGroundY - currentObstacleHeight;
      const hitX = scaledPlayerX + scaledPlayerSize - 4 >= obstacleLeft && scaledPlayerX + 4 <= obstacleRight;
      const hitY = playerBottom >= obstacleTop && playerTop <= scaledGroundY;

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
  }, [active, gameState, scaledGroundY, scaledObstacleWidth, scaledPlayerSize, scaledPlayerX]);

  return (
    <div
      style={{
        border: "3px solid rgba(49, 64, 95, 0.16)",
        borderRadius: large ? 24 : 18,
        background: "linear-gradient(180deg, #e4f8ff 0%, #fdf8ef 100%)",
        boxShadow: "0 6px 0 rgba(49,64,95,0.08)",
        padding: large ? 18 : 12,
        width: "100%",
        maxWidth: large ? 760 : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: large ? 12 : 8, gap: 12 }}>
        <div>
          <div style={{ fontSize: large ? 13 : 11, fontWeight: 900, color: "#7f57f1", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Waiting Game
          </div>
          <div style={{ fontSize: large ? 14 : 12, color: "#51617c", fontWeight: 700 }}>
            `Space` でジャンプ
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: large ? 14 : 11, fontWeight: 900, color: "#23324f" }}>
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
          borderRadius: large ? 14 : 12,
          background: active ? "#fff8f1" : "#f6f2ea",
          color: "#23324f",
          padding: large ? "10px 12px" : "8px 10px",
          fontSize: large ? 14 : 12,
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
          height: stageHeight,
          overflow: "hidden",
          borderRadius: large ? 18 : 14,
          border: "3px solid #31405f",
          background: "linear-gradient(180deg, #7ad8ff 0%, #c7f1ff 58%, #d9f0bf 58%, #d9f0bf 100%)",
          boxShadow: "inset 0 -8px 0 rgba(69, 120, 42, 0.12)",
        }}
      >
        <div style={{ position: "absolute", top: large ? 22 : 14, left: large ? 58 : 34, width: 42 * cloudScale, height: 12 * cloudScale, borderRadius: 999, background: "#fff", boxShadow: `${18 * cloudScale}px 0 0 #fff, ${9 * cloudScale}px ${-6 * cloudScale}px 0 #fff` }} />
        <div style={{ position: "absolute", top: large ? 38 : 24, right: large ? 72 : 40, width: 32 * cloudScale, height: 10 * cloudScale, borderRadius: 999, background: "#fff", boxShadow: `${16 * cloudScale}px 0 0 #fff` }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: large ? 28 : 18, height: large ? 26 : 18, background: "linear-gradient(180deg, #4eb752 0%, #37983b 100%)", borderTop: "3px solid #87df70" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: large ? 30 : 20, background: "linear-gradient(180deg, #d38a4a 0%, #b86a35 100%)", borderTop: "3px solid #f5b36c" }} />
        {large && <div style={{ position: "absolute", left: 180, bottom: 58, width: 46, height: 86, borderRadius: "16px 16px 0 0", background: "#35b34f", border: "4px solid #31405f", boxShadow: "inset 0 0 0 4px #71dd78" }} />}
        {large && <div style={{ position: "absolute", left: 174, bottom: 128, width: 58, height: 24, borderRadius: 999, background: "#35b34f", border: "4px solid #31405f", boxShadow: "inset 0 0 0 4px #71dd78" }} />}
        {large && <div style={{ position: "absolute", right: 120, bottom: 54, width: 32, height: 32, background: "#ffd558", border: "4px solid #31405f", boxShadow: "inset 0 0 0 4px #ffe188" }} />}
        {large && <div style={{ position: "absolute", right: 86, bottom: 54, width: 32, height: 32, background: "#d38a4a", border: "4px solid #31405f", boxShadow: "inset 0 0 0 4px #e0a36d" }} />}
        {large && <div style={{ position: "absolute", right: 154, bottom: 54, width: 32, height: 32, background: "#d38a4a", border: "4px solid #31405f", boxShadow: "inset 0 0 0 4px #e0a36d" }} />}

        <div
          style={{
            position: "absolute",
            left: scaledPlayerX,
            bottom: scaledGroundY - playerY - scaledPlayerSize,
            width: scaledPlayerSize,
            height: scaledPlayerSize,
            borderRadius: 4,
            background: "linear-gradient(180deg, #ff6e62 0%, #ff9b90 100%)",
            border: "3px solid #31405f",
            boxShadow: playerY > 0 ? "0 6px 0 rgba(49,64,95,0.10)" : "0 4px 0 rgba(49,64,95,0.14)",
          }}
        >
          <div style={{ position: "absolute", left: large ? 7 : 4, top: large ? 7 : 4, width: large ? 12 : 8, height: large ? 12 : 8, background: "#fff8f1", borderRadius: 2 }} />
        </div>

        <div
          style={{
            position: "absolute",
            left: obstacleX,
            bottom: scaledGroundY - obstacleHeight,
            width: scaledObstacleWidth,
            height: obstacleHeight,
            borderRadius: "6px 6px 0 0",
            background: "linear-gradient(180deg, #7bd95d 0%, #2fa84f 100%)",
            border: "3px solid #31405f",
            boxSizing: "border-box",
          }}
        />

        {!active && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,248,241,0.68)", fontSize: large ? 14 : 12, fontWeight: 900, color: "#51617c" }}>
            実行中だけ遊べます
          </div>
        )}

        {active && gameState === "ready" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: large ? 16 : 12, fontWeight: 900, color: "#23324f" }}>
            Spaceでスタート
          </div>
        )}

        {active && gameState === "gameover" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,248,241,0.45)", color: "#23324f" }}>
            <div style={{ fontSize: large ? 18 : 13, fontWeight: 900, marginBottom: 4 }}>Game Over</div>
            <div style={{ fontSize: large ? 13 : 11, fontWeight: 800 }}>Spaceでもう一回</div>
          </div>
        )}
      </div>
    </div>
  );
}
