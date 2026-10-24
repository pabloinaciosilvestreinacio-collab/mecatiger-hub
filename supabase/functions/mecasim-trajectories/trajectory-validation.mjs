// Pure validation used on the server; never trust browser-provided coordinates.
const MIN = 0.25;
const MAX = 3.41; // Meca Sim demo field width = 3.66 m, 25 cm margin.

export function validateTrajectory(name, points) {
  if (typeof name !== "string" || name.trim().length < 3 ||
      name.trim().length > 70 || /[\u0000-\u001f\u007f]/u.test(name)) {
    throw new RangeError("Invalid trajectory name");
  }
  if (!Array.isArray(points) || points.length < 1 || points.length > 16) {
    throw new RangeError("A route requires 1 to 16 points");
  }
  return {
    name: name.trim(),
    points: points.map(point => {
      if (!point || typeof point !== "object" || Array.isArray(point) ||
          Object.keys(point).length !== 2 || !("x" in point) || !("y" in point) ||
          typeof point.x !== "number" || typeof point.y !== "number" ||
          !Number.isFinite(point.x) || !Number.isFinite(point.y) ||
          point.x < MIN || point.x > MAX || point.y < MIN || point.y > MAX) {
        throw new RangeError("Invalid waypoint coordinates");
      }
      return { x: Math.round(point.x * 1000) / 1000,
               y: Math.round(point.y * 1000) / 1000 };
    })
  };
}

export function validRouteId(id) {
  return Number.isSafeInteger(id) && id > 0;
}
