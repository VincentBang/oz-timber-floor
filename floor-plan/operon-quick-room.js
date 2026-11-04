(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.OzQuickRoom = factory();
  }
}(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function roundTo(value, places) {
    const factor = Math.pow(10, places || 0);
    return Math.round((Number(value) || 0) * factor) / factor;
  }

  function distanceBetweenPoints(first, second) {
    const dx = (Number(first && first.x) || 0) - (Number(second && second.x) || 0);
    const dy = (Number(first && first.y) || 0) - (Number(second && second.y) || 0);
    return Math.hypot(dx, dy);
  }

  function polygonArea(points) {
    if (!Array.isArray(points) || points.length < 3) {
      return 0;
    }
    let area = 0;
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      area += ((Number(current.x) || 0) * (Number(next.y) || 0)) - ((Number(next.x) || 0) * (Number(current.y) || 0));
    }
    return Math.abs(area) / 2;
  }

  function convertPixelAreaToSquareMeters(areaPx, pixelsPerMetre) {
    const scale = Number(pixelsPerMetre) || 0;
    if (!(areaPx > 0) || !(scale > 0)) {
      return 0;
    }
    return areaPx / (scale * scale);
  }

  function calculatePixelsPerMetre(distancePx, distanceMetres) {
    const pixels = Number(distancePx) || 0;
    const metres = Number(distanceMetres) || 0;
    if (!(pixels > 0) || !(metres > 0)) {
      return 0;
    }
    return pixels / metres;
  }

  function assessScaleQuality(distancePx, distanceMetres, options) {
    const settings = Object.assign({ minDistanceMetres: 2, minDistancePx: 80 }, options || {});
    const warnings = [];
    const pixels = Number(distancePx) || 0;
    const metres = Number(distanceMetres) || 0;

    if (!(pixels > 0) || !(metres > 0)) {
      return {
        status: "needs_review",
        warnings: ["Scale needs a valid plan distance and real distance."],
        pixelsPerMetre: 0
      };
    }
    if (metres < settings.minDistanceMetres) {
      warnings.push("Use a longer known wall where possible. Short calibration distances can reduce accuracy.");
    }
    if (pixels < settings.minDistancePx) {
      warnings.push("Calibration points are too close. Choose a longer wall or larger dimension.");
    }

    return {
      status: warnings.length ? "verification_recommended" : "set",
      warnings: warnings,
      pixelsPerMetre: calculatePixelsPerMetre(pixels, metres)
    };
  }

  function getCustomerConfidenceLabel(level) {
    if (level === "High") {
      return "Looks clean";
    }
    if (level === "Medium") {
      return "Review suggested boundary";
    }
    return "Manual trace recommended";
  }

  function createWallMaskFromImageData(imageData, width, height, options) {
    const settings = Object.assign({ threshold: 170, closeRadius: 1 }, options || {});
    const data = imageData && imageData.data ? imageData.data : imageData;
    const mask = new Uint8Array(width * height);

    for (let index = 0; index < width * height; index += 1) {
      const pixelIndex = index * 4;
      const red = data[pixelIndex] || 0;
      const green = data[pixelIndex + 1] || 0;
      const blue = data[pixelIndex + 2] || 0;
      const alpha = typeof data[pixelIndex + 3] === "number" ? data[pixelIndex + 3] : 255;
      const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);
      mask[index] = alpha > 16 && luminance < settings.threshold ? 1 : 0;
    }

    return settings.closeRadius > 0 ? dilateMask(mask, width, height, settings.closeRadius) : mask;
  }

  function dilateMask(mask, width, height, radius) {
    const output = new Uint8Array(mask.length);
    const safeRadius = Math.max(0, Math.round(Number(radius) || 0));

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width) + x;
        if (mask[index]) {
          for (let offsetY = -safeRadius; offsetY <= safeRadius; offsetY += 1) {
            for (let offsetX = -safeRadius; offsetX <= safeRadius; offsetX += 1) {
              const nextX = x + offsetX;
              const nextY = y + offsetY;
              if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
                output[(nextY * width) + nextX] = 1;
              }
            }
          }
        }
      }
    }

    return output;
  }

  function closeSmallWallGaps(mask, width, height, radius) {
    return dilateMask(mask, width, height, radius || 1);
  }

  function floodFillRegion(mask, width, height, startX, startY, options) {
    const settings = Object.assign({ maxPixels: width * height }, options || {});
    const x0 = Math.round(Number(startX) || 0);
    const y0 = Math.round(Number(startY) || 0);
    const startIndex = (y0 * width) + x0;

    if (x0 < 0 || x0 >= width || y0 < 0 || y0 >= height) {
      return { rejected: true, reason: "Click is outside the plan image." };
    }
    if (mask[startIndex]) {
      return { rejected: true, reason: "Click is on a wall or dark plan detail." };
    }

    const visited = new Uint8Array(width * height);
    const stack = [startIndex];
    visited[startIndex] = 1;
    let pixelCount = 0;
    let minX = x0;
    let maxX = x0;
    let minY = y0;
    let maxY = y0;
    let touchesEdge = false;

    while (stack.length) {
      const index = stack.pop();
      const x = index % width;
      const y = Math.floor(index / width);
      pixelCount += 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      if (x <= 1 || y <= 1 || x >= width - 2 || y >= height - 2) {
        touchesEdge = true;
      }
      if (pixelCount > settings.maxPixels) {
        return {
          rejected: true,
          reason: "Suggested area is too large to trust.",
          pixelCount: pixelCount,
          touchesEdge: touchesEdge
        };
      }

      const neighbours = [
        index - 1,
        index + 1,
        index - width,
        index + width
      ];
      for (let neighbourIndex = 0; neighbourIndex < neighbours.length; neighbourIndex += 1) {
        const next = neighbours[neighbourIndex];
        if (next < 0 || next >= visited.length || visited[next] || mask[next]) {
          continue;
        }
        const nextX = next % width;
        const nextY = Math.floor(next / width);
        if (Math.abs(nextX - x) + Math.abs(nextY - y) !== 1) {
          continue;
        }
        visited[next] = 1;
        stack.push(next);
      }
    }

    return {
      rejected: false,
      pixelCount: pixelCount,
      bounds: { minX: minX, minY: minY, maxX: maxX, maxY: maxY },
      touchesEdge: touchesEdge,
      visited: visited
    };
  }

  function scanConnectedRegion(mask, visited, width, height, startIndex, options) {
    const settings = Object.assign({ maxPixels: width * height }, options || {});
    if (mask[startIndex] || visited[startIndex]) {
      return { rejected: true, reason: "Seed is unavailable." };
    }

    const stack = [startIndex];
    visited[startIndex] = 1;
    let pixelCount = 0;
    let minX = startIndex % width;
    let maxX = minX;
    let minY = Math.floor(startIndex / width);
    let maxY = minY;
    let touchesEdge = false;

    while (stack.length) {
      const index = stack.pop();
      const x = index % width;
      const y = Math.floor(index / width);
      pixelCount += 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      if (x <= 1 || y <= 1 || x >= width - 2 || y >= height - 2) {
        touchesEdge = true;
      }
      if (pixelCount > settings.maxPixels) {
        return {
          rejected: true,
          reason: "Suggested area is too large to trust.",
          pixelCount: pixelCount,
          bounds: { minX: minX, minY: minY, maxX: maxX, maxY: maxY },
          touchesEdge: touchesEdge
        };
      }

      const neighbours = [
        index - 1,
        index + 1,
        index - width,
        index + width
      ];
      for (let neighbourIndex = 0; neighbourIndex < neighbours.length; neighbourIndex += 1) {
        const next = neighbours[neighbourIndex];
        if (next < 0 || next >= visited.length || visited[next] || mask[next]) {
          continue;
        }
        const nextX = next % width;
        const nextY = Math.floor(next / width);
        if (Math.abs(nextX - x) + Math.abs(nextY - y) !== 1) {
          continue;
        }
        visited[next] = 1;
        stack.push(next);
      }
    }

    return {
      rejected: false,
      pixelCount: pixelCount,
      bounds: { minX: minX, minY: minY, maxX: maxX, maxY: maxY },
      touchesEdge: touchesEdge
    };
  }

  function polygonFromBounds(bounds, padding, width, height) {
    const inset = Math.max(0, Number(padding) || 0);
    return [
      { x: clamp(bounds.minX + inset, 0, width), y: clamp(bounds.minY + inset, 0, height) },
      { x: clamp(bounds.maxX - inset, 0, width), y: clamp(bounds.minY + inset, 0, height) },
      { x: clamp(bounds.maxX - inset, 0, width), y: clamp(bounds.maxY - inset, 0, height) },
      { x: clamp(bounds.minX + inset, 0, width), y: clamp(bounds.maxY - inset, 0, height) }
    ];
  }

  function classifyRegionConfidence(region, options) {
    const settings = Object.assign({
      width: 0,
      height: 0,
      areaM2: 0,
      scaleSet: false
    }, options || {});
    const reasons = [];
    let level = "High";

    if (!settings.scaleSet) {
      reasons.push("Scale is not set.");
      level = "Low";
    }
    if (!region || region.rejected) {
      reasons.push(region && region.reason ? region.reason : "No enclosed room area was found.");
      return { level: "Low", reasons: reasons };
    }
    if (region.touchesEdge) {
      reasons.push("Suggested region touches the page edge, so it may have leaked outside the room.");
      level = "Low";
    }
    if (settings.areaM2 < 1) {
      reasons.push("Suggested area is under 1 m², which is unusually small.");
      level = "Low";
    }
    if (settings.areaM2 > 150) {
      reasons.push("Suggested area is over 150 m², which may include too much of the plan.");
      level = "Low";
    }
    if (region.pixelCount < 80) {
      reasons.push("Detected region is very small and may be text or plan noise.");
      level = "Low";
    }

    const canvasPixels = (settings.width || 0) * (settings.height || 0);
    if (canvasPixels && region.pixelCount > canvasPixels * 0.45) {
      reasons.push("Suggested region covers a large part of the plan.");
      level = "Low";
    }

    if (level !== "Low") {
      const bounds = region.bounds || {};
      const boxArea = Math.max(1, ((bounds.maxX || 0) - (bounds.minX || 0)) * ((bounds.maxY || 0) - (bounds.minY || 0)));
      const fillRatio = region.pixelCount / boxArea;
      if (fillRatio < 0.42) {
        reasons.push("Boundary is noisy or jagged; manual trace is recommended.");
        level = "Low";
      } else if (fillRatio < 0.62) {
        reasons.push("Boundary is partly irregular; review the outline before adding.");
        level = "Medium";
      }
      const boundsWidth = Math.max(1, (bounds.maxX || 0) - (bounds.minX || 0));
      const boundsHeight = Math.max(1, (bounds.maxY || 0) - (bounds.minY || 0));
      const aspectRatio = Math.max(boundsWidth / boundsHeight, boundsHeight / boundsWidth);
      if (aspectRatio > 6) {
        reasons.push("Region is long and narrow; confirm it is a hallway or included area.");
        level = "Medium";
      }
    }

    if (!reasons.length) {
      reasons.push("Region appears enclosed and scale is set.");
    }

    return { level: level, reasons: reasons };
  }

  function getRegionBoxArea(region) {
    const bounds = region && region.bounds ? region.bounds : {};
    return Math.max(1, ((bounds.maxX || 0) - (bounds.minX || 0)) * ((bounds.maxY || 0) - (bounds.minY || 0)));
  }

  function isLikelyPageMarginRegion(region, width, height) {
    if (!region || !region.touchesEdge) {
      return false;
    }
    const bounds = region.bounds || {};
    const boxWidth = Math.max(0, (bounds.maxX || 0) - (bounds.minX || 0));
    const boxHeight = Math.max(0, (bounds.maxY || 0) - (bounds.minY || 0));
    const canvasPixels = width * height;
    return region.pixelCount > canvasPixels * 0.08 || boxWidth > width * 0.7 || boxHeight > height * 0.7;
  }

  function isLikelyTextOnlyRegion(region, areaM2, options) {
    const settings = Object.assign({ minTextAreaM2: 1, minDimensionPx: 8 }, options || {});
    if (!region || !region.bounds) {
      return true;
    }
    const bounds = region.bounds;
    const boxWidth = Math.max(0, bounds.maxX - bounds.minX);
    const boxHeight = Math.max(0, bounds.maxY - bounds.minY);
    if (areaM2 < settings.minTextAreaM2) {
      return true;
    }
    if (boxWidth < settings.minDimensionPx || boxHeight < settings.minDimensionPx) {
      return true;
    }
    const fillRatio = region.pixelCount / getRegionBoxArea(region);
    return areaM2 < 3 && fillRatio < 0.4;
  }

  function detectRoomFromMask(mask, width, height, point, options) {
    const settings = Object.assign({
      pixelsPerMetre: 0,
      closeRadius: 1
    }, options || {});
    const workingMask = settings.closeRadius > 0 ? closeSmallWallGaps(mask, width, height, settings.closeRadius) : mask;
    const region = floodFillRegion(workingMask, width, height, point.x, point.y, {
      maxPixels: Math.max(200, Math.floor(width * height * 0.7))
    });

    if (region.rejected) {
      const rejectedReasons = [region.reason || "No enclosed room area was found."];
      if (region.touchesEdge) {
        rejectedReasons.push("Suggested region touches the page edge, so it may have leaked outside the room.");
      }
      return {
        ok: false,
        confidence: "Low",
        confidenceReasons: rejectedReasons,
        region: region,
        polygon: [],
        areaM2: 0
      };
    }

    const polygon = polygonFromBounds(region.bounds, 1, width, height);
    const polygonAreaPx = polygonArea(polygon);
    const pixelAreaM2 = convertPixelAreaToSquareMeters(region.pixelCount, settings.pixelsPerMetre);
    const polygonAreaM2 = convertPixelAreaToSquareMeters(polygonAreaPx, settings.pixelsPerMetre);
    const areaM2 = pixelAreaM2 > 0 ? pixelAreaM2 : polygonAreaM2;
    const confidence = classifyRegionConfidence(region, {
      width: width,
      height: height,
      areaM2: areaM2,
      scaleSet: settings.pixelsPerMetre > 0
    });

    return {
      ok: confidence.level !== "Low",
      confidence: confidence.level,
      confidenceReasons: confidence.reasons,
      region: region,
      polygon: polygon,
      areaPx: region.pixelCount,
      areaM2: roundTo(areaM2, 2)
    };
  }

  function detectRoomFromImageData(imageData, width, height, point, options) {
    const settings = Object.assign({ threshold: 170, wallCloseRadius: 1, pixelsPerMetre: 0 }, options || {});
    const mask = createWallMaskFromImageData(imageData, width, height, {
      threshold: settings.threshold,
      closeRadius: settings.wallCloseRadius
    });
    return detectRoomFromMask(mask, width, height, point, {
      pixelsPerMetre: settings.pixelsPerMetre,
      closeRadius: 0
    });
  }

  function buildCandidateFromRegion(region, width, height, settings, index) {
    const polygon = polygonFromBounds(region.bounds, 1, width, height);
    const pixelAreaM2 = convertPixelAreaToSquareMeters(region.pixelCount, settings.pixelsPerMetre);
    const polygonAreaM2 = convertPixelAreaToSquareMeters(polygonArea(polygon), settings.pixelsPerMetre);
    const areaM2 = pixelAreaM2 > 0 ? pixelAreaM2 : polygonAreaM2;
    const confidence = classifyRegionConfidence(region, {
      width: width,
      height: height,
      areaM2: areaM2,
      scaleSet: settings.pixelsPerMetre > 0
    });

    return {
      id: "candidate-" + (index + 1),
      polygon: polygon,
      areaPx: region.pixelCount,
      areaM2: roundTo(areaM2, 2),
      confidence: confidence.level,
      confidenceLabel: getCustomerConfidenceLabel(confidence.level),
      confidenceReasons: confidence.reasons,
      included: confidence.level === "High" && !region.touchesEdge,
      editable: true,
      label: "Unknown",
      source: "suggest_all",
      region: region
    };
  }

  function detectAllRoomCandidatesFromMask(mask, width, height, options) {
    const settings = Object.assign({
      pixelsPerMetre: 0,
      closeRadius: 1,
      maxCandidates: 36,
      minRegionPixels: 80,
      minAreaM2: 1,
      maxAreaM2: 150
    }, options || {});
    const workingMask = settings.closeRadius > 0 ? closeSmallWallGaps(mask, width, height, settings.closeRadius) : mask;
    const visited = new Uint8Array(width * height);
    const candidates = [];
    const canvasPixels = width * height;

    for (let index = 0; index < workingMask.length; index += 1) {
      if (workingMask[index] || visited[index]) {
        continue;
      }
      const region = scanConnectedRegion(workingMask, visited, width, height, index, {
        maxPixels: canvasPixels
      });
      if (!region || region.rejected) {
        continue;
      }
      if (region.pixelCount < settings.minRegionPixels) {
        continue;
      }
      const areaM2 = convertPixelAreaToSquareMeters(region.pixelCount, settings.pixelsPerMetre);
      if (areaM2 < settings.minAreaM2) {
        continue;
      }
      if (isLikelyPageMarginRegion(region, width, height)) {
        continue;
      }
      if (isLikelyTextOnlyRegion(region, areaM2, { minTextAreaM2: settings.minAreaM2 })) {
        continue;
      }

      const candidate = buildCandidateFromRegion(region, width, height, settings, candidates.length);
      if (candidate.areaM2 > settings.maxAreaM2) {
        candidate.confidence = "Low";
        candidate.included = false;
        candidate.confidenceReasons = candidate.confidenceReasons.concat("Suggested area is unusually large; review before including.");
      }
      candidates.push(candidate);
    }

    return candidates
      .sort(function (a, b) {
        return b.areaM2 - a.areaM2;
      })
      .slice(0, settings.maxCandidates)
      .map(function (candidate, index) {
        return Object.assign({}, candidate, {
          id: "candidate-" + (index + 1),
          displayName: "Area " + (index + 1),
          confidenceLabel: getCustomerConfidenceLabel(candidate.confidence)
        });
      });
  }

  function detectAllRoomCandidatesFromImageData(imageData, width, height, options) {
    const settings = Object.assign({ threshold: 170, wallCloseRadius: 1, pixelsPerMetre: 0 }, options || {});
    const mask = createWallMaskFromImageData(imageData, width, height, {
      threshold: settings.threshold,
      closeRadius: settings.wallCloseRadius
    });
    return detectAllRoomCandidatesFromMask(mask, width, height, {
      pixelsPerMetre: settings.pixelsPerMetre,
      closeRadius: 0,
      maxCandidates: settings.maxCandidates,
      minRegionPixels: settings.minRegionPixels,
      minAreaM2: settings.minAreaM2,
      maxAreaM2: settings.maxAreaM2
    });
  }

  function aggregateIncludedArea(rooms) {
    return roundTo((Array.isArray(rooms) ? rooms : []).reduce(function (total, room) {
      const included = room && room.included !== false && room.includeInQuote !== false;
      return included ? total + (Number(room.areaM2) || 0) : total;
    }, 0), 2);
  }

  return {
    clamp: clamp,
    roundTo: roundTo,
    distanceBetweenPoints: distanceBetweenPoints,
    polygonArea: polygonArea,
    convertPixelAreaToSquareMeters: convertPixelAreaToSquareMeters,
    calculatePixelsPerMetre: calculatePixelsPerMetre,
    assessScaleQuality: assessScaleQuality,
    getCustomerConfidenceLabel: getCustomerConfidenceLabel,
    createWallMaskFromImageData: createWallMaskFromImageData,
    dilateMask: dilateMask,
    closeSmallWallGaps: closeSmallWallGaps,
    floodFillRegion: floodFillRegion,
    scanConnectedRegion: scanConnectedRegion,
    polygonFromBounds: polygonFromBounds,
    classifyRegionConfidence: classifyRegionConfidence,
    detectRoomFromMask: detectRoomFromMask,
    detectRoomFromImageData: detectRoomFromImageData,
    detectAllRoomCandidatesFromMask: detectAllRoomCandidatesFromMask,
    detectAllRoomCandidatesFromImageData: detectAllRoomCandidatesFromImageData,
    aggregateIncludedArea: aggregateIncludedArea
  };
}));
