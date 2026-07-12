import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Gear } from '../domain';

export type Point = { x: number; y: number };
type Rail = { type: 'horizontal' } | { type: 'vertical'; x: number };

export const gatePositions: Record<Gear, Point> = {
  0: { x: 50, y: 50 },
  1: { x: 20, y: 24 },
  2: { x: 20, y: 76 },
  3: { x: 50, y: 24 },
  4: { x: 50, y: 76 },
  5: { x: 80, y: 24 },
  6: { x: 80, y: 76 },
};

const columns = [20, 50, 80] as const;

interface GearboxProps {
  gear: Gear;
  onShift: (gear: Gear) => void;
  disabled?: boolean;
  compact?: boolean;
  immersive?: boolean;
  reducedMotion?: boolean;
  label?: string;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function nearestColumn(x: number): number {
  return columns.reduce((nearest, column) =>
    Math.abs(column - x) < Math.abs(nearest - x) ? column : nearest,
  );
}

function nearestGear(point: Point): Gear {
  const distances = (Object.entries(gatePositions) as [string, Point][]).map(([gear, gate]) => ({
    gear: Number(gear) as Gear,
    distance: Math.hypot(point.x - gate.x, point.y - gate.y),
  }));
  distances.sort((a, b) => a.distance - b.distance);
  return distances[0].distance <= 18 ? distances[0].gear : 0;
}

export function routeAlongGate(start: Point, targetGear: Gear): Point[] {
  const target = gatePositions[targetGear];
  const points: Point[] = [{ ...start }];
  const startIsHorizontal = Math.abs(start.y - 50) < 1;

  if (!startIsHorizontal && Math.abs(start.x - target.x) < 1 && targetGear !== 0) {
    points.push({ ...target });
    return points;
  }

  if (!startIsHorizontal) points.push({ x: nearestColumn(start.x), y: 50 });
  if (targetGear === 0) {
    if (points.at(-1)?.x !== 50) points.push({ x: 50, y: 50 });
    return points;
  }
  if (points.at(-1)?.x !== target.x || points.at(-1)?.y !== 50) {
    points.push({ x: target.x, y: 50 });
  }
  points.push({ ...target });
  return points;
}

function railForGear(gear: Gear): Rail {
  return gear === 0 ? { type: 'horizontal' } : { type: 'vertical', x: gatePositions[gear].x };
}

function constrainToGate(raw: Point, rail: Rail): { point: Point; rail: Rail } {
  if (rail.type === 'vertical') {
    const crossedNeutral = Math.abs(raw.y - 50) <= 9;
    if (crossedNeutral) return { point: { x: rail.x, y: 50 }, rail: { type: 'horizontal' } };
    return {
      point: { x: rail.x, y: clamp(raw.y, 24, 76) },
      rail,
    };
  }

  const column = nearestColumn(raw.x);
  if (Math.abs(raw.x - column) <= 9 && Math.abs(raw.y - 50) > 9) {
    const nextRail: Rail = { type: 'vertical', x: column };
    return {
      point: { x: column, y: 50 },
      rail: nextRail,
    };
  }
  return {
    point: { x: clamp(raw.x, 20, 80), y: 50 },
    rail,
  };
}

export function Gearbox({
  gear,
  onShift,
  disabled = false,
  compact = false,
  immersive = false,
  reducedMotion = false,
  label = 'Six-speed gear selector',
}: GearboxProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const leverRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const stemAnimationRef = useRef<Animation | null>(null);
  const visualPointRef = useRef<Point>(gatePositions[gear]);
  const railRef = useRef<Rail>(railForGear(gear));
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const transformForPoint = (point: Point): string => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 'translate3d(0, 0, 0)';
    return `translate3d(${((point.x - 50) / 100) * rect.width}px, ${((point.y - 50) / 100) * rect.height}px, 0)`;
  };

  const applyPoint = (point: Point) => {
    const lever = leverRef.current;
    if (!lever) return;
    visualPointRef.current = point;
    const angle = Math.atan2(point.y - 50, point.x - 50) * (180 / Math.PI) + 90;
    lever.style.transform = transformForPoint(point);
    lever.style.setProperty('--lever-angle', `${angle}deg`);
    lever.classList.toggle('is-neutral', Math.abs(point.x - 50) < 1 && Math.abs(point.y - 50) < 1);
  };

  const animateToGear = (targetGear: Gear) => {
    const lever = leverRef.current;
    if (!lever) return;
    animationRef.current?.cancel();
    stemAnimationRef.current?.cancel();
    const route = routeAlongGate(visualPointRef.current, targetGear);
    const target = gatePositions[targetGear];
    railRef.current = railForGear(targetGear);

    if (reducedMotion || route.length < 2 || typeof lever.animate !== 'function') {
      applyPoint(target);
      return;
    }

    const distances = route
      .slice(1)
      .map((point, index) => Math.hypot(point.x - route[index].x, point.y - route[index].y));
    const totalDistance = distances.reduce((sum, distance) => sum + distance, 0);
    let travelled = 0;
    const keyframes = route.map((point, index) => {
      if (index > 0) travelled += distances[index - 1];
      return {
        transform: transformForPoint(point),
        offset: totalDistance ? travelled / totalDistance : 1,
      };
    });
    const timing: KeyframeAnimationOptions = {
      duration: Math.max(120, (route.length - 1) * 95),
      easing: 'cubic-bezier(.22,.8,.25,1)',
      fill: 'forwards',
    };
    const animation = lever.animate(keyframes, timing);
    const stem = lever.querySelector<HTMLElement>('.shift-lever__stem');
    if (stem && typeof stem.animate === 'function') {
      const stemKeyframes = route.map((point, index) => ({
        transform: `rotate(${Math.atan2(point.y - 50, point.x - 50) * (180 / Math.PI) + 90}deg)`,
        offset: keyframes[index].offset,
      }));
      stemAnimationRef.current = stem.animate(stemKeyframes, timing);
    }
    animationRef.current = animation;
    animation.onfinish = () => {
      applyPoint(target);
      animation.cancel();
      stemAnimationRef.current?.cancel();
      stemAnimationRef.current = null;
      animationRef.current = null;
    };
  };

  useEffect(() => {
    if (!draggingRef.current) animateToGear(gear);
  }, [gear, reducedMotion]);

  useEffect(() => {
    const handleResize = () => applyPoint(visualPointRef.current);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pointFromEvent = (event: PointerEvent<HTMLDivElement>): Point => {
    const rect = trackRef.current!.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    animationRef.current?.cancel();
    stemAnimationRef.current?.cancel();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    railRef.current =
      Math.abs(visualPointRef.current.y - 50) < 1
        ? { type: 'horizontal' }
        : { type: 'vertical', x: nearestColumn(visualPointRef.current.x) };
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || disabled) return;
    const constrained = constrainToGate(pointFromEvent(event), railRef.current);
    railRef.current = constrained.rail;
    applyPoint(constrained.point);
  };

  const finishPointer = (event?: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || disabled) return;
    if (event) {
      const constrained = constrainToGate(pointFromEvent(event), railRef.current);
      railRef.current = constrained.rail;
      applyPoint(constrained.point);
    }
    draggingRef.current = false;
    setDragging(false);
    const nextGear = nearestGear(visualPointRef.current);
    if (nextGear === gear) animateToGear(nextGear);
    else onShift(nextGear);
  };

  return (
    <section
      className={`gearbox ${compact ? 'gearbox--compact' : ''} ${immersive ? 'gearbox--immersive' : ''}`}
      aria-label={label}
    >
      {!immersive && (
        <div className="gearbox__legend" aria-live="polite">
          <span>Manual select</span>
          <strong>{gear === 0 ? 'Neutral' : `Gear ${gear}`}</strong>
        </div>
      )}

      <div
        className={`shift-gate ${dragging ? 'is-dragging' : ''}`}
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={() => finishPointer()}
      >
        <span className="shift-gate__bezel" aria-hidden="true" />
        <span className="shift-screw shift-screw--tl" aria-hidden="true" />
        <span className="shift-screw shift-screw--tr" aria-hidden="true" />
        <span className="shift-screw shift-screw--bl" aria-hidden="true" />
        <span className="shift-screw shift-screw--br" aria-hidden="true" />
        <svg className="shift-gate__path" viewBox="0 0 100 100" aria-hidden="true">
          <path
            className="shift-gate__shadow"
            d="M20 18 V50 H80 V18 M50 18 V82 M20 50 V82 M80 50 V82"
          />
          <path
            className="shift-gate__channel"
            d="M20 18 V50 H80 V18 M50 18 V82 M20 50 V82 M80 50 V82"
          />
          <path
            className="shift-gate__edge"
            d="M20 18 V50 H80 V18 M50 18 V82 M20 50 V82 M80 50 V82"
          />
        </svg>
        <span className="shift-boot" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>

        <div className="shift-lever" ref={leverRef} aria-hidden="true">
          <span className="shift-lever__stem" />
          <span className="shift-lever__knob">
            <span className="shift-lever__cap">
              <i />
            </span>
          </span>
        </div>

        {([1, 2, 3, 4, 5, 6] as Gear[]).map((value) => (
          <button
            key={value}
            type="button"
            className={`gear-gate gear-gate--${value} ${gear === value ? 'is-active' : ''}`}
            data-gear={value}
            style={{ left: `${gatePositions[value].x}%`, top: `${gatePositions[value].y}%` }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onShift(value)}
            disabled={disabled}
            aria-label={`Engage gear ${value}`}
            aria-pressed={gear === value}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          className={`neutral-gate ${gear === 0 ? 'is-active' : ''}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onShift(0)}
          disabled={disabled}
          aria-label="Select neutral"
          aria-pressed={gear === 0}
        >
          N
        </button>
      </div>

      {!immersive && (
        <p className="gearbox__hint">
          Drag the knob, click a gate, or press <kbd>1</kbd>–<kbd>6</kbd> / <kbd>N</kbd>
        </p>
      )}
      {immersive && (
        <span className="sr-only" aria-live="polite">
          {gear === 0 ? 'Neutral' : `Gear ${gear}`}
        </span>
      )}
    </section>
  );
}
