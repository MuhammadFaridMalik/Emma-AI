/* =========================================================
   EMMA AI — Virtual Device
   Phase 1: State visual sederhana (belum ada AI/backend).
   ========================================================= */

(function () {
    "use strict";

    var EMMA_STATES = [
        "idle",
        "listening",
        "thinking",
        "speaking",
        "happy",
        "error",
        "sleeping",
        "powered_off"
    ];

    var deviceEl = document.getElementById("device");
    var stateLabelEl = document.getElementById("stateLabel");
    var lastStateBeforeOff = "idle";
    var assistantTimer = null;

    function setState(state) {
        if (EMMA_STATES.indexOf(state) === -1) {
            console.warn("[EMMA] State tidak dikenal:", state);
            return;
        }
        deviceEl.setAttribute("data-state", state);
        stateLabelEl.textContent = state.replace("_", " ").toUpperCase();
    }

    function getState() {
        return deviceEl.getAttribute("data-state");
    }

    function togglePower() {
        if (getState() === "powered_off") {
            setState(lastStateBeforeOff || "idle");
        } else {
            lastStateBeforeOff = getState();
            clearTimeout(assistantTimer);
            setState("powered_off");
        }
    }

    function runAssistantDemo() {
        if (getState() === "powered_off") return;

        clearTimeout(assistantTimer);
        setState("listening");

        assistantTimer = setTimeout(function () {
            setState("thinking");
            assistantTimer = setTimeout(function () {
                setState("speaking");
                assistantTimer = setTimeout(function () {
                    setState("happy");
                    assistantTimer = setTimeout(function () {
                        setState("idle");
                    }, 1200);
                }, 1600);
            }, 1200);
        }, 1200);
    }

    function handleControlClick(event) {
        var action = event.currentTarget.getAttribute("data-action");

        if (action === "power") {
            togglePower();
            return;
        }

        if (getState() === "powered_off") return;

        if (action === "assistant") {
            runAssistantDemo();
        }

        if (action === "vol-up" || action === "vol-down") {
            console.log("[EMMA] tombol ditekan:", action, "(logic volume menyusul di Phase 2)");
        }
    }

    function buildStateSwitcher() {
        var container = document.getElementById("stateSwitcher");
        EMMA_STATES.forEach(function (state) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = state;
            btn.addEventListener("click", function () {
                setState(state);
            });
            container.appendChild(btn);
        });
    }

    function init() {
        document.querySelectorAll(".btn[data-action]").forEach(function (btn) {
            btn.addEventListener("click", handleControlClick);
        });
        buildStateSwitcher();
        setState("idle");
    }

    document.addEventListener("DOMContentLoaded", init);
})();