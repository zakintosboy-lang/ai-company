"use client";

import { useEffect, useRef, useState } from "react";

type GameState = "ready" | "playing" | "gameover";

interface Props {
  active: boolean;
  size?: "small" | "large";
  variant?: "card" | "embedded";
  compact?: boolean;
}

const GRAVITY = 0.62;
const JUMP_POWER = -8.6;
const PLAYER_X = 36;

function BicycleRider({
  playerY,
  compact,
  large,
}: {
  playerY: number;
  compact: boolean;
  large: boolean;
}) {
  const wheel = compact ? 10 : large ? 16 : 12;
  const width = compact ? 34 : large ? 56 : 40;
  const height = compact ? 22 : large ? 36 : 26;
  const frameColor = "#ef4444";
  const riderColor = "#2563eb";
  const spinDuration = compact ? 0.45 : 0.32;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        transform: `translateY(${playerY > 0 ? -1 : 0}px) rotate(${playerY > 0 ? -4 : 0}deg)`,
        transformOrigin: "50% 100%",
      }}
    >
      {[0, 1].map((index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            bottom: 0,
            left: index === 0 ? 0 : width - wheel,
            width: wheel,
            height: wheel,
            borderRadius: "50%",
            border: "3px solid #31405f",
            background: "radial-gradient(circle, #f8fafc 0 30%, #64748b 31% 38%, transparent 39%)",
            animation: `bike-wheel ${spinDuration}s linear infinite`,
            boxSizing: "border-box",
          }}
        />
      ))}

      <div style={{ position: "absolute", left: wheel * 0.5, bottom: wheel * 0.55, width: width * 0.34, height: 3, background: frameColor, borderRadius: 999, transform: "rotate(16deg)" }} />
      <div style={{ position: "absolute", left: wheel * 1.3, bottom: wheel * 0.55, width: width * 0.28, height: 3, background: frameColor, borderRadius: 999, transform: "rotate(-22deg)" }} />
      <div style={{ position: "absolute", left: width * 0.33, bottom: wheel * 0.98, width: width * 0.24, height: 3, background: frameColor, borderRadius: 999, transform: "rotate(60deg)" }} />
      <div style={{ position: "absolute", left: width * 0.5, bottom: wheel * 1.2, width: width * 0.2, height: 3, background: "#31405f", borderRadius: 999, transform: "rotate(-18deg)" }} />
      <div style={{ position: "absolute", left: width * 0.22, bottom: wheel * 1.14, width: width * 0.18, height: 3, background: "#31405f", borderRadius: 999, transform: "rotate(12deg)" }} />
      <div style={{ position: "absolute", left: width * 0.37, bottom: wheel * 1.52, width: compact ? 8 : 10, height: compact ? 8 : 10, borderRadius: "50%", background: "#fde68a", border: "2px solid #31405f" }} />
      <div style={{ position: "absolute", left: width * 0.38, bottom: wheel * 1.04, width: compact ? 8 : 10, height: compact ? 10 : 14, borderRadius: 6, background: riderColor, border: "2px solid #31405f" }} />
      <div style={{ position: "absolute", left: width * 0.32, bottom: wheel * 0.88, width: compact ? 8 : 10, height: 3, background: riderColor, borderRadius: 999, transform: "rotate(38deg)" }} />
      <div style={{ position: "absolute", left: width * 0.44, bottom: wheel * 0.88, width: compact ? 8 : 10, height: 3, background: riderColor, borderRadius: 999, transform: "rotate(-36deg)" }} />
      <div style={{ position: "absolute", left: width * 0.3, bottom: wheel * 0.6, width: compact ? 8 : 11, height: 3, background: riderColor, borderRadius: 999, transform: "rotate(58deg)" }} />
      <div style={{ position: "absolute", left: width * 0.5, bottom: wheel * 0.6, width: compact ? 8 : 11, height: 3, background: riderColor, borderRadius: 999, transform: "rotate(-58deg)" }} />
    </div>
  );
}

export default function WaitingGame({ active, size = "small", variant = "card", compact = false }: Props) {
  const [gameState, setGameState] = useState<GameState>("ready");
  const [playerY, setPlayerY] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [obstacleX, setObstacleX] = useState(260);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [bgOffset, setBgOffset] = useState(0);
  const rafRef = useRef<number | null>(null);
  const scoreCarryRef = useRef(0);
  const playerYRef = useRef(0);
  const velocityYRef = useRef(0);
  const obstacleXRef = useRef(260);
  const scoreRef = useRef(0);
  const bestScoreRef = useRef(0);
  const bgOffsetRef = useRef(0);

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
  const stageHeight = compact ? 94 : large ? 188 : 132;
  const surfaceOffset = compact ? 14 : large ? 22 : 18;
  const scaledPlayerX = compact ? 34 : large ? 68 : PLAYER_X;
  const playerHitWidth = compact ? 26 : large ? 44 : 30;
  const playerHitHeight = compact ? 14 : large ? 24 : 18;
  const shellWidth = compact ? 16 : large ? 30 : 18;
  const goombaWidth = compact ? 18 : large ? 32 : 18;
  const blockWidth = compact ? 16 : large ? 28 : 16;
  const fireballWidth = compact ? 12 : large ? 22 : 14;
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
    setBgOffset(0);
    playerYRef.current = 0;
    velocityYRef.current = 0;
    obstacleXRef.current = 260;
    scoreRef.current = 0;
    scoreCarryRef.current = 0;
    obstacleTypeRef.current = nextType;
    bgOffsetRef.current = 0;
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
      setBgOffset(0);
      playerYRef.current = 0;
      velocityYRef.current = 0;
      obstacleXRef.current = 260;
      scoreRef.current = 0;
      scoreCarryRef.current = 0;
      obstacleTypeRef.current = "shell";
      bgOffsetRef.current = 0;
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
      bgOffsetRef.current = (bgOffsetRef.current + speed) % 10000;
      setBgOffset(bgOffsetRef.current);
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
      const hitX = scaledPlayerX + playerHitWidth >= obstacleLeft && scaledPlayerX + 4 <= obstacleRight;
      const hitY = playerYRef.current < currentMetrics.height - playerHitHeight * 0.18;

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
  }, [active, gameState, fireballWidth, goombaWidth, blockWidth, large, scaledPlayerX, shellWidth]);

  return (
    <div
      style={{
        border: "3px solid rgba(49, 64, 95, 0.16)",
        borderRadius: large ? 24 : 18,
        background: embedded ? "transparent" : "linear-gradient(180deg, #f0fbff 0%, #fff6ea 100%)",
        boxShadow: embedded ? "none" : "0 10px 0 rgba(49,64,95,0.08)",
        padding: embedded ? 0 : compact ? 0 : large ? 18 : 12,
        width: "100%",
        maxWidth: large ? 760 : "none",
        borderColor: embedded ? "transparent" : "rgba(49, 64, 95, 0.16)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: compact ? 6 : large ? 12 : 8, gap: 12, paddingInline: embedded ? 2 : 0 }}>
        <div>
          <div style={{ fontSize: compact ? 9 : large ? 12 : 11, fontWeight: 900, color: "#7f57f1", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Waiting Game
          </div>
          <div style={{ fontSize: compact ? 10 : large ? 15 : 12, color: "#23324f", fontWeight: 900, marginTop: large ? 2 : 0 }}>
            {active ? "`Space` またはボタンでジャンプ" : "AI 実行中にオープン"}
          </div>
          {!compact && (
            <div style={{ fontSize: large ? 12 : 10, color: "#64748b", fontWeight: 700, marginTop: 2 }}>
              {active ? "待ち時間の間だけ遊べる社内アーケード" : "処理が始まるとプレイできます"}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", fontSize: compact ? 10 : large ? 14 : 11, fontWeight: 900, color: "#23324f" }}>
          <div style={{ fontSize: large ? 22 : undefined }}>Score {score}</div>
          <div style={{ color: "#f97316" }}>Best {bestScore}</div>
          {large && (
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 4, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Office Arcade
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <button
          type="button"
          onClick={jump}
          style={{
            width: "100%",
            marginBottom: 12,
            border: "3px solid #31405f",
            borderRadius: large ? 16 : 12,
            background: active ? "linear-gradient(180deg, #fff8f1 0%, #fff0de 100%)" : "#f6f2ea",
            color: "#23324f",
            padding: large ? "12px 14px" : "8px 10px",
            fontSize: large ? 15 : 12,
            fontWeight: 900,
            cursor: active ? "pointer" : "not-allowed",
            boxShadow: "0 6px 0 rgba(49,64,95,0.08)",
          }}
          disabled={!active}
        >
          {!active
            ? "AI 実行開始でプレイ解禁"
            : gameState === "gameover"
              ? "もう一回遊ぶ"
              : gameState === "ready"
                ? "ゲームをスタート"
                : "ジャンプする"}
        </button>
      )}

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
          boxShadow: compact ? "inset 0 -6px 0 rgba(69, 120, 42, 0.12)" : "inset 0 -8px 0 rgba(69, 120, 42, 0.12)",
        }}
      >
        {large && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              zIndex: 3,
              borderRadius: 999,
              padding: "5px 10px",
              border: "2px solid rgba(49,64,95,0.16)",
              background: "rgba(255,248,241,0.86)",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: active ? "#16a34a" : "#64748b",
              textTransform: "uppercase",
            }}
          >
            {active ? "Play Now" : "Locked"}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.55,
            backgroundImage:
              "radial-gradient(circle at 20px 20px, #ffffff 0 14px, transparent 15px), radial-gradient(circle at 44px 20px, #ffffff 0 12px, transparent 13px), radial-gradient(circle at 32px 10px, #ffffff 0 10px, transparent 11px)",
            backgroundSize: `${Math.round(96 * cloudScale)}px ${Math.round(44 * cloudScale)}px`,
            backgroundPosition: `${-bgOffset * 0.18}px ${compact ? 8 : large ? 18 : 10}px`,
            backgroundRepeat: "repeat-x",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: compact ? 28 : large ? 54 : 36,
            height: compact ? 22 : large ? 48 : 30,
            backgroundImage:
              "radial-gradient(circle at 40px 48px, #86cf66 0 34px, transparent 35px), radial-gradient(circle at 110px 48px, #78c55a 0 26px, transparent 27px)",
            backgroundSize: compact ? "120px 30px" : large ? "210px 60px" : "140px 42px",
            backgroundPosition: `${-bgOffset * 0.35}px 0`,
            backgroundRepeat: "repeat-x",
            opacity: 0.95,
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: compact ? 16 : large ? 28 : 18, height: compact ? 8 : large ? 26 : 18, background: compact ? "linear-gradient(180deg, #d1d5db 0%, #9ca3af 100%)" : "linear-gradient(180deg, #4eb752 0%, #37983b 100%)", borderTop: compact ? "3px solid #fef08a" : "3px solid #87df70" }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: compact ? 16 : large ? 30 : 20,
            background: compact ? "linear-gradient(180deg, #475569 0%, #334155 100%)" : "linear-gradient(180deg, #d38a4a 0%, #b86a35 100%)",
            borderTop: compact ? "3px solid #e2e8f0" : "3px solid #f5b36c",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: compact ? 16 : large ? 30 : 20,
            opacity: 0.28,
            backgroundImage:
              compact
                ? "linear-gradient(90deg, transparent 0, transparent 18px, rgba(255,255,255,0.85) 18px, rgba(255,255,255,0.85) 28px, transparent 28px, transparent 46px)"
                : "linear-gradient(90deg, transparent 0, transparent 10px, #7b4627 10px, #7b4627 12px, transparent 12px, transparent 34px, #7b4627 34px, #7b4627 36px, transparent 36px)",
            backgroundSize: compact ? "34px 16px" : large ? "48px 30px" : "40px 20px",
            backgroundPosition: `${-bgOffset}px 0`,
          }}
        />
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
            width: compact ? 34 : large ? 56 : 40,
            height: compact ? 24 : large ? 40 : 28,
            filter: playerY > 0 ? "drop-shadow(0 5px 0 rgba(49,64,95,0.10))" : "drop-shadow(0 4px 0 rgba(49,64,95,0.14))",
          }}
        >
          <BicycleRider playerY={playerY} compact={compact} large={large} />
        </div>

        <div
          style={{ position: "absolute", left: obstacleX, bottom: surfaceOffset }}
        >
          {obstacleType === "shell" && (
            <div
              style={{
                width: shellWidth,
                height: compact ? 16 : large ? 26 : 18,
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
                height: compact ? 18 : large ? 28 : 20,
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
                height: compact ? 16 : large ? 30 : 22,
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
                height: compact ? 12 : large ? 20 : 14,
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #ffe188 0%, #ff9f43 45%, #e2552f 100%)",
                border: "3px solid #31405f",
                boxSizing: "border-box",
              }}
            />
          )}
        </div>

        {!active && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,248,241,0.68)", fontSize: compact ? 10 : large ? 14 : 12, fontWeight: 900, color: "#51617c" }}>
            実行中だけ遊べます
          </div>
        )}

        {active && gameState === "ready" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: compact ? 10 : large ? 16 : 12, fontWeight: 900, color: "#23324f" }}>
            Spaceでスタート
          </div>
        )}

        {active && gameState === "gameover" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,248,241,0.45)", color: "#23324f" }}>
            <div style={{ fontSize: compact ? 11 : large ? 18 : 13, fontWeight: 900, marginBottom: 4 }}>Game Over</div>
            <div style={{ fontSize: compact ? 9 : large ? 13 : 11, fontWeight: 800 }}>Spaceでもう一回</div>
          </div>
        )}
      </div>
    </div>
  );
}
