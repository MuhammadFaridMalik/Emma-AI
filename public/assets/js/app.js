/* =========================================================
   EMMA AI — Virtual Device
   Phase 5: Device State + Sensor + Command Processor
   (dipakai oleh Command Engine EMMA lewat window.EMMA.executeCommand).
   ========================================================= */

(function () {
    "use strict";

    var EMMA_EXPRESSIONS = [
        "idle", "listening", "thinking", "speaking", "happy", "error", "sleeping"
    ];

    var deviceState = {
        power: true,
        battery: 82,
        wifi: true,
        wifiSignal: "good",
        volume: 60,
        led: false,
        speaker: true,
        microphone: true,
        temperature: 29.4,
        light: 65,
        sound: 42,
        motion: false,
        screen: true,
        expression: "idle",
        ledOverride: null
    };

    var assistantTimer = null;
    var batteryTimer = null;
    var sensorTimer = null;

    var deviceEl = document.getElementById("device");
    var stateLabelEl = document.getElementById("stateLabel");
    var ledEl = document.getElementById("led");
    var statusPanelEl = document.getElementById("statusPanel");
    var statPower = document.getElementById("statPower");
    var statBattery = document.getElementById("statBattery");
    var batteryFill = document.getElementById("batteryFill");
    var statWifi = document.getElementById("statWifi");
    var statTemperature = document.getElementById("statTemperature");
    var statLight = document.getElementById("statLight");
    var statSound = document.getElementById("statSound");
    var statMotion = document.getElementById("statMotion");
    var statVolume = document.getElementById("statVolume");
    var statSpeaker = document.getElementById("statSpeaker");
    var statMicrophone = document.getElementById("statMicrophone");
    var statLed = document.getElementById("statLed");

    function clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }

    function randomWalk(value, min, max, step) {
        var delta = (Math.random() * 2 - 1) * step;
        return clamp(value + delta, min, max);
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
        deviceState.screen = deviceState.power;
        var expression = deviceState.power ? deviceState.expression : "powered_off";

        deviceEl.setAttribute("data-state", expression);
        stateLabelEl.textContent = expression.replace("_", " ").toUpperCase();

        statPower.textContent = deviceState.power ? "ON" : "OFF";
        statBattery.textContent = deviceState.battery + "% (" + batteryTier(deviceState.battery) + ")";
        batteryFill.style.width = deviceState.battery + "%";
        batteryFill.classList.toggle("battery-bar__fill--low", deviceState.battery <= 20);

        statWifi.textContent = deviceState.wifi
            ? "Connected · " + signalLabel(deviceState.wifiSignal)
            : "Disconnected";

        statTemperature.textContent = deviceState.temperature.toFixed(1) + "°C";
        statLight.textContent = Math.round(deviceState.light) + "%";
        statSound.textContent = Math.round(deviceState.sound) + " dB";
        statMotion.textContent = deviceState.motion ? "Detected" : "Not detected";
        statMotion.classList.toggle("status-panel__value--alert", deviceState.motion);

        var autoLed = deviceState.power && expression !== "sleeping";
        var effectiveLed = deviceState.ledOverride === null ? autoLed : deviceState.ledOverride;
        deviceState.led = deviceState.power && effectiveLed;
        statLed.textContent = deviceState.led ? "ON" : "OFF";
        ledEl.classList.toggle("led--off", !deviceState.led);

        statSpeaker.textContent = deviceState.speaker ? "ON" : "OFF";
        statMicrophone.textContent = deviceState.microphone ? "ON" : "OFF";
        statVolume.textContent = deviceState.volume + "%";

        statusPanelEl.classList.toggle("status-panel--off", !deviceState.power);
    }

    function setExpression(name) {
        if (EMMA_EXPRESSIONS.indexOf(name) === -1) {
            console.warn("[EMMA] ekspresi tidak dikenal:", name);
            return;
        }
        if (!deviceState.power) return;
        deviceState.expression = name;
        render();
    }

    function setPower(on) {
        deviceState.power = !!on;
        clearTimeout(assistantTimer);
        if (deviceState.power) {
            deviceState.expression = "idle";
            deviceState.ledOverride = null;
        }
        render();
    }

    function togglePower() {
        setPower(!deviceState.power);
    }

    function setLed(on) {
        if (!deviceState.power) return;
        deviceState.ledOverride = !!on;
        render();
    }

    function runAssistantDemo() {
        if (!deviceState.power) return;

        if (!deviceState.microphone) {
            setExpression("error");
            assistantTimer = setTimeout(function () { setExpression("idle"); }, 1200);
            return;
        }

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

    function toggleWifi() { deviceState.wifi = !deviceState.wifi; render(); }

    function cycleSignal() {
        var order = ["weak", "good", "excellent"];
        var idx = order.indexOf(deviceState.wifiSignal);
        deviceState.wifiSignal = order[(idx + 1) % order.length];
        render();
    }

    function toggleSpeaker() { deviceState.speaker = !deviceState.speaker; render(); }
    function toggleMicrophone() { deviceState.microphone = !deviceState.microphone; render(); }

    function drainBattery(amount) {
        deviceState.battery = clamp(deviceState.battery - amount, 0, 100);
        if (deviceState.battery === 0 && deviceState.power) {
            deviceState.expression = "sleeping";
        }
        render();
    }

    function chargeBattery() { deviceState.battery = 100; render(); }

    function forceMotionPulse() {
        deviceState.motion = true;
        render();
        setTimeout(function () { deviceState.motion = false; render(); }, 3000);
    }

    function tickSensors() {
        if (!deviceState.power) return;
        deviceState.temperature = randomWalk(deviceState.temperature, 22, 33, 0.4);
        deviceState.light = randomWalk(deviceState.light, 5, 100, 6);
        deviceState.sound = randomWalk(deviceState.sound, 25, 75, 5);
        deviceState.motion = Math.random() < 0.2;
        render();
    }

    var commandRegistry = {
        "power.toggle": togglePower,
        "power.on": function () { setPower(true); },
        "power.off": function () { setPower(false); },
        "led.on": function () { setLed(true); },
        "led.off": function () { setLed(false); },
        "assistant.trigger": runAssistantDemo,
        "volume.up": function () { adjustVolume(10); },
        "volume.down": function () { adjustVolume(-10); },
        "wifi.toggle": toggleWifi,
        "wifi.cycleSignal": cycleSignal,
        "speaker.toggle": toggleSpeaker,
        "microphone.toggle": toggleMicrophone,
        "battery.drain": function (payload) { drainBattery((payload && payload.amount) || 10); },
        "battery.charge": chargeBattery,
        "sensor.tick": tickSensors,
        "sensor.motionPulse": forceMotionPulse,
        "expression.set": function (payload) { setExpression(payload && payload.name); }
    };

    function executeCommand(commandName, payload) {
        var handler = commandRegistry[commandName];
        if (!handler) {
            console.warn("[EMMA] Command tidak dikenal:", commandName);
            return false;
        }
        handler(payload);
        return true;
    }

    function handleControlClick(event) {
        var action = event.currentTarget.getAttribute("data-action");
        if (action === "power") { executeCommand("power.toggle"); return; }
        if (!deviceState.power) return;
        if (action === "assistant") executeCommand("assistant.trigger");
        if (action === "vol-up") executeCommand("volume.up");
        if (action === "vol-down") executeCommand("volume.down");
    }

    function buildExpressionSwitcher() {
        var container = document.getElementById("stateSwitcher");
        EMMA_EXPRESSIONS.forEach(function (name) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = name;
            btn.addEventListener("click", function () {
                executeCommand("expression.set", { name: name });
            });
            container.appendChild(btn);
        });
    }

    function buildHardwareSwitcher() {
        var container = document.getElementById("hardwareSwitcher");
        var actions = [
            { label: "wifi toggle", command: "wifi.toggle" },
            { label: "signal cycle", command: "wifi.cycleSignal" },
            { label: "speaker toggle", command: "speaker.toggle" },
            { label: "battery -10%", command: "battery.drain", payload: { amount: 10 } },
            { label: "battery full", command: "battery.charge" }
        ];
        actions.forEach(function (a) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = a.label;
            btn.addEventListener("click", function () { executeCommand(a.command, a.payload); });
            container.appendChild(btn);
        });
    }

    function buildSensorSwitcher() {
        var container = document.getElementById("sensorSwitcher");
        var actions = [
            { label: "sensor tick", command: "sensor.tick" },
            { label: "motion pulse", command: "sensor.motionPulse" },
            { label: "microphone toggle", command: "microphone.toggle" }
        ];
        actions.forEach(function (a) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = a.label;
            btn.addEventListener("click", function () { executeCommand(a.command); });
            container.appendChild(btn);
        });
    }

    function startBatterySimulation() {
        batteryTimer = setInterval(function () {
            if (deviceState.power && deviceState.battery > 0) drainBattery(1);
        }, 20000);
    }

    function startSensorSimulation() {
        sensorTimer = setInterval(tickSensors, 4000);
    }

    function init() {
        document.querySelectorAll(".btn[data-action]").forEach(function (btn) {
            btn.addEventListener("click", handleControlClick);
        });
        buildExpressionSwitcher();
        buildHardwareSwitcher();
        buildSensorSwitcher();
        render();
        startBatterySimulation();
        startSensorSimulation();
    }

    document.addEventListener("DOMContentLoaded", init);

    window.EMMA = {
        getState: function () { return deviceState; },
        executeCommand: executeCommand
    };
})();