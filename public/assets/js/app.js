/* =========================================================
   EMMA AI — Virtual Device
   Phase 2: Virtual Hardware + Device State terpusat.
   Belum ada AI/backend/database di sini.
   ========================================================= */

(function () {
    "use strict";

    var EMMA_EXPRESSIONS = [
        "idle", "listening", "thinking", "speaking", "happy", "error", "sleeping"
    ];

    /**
     * Device State terpusat.
     * Semua komponen visual (LED, battery bar, wifi, volume, speaker)
     * WAJIB membaca dari objek ini lewat render(), bukan diubah langsung di DOM.
     */
    var deviceState = {
        power: true,
        battery: 82,
        wifi: true,
        wifiSignal: "good", // "excellent" | "good" | "weak"
        volume: 60,
        led: false,
        speaker: true
    };

    var currentExpression = "idle";
    var assistantTimer = null;
    var batteryTimer = null;

    var deviceEl = document.getElementById("device");
    var stateLabelEl = document.getElementById("stateLabel");
    var ledEl = document.getElementById("led");
    var statusPanelEl = document.getElementById("statusPanel");
    var statPower = document.getElementById("statPower");
    var statBattery = document.getElementById("statBattery");
    var batteryFill = document.getElementById("batteryFill");
    var statWifi = document.getElementById("statWifi");
    var statVolume = document.getElementById("statVolume");
    var statSpeaker = document.getElementById("statSpeaker");
    var statLed = document.getElementById("statLed");

    function clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }

    function batteryTier(v) {
        if (v >= 90) return 100;
        if (v >= 70) return 80;
        if (v >= 50) return 60;
        if (v >= 30) return 40;
        if (v >= 15) return 20;
        return 10;
    }

    function signalLabel(signal) {
        if (signal === "excellent") return "Excellent";
        if (signal === "weak") return "Weak";
        return "Good";
    }

    function render() {
        var expression = deviceState.power ? currentExpression : "powered_off";
        deviceEl.setAttribute("data-state", expression);
        stateLabelEl.textContent = expression.replace("_", " ").toUpperCase();

        statPower.textContent = deviceState.power ? "ON" : "OFF";

        statBattery.textContent = deviceState.battery + "% (" + batteryTier(deviceState.battery) + ")";
        batteryFill.style.width = deviceState.battery + "%";
        batteryFill.classList.toggle("battery-bar__fill--low", deviceState.battery <= 20);

        statWifi.textContent = deviceState.wifi
            ? "Connected · " + signalLabel(deviceState.wifiSignal)
            : "Disconnected";

        statVolume.textContent = deviceState.volume + "%";

        statSpeaker.textContent = deviceState.speaker ? "ON" : "OFF";

        deviceState.led = deviceState.power && expression !== "sleeping";
        statLed.textContent = deviceState.led ? "ON" : "OFF";
        ledEl.classList.toggle("led--off", !deviceState.led);

        statusPanelEl.classList.toggle("status-panel--off", !deviceState.power);
    }

    function setExpression(name) {
        if (EMMA_EXPRESSIONS.indexOf(name) === -1) {
            console.warn("[EMMA] ekspresi tidak dikenal:", name);
            return;
        }
        if (!deviceState.power) return;
        currentExpression = name;
        render();
    }

    function togglePower() {
        deviceState.power = !deviceState.power;
        clearTimeout(assistantTimer);
        if (deviceState.power) currentExpression = "idle";
        render();
    }

    function runAssistantDemo() {
        if (!deviceState.power) return;
        clearTimeout(assistantTimer);
        setExpression("listening");

        assistantTimer = setTimeout(function () {
            setExpression("thinking");
            assistantTimer = setTimeout(function () {
                setExpression("speaking");
                assistantTimer = setTimeout(function () {
                    setExpression("happy");
                    assistantTimer = setTimeout(function () {
                        setExpression("idle");
                    }, 1200);
                }, 1600);
            }, 1200);
        }, 1200);
    }

    function adjustVolume(step) {
        if (!deviceState.power) return;
        deviceState.volume = clamp(deviceState.volume + step, 0, 100);
        deviceState.speaker = deviceState.volume > 0;
        render();
    }

    function toggleWifi() {
        deviceState.wifi = !deviceState.wifi;
        render();
    }

    function cycleSignal() {
        var order = ["weak", "good", "excellent"];
        var idx = order.indexOf(deviceState.wifiSignal);
        deviceState.wifiSignal = order[(idx + 1) % order.length];
        render();
    }

    function toggleSpeaker() {
        deviceState.speaker = !deviceState.speaker;
        render();
    }

    function drainBattery(amount) {
        deviceState.battery = clamp(deviceState.battery - amount, 0, 100);
        if (deviceState.battery === 0 && deviceState.power) {
            currentExpression = "sleeping";
        }
        render();
    }

    function chargeBattery() {
        deviceState.battery = 100;
        render();
    }

    function handleControlClick(event) {
        var action = event.currentTarget.getAttribute("data-action");

        if (action === "power") {
            togglePower();
            return;
        }

        if (!deviceState.power) return;

        if (action === "assistant") runAssistantDemo();
        if (action === "vol-up") adjustVolume(10);
        if (action === "vol-down") adjustVolume(-10);
    }

    function buildExpressionSwitcher() {
        var container = document.getElementById("stateSwitcher");
        EMMA_EXPRESSIONS.forEach(function (name) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = name;
            btn.addEventListener("click", function () { setExpression(name); });
            container.appendChild(btn);
        });
    }

    function buildHardwareSwitcher() {
        var container = document.getElementById("hardwareSwitcher");
        var actions = [
            { label: "wifi toggle", fn: toggleWifi },
            { label: "signal cycle", fn: cycleSignal },
            { label: "speaker toggle", fn: toggleSpeaker },
            { label: "battery -10%", fn: function () { drainBattery(10); } },
            { label: "battery full", fn: chargeBattery }
        ];
        actions.forEach(function (a) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = a.label;
            btn.addEventListener("click", a.fn);
            container.appendChild(btn);
        });
    }

    function startBatterySimulation() {
        batteryTimer = setInterval(function () {
            if (deviceState.power && deviceState.battery > 0) {
                drainBattery(1);
            }
        }, 20000);
    }

    function init() {
        document.querySelectorAll(".btn[data-action]").forEach(function (btn) {
            btn.addEventListener("click", handleControlClick);
        });
        buildExpressionSwitcher();
        buildHardwareSwitcher();
        render();
        startBatterySimulation();
    }

    document.addEventListener("DOMContentLoaded", init);
})();