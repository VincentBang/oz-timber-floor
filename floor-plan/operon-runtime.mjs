import './operon-quick-room.js';
import './operon-mobile-nav.js';
import {loadPlan} from './plan-loader.mjs';
import {roomArea,roomsOverlap} from './geometry.mjs';
import {saveAreaSummary} from './summary.mjs';
import {contactDestination} from './context.mjs';
import {readDraft,writeDraft,clearDraft,clearAreaSummary,installAccessibility} from './port-adapter.mjs';
let loadTicket=0,loadController,activeRaster,scaleFocus;
const FLOORPLAN_AREA_KEY = "oz-source-floorplan-area";
    const FLOORPLAN_CONFIRMED_AREA_KEY = "oz_source_confirmed_floorplan_area";
    const FLOORPLAN_ROOMS_KEY = "oz_source_floorplan_rooms";
    const FLOORPLAN_SOURCE_KEY = "oz_source_floorplan_source";
    const FLOORPLAN_QUOTE_HANDOFF_KEY = "oz_source_floorplan_quote_handoff_v1";
    const FLOORPLAN_STATE_KEY = "oz-source-floorplan-trace-v2";
    const FLOORPLAN_DRAFT_KEY = "oz-source-floorplan-draft-v1";
    const FLOORPLAN_IMAGE_SESSION_KEY = "oz-source-floorplan-image-session-v1";
    const AUTO_CLOSE_THRESHOLD_PX = 16;
    const HANDLE_HIT_RADIUS = 16;
    const EDGE_HANDLE_HIT_RADIUS = 14;
    const DEFAULT_CANVAS_WIDTH = 1200;
    const DEFAULT_CANVAS_HEIGHT = 860;
    const READABLE_CANVAS_LONG_EDGE = 1600;
    const canvas = document.getElementById("planCanvas");
    const context = canvas.getContext("2d");
    const QUICK_ROOM = window.OzQuickRoom || null;



    const dom = {
      planUpload: document.getElementById("planUpload"),
      uploadStatus: document.getElementById("uploadStatus"),
      planFileActions: document.getElementById("planFileActions"),
      clearPlanButton: document.getElementById("clearPlanButton"),
      resumeMeasurementBanner: document.getElementById("resumeMeasurementBanner"),
      resumeMeasurementButton: document.getElementById("resumeMeasurementButton"),
      startNewMeasurementButton: document.getElementById("startNewMeasurementButton"),
      globalStatus: document.getElementById("globalStatus"),
      canvasStatus: document.getElementById("canvasStatus"),
      canvasShell: document.getElementById("canvasShell"),
      traceStatus: document.getElementById("traceStatus"),
      traceRoomLabel: document.getElementById("traceRoomLabel"),
      traceRoomName: document.getElementById("traceRoomName"),
      setScaleButton: document.getElementById("setScaleButton"),
      verifyScaleButton: document.getElementById("verifyScaleButton"),
      resetScaleButton: document.getElementById("resetScaleButton"),
      startTraceButton: document.getElementById("startTraceButton"),
      undoTracePointButton: document.getElementById("undoTracePointButton"),
      clearTraceButton: document.getElementById("clearTraceButton"),
      finishTraceButton: document.getElementById("finishTraceButton"),
      suggestAllAreasButton: document.getElementById("suggestAllAreasButton"),
      prepareQuickModeButton: document.getElementById("prepareQuickModeButton"),
      quickModeInfoButton: document.getElementById("quickModeInfoButton"),
      quickSuggestionPanel: document.getElementById("quickSuggestionPanel"),
      quickSuggestionTitle: document.getElementById("quickSuggestionTitle"),
      quickSuggestionCopy: document.getElementById("quickSuggestionCopy"),
      quickSuggestionArea: document.getElementById("quickSuggestionArea"),
      quickSuggestionConfidence: document.getElementById("quickSuggestionConfidence"),
      quickSuggestionReasons: document.getElementById("quickSuggestionReasons"),
      acceptQuickRoomButton: document.getElementById("acceptQuickRoomButton"),
      editQuickRoomButton: document.getElementById("editQuickRoomButton"),
      discardQuickRoomButton: document.getElementById("discardQuickRoomButton"),
      quickPreviewCanvas: document.getElementById("quickPreviewCanvas"),
      quickImageLoadedLabel: document.getElementById("quickImageLoadedLabel"),
      quickScaleStatusLabel: document.getElementById("quickScaleStatusLabel"),
      quickDetectionStatusLabel: document.getElementById("quickDetectionStatusLabel"),
      quickSuggestedCountLabel: document.getElementById("quickSuggestedCountLabel"),
      quickSelectedTotalLabel: document.getElementById("quickSelectedTotalLabel"),
      quickContrastSlider: document.getElementById("quickContrastSlider"),
      quickThresholdSlider: document.getElementById("quickThresholdSlider"),
      quickNoiseSlider: document.getElementById("quickNoiseSlider"),
      scaleModal: document.getElementById("scaleModal"),
      scaleModalTitle: document.getElementById("scaleModalTitle"),
      scaleModalHelp: document.getElementById("scaleModalHelp"),
      scaleDistanceInput: document.getElementById("scaleDistanceInput"),
      saveScaleButton: document.getElementById("saveScaleButton"),
      cancelScaleButton: document.getElementById("cancelScaleButton"),
      selectedAreaTotal: document.getElementById("selectedAreaTotal"),
      roomsCountText: document.getElementById("roomsCountText"),
      scaleReadout: document.getElementById("scaleReadout"),
      scaleStatusLabel: document.getElementById("scaleStatusLabel"),
      scaleKnownDistance: document.getElementById("scaleKnownDistance"),
      scalePixelDistance: document.getElementById("scalePixelDistance"),
      scalePixelsPerMetre: document.getElementById("scalePixelsPerMetre"),
      scaleMetresPerPixel: document.getElementById("scaleMetresPerPixel"),
      scaleQualityMessage: document.getElementById("scaleQualityMessage"),
      flooringCount: document.getElementById("flooringCount"),
      excludedCount: document.getElementById("excludedCount"),
      suggestedAreasCount: document.getElementById("suggestedAreasCount"),
      suggestedIncludedCount: document.getElementById("suggestedIncludedCount"),
      suggestedConfidenceSummary: document.getElementById("suggestedConfidenceSummary"),
      scaleWarningText: document.getElementById("scaleWarningText"),
      tracePointCount: document.getElementById("tracePointCount"),
      traceShapeStatus: document.getElementById("traceShapeStatus"),
      traceValidationMessage: document.getElementById("traceValidationMessage"),
      measurementConfidenceTag: document.getElementById("measurementConfidenceTag"),
      measurementConfidenceText: document.getElementById("measurementConfidenceText"),
      confidenceChecklist: document.getElementById("confidenceChecklist"),
      uploadFlowFile: document.getElementById("uploadFlowFile"),
      uploadFlowScale: document.getElementById("uploadFlowScale"),
      uploadFlowRooms: document.getElementById("uploadFlowRooms"),
      useAreaInQuoteButton: document.getElementById("useAreaInQuoteButton"),
      clearRoomsButton: document.getElementById("clearRoomsButton"),
      roomsTable: document.getElementById("roomsTable"),
      modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
      modePanels: {
        trace: document.getElementById("tracePanel"),
        quick: document.getElementById("quickPanel")
      }
    };

    function buildQuoteReturnUrl() { return contactDestination(location.search); }

    function setQuoteReturnLinks() {
      document.querySelectorAll("[data-quote-return-link]").forEach(function (link) {
        link.setAttribute("href", buildQuoteReturnUrl());
      });
    }

    function refreshWorkspaceMode() {
      document.body.classList.toggle("floorplan-workspace-active", !!state.image);
    }

    function scrollToWorkspace() {
      const tool = document.getElementById("measurementTool");
      if (!tool) {
        return;
      }
      window.requestAnimationFrame(function () {
        const header = document.querySelector(".site-header");
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        const top = tool.getBoundingClientRect().top + window.scrollY - headerHeight - 10;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: "smooth"
        });
      });
    }

    const roomVisuals = {
      flooring: { fill: "rgba(255, 220, 27, 0.28)", stroke: "rgba(195, 158, 0, 0.95)" },
      wet: { fill: "rgba(125, 135, 156, 0.2)", stroke: "rgba(98, 112, 133, 0.92)" },
      outdoor: { fill: "rgba(82, 82, 91, 0.2)", stroke: "rgba(63, 63, 70, 0.9)" }
    };

    const floorplanState = {
      image: null,
      file: null,
      fileName: "",
      imageLoaded: false,
      imageElement: null,
      mode: "trace",
      activeTool: "idle",
      scalePoints: [],
      pendingScaleDistancePx: 0,
      pixelsPerMetre: 0,
      scaleStatus: "not_set",
      scaleWarnings: [],
      scaleVerified: false,
      scaleModalMode: "set",
      lastScaleDistanceMeters: 0,
      lastScaleDistancePx: 0,
      tracePoints: [],
      rooms: [],
      roomCounter: 1,
      selectedRoomId: "",
      dragTarget: null,
      suppressNextClick: false,
      selectedTotalArea: 0
    };
    const state = floorplanState;

    const quickRoomState = {
      imageLoaded: false,
      imageElement: null,
      canvas: document.getElementById("quickPreviewCanvas"),
      ctx: document.getElementById("quickPreviewCanvas").getContext("2d"),
      scale: null,
      originalCanvas: null,
      processedCanvas: null,
      detectedRegions: [],
      suggestedRooms: [],
      activeSuggestion: null,
      pendingMergeRoomId: "",
      selectedRoomIds: new Set(),
      excludedRegions: [],
      detectionStatus: "Not started",
      currentView: "original",
      grayscaleCanvas: null,
      thresholdCanvas: null,
      cleanedCanvas: null,
      settings: {
        contrast: 1.5,
        threshold: 160,
        noisePasses: 1
      }
    };

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function roundTo(value, places) {
      return Number(value.toFixed(places));
    }

    function formatArea(value) {
      return roundTo(value || 0, 2).toFixed(2) + " m²";
    }

    function formatCanvasRoomLabel(room) {
      const label = (room && room.name ? room.name : "Room") + " · " + formatArea(room && room.areaM2);
      return label.length > 42 ? label.slice(0, 39) + "..." : label;
    }

    function calculateQuickSelectedTotalArea() {
      return state.rooms.reduce(function (total, room) {
        const isQuickRoom = room && room.source === "quick_room";
        return isQuickRoom && room.includeInQuote ? total + (room.areaM2 || 0) : total;
      }, 0);
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function distanceBetweenPoints(first, second) {
      const dx = first.x - second.x;
      const dy = first.y - second.y;
      return Math.hypot(dx, dy);
    }

    function getPointerPoint(event) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };
    }

    function setGlobalStatus(message) {
      if (!dom.globalStatus) {
        return;
      }
      dom.globalStatus.textContent = message;
    }

    function setCanvasStatus(message, options) {
      const forceVisible = !!(options && options.forceVisible);
      dom.canvasStatus.textContent = message;
      dom.canvasStatus.classList.toggle("hidden", !!state.image && !forceVisible);
    }

    function setUploadStatus(message) {
      dom.uploadStatus.textContent = message;
    }

    function setTraceStatus(message) {
      if (typeof message === "object" && message) {
        dom.traceStatus.classList.toggle("status-next", !!message.next);
        dom.traceStatus.innerHTML = message.next
          ? '<strong>Next step</strong><span>' + escapeHtml(message.text || "") + "</span>"
          : escapeHtml(message.text || "");
        return;
      }

      dom.traceStatus.classList.remove("status-next");
      dom.traceStatus.textContent = message;
    }

    function setUploadFlowStep(element, stateName) {
      if (!element) {
        return;
      }
      element.classList.toggle("is-active", stateName === "active");
      element.classList.toggle("is-complete", stateName === "complete");
    }

    function renderUploadFlow() {
      const hasPlan = !!state.image;
      const hasScale = !!state.pixelsPerMetre;
      const hasRooms = state.rooms.length > 0;
      setUploadFlowStep(dom.uploadFlowFile, hasPlan ? "complete" : "active");
      setUploadFlowStep(dom.uploadFlowScale, hasScale ? "complete" : hasPlan ? "active" : "");
      setUploadFlowStep(dom.uploadFlowRooms, hasRooms ? "complete" : hasScale ? "active" : "");
    }

    function getConfidenceCustomerLabel(level) {
      if (QUICK_ROOM && typeof QUICK_ROOM.getCustomerConfidenceLabel === "function") {
        return QUICK_ROOM.getCustomerConfidenceLabel(level);
      }
      if (level === "High") {
        return "Looks clean";
      }
      if (level === "Medium") {
        return "Review suggested boundary";
      }
      return "Manual trace recommended";
    }

    function getScaleStatusText() {
      if (!state.pixelsPerMetre) {
        return "Not set";
      }
      if (state.scaleStatus === "verified") {
        return "Verified";
      }
      if (state.scaleStatus === "needs_review") {
        return "Needs review";
      }
      if (state.scaleStatus === "verification_recommended") {
        return "Set, verification recommended";
      }
      return "Set";
    }

    function hasScaleQualityIssue() {
      return state.scaleStatus === "needs_review" || state.scaleStatus === "verification_recommended" || (Array.isArray(state.scaleWarnings) && state.scaleWarnings.length > 0);
    }

    function hasUnusualIncludedRoom(includedRooms) {
      return includedRooms.some(function (room) {
        return Number(room.areaM2 || 0) < 1 || Number(room.areaM2 || 0) > 150;
      });
    }

    function getSuggestedAreaStats() {
      const suggestedRooms = state.rooms.filter(function (room) {
        return room.source === "quick_room" && room.origin === "suggest_all";
      });
      const includedSuggestedRooms = suggestedRooms.filter(function (room) {
        return room.includeInQuote;
      });
      const counts = suggestedRooms.reduce(function (summary, room) {
        const level = room.confidence || "Low";
        summary[level] = (summary[level] || 0) + 1;
        return summary;
      }, { High: 0, Medium: 0, Low: 0 });
      return {
        total: suggestedRooms.length,
        included: includedSuggestedRooms.length,
        high: counts.High || 0,
        medium: counts.Medium || 0,
        low: counts.Low || 0
      };
    }

    function getMeasurementConfidence() {
      const hasPlan = !!state.image;
      const hasScale = !!state.pixelsPerMetre;
      const includedRooms = state.rooms.filter(function (room) {
        return room.includeInQuote;
      });
      const unusualIncludedRoom = hasUnusualIncludedRoom(includedRooms);
      const hasLowIncludedRoom = includedRooms.some(function (room) {
        return room.source === "quick_room" && room.confidence === "Low";
      });
      const hasMediumIncludedRoom = includedRooms.some(function (room) {
        return room.source === "quick_room" && room.confidence === "Medium";
      });
      const selectedArea = calculateSelectedTotalArea();
      const checklist = [
        {
          title: "Plan",
          complete: hasPlan,
          text: hasPlan ? "Floor plan loaded: " + (state.fileName || "uploaded plan") + "." : "No plan uploaded yet."
        },
        {
          title: "Scale",
          complete: hasScale,
          text: hasScale ? "Scale status: " + getScaleStatusText() + "." : "Set scale from a known wall length."
        },
        {
          title: "Rooms",
          complete: state.rooms.length > 0,
          text: state.rooms.length ? state.rooms.length + " room" + (state.rooms.length === 1 ? "" : "s") + " traced and labelled." : "No rooms traced yet."
        },
        {
          title: "Quote area",
          complete: selectedArea > 0 && includedRooms.length > 0,
          text: selectedArea > 0 ? formatArea(selectedArea) + " selected for quote." : "No included flooring area yet."
        }
      ];
      const completeCount = checklist.filter(function (item) {
        return item.complete;
      }).length;

      if (hasPlan && hasScale && selectedArea > 0 && (hasScaleQualityIssue() || unusualIncludedRoom)) {
        return {
          level: "Low",
          className: "warn",
          text: "Needs review. Check the scale and any unusual room sizes before using this area.",
          checklist: checklist
        };
      }
      if (completeCount === checklist.length && includedRooms.length >= 1) {
        if (state.scaleStatus === "verified" && !hasMediumIncludedRoom && !hasLowIncludedRoom) {
          return {
            level: "High",
            className: "good",
            text: "Measured confidence is high. Scale has been verified and rooms are traced.",
            checklist: checklist
          };
        }
      }
      if (hasPlan && hasScale && selectedArea > 0 && !hasLowIncludedRoom) {
        return {
          level: "Medium",
          className: "warn",
          text: "Measured confidence is medium. Scale is set and rooms are traced, but verification is still recommended.",
          checklist: checklist
        };
      }
      if (hasPlan && hasScale && selectedArea > 0) {
        return {
          level: "Low",
          className: "warn",
          text: "Measured confidence is low. Review boundaries and unusual room sizes before using this area.",
          checklist: checklist
        };
      }
      return {
        level: "Low",
        className: "warn",
        text: "Measured confidence is low. Upload a plan, set scale and trace at least one included room.",
        checklist: checklist
      };
    }

    function renderMeasurementConfidence() {
      if (!dom.measurementConfidenceTag || !dom.confidenceChecklist) {
        return;
      }
      const confidence = getMeasurementConfidence();
      dom.measurementConfidenceTag.textContent = confidence.level;
      dom.measurementConfidenceTag.className = "pill " + confidence.className;
      dom.measurementConfidenceText.textContent = confidence.text;
      dom.confidenceChecklist.innerHTML = confidence.checklist.map(function (item) {
        return '<div class="confidence-item ' + (item.complete ? "is-complete" : "is-warning") + '">' +
          "<strong>" + escapeHtml(item.title) + "</strong>" +
          "<span>" + escapeHtml(item.text) + "</span>" +
          "</div>";
      }).join("");
    }

    function renderMeasurementGuidance() {
      renderUploadFlow();
      renderMeasurementConfidence();
    }

    function renderScaleDetails() {
      const statusText = getScaleStatusText();
      const warnings = Array.isArray(state.scaleWarnings) ? state.scaleWarnings : [];
      if (dom.scaleStatusLabel) {
        dom.scaleStatusLabel.textContent = statusText;
      }
      if (dom.scaleKnownDistance) {
        dom.scaleKnownDistance.textContent = state.lastScaleDistanceMeters
          ? roundTo(state.lastScaleDistanceMeters, 2) + " m"
          : "-";
      }
      if (dom.scalePixelDistance) {
        dom.scalePixelDistance.textContent = state.lastScaleDistancePx
          ? roundTo(state.lastScaleDistancePx, 1) + " px"
          : "-";
      }
      if (dom.scalePixelsPerMetre) {
        dom.scalePixelsPerMetre.textContent = state.pixelsPerMetre
          ? roundTo(state.pixelsPerMetre, 2) + " px/m"
          : "-";
      }
      if (dom.scaleMetresPerPixel) {
        dom.scaleMetresPerPixel.textContent = state.pixelsPerMetre
          ? roundTo(1 / state.pixelsPerMetre, 4) + " m/px"
          : "-";
      }
      if (dom.scaleQualityMessage) {
        dom.scaleQualityMessage.textContent = warnings.length
          ? warnings.join(" ")
          : state.pixelsPerMetre
            ? "Scale is set. Verify with another wall when possible for higher confidence."
            : "Set scale before tracing rooms.";
      }
      if (dom.scaleWarningText) {
        dom.scaleWarningText.textContent = warnings.length ? warnings.join(" ") : "";
      }
    }

    function renderSuggestedAreaSummary() {
      if (!dom.suggestedAreasCount || !dom.suggestedIncludedCount || !dom.suggestedConfidenceSummary) {
        return;
      }
      const stats = getSuggestedAreaStats();
      dom.suggestedAreasCount.textContent = String(stats.total);
      dom.suggestedIncludedCount.textContent = String(stats.included);
      if (!stats.total) {
        dom.suggestedConfidenceSummary.textContent = "No suggested areas yet.";
        return;
      }
      dom.suggestedConfidenceSummary.textContent = [
        getConfidenceCustomerLabel("High") + ": " + stats.high,
        getConfidenceCustomerLabel("Medium") + ": " + stats.medium,
        getConfidenceCustomerLabel("Low") + ": " + stats.low
      ].join(" · ");
    }

    function renderTraceDetails() {
      if (dom.tracePointCount) {
        dom.tracePointCount.textContent = String(state.tracePoints.length);
      }
      if (dom.traceShapeStatus) {
        dom.traceShapeStatus.textContent = state.tracePoints.length >= 3
          ? "Ready to finish"
          : state.tracePoints.length > 0
            ? "Add more points"
            : "Open";
      }
      if (dom.traceValidationMessage) {
        if (!state.pixelsPerMetre) {
          dom.traceValidationMessage.textContent = "Set scale before tracing.";
        } else if (state.activeTool === "trace" && state.tracePoints.length > 0 && state.tracePoints.length < 3) {
          dom.traceValidationMessage.textContent = "Add at least three points before finishing a room.";
        } else if (state.activeTool === "trace" && state.tracePoints.length >= 3) {
          dom.traceValidationMessage.textContent = "Finish room when the outline follows the flooring area.";
        } else {
          dom.traceValidationMessage.textContent = "";
        }
      }
    }

    function clearStoredFloorplanImageState() { /* No persistent image bytes or unrelated storage keys. */ }

    function saveSessionFloorplanImage() { /* Image bytes remain in memory only; resume asks for the same plan again. */ }

    function getSessionFloorplanImage() { return ''; }

    function getSavedMeasurementSnapshot() { return readDraft(); }

    function saveDraftState() { writeDraft({source:'draft',pageNumber:state.pageNumber||1,planHash:state.planHash,rooms:state.rooms,roomCounter:state.roomCounter,selectedRoomId:state.selectedRoomId,pixelsPerMetre:state.pixelsPerMetre,scaleStatus:state.scaleStatus,scaleWarnings:state.scaleWarnings,scaleVerified:state.scaleVerified,lastScaleDistanceMeters:state.lastScaleDistanceMeters,lastScaleDistancePx:state.lastScaleDistancePx,canvasWidth:canvas.width,canvasHeight:canvas.height}); }

    function clearDraftState() { clearDraft(); }

    function clearStoredMeasurementResults() { clearAreaSummary(); }

    function clearCanvas() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      createEmptyCanvasState();
    }

    function getReadableCanvasSize(image) {
      if (!image || !image.width || !image.height) {
        return {
          width: DEFAULT_CANVAS_WIDTH,
          height: DEFAULT_CANVAS_HEIGHT
        };
      }

      const ratio = image.width / image.height;
      const longEdge = READABLE_CANVAS_LONG_EDGE;
      const width = image.width >= image.height ? longEdge : Math.round(longEdge * ratio);
      const height = image.height >= image.width ? longEdge : Math.round(longEdge / ratio);

      return {
        width: Math.max(720, Math.round(width)),
        height: Math.max(720, Math.round(height))
      };
    }

    function scalePoint(point, scaleX, scaleY) {
      return {
        x: roundTo((Number(point.x) || 0) * scaleX, 3),
        y: roundTo((Number(point.y) || 0) * scaleY, 3)
      };
    }

    function scaleStoredGeometry(previousWidth, previousHeight, nextWidth, nextHeight) {
      const safePreviousWidth = Number(previousWidth) || DEFAULT_CANVAS_WIDTH;
      const safePreviousHeight = Number(previousHeight) || DEFAULT_CANVAS_HEIGHT;
      if (!safePreviousWidth || !safePreviousHeight || (safePreviousWidth === nextWidth && safePreviousHeight === nextHeight)) {
        return;
      }

      const scaleX = nextWidth / safePreviousWidth;
      const scaleY = nextHeight / safePreviousHeight;
      state.scalePoints = state.scalePoints.map(function (point) {
        return scalePoint(point, scaleX, scaleY);
      });
      state.tracePoints = state.tracePoints.map(function (point) {
        return scalePoint(point, scaleX, scaleY);
      });
      state.rooms = state.rooms.map(function (room) {
        const nextRoom = Object.assign({}, room, {
          points: Array.isArray(room.points) ? room.points.map(function (point) {
            return scalePoint(point, scaleX, scaleY);
          }) : []
        });
        nextRoom.polygon = nextRoom.points.slice();
        nextRoom.centroid = calculatePolygonCentroid(nextRoom.points);
        return nextRoom;
      });
      if (state.pixelsPerMetre) {
        state.pixelsPerMetre = state.pixelsPerMetre * ((scaleX + scaleY) / 2);
      }
    }

    function resizeCanvasForImage(image, options) {
      const nextSize = getReadableCanvasSize(image);
      const previousWidth = options && options.previousWidth ? options.previousWidth : canvas.width;
      const previousHeight = options && options.previousHeight ? options.previousHeight : canvas.height;

      if (options && options.scaleGeometry) {
        scaleStoredGeometry(previousWidth, previousHeight, nextSize.width, nextSize.height);
      }

      if (canvas.width !== nextSize.width || canvas.height !== nextSize.height) {
        canvas.width = nextSize.width;
        canvas.height = nextSize.height;
      }
    }

    function clearScaleState() {
      state.pixelsPerMetre = 0;
      state.scalePoints = [];
      state.pendingScaleDistancePx = 0;
      state.scaleStatus = "not_set";
      state.scaleWarnings = [];
      state.scaleVerified = false;
      state.scaleModalMode = "set";
      state.lastScaleDistanceMeters = 0;
      state.lastScaleDistancePx = 0;
      renderScaleDetails();
    }

    function clearTraceState() {
      state.tracePoints = [];
      state.activeTool = "idle";
      state.dragTarget = null;
      state.suppressNextClick = false;
    }

    function clearQuickSuggestion() {
      quickRoomState.activeSuggestion = null;
      quickRoomState.detectionStatus = state.mode === "quick" ? "Click inside a room to suggest an outline" : quickRoomState.detectionStatus;
      renderQuickSuggestionPanel();
      renderQuickRoomStatus();
    }

    function clearRoomsTable() {
      state.rooms = [];
      state.roomCounter = 1;
      state.selectedRoomId = "";
      state.selectedTotalArea = 0;
      quickRoomState.pendingMergeRoomId = "";
      quickRoomState.suggestedRooms = [];
      clearQuickSuggestion();
      renderRoomsTable();
    }

    function resetFloorplanState() {
      state.image = null;
      state.file = null;
      state.fileName = "";
      state.imageLoaded = false;
      state.imageElement = null;
      canvas.width = DEFAULT_CANVAS_WIDTH;
      canvas.height = DEFAULT_CANVAS_HEIGHT;
      clearScaleState();
      clearTraceState();
      clearRoomsTable();
    }

    function showUploadEmptyState() {
      refreshWorkspaceMode();
      dom.canvasShell.classList.add("hidden");
      dom.modePanels.trace.classList.add("hidden");
      dom.planFileActions.classList.add("hidden");
      dom.planUpload.value = "";
      setUploadStatus("Upload a PDF, JPG or PNG floor plan to start measuring.");
      setCanvasStatus("Upload a floor plan to begin.", { forceVisible: true });
      setTraceStatus({ next: true, text: "Upload a floor plan first, then press Step 1. Set scale." });
      renderCanvas();
      renderRoomsTable();
      renderMeasurementGuidance();
    }

    function showUploadedPlanState() {
      refreshWorkspaceMode();
      dom.canvasShell.classList.remove("hidden");
      dom.modePanels.trace.classList.remove("hidden");
      dom.planFileActions.classList.remove("hidden");
      setUploadStatus(
        (state.fileName ? "Loaded floor plan: " + state.fileName + ". " : "Floor plan loaded. ") +
        (state.pixelsPerMetre
          ? "Scale confirmed. Trace the flooring rooms."
          : "Plan ready. Set scale, then trace the flooring rooms.")
      );
      setCanvasStatus("Plan ready. Set scale, then trace the flooring rooms.");
      setTraceStatus(state.pixelsPerMetre
        ? { next: true, text: "Scale is set. Press Step 2. Trace room to start measuring a room." }
        : { next: true, text: "Start with Step 1. Press Set scale, then click two points on the plan." });
      renderCanvas();
      renderRoomsTable();
      renderMeasurementGuidance();
    }

    function renderFloorplanPreview() {
      if (!state.image) {
        showUploadEmptyState();
        return;
      }
      showUploadedPlanState();
    }

    async function restoreSavedMeasurement(snapshot) {
      state.rooms = Array.isArray(snapshot.rooms) ? snapshot.rooms.slice() : [];
      state.roomCounter = snapshot.roomCounter || (state.rooms.length + 1);
      state.selectedRoomId = snapshot.selectedRoomId || "";
      state.pixelsPerMetre = Number(snapshot.pixelsPerMetre || 0);
      state.scaleStatus = snapshot.scaleStatus || (state.pixelsPerMetre ? "verification_recommended" : "not_set");
      state.scaleWarnings = Array.isArray(snapshot.scaleWarnings) ? snapshot.scaleWarnings.slice() : [];
      state.scaleVerified = !!snapshot.scaleVerified;
      state.lastScaleDistanceMeters = Number(snapshot.lastScaleDistanceMeters || 0);
      state.lastScaleDistancePx = Number(snapshot.lastScaleDistancePx || 0);
      state.pageNumber=snapshot.pageNumber;state.planHash=snapshot.planHash;state.restoredCanvasWidth=snapshot.canvasWidth;state.restoredCanvasHeight=snapshot.canvasHeight;
      state.fileName = snapshot.fileName || state.fileName || "";

      const sessionImageDataUrl = snapshot.source === "draft" ? getSessionFloorplanImage() : "";
      if (sessionImageDataUrl) {
        try {
          const restoredImage = await loadImageFromDataUrl(sessionImageDataUrl);
          state.image = restoredImage;
          state.imageElement = restoredImage;
          state.imageLoaded = true;
          resizeCanvasForImage(restoredImage, {
            previousWidth: snapshot.canvasWidth || DEFAULT_CANVAS_WIDTH,
            previousHeight: snapshot.canvasHeight || DEFAULT_CANVAS_HEIGHT,
            scaleGeometry: true
          });
          renderFloorplanPreview();
          setGlobalStatus("Previous floor plan measurement resumed.");
          scrollToWorkspace();
          return;
        } catch (error) {
          // Fall back to measurement-only restore if the temporary image is unavailable.
        }
      }

      renderRoomsTable();
      setGlobalStatus("Previous measurement loaded. Please re-upload the floor plan to continue editing.");
      setUploadStatus("Please re-upload the floor plan to continue editing.");
      setCanvasStatus("Room measurements were restored, but the plan image could not be reopened. Upload the plan again to continue editing.", { forceVisible: true });
      setTraceStatus({ next: true, text: "Rooms restored. Upload the floor plan again to continue editing." });
      scrollToWorkspace();
    }

    function clearUploadedFloorplan(skipRoomPrompt) {
      if (!skipRoomPrompt && state.rooms.length) {
        const confirmed = window.confirm("You have measured rooms already. Clear this floor plan and remove measurements?");
        if (!confirmed) {
          return false;
        }
      }

      ++loadTicket;loadController?.abort();if(activeRaster){activeRaster.width=0;activeRaster.height=0;activeRaster=null;}
      resetFloorplanState();
      configurePdfPages(1,1,null);document.querySelector('#oz-share-area').checked=false;
      clearDraftState();
      clearStoredMeasurementResults();
      clearStoredFloorplanImageState();
      showUploadEmptyState();
      setGlobalStatus("Floor plan cleared. Upload a new plan to start again.");
      return true;
    }

    function getNextRoomName() {
      return "Room " + state.roomCounter;
    }

    function getSelectedRoomLabel() {
      return dom.traceRoomLabel && dom.traceRoomLabel.value ? dom.traceRoomLabel.value : "Room";
    }

    function getNextRoomLabelName(label) {
      const baseLabel = label || getSelectedRoomLabel();
      const existingCount = state.rooms.filter(function (room) {
        return (room.label || "").toLowerCase() === baseLabel.toLowerCase();
      }).length;
      return baseLabel + " " + (existingCount + 1);
    }

    function getDefaultIncludeForType(type) {
      return type === "flooring";
    }

    function getSelectedRoom() {
      return state.rooms.find(function (room) {
        return room.id === state.selectedRoomId;
      }) || null;
    }

    function getEdgeMidpoints(points) {
      return points.map(function (point, index) {
        const next = points[(index + 1) % points.length];
        return {
          x: (point.x + next.x) / 2,
          y: (point.y + next.y) / 2,
          edgeIndex: index
        };
      });
    }

    function getPointBounds(points) {
      return (Array.isArray(points) ? points : []).reduce(function (bounds, point) {
        return {
          minX: Math.min(bounds.minX, point.x),
          minY: Math.min(bounds.minY, point.y),
          maxX: Math.max(bounds.maxX, point.x),
          maxY: Math.max(bounds.maxY, point.y)
        };
      }, {
        minX: canvas.width,
        minY: canvas.height,
        maxX: 0,
        maxY: 0
      });
    }

    function polygonFromPointBounds(bounds) {
      return [
        { x: clamp(bounds.minX, 0, canvas.width), y: clamp(bounds.minY, 0, canvas.height) },
        { x: clamp(bounds.maxX, 0, canvas.width), y: clamp(bounds.minY, 0, canvas.height) },
        { x: clamp(bounds.maxX, 0, canvas.width), y: clamp(bounds.maxY, 0, canvas.height) },
        { x: clamp(bounds.minX, 0, canvas.width), y: clamp(bounds.maxY, 0, canvas.height) }
      ];
    }

    function pointInPolygon(point, polygon) {
      let inside = false;
      for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
        const currentPoint = polygon[index];
        const previousPoint = polygon[previous];
        const intersects = ((currentPoint.y > point.y) !== (previousPoint.y > point.y))
          && (point.x < ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) / ((previousPoint.y - currentPoint.y) || 1e-6) + currentPoint.x);
        if (intersects) {
          inside = !inside;
        }
      }
      return inside;
    }

    function getRoomHitTarget(point) {
      const selectedRoom = getSelectedRoom();
      if (selectedRoom) {
        for (let pointIndex = 0; pointIndex < selectedRoom.points.length; pointIndex += 1) {
          if (distanceBetweenPoints(point, selectedRoom.points[pointIndex]) <= HANDLE_HIT_RADIUS) {
            return {
              type: "corner",
              roomId: selectedRoom.id,
              pointIndex: pointIndex
            };
          }
        }

        const edgeMidpoints = getEdgeMidpoints(selectedRoom.points);
        for (let edgeIndex = 0; edgeIndex < edgeMidpoints.length; edgeIndex += 1) {
          if (distanceBetweenPoints(point, edgeMidpoints[edgeIndex]) <= EDGE_HANDLE_HIT_RADIUS) {
            return {
              type: "edge",
              roomId: selectedRoom.id,
              edgeIndex: edgeMidpoints[edgeIndex].edgeIndex
            };
          }
        }
      }

      for (let roomIndex = state.rooms.length - 1; roomIndex >= 0; roomIndex -= 1) {
        if (pointInPolygon(point, state.rooms[roomIndex].points)) {
          return {
            type: "room",
            roomId: state.rooms[roomIndex].id
          };
        }
      }

      return null;
    }

    function recalculateRoomGeometry(room) {
      room.areaM2 = roundTo(convertPixelAreaToSquareMeters(calculatePolygonAreaPx(room.points)), 2);
      room.centroid = calculatePolygonCentroid(room.points);
      room.polygon = room.points.slice();
      room.included = !!room.includeInQuote;
    }

    function selectRoom(roomId) {
      state.selectedRoomId = roomId || "";
      renderCanvas();
      renderRoomsTable();
    }

    function cloneCanvas(sourceCanvas) {
      const nextCanvas = document.createElement("canvas");
      nextCanvas.width = sourceCanvas.width;
      nextCanvas.height = sourceCanvas.height;
      nextCanvas.getContext("2d").drawImage(sourceCanvas, 0, 0);
      return nextCanvas;
    }

    function loadImageFromDataUrl(dataUrl) {
      return new Promise(function (resolve, reject) {
        const image = new Image();
        image.onload = function () {
          resolve(image);
        };
        image.onerror = reject;
        image.src = dataUrl;
      });
    }

    async function renderPdfPlanImage(file) { return loadPlan(file); }

    function drawImageToCanvas(image, targetCanvas) {
      const ratio = Math.min(targetCanvas.width / image.width, targetCanvas.height / image.height);
      const drawWidth = image.width * ratio;
      const drawHeight = image.height * ratio;
      const drawX = (targetCanvas.width - drawWidth) / 2;
      const drawY = (targetCanvas.height - drawHeight) / 2;
      const targetContext = targetCanvas.getContext("2d");
      targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
      targetContext.fillStyle = "#ffffff";
      targetContext.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
      targetContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }

    function loadFloorplanImage() {
      quickRoomState.imageLoaded = !!state.image;
      quickRoomState.imageElement = state.image || null;
      quickRoomState.canvas.width = canvas.width;
      quickRoomState.canvas.height = canvas.height;
      quickRoomState.scale = state.pixelsPerMetre ? {
        pixelsPerMetre: state.pixelsPerMetre,
        metresPerPixel: 1 / state.pixelsPerMetre
      } : null;

      if (!quickRoomState.imageElement) {
        quickRoomState.originalCanvas = null;
        quickRoomState.processedCanvas = null;
        quickRoomState.grayscaleCanvas = null;
        quickRoomState.thresholdCanvas = null;
        quickRoomState.cleanedCanvas = null;
        quickRoomState.detectedRegions = [];
        quickRoomState.suggestedRooms = [];
        quickRoomState.activeSuggestion = null;
        quickRoomState.selectedRoomIds = new Set();
        quickRoomState.detectionStatus = "No plan uploaded";
        renderQuickRoomStatus();
        renderQuickSuggestionPanel();
        renderQuickPreview();
        return null;
      }

      const workingCanvas = document.createElement("canvas");
      workingCanvas.width = quickRoomState.canvas.width;
      workingCanvas.height = quickRoomState.canvas.height;
      drawImageToCanvas(quickRoomState.imageElement, workingCanvas);
      quickRoomState.originalCanvas = cloneCanvas(workingCanvas);
      quickRoomState.processedCanvas = workingCanvas;
      quickRoomState.detectionStatus = "Image loaded";
      renderQuickRoomStatus();
      return workingCanvas;
    }

    function convertToGrayscale(sourceCanvas) {
      const canvasCopy = cloneCanvas(sourceCanvas);
      const canvasContext = canvasCopy.getContext("2d");
      const imageData = canvasContext.getImageData(0, 0, canvasCopy.width, canvasCopy.height);
      const pixels = imageData.data;

      for (let index = 0; index < pixels.length; index += 4) {
        const luminance = Math.round((0.299 * pixels[index]) + (0.587 * pixels[index + 1]) + (0.114 * pixels[index + 2]));
        pixels[index] = luminance;
        pixels[index + 1] = luminance;
        pixels[index + 2] = luminance;
      }

      canvasContext.putImageData(imageData, 0, 0);
      return canvasCopy;
    }

    function increaseContrast(sourceCanvas) {
      const canvasCopy = cloneCanvas(sourceCanvas);
      const canvasContext = canvasCopy.getContext("2d");
      const imageData = canvasContext.getImageData(0, 0, canvasCopy.width, canvasCopy.height);
      const pixels = imageData.data;
      const contrastFactor = quickRoomState.settings.contrast;

      for (let index = 0; index < pixels.length; index += 4) {
        const adjusted = clamp(((pixels[index] - 128) * contrastFactor) + 128, 0, 255);
        pixels[index] = adjusted;
        pixels[index + 1] = adjusted;
        pixels[index + 2] = adjusted;
      }

      canvasContext.putImageData(imageData, 0, 0);
      return canvasCopy;
    }

    function thresholdImage(sourceCanvas) {
      const canvasCopy = cloneCanvas(sourceCanvas);
      const canvasContext = canvasCopy.getContext("2d");
      const imageData = canvasContext.getImageData(0, 0, canvasCopy.width, canvasCopy.height);
      const pixels = imageData.data;
      const threshold = quickRoomState.settings.threshold;

      for (let index = 0; index < pixels.length; index += 4) {
        const value = pixels[index] < threshold ? 0 : 255;
        pixels[index] = value;
        pixels[index + 1] = value;
        pixels[index + 2] = value;
      }

      canvasContext.putImageData(imageData, 0, 0);
      return canvasCopy;
    }

    function removeNoise(sourceCanvas) {
      let workingCanvas = cloneCanvas(sourceCanvas);
      const passes = quickRoomState.settings.noisePasses;

      for (let passIndex = 0; passIndex < passes; passIndex += 1) {
        const sourceContext = workingCanvas.getContext("2d");
        const sourceData = sourceContext.getImageData(0, 0, workingCanvas.width, workingCanvas.height);
        const outputCanvas = cloneCanvas(workingCanvas);
        const outputContext = outputCanvas.getContext("2d");
        const outputData = outputContext.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        const sourcePixels = sourceData.data;
        const outputPixels = outputData.data;

        for (let y = 1; y < workingCanvas.height - 1; y += 1) {
          for (let x = 1; x < workingCanvas.width - 1; x += 1) {
            let darkNeighbours = 0;
            for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
              for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                const neighbourIndex = (((y + offsetY) * workingCanvas.width) + (x + offsetX)) * 4;
                if (sourcePixels[neighbourIndex] === 0) {
                  darkNeighbours += 1;
                }
              }
            }

            const pixelIndex = ((y * workingCanvas.width) + x) * 4;
            const nextValue = darkNeighbours >= 4 ? 0 : 255;
            outputPixels[pixelIndex] = nextValue;
            outputPixels[pixelIndex + 1] = nextValue;
            outputPixels[pixelIndex + 2] = nextValue;
          }
        }

        outputContext.putImageData(outputData, 0, 0);
        workingCanvas = outputCanvas;
      }

      return workingCanvas;
    }

    function normaliseImage() {
      const baseCanvas = loadFloorplanImage();
      if (!baseCanvas) {
        return;
      }

      quickRoomState.detectionStatus = "Preparing Quick Room Mode";
      renderQuickRoomStatus();

      const grayscaleCanvas = convertToGrayscale(baseCanvas);
      const contrastCanvas = increaseContrast(grayscaleCanvas);
      const thresholdCanvas = thresholdImage(contrastCanvas);
      const cleanedCanvas = removeNoise(thresholdCanvas);

      quickRoomState.grayscaleCanvas = grayscaleCanvas;
      quickRoomState.thresholdCanvas = thresholdCanvas;
      quickRoomState.cleanedCanvas = cleanedCanvas;
      quickRoomState.processedCanvas = cleanedCanvas;
      quickRoomState.detectionStatus = "Quick Room Mode ready";
      renderQuickRoomStatus();
      renderQuickPreview();
    }

    function renderQuickRoomStatus() {
      dom.quickImageLoadedLabel.textContent = quickRoomState.imageLoaded ? "Yes" : "No";
      dom.quickScaleStatusLabel.textContent = quickRoomState.scale ? getScaleStatusText() : "No";
      dom.quickDetectionStatusLabel.textContent = quickRoomState.detectionStatus;
      dom.quickSuggestedCountLabel.textContent = String(state.rooms.filter(function (room) {
        return room.source === "quick_room";
      }).length);
      dom.quickSelectedTotalLabel.textContent = formatArea(calculateQuickSelectedTotalArea());
    }

    function renderQuickSuggestionPanel() {
      const suggestion = quickRoomState.activeSuggestion;
      if (!dom.quickSuggestionPanel) {
        return;
      }
      dom.quickSuggestionPanel.classList.toggle("hidden", !suggestion);
      if (!suggestion) {
        return;
      }

      dom.quickSuggestionPanel.dataset.confidence = suggestion.confidence || "Low";
      dom.quickSuggestionTitle.textContent = suggestion.confidence === "Low"
        ? "Suggested outline needs manual review"
        : "Suggested room outline";
      dom.quickSuggestionCopy.textContent = suggestion.confidence === "Low"
        ? "This click may have leaked or picked up plan noise. Use Manual Trace if the outline is not right."
        : "Review the outline on the plan before adding it to your measured area.";
      dom.quickSuggestionArea.textContent = formatArea(suggestion.areaM2);
      dom.quickSuggestionConfidence.textContent = getConfidenceCustomerLabel(suggestion.confidence || "Low");
      dom.quickSuggestionConfidence.className = "pill " + (suggestion.confidence === "High" ? "good" : "warn");
      dom.quickSuggestionReasons.innerHTML = (suggestion.confidenceReasons || []).map(function (reason) {
        return "<li>" + escapeHtml(reason) + "</li>";
      }).join("");
      dom.acceptQuickRoomButton.disabled = suggestion.confidence === "Low" || !(suggestion.areaM2 > 0);
      dom.editQuickRoomButton.disabled = !(suggestion.polygon && suggestion.polygon.length >= 3);
    }

    function ensureQuickRoomReady() {
      if (!QUICK_ROOM) {
        quickRoomState.detectionStatus = "Quick Room Mode is unavailable";
        renderQuickRoomStatus();
        return false;
      }
      if (!state.image) {
        quickRoomState.detectionStatus = "Upload a plan first";
        renderQuickRoomStatus();
        return false;
      }
      if (!state.pixelsPerMetre) {
        quickRoomState.detectionStatus = "Set scale first";
        setCanvasStatus("Set scale before using Quick Room Mode.", { forceVisible: true });
        setTraceStatus({ next: true, text: "Press Step 1. Set scale, then use Quick Room Mode." });
        renderQuickRoomStatus();
        return false;
      }
      if (!quickRoomState.originalCanvas || quickRoomState.originalCanvas.width !== canvas.width || quickRoomState.originalCanvas.height !== canvas.height) {
        loadFloorplanImage();
      }
      return !!quickRoomState.originalCanvas;
    }

    function getQuickRoomImageData() {
      if (!ensureQuickRoomReady()) {
        return null;
      }
      const workingContext = quickRoomState.originalCanvas.getContext("2d");
      return workingContext.getImageData(0, 0, quickRoomState.originalCanvas.width, quickRoomState.originalCanvas.height);
    }

    function suggestQuickRoomAtPoint(point) {
      const imageData = getQuickRoomImageData();
      if (!imageData) {
        return;
      }

      quickRoomState.detectionStatus = "Suggesting room outline";
      renderQuickRoomStatus();
      if (window.OzFloorplanTracking) {
        window.OzFloorplanTracking.trackEvent("floorplan_quick_room_started", {
          measurement_mode: "quick_room"
        });
      }

      const result = QUICK_ROOM.detectRoomFromImageData(
        imageData,
        quickRoomState.originalCanvas.width,
        quickRoomState.originalCanvas.height,
        point,
        {
          pixelsPerMetre: state.pixelsPerMetre,
          threshold: quickRoomState.settings.threshold,
          wallCloseRadius: 2,
          wallDilateRadius: 1
        }
      );
      const roomLabel = getSelectedRoomLabel();
      const suggestion = Object.assign({}, result, {
        id: "quick-suggestion-" + Date.now(),
        label: roomLabel,
        name: getNextRoomLabelName(roomLabel),
        source: "quick_room",
        included: true,
        includeInQuote: true,
        createdAt: new Date().toISOString()
      });

      quickRoomState.activeSuggestion = suggestion;
      quickRoomState.detectionStatus = suggestion.confidence === "Low"
        ? "Low confidence suggestion"
        : "Suggestion ready";
      renderCanvas();
      renderQuickSuggestionPanel();
      renderQuickRoomStatus();
      setCanvasStatus(suggestion.confidence === "Low"
        ? "Quick Room Mode found a low-confidence outline. Use Manual Trace if the preview is not right."
        : "Quick Room Mode suggested a room outline. Review it before adding the room.");
    }

    function buildQuickRoomFromSuggestion(suggestion) {
      const polygon = (suggestion.polygon || []).map(function (point) {
        return {
          x: roundTo(point.x, 3),
          y: roundTo(point.y, 3)
        };
      });
      return {
        id: "room-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        source: "quick_room",
        label: suggestion.label || "Room",
        name: suggestion.name || getNextRoomLabelName(suggestion.label || "Room"),
        type: "flooring",
        polygon: polygon,
        points: polygon.slice(),
        areaM2: roundTo(Number(suggestion.areaM2) || 0, 2),
        included: true,
        includeInQuote: true,
        confidence: suggestion.confidence || "Low",
        confidenceLabel: getConfidenceCustomerLabel(suggestion.confidence || "Low"),
        confidenceReasons: Array.isArray(suggestion.confidenceReasons) ? suggestion.confidenceReasons.slice() : [],
        editable: true,
        centroid: calculatePolygonCentroid(polygon),
        createdAt: suggestion.createdAt || new Date().toISOString()
      };
    }

    function acceptQuickRoom(options) {
      const suggestion = quickRoomState.activeSuggestion;
      if (!suggestion || !suggestion.polygon || suggestion.polygon.length < 3 || !(suggestion.areaM2 > 0)) {
        setCanvasStatus("No usable quick room suggestion is ready yet.", { forceVisible: true });
        return;
      }
      if (suggestion.confidence === "Low" && !(options && options.allowLowConfidence)) {
        setCanvasStatus("This quick suggestion is low confidence. Use Edit manually or Manual Trace.", { forceVisible: true });
        return;
      }

      const room = buildQuickRoomFromSuggestion(suggestion);
      if(!addMeasuredRoom(room))return;
      state.roomCounter += 1;
      selectRoom(room.id);
      clearQuickSuggestion();
      saveDraftState();
      renderCanvas();
      renderRoomsTable();
      setTraceStatus(options && options.edit
        ? "Quick room added. Drag a corner or edge handle to edit the outline manually."
        : "Quick room added. Confirm the included rooms before sending the measured area into your quote.");
      setCanvasStatus("Quick room added: " + formatArea(room.areaM2) + ".");
      setGlobalStatus("Quick room added: " + formatArea(room.areaM2));
      if (window.OzFloorplanTracking) {
        window.OzFloorplanTracking.trackEvent("floorplan_quick_room_accepted", {
          measurement_mode: "quick_room",
          confidence_level: room.confidence || ""
        });
        window.OzFloorplanTracking.trackFloorplanRoomAdded(room.areaM2, "quick_room");
      }
    }

    function editQuickRoomSuggestion() {
      acceptQuickRoom({ edit: true, allowLowConfidence: true });
    }

    function discardQuickRoomSuggestion() {
      clearQuickSuggestion();
      renderCanvas();
      setCanvasStatus("Quick room suggestion discarded. Click inside another room or use Manual Trace.");
    }

    function buildQuickRoomFromCandidate(candidate, index) {
      const polygon = (candidate.polygon || []).map(function (point) {
        return {
          x: roundTo(point.x, 3),
          y: roundTo(point.y, 3)
        };
      });
      const isHighConfidence = candidate.confidence === "High";
      return {
        id: "room-" + Date.now() + "-" + candidate.id + "-" + Math.random().toString(36).slice(2, 5),
        source: "quick_room",
        origin: "suggest_all",
        candidateId: candidate.id,
        name: candidate.displayName || ("Area " + (index + 1)),
        label: candidate.label || "Unknown",
        type: "flooring",
        polygon: polygon,
        points: polygon.slice(),
        areaM2: roundTo(Number(candidate.areaM2) || 0, 2),
        included: isHighConfidence && candidate.included !== false,
        includeInQuote: isHighConfidence && candidate.included !== false,
        confidence: candidate.confidence || "Low",
        confidenceLabel: candidate.confidenceLabel || getConfidenceCustomerLabel(candidate.confidence || "Low"),
        confidenceReasons: Array.isArray(candidate.confidenceReasons) ? candidate.confidenceReasons.slice() : [],
        editable: candidate.editable !== false,
        centroid: calculatePolygonCentroid(polygon),
        createdAt: new Date().toISOString()
      };
    }

    function suggestAllAreas() {
      const imageData = getQuickRoomImageData();
      if (!imageData || !QUICK_ROOM || typeof QUICK_ROOM.detectAllRoomCandidatesFromImageData !== "function") {
        return;
      }

      const existingSuggestedRooms = state.rooms.filter(function (room) {
        return room.source === "quick_room" && room.origin === "suggest_all";
      });
      if (existingSuggestedRooms.length) {
        const confirmed = window.confirm("Replace the current suggested areas with a new set?");
        if (!confirmed) {
          return;
        }
        state.rooms = state.rooms.filter(function (room) {
          return !(room.source === "quick_room" && room.origin === "suggest_all");
        });
      }

      quickRoomState.activeSuggestion = null;
      quickRoomState.pendingMergeRoomId = "";
      quickRoomState.detectionStatus = "Finding suggested areas";
      if (window.OzFloorplanTracking) {
        window.OzFloorplanTracking.trackEvent("floorplan_suggest_all_started", {
          measurement_mode: "suggest_all"
        });
      }
      renderQuickSuggestionPanel();
      renderQuickRoomStatus();

      const candidates = QUICK_ROOM.detectAllRoomCandidatesFromImageData(
        imageData,
        quickRoomState.originalCanvas.width,
        quickRoomState.originalCanvas.height,
        {
          pixelsPerMetre: state.pixelsPerMetre,
          threshold: quickRoomState.settings.threshold,
          wallCloseRadius: 2,
          minAreaM2: 1,
          maxAreaM2: 150,
          maxCandidates: 36
        }
      );

      quickRoomState.suggestedRooms = candidates.slice();
      const candidateRooms = candidates.map(buildQuickRoomFromCandidate);
      let autoIncludedCount = candidateRooms.filter(function (room) {
        return room.includeInQuote;
      }).length;
      const accepted=[];for(const candidate of candidateRooms){if(addMeasuredRoom(candidate))accepted.push(candidate);}
      candidateRooms.splice(0,candidateRooms.length,...accepted);autoIncludedCount=accepted.filter(room=>room.includeInQuote).length;
      state.selectedRoomId = candidateRooms.length ? candidateRooms[0].id : "";
      quickRoomState.detectionStatus = candidateRooms.length
        ? candidateRooms.length + " suggested area" + (candidateRooms.length === 1 ? "" : "s") + " found"
        : "No suggested areas found";
      saveDraftState();
      renderCanvas();
      renderRoomsTable();
      renderQuickRoomStatus();
      setCanvasStatus(candidateRooms.length
        ? "Suggested areas added. " + autoIncludedCount + " high-confidence area" + (autoIncludedCount === 1 ? " is" : "s are") + " included by default. Review, include, edit, merge or delete before using the area in quote."
        : "No clear suggested areas were found. Use Manual Trace for this plan.", { forceVisible: !candidateRooms.length });
      setTraceStatus({ next: true, text: "Review suggested areas before using them in your quote." });
      if (window.OzFloorplanTracking) {
        window.OzFloorplanTracking.trackEvent("floorplan_suggest_all_completed", {
          measurement_mode: "suggest_all",
          confidence_level: autoIncludedCount > 0 ? "high" : "low"
        });
      }
    }

    function mergeQuickRoom(roomId) {
      const room = state.rooms.find(function (item) {
        return item.id === roomId;
      });
      if (!room || room.source !== "quick_room") {
        return;
      }

      if (!quickRoomState.pendingMergeRoomId || quickRoomState.pendingMergeRoomId === roomId) {
        quickRoomState.pendingMergeRoomId = roomId;
        selectRoom(roomId);
        setTraceStatus("Merge started. Press Merge on another suggested area to combine the two outlines.");
        return;
      }

      const anchor = state.rooms.find(function (item) {
        return item.id === quickRoomState.pendingMergeRoomId;
      });
      if (!anchor || anchor.source !== "quick_room") {
        quickRoomState.pendingMergeRoomId = roomId;
        selectRoom(roomId);
        setTraceStatus("Merge started. Press Merge on another suggested area to combine the two outlines.");
        return;
      }

      const mergedPoints = polygonFromPointBounds(getPointBounds(anchor.points.concat(room.points)));
      const mergedAreaM2 = roundTo(convertPixelAreaToSquareMeters(calculatePolygonAreaPx(mergedPoints)), 2);
      const mergedRoom = {
        id: "room-" + Date.now() + "-merged-" + Math.random().toString(36).slice(2, 6),
        source: "quick_room",
        origin: "suggest_all",
        name: anchor.name + " + " + room.name,
        label: "Unknown",
        type: "flooring",
        polygon: mergedPoints,
        points: mergedPoints.slice(),
        areaM2: mergedAreaM2,
        included: !!(anchor.includeInQuote || room.includeInQuote),
        includeInQuote: !!(anchor.includeInQuote || room.includeInQuote),
        confidence: "Medium",
        confidenceLabel: getConfidenceCustomerLabel("Medium"),
        confidenceReasons: ["Merged from suggested areas. Review the outline before using it in your quote."],
        editable: true,
        centroid: calculatePolygonCentroid(mergedPoints),
        createdAt: new Date().toISOString()
      };

      const beforeMerge=state.rooms.slice();
      state.rooms = state.rooms.filter(function (item) {
        return item.id !== anchor.id && item.id !== room.id;
      });
      if(!addMeasuredRoom(mergedRoom)){state.rooms=beforeMerge;return;}
      quickRoomState.pendingMergeRoomId = "";
      selectRoom(mergedRoom.id);
      saveDraftState();
      renderCanvas();
      renderRoomsTable();
      setTraceStatus("Suggested areas merged. Drag handles to refine the merged outline if needed.");
    }

    function splitQuickRoomManually(roomId) {
      quickRoomState.pendingMergeRoomId = "";
      setMode("trace");
      selectRoom(roomId);
      setTraceStatus({ next: true, text: "Split manually: adjust or delete this suggested area, then use Manual Trace to draw separate zones." });
      setCanvasStatus("Manual Trace is ready for splitting or replacing the suggested area.");
    }

    function renderQuickPreview() {
      const targetContext = quickRoomState.ctx;
      targetContext.clearRect(0, 0, quickRoomState.canvas.width, quickRoomState.canvas.height);
      targetContext.fillStyle = "#f8fafc";
      targetContext.fillRect(0, 0, quickRoomState.canvas.width, quickRoomState.canvas.height);
    }

    function initQuickRoomMode() {
      if (dom.quickContrastSlider) {
        quickRoomState.settings.contrast = Number(dom.quickContrastSlider.value) / 100;
      }
      if (dom.quickThresholdSlider) {
        quickRoomState.settings.threshold = Number(dom.quickThresholdSlider.value);
      }
      if (dom.quickNoiseSlider) {
        quickRoomState.settings.noisePasses = Number(dom.quickNoiseSlider.value);
      }
      loadFloorplanImage();
      renderQuickRoomStatus();
      renderQuickPreview();
    }

    function createEmptyCanvasState() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#f8fafc";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(16,24,40,0.86)";
      context.font = "700 30px Inter, sans-serif";
      context.fillText("Upload a floor plan to begin", 80, 120);
      context.font = "500 18px Inter, sans-serif";
      context.fillStyle = "rgba(102,112,133,0.92)";
      context.fillText("Set scale, trace rooms, and send measured area into quote.", 80, 154);
    }

    function drawImageFit(image) {
      const ratio = Math.min(canvas.width / image.width, canvas.height / image.height);
      const drawWidth = image.width * ratio;
      const drawHeight = image.height * ratio;
      const drawX = (canvas.width - drawWidth) / 2;
      const drawY = (canvas.height - drawHeight) / 2;
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      return {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight
      };
    }

    function drawPolygon(points, fill, stroke, lineWidth) {
      if (!points.length) {
        return;
      }
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        context.lineTo(points[index].x, points[index].y);
      }
      context.closePath();
      context.fillStyle = fill;
      context.strokeStyle = stroke;
      context.lineWidth = lineWidth || 3;
      context.fill();
      context.stroke();
    }

    function getRoomCanvasVisual(room) {
      if (room && room.source === "quick_room") {
        const included = room.includeInQuote !== false;
        if (room.confidence === "High") {
          return {
            fill: included ? "rgba(15, 118, 110, 0.24)" : "rgba(15, 118, 110, 0.09)",
            stroke: "rgba(15, 118, 110, 0.92)",
            dashed: !included
          };
        }
        if (room.confidence === "Medium") {
          return {
            fill: included ? "rgba(245, 158, 11, 0.22)" : "rgba(245, 158, 11, 0.08)",
            stroke: "rgba(180, 83, 9, 0.9)",
            dashed: !included
          };
        }
        return {
          fill: included ? "rgba(180, 83, 9, 0.18)" : "rgba(180, 83, 9, 0.07)",
          stroke: "rgba(154, 52, 18, 0.86)",
          dashed: true
        };
      }
      return roomVisuals[room.type] || roomVisuals.flooring;
    }

    function drawRooms() {
      state.rooms.forEach(function (room) {
        const visual = getRoomCanvasVisual(room);
        const isSelected = room.id === state.selectedRoomId;
        context.save();
        if (visual.dashed) {
          context.setLineDash([10, 8]);
        }
        drawPolygon(room.points, visual.fill, visual.stroke, isSelected ? 4 : 3);
        context.restore();

        const centroid = room.centroid;
        if (centroid) {
          const label = formatCanvasRoomLabel(room);
          context.font = "600 14px Inter, sans-serif";
          const textWidth = context.measureText(label).width;
          const bubbleWidth = textWidth + 18;
          const bubbleHeight = 30;
          const bubbleX = centroid.x - (bubbleWidth / 2);
          const bubbleY = centroid.y - (bubbleHeight / 2);
          context.fillStyle = "rgba(255,255,255,0.92)";
          context.strokeStyle = "rgba(16,24,40,0.08)";
          context.lineWidth = 1;
          context.beginPath();
          context.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 14);
          context.fill();
          context.stroke();
          context.fillStyle = "rgba(16,24,40,0.88)";
          context.fillText(label, bubbleX + 9, bubbleY + 19);
        }

        if (isSelected) {
          const edgeMidpoints = getEdgeMidpoints(room.points);
          room.points.forEach(function (point) {
            context.beginPath();
            context.fillStyle = "rgba(255,255,255,0.98)";
            context.strokeStyle = "rgba(15,118,110,0.9)";
            context.lineWidth = 2.5;
            context.arc(point.x, point.y, 7, 0, Math.PI * 2);
            context.fill();
            context.stroke();
          });

          edgeMidpoints.forEach(function (point) {
            context.beginPath();
            context.fillStyle = "rgba(255,255,255,0.96)";
            context.strokeStyle = "rgba(31,111,139,0.86)";
            context.lineWidth = 2;
            context.arc(point.x, point.y, 5.5, 0, Math.PI * 2);
            context.fill();
            context.stroke();
          });
        }
      });
    }

    function drawQuickSuggestionPreview() {
      const suggestion = quickRoomState.activeSuggestion;
      if (state.mode !== "quick" || !suggestion || !suggestion.polygon || suggestion.polygon.length < 3) {
        return;
      }

      const isLowConfidence = suggestion.confidence === "Low";
      context.save();
      context.setLineDash(isLowConfidence ? [10, 8] : []);
      drawPolygon(
        suggestion.polygon,
        isLowConfidence ? "rgba(245, 158, 11, 0.16)" : "rgba(31, 111, 139, 0.18)",
        isLowConfidence ? "rgba(180, 83, 9, 0.95)" : "rgba(31, 111, 139, 0.95)",
        4
      );
      context.setLineDash([]);

      const centroid = calculatePolygonCentroid(suggestion.polygon);
      if (centroid) {
        const label = "Suggested " + formatArea(suggestion.areaM2);
        context.font = "700 14px Inter, sans-serif";
        const textWidth = context.measureText(label).width;
        const bubbleWidth = textWidth + 22;
        const bubbleHeight = 32;
        context.fillStyle = "rgba(255,255,255,0.96)";
        context.strokeStyle = "rgba(31,111,139,0.22)";
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(centroid.x - (bubbleWidth / 2), centroid.y - (bubbleHeight / 2), bubbleWidth, bubbleHeight, 16);
        context.fill();
        context.stroke();
        context.fillStyle = isLowConfidence ? "rgba(146, 64, 14, 0.95)" : "rgba(16,24,40,0.9)";
        context.fillText(label, centroid.x - (bubbleWidth / 2) + 11, centroid.y + 5);
      }
      context.restore();
    }

    function drawScaleDraft() {
      if (state.scalePoints.length === 1) {
        const point = state.scalePoints[0];
        context.beginPath();
        context.fillStyle = "rgba(31,111,139,0.96)";
        context.arc(point.x, point.y, 6, 0, Math.PI * 2);
        context.fill();
        return;
      }

      if (state.scalePoints.length === 2) {
        context.beginPath();
        context.strokeStyle = "rgba(31,111,139,0.96)";
        context.lineWidth = 3;
        context.moveTo(state.scalePoints[0].x, state.scalePoints[0].y);
        context.lineTo(state.scalePoints[1].x, state.scalePoints[1].y);
        context.stroke();

        state.scalePoints.forEach(function (point) {
          context.beginPath();
          context.fillStyle = "rgba(31,111,139,0.96)";
          context.arc(point.x, point.y, 6, 0, Math.PI * 2);
          context.fill();
        });
      }
    }

    function drawTraceDraft() {
      if (!state.tracePoints.length) {
        return;
      }

      context.beginPath();
      context.strokeStyle = "rgba(15,118,110,0.96)";
      context.lineWidth = 3;
      context.moveTo(state.tracePoints[0].x, state.tracePoints[0].y);
      for (let index = 1; index < state.tracePoints.length; index += 1) {
        context.lineTo(state.tracePoints[index].x, state.tracePoints[index].y);
      }
      context.stroke();

      state.tracePoints.forEach(function (point, index) {
        context.beginPath();
        context.fillStyle = index === 0 ? "rgba(6,118,71,0.96)" : "rgba(15,118,110,0.96)";
        context.arc(point.x, point.y, index === 0 ? 7 : 5, 0, Math.PI * 2);
        context.fill();
      });

      if (state.tracePoints.length >= 3) {
        const start = state.tracePoints[0];
        context.beginPath();
        context.strokeStyle = "rgba(6,118,71,0.65)";
        context.setLineDash([6, 6]);
        context.arc(start.x, start.y, AUTO_CLOSE_THRESHOLD_PX, 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);
      }
    }

    function renderCanvas() {
      refreshTraceStepUi();
      renderTraceDetails();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#f8fafc";
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (!state.image) {
        createEmptyCanvasState();
        return;
      }

      drawImageFit(state.image);
      drawRooms();
      drawQuickSuggestionPreview();
      drawScaleDraft();
      drawTraceDraft();
    }

    function calculatePolygonAreaPx(points) {
      if (points.length < 3) {
        return 0;
      }
      let area = 0;
      for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        area += (current.x * next.y) - (next.x * current.y);
      }
      return Math.abs(area) / 2;
    }

    function calculatePolygonCentroid(points) {
      if (!points.length) {
        return null;
      }
      const totals = points.reduce(function (carry, point) {
        return {
          x: carry.x + point.x,
          y: carry.y + point.y
        };
      }, { x: 0, y: 0 });
      return {
        x: totals.x / points.length,
        y: totals.y / points.length
      };
    }

    function convertPixelAreaToSquareMeters(areaPx) {
      if (!state.pixelsPerMetre) {
        return 0;
      }
      return areaPx / (state.pixelsPerMetre * state.pixelsPerMetre);
    }

    function calculateSelectedTotalArea() {
      return roundTo(state.rooms.reduce(function (sum, room) {
        return room.includeInQuote ? sum + room.areaM2 : sum;
      }, 0), 2);
    }

    function renderRoomsTable() {
      refreshTraceStepUi();
      const flooringIncludedCount = state.rooms.filter(function (room) {
        return room.includeInQuote;
      }).length;
      const excludedCount = state.rooms.length - flooringIncludedCount;
      const selectedTotalArea = calculateSelectedTotalArea();
      state.selectedTotalArea = selectedTotalArea;

      dom.selectedAreaTotal.textContent = formatArea(selectedTotalArea);
      dom.roomsCountText.textContent = state.rooms.length + " measured room" + (state.rooms.length === 1 ? "" : "s");
      dom.flooringCount.textContent = String(flooringIncludedCount);
      dom.excludedCount.textContent = String(excludedCount);
      dom.scaleReadout.textContent = state.pixelsPerMetre
        ? roundTo(state.pixelsPerMetre, 2) + " px/m"
        : "Not set";
      dom.useAreaInQuoteButton.disabled = !(selectedTotalArea > 0);
      renderScaleDetails();
      renderSuggestedAreaSummary();

      if (!state.rooms.length) {
        dom.roomsTable.innerHTML = "<p class=\"helper\">No rooms saved yet.</p>";
        renderMeasurementGuidance();
        return;
      }

      dom.roomsTable.innerHTML = state.rooms.map(function (room) {
        const selectedClass = room.id === state.selectedRoomId ? ' data-selected="true"' : "";
        const isQuickRoom = room.source === "quick_room";
        const sourceLabel = isQuickRoom && room.origin === "suggest_all" ? "Suggested" : isQuickRoom ? "Quick" : "Manual";
        const confidenceLabel = room.source === "quick_room"
          ? "Confidence: " + escapeHtml(getConfidenceCustomerLabel(room.confidence || "Medium"))
          : "Manual trace";
        const mergeActive = quickRoomState.pendingMergeRoomId === room.id ? "Merge target" : "Merge";
        return `
          <div class="room-row" data-room-id="${room.id}"${selectedClass}>
            <div class="room-main">
              <input type="text" aria-label="Room name" maxlength="48" value="${escapeHtml(room.name)}" data-room-field="name">
              <div class="room-meta">
                <span>${escapeHtml(room.label || "Room")}</span>
                <span>${sourceLabel}</span>
                <span>${escapeHtml(room.type === "flooring" ? "Flooring area" : room.type === "wet" ? "Wet area / exclude" : "Outdoor / exclude")}</span>
                <span>${confidenceLabel}</span>
                <strong>${formatArea(room.areaM2)}</strong>
              </div>
            </div>
            <div class="room-side">
              <label class="room-toggle">
                <input type="checkbox" data-room-field="include" ${room.includeInQuote ? "checked" : ""}>
                <span>Include in quote</span>
              </label>
              <button class="button-secondary" type="button" data-room-action="edit">Edit</button>
              ${isQuickRoom ? '<button class="button-secondary" type="button" data-room-action="merge">' + mergeActive + '</button>' : ""}
              ${isQuickRoom ? '<button class="button-secondary" type="button" data-room-action="split">Split manually</button>' : ""}
              <button class="room-delete" type="button" data-room-action="delete">Delete</button>
            </div>
          </div>
        `;
      }).join("");
      renderMeasurementGuidance();
    }

    function setMode(mode) {
      state.mode = mode;
      clearQuickSuggestion();
      if (mode === "quick") {
        state.activeTool = "idle";
        state.tracePoints = [];
      }
      dom.modeButtons.forEach(function (button) {
        button.classList.toggle("active", button.dataset.mode === mode);
      });
      Object.keys(dom.modePanels).forEach(function (key) {
        dom.modePanels[key].classList.toggle("active", key === mode);
      });

      if (mode === "trace") {
        setGlobalStatus("Set scale first, then trace each flooring room. When you return near the start point, the room closes automatically.");
      } else {
        initQuickRoomMode();
        setGlobalStatus("Quick Room Mode is ready. Set scale first, then click inside a room and review the suggested outline.");
      }
      renderCanvas();
      renderQuickRoomStatus();
      renderQuickPreview();
    }

    function refreshTraceStepUi() {
      if (!state.image) {
        dom.setScaleButton.textContent = "Step 1. Set scale";
        dom.setScaleButton.disabled = true;
        dom.setScaleButton.classList.add("button-step-active");
        if (dom.verifyScaleButton) {
          dom.verifyScaleButton.disabled = true;
        }
        dom.resetScaleButton.disabled = true;
        dom.startTraceButton.disabled = true;
        dom.startTraceButton.classList.remove("button-step-active");
        dom.undoTracePointButton.disabled = true;
        dom.clearTraceButton.disabled = true;
        if (dom.finishTraceButton) {
          dom.finishTraceButton.disabled = true;
        }
        return;
      }

      const scaleReady = !!state.pixelsPerMetre;
      const traceActive = state.activeTool === "trace";
      const scaleActive = state.activeTool === "scale";
      const hasTracePoints = state.tracePoints.length > 0;
      dom.setScaleButton.textContent = scaleReady ? "Step 1. Scale set" : "Step 1. Set scale";
      dom.setScaleButton.disabled = scaleReady;
      dom.setScaleButton.classList.toggle("button-step-active", !scaleReady || scaleActive);
      if (dom.verifyScaleButton) {
        dom.verifyScaleButton.disabled = !scaleReady;
        dom.verifyScaleButton.classList.toggle("button-step-active", state.activeTool === "verify_scale");
      }
      dom.resetScaleButton.disabled = !scaleReady;
      dom.startTraceButton.disabled = !scaleReady;
      dom.startTraceButton.classList.toggle("button-step-active", scaleReady && !traceActive);
      dom.undoTracePointButton.disabled = !(traceActive && hasTracePoints);
      dom.clearTraceButton.disabled = !(traceActive && hasTracePoints);
      if (dom.finishTraceButton) {
        dom.finishTraceButton.disabled = !(traceActive && state.tracePoints.length >= 3);
      }
    }

    async function handlePlanUpload(file) {
      if (!file) return;
      const reconnecting=!state.image&&state.rooms.length>0;
      const replacing=!!state.image&&state.rooms.length>0;
      if (replacing&&!confirm('Uploading a new floor plan will remove the current measurements. Continue?')) {dom.planUpload.value='';return;}
      const ticket=++loadTicket;loadController?.abort();loadController=new AbortController();
      const previous=activeRaster;setUploadStatus('Opening plan…');
      try {
        const result=await loadPlan(file,reconnecting?(state.pageNumber||1):1,loadController.signal);
        const planHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');
        if(ticket!==loadTicket){result.canvas.width=0;result.canvas.height=0;return;}
        if(reconnecting&&state.planHash!==planHash){result.canvas.width=0;result.canvas.height=0;throw Error('Choose the same plan to resume these measurements, or choose Start a new measurement.');}
        if(replacing){clearRoomsTable();clearScaleState();state.selectedRoomId='';}
        state.file=file;state.pageNumber=result.pageNumber;state.planHash=planHash;state.fileName=file.name||'Uploaded plan';state.image=result.canvas;state.imageElement=result.canvas;state.imageLoaded=true;activeRaster=result.canvas;dom.resumeMeasurementBanner.classList.add('hidden');
        resizeCanvasForImage(result.canvas,{previousWidth:reconnecting?state.restoredCanvasWidth:canvas.width,previousHeight:reconnecting?state.restoredCanvasHeight:canvas.height,scaleGeometry:reconnecting});
        if(previous&&previous!==activeRaster){previous.width=0;previous.height=0;}
        clearTraceState();saveDraftState();initQuickRoomMode();renderFloorplanPreview();
        setUploadStatus((reconnecting?'Plan reconnected: ':'Loaded floor plan: ')+state.fileName+'.'+(result.pageCount>1?' Page '+result.pageNumber+' of '+result.pageCount+'. Use PDF page to select another.':''));
        configurePdfPages(result.pageCount,result.pageNumber,file);setGlobalStatus('Plan opened. Set scale, then trace the flooring rooms.');scrollToWorkspace();
      } catch(error) { if(ticket===loadTicket){setUploadStatus(error.message+(state.image?' Your previous plan and measurements are unchanged.':''));setCanvasStatus('Choose a valid JPG, PNG or PDF to try again, or continue with an enquiry.',{forceVisible:true});} }
      finally {if(ticket===loadTicket)dom.planUpload.value='';}
    }

    function startScaleMode() {
      if (!state.image) {
        setCanvasStatus("Upload a floor plan first.");
        return;
      }
      state.activeTool = "scale";
      state.scaleModalMode = "set";
      state.scalePoints = [];
      state.tracePoints = [];
      state.dragTarget = null;
      renderCanvas();
      setTraceStatus({ next: true, text: "Scale mode is on. Click the first point on a known wall." });
      setCanvasStatus("Scale mode is active. Click two points on a known wall.");
      if (window.OzFloorplanTracking) {
        window.OzFloorplanTracking.trackEvent("floorplan_scale_started", {
          measurement_mode: "manual_scale"
        });
      }
    }

    function startScaleVerificationMode() {
      if (!state.image) {
        setCanvasStatus("Upload a floor plan first.");
        return;
      }
      if (!state.pixelsPerMetre) {
        setCanvasStatus("Set scale before verifying it.", { forceVisible: true });
        setTraceStatus({ next: true, text: "Set scale first, then verify with another wall if possible." });
        return;
      }
      state.activeTool = "verify_scale";
      state.scaleModalMode = "verify";
      state.scalePoints = [];
      state.tracePoints = [];
      state.dragTarget = null;
      renderCanvas();
      setTraceStatus({ next: true, text: "Verification mode is on. Click two points on another known wall." });
      setCanvasStatus("Click two points on another known wall to check the scale.");
    }

    function handleScalePointClick(point) {
      state.scalePoints.push(point);
      if (state.scalePoints.length === 1) {
        setTraceStatus({ next: true, text: "Now click the second point on the same wall." });
        renderCanvas();
        return;
      }

      const distancePx = distanceBetweenPoints(state.scalePoints[0], state.scalePoints[1]);
      state.pendingScaleDistancePx = distancePx;
      openScaleDistanceModal(state.scaleModalMode || "set");
      renderCanvas();
    }

    function openScaleDistanceModal(mode) {
      state.scaleModalMode = mode || "set";
      if (dom.scaleModalTitle) {
        dom.scaleModalTitle.textContent = state.scaleModalMode === "verify"
          ? "Verify real distance in metres"
          : "Enter real distance in metres";
      }
      if (dom.scaleModalHelp) {
        dom.scaleModalHelp.textContent = state.scaleModalMode === "verify"
          ? "Enter the real distance for this second wall. Oz Timber Floor will compare it with the current scale."
          : "Example: 4.4";
      }
      scaleFocus=document.activeElement;dom.scaleModal.showModal();dom.scaleModal.classList.add("active");
      dom.scaleDistanceInput.value = "";
      dom.scaleDistanceInput.focus();
    }

    function closeScaleModal() {
      dom.scaleModal.classList.remove("active");dom.scaleModal.close();queueMicrotask(()=>{const target=scaleFocus?.isConnected&&!scaleFocus.disabled?scaleFocus:dom.startTraceButton;target?.focus();});
    }

    function confirmScale(distanceMeters) {
      if (!Number.isFinite(distanceMeters) || distanceMeters>1000 || !(distanceMeters > 0) || !(state.pendingScaleDistancePx >= 2)) {
        setTraceStatus("Enter a valid wall distance in metres.");
        return;
      }
      const quality = QUICK_ROOM && typeof QUICK_ROOM.assessScaleQuality === "function"
        ? QUICK_ROOM.assessScaleQuality(state.pendingScaleDistancePx, distanceMeters)
        : {
          status: distanceMeters < 2 || state.pendingScaleDistancePx < 80 ? "verification_recommended" : "set",
          warnings: [
            distanceMeters < 2 ? "Use a longer known wall where possible. Short calibration distances can reduce accuracy." : "",
            state.pendingScaleDistancePx < 80 ? "Calibration points are too close. Choose a longer wall or larger dimension." : ""
          ].filter(Boolean),
          pixelsPerMetre: state.pendingScaleDistancePx / distanceMeters
        };

      if (state.scaleModalMode === "verify" && state.pixelsPerMetre) {
        const verifiedPixelsPerMetre = quality.pixelsPerMetre || 0;
        const variance = verifiedPixelsPerMetre > 0
          ? Math.abs(verifiedPixelsPerMetre - state.pixelsPerMetre) / state.pixelsPerMetre
          : 1;
        if (variance <= 0.05) {
          state.scaleStatus = "verified";
          state.scaleVerified = true;
          state.scaleWarnings = [];
          setTraceStatus({ next: true, text: "Scale verified. Press Step 2. Trace room to start tracing." });
          setCanvasStatus("Scale verified against another wall.");
          setGlobalStatus("Scale verified.");
        } else {
          state.scaleStatus = "needs_review";
          state.scaleVerified = false;
          state.scaleWarnings = ["Scale verification differs by " + roundTo(variance * 100, 1) + "%. Reset scale if the original wall distance was not reliable."];
          setTraceStatus({ next: true, text: "Scale needs review. Reset scale if the first known distance may be wrong." });
          setCanvasStatus("Scale verification differed from the current scale. Review before using the area.", { forceVisible: true });
          setGlobalStatus("Scale needs review.");
        }
        state.pendingScaleDistancePx = 0;
        state.activeTool = "idle";
        state.scalePoints = [];
        closeScaleModal();
        saveDraftState();
        renderCanvas();
          renderRoomsTable();
          initQuickRoomMode();
          if (window.OzFloorplanTracking) {
            window.OzFloorplanTracking.trackEvent("floorplan_scale_verified", {
              confidence_level: state.scaleStatus === "verified" ? "high" : "low",
              measurement_mode: "verify_scale"
            });
          }
          return;
        }

      state.pixelsPerMetre = quality.pixelsPerMetre || (state.pendingScaleDistancePx / distanceMeters);
      state.scaleStatus = quality.status || "set";
      state.scaleWarnings = Array.isArray(quality.warnings) ? quality.warnings.slice() : [];
      state.scaleVerified = false;
      state.lastScaleDistanceMeters = distanceMeters;
      state.lastScaleDistancePx = state.pendingScaleDistancePx;
      state.pendingScaleDistancePx = 0;
      state.activeTool = "idle";
      state.scalePoints = [];
      state.scaleModalMode = "set";
      closeScaleModal();
      saveDraftState();
      renderCanvas();
      renderRoomsTable();
      initQuickRoomMode();
      setTraceStatus({ next: true, text: state.scaleWarnings.length ? "Scale saved. Verification is recommended before using suggested areas." : "Scale saved. Press Step 2. Trace room to start tracing." });
      setCanvasStatus(state.scaleWarnings.length
        ? "Scale saved, but verification is recommended before using suggested areas."
        : "Scale confirmed. Trace around a room, then return near the start point to close it.");
      setGlobalStatus(state.scaleWarnings.length ? "Scale set. Verification recommended." : "Scale set. You can now trace rooms.");
      if (window.OzFloorplanTracking) {
        window.OzFloorplanTracking.trackFloorplanScaleSet(distanceMeters);
      }
    }

    function resetScale() {
      if(state.rooms.length&&!confirm("Resetting scale clears the measured rooms. Continue?"))return;
      clearRoomsTable();
      clearScaleState();
      state.activeTool = "idle";
      saveDraftState();
      renderCanvas();
      renderRoomsTable();
      initQuickRoomMode();
      setTraceStatus({ next: true, text: "Scale cleared. Press Step 1. Set scale to start again." });
      setCanvasStatus("Scale cleared. Set scale before tracing rooms.");
    }

    function startTraceMode() {
      if (!state.image) {
        setCanvasStatus("Upload a floor plan first.");
        return;
      }
      if (!state.pixelsPerMetre) {
        setCanvasStatus("Press Set scale before tracing a room.");
        setTraceStatus({ next: true, text: "Start with Step 1. Press Set scale first." });
        return;
      }
      state.activeTool = "trace";
      state.tracePoints = [];
      state.dragTarget = null;
      renderCanvas();
      setTraceStatus({ next: true, text: "Trace around the room boundary. Return near the first point to close it." });
      setCanvasStatus("Trace mode is active. Click around the room boundary.");
      if (window.OzFloorplanTracking) {
        window.OzFloorplanTracking.trackEvent("floorplan_manual_trace_started", {
          measurement_mode: "manual_trace"
        });
      }
    }

    function shouldAutoClosePolygon(points, newPoint) {
      if (points.length < 3) {
        return false;
      }
      return distanceBetweenPoints(points[0], newPoint) <= AUTO_CLOSE_THRESHOLD_PX;
    }

    function handleTracePointClick(point) {
      if (!state.pixelsPerMetre) {
        setCanvasStatus("Press Set scale before tracing a room.");
        setTraceStatus({ next: true, text: "Start with Step 1. Press Set scale first." });
        return;
      }

      if (shouldAutoClosePolygon(state.tracePoints, point)) {
        closeAndSavePolygon();
        return;
      }

      if(state.tracePoints.length>=128){setTraceStatus("Use no more than 128 corners per room.");return;}
      state.tracePoints.push(point);
      renderCanvas();
      renderTraceDetails();
      if (state.tracePoints.length < 3) {
        setTraceStatus({ next: true, text: "Keep tracing around the room. Return near the first point to close it." });
      } else {
        setTraceStatus({ next: true, text: "Return near the first point to close the room automatically." });
      }
    }

    function closeAndSavePolygon() {
      if (state.tracePoints.length < 3) {
        setTraceStatus("Add at least three points before closing the room.");
        return;
      }

      try {validateRoom(state.tracePoints);} catch(error){setTraceStatus(error.message);return;}
      const areaPx = calculatePolygonAreaPx(state.tracePoints);
      const areaM2 = roundTo(convertPixelAreaToSquareMeters(areaPx), 2);

      if (!(areaM2 > 0)) {
        setTraceStatus("Could not calculate room area. Check the scale and try again.");
        return;
      }
      if (areaM2 < 1 && !window.confirm("This room is under 1 m². Save it anyway?")) {
        setTraceStatus("Room not saved. Continue tracing or clear the trace.");
        return;
      }
      if (areaM2 > 150 && !window.confirm("This room is over 150 m². Save it anyway?")) {
        setTraceStatus("Room not saved. Review the outline before saving.");
        return;
      }

      const roomLabel = getSelectedRoomLabel();
      const preferredName = dom.traceRoomName ? dom.traceRoomName.value.trim() : "";
      const roomName = preferredName || (roomLabel === "Other" ? "Other room" : getNextRoomLabelName(roomLabel)) || getNextRoomName();
      const roomType = "flooring";

      addMeasuredRoom({
        id: "room-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        source: "manual_trace",
        name: roomName,
        label: roomLabel,
        type: roomType,
        areaM2: areaM2,
        points: state.tracePoints.slice(),
        polygon: state.tracePoints.slice(),
        centroid: calculatePolygonCentroid(state.tracePoints),
        includeInQuote: getDefaultIncludeForType(roomType),
        included: getDefaultIncludeForType(roomType),
        confidence: "Manual",
        confidenceReasons: ["Manual trace confirmed by customer."],
        createdAt: new Date().toISOString()
      });

      state.tracePoints = [];
      state.activeTool = "trace";
      if (dom.traceRoomName) {
        dom.traceRoomName.value = "";
      }
      state.roomCounter += 1;
      selectRoom(state.rooms[state.rooms.length - 1].id);
      renderCanvas();
      renderRoomsTable();
      saveDraftState();
      setTraceStatus({ next: true, text: "Room added: " + formatArea(areaM2) + ". Press Step 2. Trace room for the next room." });
      setCanvasStatus("Room added. Trace the next room or use the area in quote.");
      setGlobalStatus("Room added: " + formatArea(areaM2));
      if (window.OzFloorplanTracking) {
        window.OzFloorplanTracking.trackFloorplanRoomAdded(areaM2, roomType);
      }
    }

    function addMeasuredRoom(room) {try{validateRoom(room.points,room.id);if(state.rooms.length>=250)throw Error('A plan can contain up to 250 rooms.');room.areaM2=roundTo(roomArea(room.points,1/state.pixelsPerMetre),2);state.rooms.push(room);return true;}catch(error){setTraceStatus(error.message);setCanvasStatus(error.message,{forceVisible:true});return false;} }

    function undoTracePoint() {
      if (!state.tracePoints.length) {
        return;
      }
      state.tracePoints.pop();
      renderCanvas();
      renderTraceDetails();
    }

    function clearTrace() {
      state.tracePoints = [];
      renderCanvas();
      renderTraceDetails();
      setTraceStatus({ next: true, text: "Trace cleared. Press Step 2. Trace room to start again." });
    }

    function clearRooms() {
      clearRoomsTable();
      state.dragTarget = null;
      saveDraftState();
      renderCanvas();
      setGlobalStatus("Measured rooms cleared.");
    }

    async function saveAreaForQuote() {
      const warn=message=>{setGlobalStatus(message);document.querySelector('#port-handoff-status').textContent=message;};
      const included=state.rooms.filter(room=>room.includeInQuote);
      if(!included.length){warn('Include at least one flooring room first.');return;}
      try { for(const room of included) validateRoom(room.points,room.id); }
      catch(error){warn(error.message);return;}
      if(!document.querySelector('#oz-share-area').checked){warn('Tick the area-sharing consent before continuing.');document.querySelector('#oz-share-area').focus();return;}
      const assisted=included.some(room=>room.source==='quick_room');
      if(!saveAreaSummary(calculateSelectedTotalArea(),included.length,undefined,Date.now(),assisted?'reviewed_suggestion':'manual_trace')){warn('This browser blocked the area handoff. Note the total and enter it in the enquiry form.');return;}
      location.assign(buildQuoteReturnUrl());
    }

    function startRoomGeometryDrag(target, point) {
      const room = state.rooms.find(function (item) {
        return item.id === target.roomId;
      });
      if (!room) {
        return false;
      }

      state.activeTool = "edit";
      state.dragTarget = {
        type: target.type,
        roomId: target.roomId,
        pointIndex: typeof target.pointIndex === "number" ? target.pointIndex : -1,
        edgeIndex: typeof target.edgeIndex === "number" ? target.edgeIndex : -1,
        startPoint: point,
        originalPoints: room.points.map(function (roomPoint) {
          return { x: roomPoint.x, y: roomPoint.y };
        })
      };
      state.suppressNextClick = false;
      selectRoom(target.roomId);
      setTraceStatus(target.type === "corner"
        ? "Drag the corner handle to line up the room edge."
        : "Drag the edge handle to move the whole wall line.");
      return true;
    }

    function updateDraggedRoom(point) {
      if (!state.dragTarget) {
        return;
      }

      const room = state.rooms.find(function (item) {
        return item.id === state.dragTarget.roomId;
      });
      if (!room) {
        return;
      }

      const deltaX = point.x - state.dragTarget.startPoint.x;
      const deltaY = point.y - state.dragTarget.startPoint.y;
      room.points = state.dragTarget.originalPoints.map(function (roomPoint) {
        return { x: roomPoint.x, y: roomPoint.y };
      });

      if (state.dragTarget.type === "corner") {
        const pointIndex = state.dragTarget.pointIndex;
        room.points[pointIndex] = {
          x: clamp(state.dragTarget.originalPoints[pointIndex].x + deltaX, 0, canvas.width),
          y: clamp(state.dragTarget.originalPoints[pointIndex].y + deltaY, 0, canvas.height)
        };
      } else if (state.dragTarget.type === "edge") {
        const startIndex = state.dragTarget.edgeIndex;
        const endIndex = (startIndex + 1) % room.points.length;
        room.points[startIndex] = {
          x: clamp(state.dragTarget.originalPoints[startIndex].x + deltaX, 0, canvas.width),
          y: clamp(state.dragTarget.originalPoints[startIndex].y + deltaY, 0, canvas.height)
        };
        room.points[endIndex] = {
          x: clamp(state.dragTarget.originalPoints[endIndex].x + deltaX, 0, canvas.width),
          y: clamp(state.dragTarget.originalPoints[endIndex].y + deltaY, 0, canvas.height)
        };
      }

      try {validateRoom(room.points,room.id);} catch(error){room.points=state.dragTarget.originalPoints.map(p=>({...p}));setTraceStatus(error.message);}
      recalculateRoomGeometry(room);
      renderCanvas();
      renderRoomsTable();
    }

    function finishRoomGeometryDrag() {
      if (!state.dragTarget) {
        return;
      }
      state.dragTarget = null;
      state.activeTool = "idle";
      state.suppressNextClick = true;
      saveDraftState();
      renderCanvas();
      renderRoomsTable();
      setTraceStatus("Room adjusted. You can keep tracing or fine-tune another saved room.");
    }

    function handleCanvasPointerDown(event) {
      if (!state.image) {
        return;
      }
      const point = getPointerPoint(event);
      const target = getRoomHitTarget(point);

      if (target && (target.type === "corner" || target.type === "edge")) {
        if (startRoomGeometryDrag(target, point)) {
          canvas.setPointerCapture(event.pointerId);
        }
        return;
      }

      if (target && target.type === "room" && state.activeTool !== "trace" && state.activeTool !== "scale") {
        selectRoom(target.roomId);
        setTraceStatus("Saved room selected. Drag a corner or edge handle to adjust it.");
        return;
      }

      if (state.activeTool === "idle") {
        selectRoom("");
      }
    }

    function handleCanvasPointerMove(event) {
      if (!state.dragTarget) {
        return;
      }
      updateDraggedRoom(getPointerPoint(event));
    }

    function handleCanvasPointerUp(event) {
      if (!state.dragTarget) {
        return;
      }
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore release failures.
      }
      finishRoomGeometryDrag();
    }

    function handleCanvasClick(event) {
      if (!state.image) {
        return;
      }

      if (state.suppressNextClick) {
        state.suppressNextClick = false;
        return;
      }

      const point = getPointerPoint(event);
      if (state.activeTool === "scale") {
        handleScalePointClick(point);
        return;
      }

      if (state.activeTool === "verify_scale") {
        handleScalePointClick(point);
        return;
      }

      if (state.activeTool === "trace") {
        handleTracePointClick(point);
        return;
      }

      if (!state.pixelsPerMetre) {
        setCanvasStatus("Press Set scale first to begin measuring.");
        setTraceStatus({ next: true, text: "Start with Step 1. Press Set scale, then click two points on the plan." });
        return;
      }

      if (state.mode === "quick") {
        suggestQuickRoomAtPoint(point);
        return;
      }

      setTraceStatus({ next: true, text: "Scale is set. Press Step 2. Trace room to start measuring a room." });
    }

    function handleRoomsTableInput(event) {
      const row = event.target.closest("[data-room-id]");
      if (!row) {
        return;
      }
      const roomId = row.dataset.roomId;
      const room = state.rooms.find(function (item) {
        return item.id === roomId;
      });
      if (!room) {
        return;
      }

      const field = event.target.dataset.roomField;
      if (field === "name") {
        room.name = event.target.value.trim() || room.name;
      } else if (field === "include") {
        room.includeInQuote = !!event.target.checked;
        room.included = room.includeInQuote;
        if (window.OzFloorplanTracking) {
          window.OzFloorplanTracking.trackEvent(room.includeInQuote ? "floorplan_room_included" : "floorplan_room_excluded", {
            measurement_mode: room.source || "manual_trace",
            confidence_level: room.confidence || ""
          });
        }
      }

      selectRoom(roomId);
      renderRoomsTable();
      saveDraftState();
    }

    function handleRoomsTableClick(event) {
      const row = event.target.closest("[data-room-id]");
      if (!row) {
        return;
      }

      if (event.target.closest("[data-room-field=\"include\"]") || event.target.closest("[data-room-field=\"name\"]")) {
        return;
      }

      const roomId = row.dataset.roomId;
      if (event.target.dataset.roomAction === "delete") {
        state.rooms = state.rooms.filter(function (room) {
          return room.id !== roomId;
        });
        if (state.selectedRoomId === roomId) {
          state.selectedRoomId = "";
        }
        renderCanvas();
        renderRoomsTable();
        saveDraftState();
        return;
      }

      if (event.target.dataset.roomAction === "edit") {
        selectRoom(roomId);
        setTraceStatus("Saved room selected. Drag a corner or edge handle to adjust it.");
        return;
      }

      if (event.target.dataset.roomAction === "merge") {
        mergeQuickRoom(roomId);
        return;
      }

      if (event.target.dataset.roomAction === "split") {
        splitQuickRoomManually(roomId);
        return;
      }

      selectRoom(roomId);
      setTraceStatus("Saved room selected. Drag a corner or edge handle to line it up with the walls.");
    }

    async function initFloorplanTool() {
      if (window.OzFloorplanTracking) {
        window.OzFloorplanTracking.trackFloorplanOpened();
      }
      const params = new URLSearchParams(window.location.search);
      const devFloorplanEnabled = params.get("devFloorplan") === "1" || params.get("floorplanDev") === "1";
      document.body.classList.toggle("floorplan-dev-mode", devFloorplanEnabled);
      setQuoteReturnLinks();
      refreshWorkspaceMode();
      clearStoredFloorplanImageState({ preserveSessionImage: true });
      initQuickRoomMode();
      renderFloorplanPreview();

      const savedMeasurement = getSavedMeasurementSnapshot();
      if (savedMeasurement) {
        dom.resumeMeasurementBanner.classList.remove("hidden");
      } else {
        dom.resumeMeasurementBanner.classList.add("hidden");
      }

      dom.modeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          setMode(button.dataset.mode);
        });
      });

      dom.planUpload.addEventListener("change", async function (event) {
        const file = event.target.files && event.target.files[0];
        if (file) {
          await handlePlanUpload(file);
        }
      });
      dom.clearPlanButton.addEventListener("click", function () {
        clearUploadedFloorplan(false);
      });
      dom.resumeMeasurementButton.addEventListener("click", async function () {
        const snapshot = getSavedMeasurementSnapshot();
        dom.resumeMeasurementBanner.classList.add("hidden");
        if (!snapshot) {
          setGlobalStatus("No previous measurement is available.");
          return;
        }
        await restoreSavedMeasurement(snapshot);
      });
      dom.startNewMeasurementButton.addEventListener("click", function () {
        dom.resumeMeasurementBanner.classList.add("hidden");
        clearDraftState();
        clearStoredMeasurementResults();
        clearUploadedFloorplan(true);
      });

      dom.setScaleButton.addEventListener("click", startScaleMode);
      if (dom.verifyScaleButton) {
        dom.verifyScaleButton.addEventListener("click", startScaleVerificationMode);
      }
      dom.resetScaleButton.addEventListener("click", resetScale);
      dom.startTraceButton.addEventListener("click", startTraceMode);
      dom.undoTracePointButton.addEventListener("click", undoTracePoint);
      dom.clearTraceButton.addEventListener("click", clearTrace);
      if (dom.finishTraceButton) {
        dom.finishTraceButton.addEventListener("click", closeAndSavePolygon);
      }
      dom.quickModeInfoButton.addEventListener("click", function () {
        setMode("trace");
      });
      dom.suggestAllAreasButton.addEventListener("click", suggestAllAreas);
      dom.prepareQuickModeButton.addEventListener("click", function () {
        if (!state.image) {
          quickRoomState.detectionStatus = "Upload a plan first";
          renderQuickRoomStatus();
          return;
        }
        normaliseImage();
      });
      if (dom.acceptQuickRoomButton) {
        dom.acceptQuickRoomButton.addEventListener("click", function () {
          acceptQuickRoom();
        });
      }
      if (dom.editQuickRoomButton) {
        dom.editQuickRoomButton.addEventListener("click", editQuickRoomSuggestion);
      }
      if (dom.discardQuickRoomButton) {
        dom.discardQuickRoomButton.addEventListener("click", discardQuickRoomSuggestion);
      }
      [dom.quickContrastSlider, dom.quickThresholdSlider, dom.quickNoiseSlider].forEach(function (input) {
        if (!input) {
          return;
        }
        input.addEventListener("input", function () {
          if (dom.quickContrastSlider) {
            quickRoomState.settings.contrast = Number(dom.quickContrastSlider.value) / 100;
          }
          if (dom.quickThresholdSlider) {
            quickRoomState.settings.threshold = Number(dom.quickThresholdSlider.value);
          }
          if (dom.quickNoiseSlider) {
            quickRoomState.settings.noisePasses = Number(dom.quickNoiseSlider.value);
          }
          if (quickRoomState.imageLoaded) {
            normaliseImage();
          } else {
            renderQuickRoomStatus();
          }
        });
      });
      dom.useAreaInQuoteButton.addEventListener("click", saveAreaForQuote);
      dom.clearRoomsButton.addEventListener("click", clearRooms);
      dom.saveScaleButton.addEventListener("click", function () {
        confirmScale(Number(dom.scaleDistanceInput.value));
      });
      dom.cancelScaleButton.addEventListener("click", function () {
        closeScaleModal();
        state.scalePoints = [];
        state.pendingScaleDistancePx = 0;
        state.scaleModalMode = "set";
        state.activeTool = "idle";
        renderCanvas();
        setTraceStatus("Scale cancelled. Click Set scale to try again.");
      });
      dom.scaleDistanceInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          confirmScale(Number(dom.scaleDistanceInput.value));
        }
      });

      canvas.addEventListener("pointerdown", handleCanvasPointerDown);
      canvas.addEventListener("pointermove", handleCanvasPointerMove);
      canvas.addEventListener("pointerup", handleCanvasPointerUp);
      canvas.addEventListener("pointercancel", handleCanvasPointerUp);
      canvas.addEventListener("click", handleCanvasClick);
      dom.roomsTable.addEventListener("input", handleRoomsTableInput);
      dom.roomsTable.addEventListener("click", handleRoomsTableClick);

      setMode("trace");
    }

    function validateRoom(points,id){roomArea(points,1/state.pixelsPerMetre);if(points.some(p=>p.x<0||p.y<0||p.x>canvas.width||p.y>canvas.height))throw Error('Keep room corners inside the plan.');for(const room of state.rooms){if(room.id!==id&&roomsOverlap(points,room.points))throw Error('This outline overlaps a saved room. Review the room boundaries.');}}
    function configurePdfPages(count,current,file){configurePages(count,current,file);}
    const configurePages=installAccessibility({canvas,dom,getState:()=>state,point:p=>{if(state.activeTool==='scale'||state.activeTool==='verify_scale')handleScalePointClick(p);else if(state.activeTool==='trace')handleTracePointClick(p);else setTraceStatus('Choose Set scale or Trace room first.');},loadPage:async(file,page)=>{const ticket=++loadTicket;loadController?.abort();loadController=new AbortController();try{const result=await loadPlan(file,page,loadController.signal);if(ticket!==loadTicket){result.canvas.width=0;result.canvas.height=0;return;}if(activeRaster){activeRaster.width=0;activeRaster.height=0;}activeRaster=result.canvas;clearRoomsTable();clearScaleState();clearTraceState();state.pageNumber=page;state.image=result.canvas;state.imageElement=result.canvas;state.imageLoaded=true;resizeCanvasForImage(result.canvas,{});renderFloorplanPreview();initQuickRoomMode();saveDraftState();setUploadStatus('PDF page '+page+' of '+result.pageCount+' opened. Set its scale before tracing.');configurePages(result.pageCount,page,file);}catch(error){setUploadStatus(error.message);}}});
    window.addEventListener('pagehide',()=>{loadController?.abort();if(activeRaster){activeRaster.width=0;activeRaster.height=0;}});
    window.addEventListener('pageshow',event=>{if(event.persisted){state.image=null;state.imageElement=null;state.imageLoaded=false;activeRaster=null;renderFloorplanPreview();if(getSavedMeasurementSnapshot())dom.resumeMeasurementBanner.classList.remove('hidden');}});
    initFloorplanTool().then(()=>{dom.planUpload.disabled=false;}).catch(()=>setUploadStatus('The measurement tool could not start. Continue with an enquiry.'));
