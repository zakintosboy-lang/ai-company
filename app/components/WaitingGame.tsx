"use client";

import { useEffect, useRef, useState } from "react";

type GameState = "ready" | "playing" | "gameover";

interface Props {
  active: boolean;
  size?: "small" | "large";
  variant?: "card" | "embedded";
}

const GRAVITY = 0.62;
const JUMP_POWER = -8.6;
const PLAYER_X = 36;
const PLAYER_SIZE = 20;

export default function WaitingGame({ active, size = "small", variant = "card" }: Props) {
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

  const large = size === "large";
  const stageHeight = large ? 228 : 132;
  const surfaceOffset = large ? 28 : 18;
  const scaledPlayerX = large ? 68 : PLAYER_X;
  const scaledPlayerSize = large ? 34 : PLAYER_SIZE;
  const shellWidth = large ? 30 : 18;
  const goombaWidth = large ? 32 : 18;
  const blockWidth = large ? 28 : 16;
  const fireballWidth = large ? 22 : 14;
  const cloudScale = large ? 1.7 : 1;
  const embedded = variant === "embedded";
  const [obstacleType, setObstacleType] = useState<"shell" | "goomba" | "block" | "fireball">("shell");
  const obstacleTypeRef = useRef<"shell" | "goomba" | "block" | "fireball">("shell");

  const pickObstacleType = () => {
    const types: Array<"shell" | "goomba" | "block" | "fireball"> = ["shell", "goomba", "block", "fireball"];
    return types[Math.floor(Math.random() * types.length)];
  };

  const getObstacleMetrics = (type: "shell" | "goomba" | "block" | "fireball", currentScore: number) => {
    if (type === "shell") return { width: shellWidth, height: large ? 26 : 18 };
    if (type === "goomba") return { width: goombaWidth, height: large ? 28 : 20 };
    if (type === "block") return { width: blockWidth, height: large ? 30 : 22 };
    return { width: fireballWidth, height: large ? 20 : 14 + (currentScore % 2) * 3 };
  };

  const resetGame = () => {
    const nextType = pickObstacleType();
    setGameState(active ? "playing" : "ready");
    setPlayerY(0);
    setVelocityY(0);
    setObstacleX(260);
    setScore(0);
    setObstacleType(nextType);
    playerYRef.current = 0;
    velocityYRef.current = 0;
    obstacleXRef.current = 260;
    scoreRef.current = 0;
    scoreCarryRef.current = 0;
    obstacleTypeRef.current = nextType;
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
      setObstacleType("shell");
      playerYRef.current = 0;
      velocityYRef.current = 0;
      obstacleXRef.current = 260;
      scoreRef.current = 0;
      scoreCarryRef.current = 0;
      obstacleTypeRef.current = "shell";
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

      const metrics = getObstacleMetrics(obstacleTypeRef.current, scoreRef.current);

      if (nextX < -metrics.width) {
        nextX = 260 + Math.random() * 90;
        scoreCarryRef.current += 1;
        scoreRef.current = scoreCarryRef.current;
        setScore(scoreCarryRef.current);
        const nextType = pickObstacleType();
        obstacleTypeRef.current = nextType;
        setObstacleType(nextType);
      }

      obstacleXRef.current = nextX;
      setObstacleX(nextX);

      const currentMetrics = getObstacleMetrics(obstacleTypeRef.current, scoreRef.current);
      const obstacleLeft = nextX;
      const obstacleRight = nextX + currentMetrics.width;
      const hitX = scaledPlayerX + scaledPlayerSize - 4 >= obstacleLeft && scaledPlayerX + 4 <= obstacleRight;
      const hitY = playerYRef.current < currentMetrics.height - 2;

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
  }, [active, gameState, fireballWidth, goombaWidth, blockWidth, large, scaledPlayerSize, scaledPlayerX, shellWidth]);

  return (
    <div
      style={{
        border: "3px solid rgba(49, 64, 95, 0.16)",
        borderRadius: large ? 24 : 18,
        background: embedded ? "transparent" : "linear-gradient(180deg, #e4f8ff 0%, #fdf8ef 100%)",
        boxShadow: embedded ? "none" : "0 6px 0 rgba(49,64,95,0.08)",
        padding: embedded ? 0 : large ? 18 : 12,
        width: "100%",
        maxWidth: large ? 760 : "none",
        borderColor: embedded ? "transparent" : "rgba(49, 64, 95, 0.16)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: large ? 12 : 8, gap: 12, paddingInline: embedded ? 10 : 0 }}>
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
          background: embedded
            ? "linear-gradient(180deg, rgba(122,216,255,0.72) 0%, rgba(199,241,255,0.72) 58%, rgba(217,240,191,0.72) 58%, rgba(217,240,191,0.72) 100%)"
            : "linear-gradient(180deg, #7ad8ff 0%, #c7f1ff 58%, #d9f0bf 58%, #d9f0bf 100%)",
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
            bottom: surfaceOffset + playerY,
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
          style={{ position: "absolute", left: obstacleX, bottom: surfaceOffset }}
        >
          {obstacleType === "shell" && (
            <div
              style={{
                width: shellWidth,
                height: large ? 26 : 18,
                borderRadius: "999px 999px 8px 8px",
                background: "linear-gradient(180deg, #46c85c 0%, #2fa84f 100%)",
                border: "3px solid #31405f",
                boxSizing: "border-box",
              }}
            />
          )}
          {obstacleType === "goomba" && (
            <div
              style={{
                width: goombaWidth,
                height: large ? 28 : 20,
                borderRadius: "10px 10px 8px 8px",
                background: "linear-gradient(180deg, #a16a3d 0%, #7a4e2b 100%)",
                border: "3px solid #31405f",
                boxSizing: "border-box",
              }}
            />
          )}
          {obstacleType === "block" && (
            <div
              style={{
                width: blockWidth,
                height: large ? 30 : 22,
                background: "#d38a4a",
                border: "3px solid #31405f",
                boxShadow: "inset 0 0 0 3px #e8a66f",
                boxSizing: "border-box",
              }}
            />
          )}
          {obstacleType === "fireball" && (
            <div
              style={{
                width: fireballWidth,
                height: large ? 20 : 14,
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #ffe188 0%, #ff9f43 45%, #e2552f 100%)",
                border: "3px solid #31405f",
                boxSizing: "border-box",
              }}
            />
          )}
        </div>

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
