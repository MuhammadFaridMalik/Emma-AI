/* =========================================================
   EMMA AI — Chat Interface
   Phase 5: Chat UI + Command Detection (sebelum ke AI) + koneksi AI.
   TIDAK ADA API key di file ini - permintaan AI selalu lewat backend.
   ========================================================= */

(function () {
    "use strict";

    var historyEl = document.getElementById("chatHistory");
    var formEl = document.getElementById("chatForm");
    var inputEl = document.getElementById("chatInput");
    var sendBtn = document.getElementById("chatSend");
    var errorEl = document.getElementById("chatError");

    var conversation = [];
    var isLoading = false;

    function scrollToBottom() {
        historyEl.scrollTop = historyEl.scrollHeight;
    }

    function addBubble(role, text) {
        var bubble = document.createElement("div");
        bubble.className = "chat__bubble chat__bubble--" + role;
        bubble.textContent = text;
        historyEl.appendChild(bubble);
        scrollToBottom();
        return bubble;
    }

    function addTypingIndicator() {
        var bubble = document.createElement("div");
        bubble.className = "chat__bubble chat__bubble--assistant chat__bubble--typing";
        bubble.id = "typingIndicator";
        bubble.innerHTML = "<span></span><span></span><span></span>";
        historyEl.appendChild(bubble);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        var el = document.getElementById("typingIndicator");
        if (el) el.remove();
    }

    function showError(message) {
        errorEl.textContent = message;
        errorEl.hidden = false;
    }

    function clearError() {
        errorEl.hidden = true;
        errorEl.textContent = "";
    }

    function setLoading(loading) {
        isLoading = loading;
        inputEl.disabled = loading;
        sendBtn.disabled = loading;
        sendBtn.textContent = loading ? "..." : "Kirim";
    }

    function speakingDuration(text) {
        return Math.min(4000, Math.max(1200, text.length * 35));
    }

    function callEmma(command, payload) {
        if (window.EMMA && typeof window.EMMA.executeCommand === "function") {
            window.EMMA.executeCommand(command, payload);
        }
    }

    function isDevicePoweredOn() {
        if (window.EMMA && typeof window.EMMA.getState === "function") {
            return !!window.EMMA.getState().power;
        }
        return true;
    }

    function runDetectedCommand(text, detected) {
        if (detected.requiresPower && !isDevicePoweredOn()) {
            showError("Device sedang mati. Nyalakan device dulu (bilang \"nyalakan device\") sebelum perintah itu.");
            return;
        }

        clearError();
        addBubble("user", text);
        conversation.push({ role: "user", content: text });

        setLoading(true);
        callEmma("expression.set", { name: "thinking" });
        addTypingIndicator();

        setTimeout(function () {
            var reply = detected.run();

            removeTypingIndicator();
            callEmma("expression.set", { name: "speaking" });
            addBubble("assistant", reply);
            conversation.push({ role: "assistant", content: reply });

            setLoading(false);
            inputEl.focus();

            setTimeout(function () {
                callEmma("expression.set", { name: "idle" });
            }, speakingDuration(reply));
        }, 500);
    }

    function sendToAI(text) {
        clearError();
        addBubble("user", text);
        conversation.push({ role: "user", content: text });

        setLoading(true);
        callEmma("expression.set", { name: "thinking" });
        addTypingIndicator();

        fetch("api/chat.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: text,
                history: conversation.slice(0, -1).slice(-10)
            })
        })
            .then(function (res) {
                return res.json().then(function (data) {
                    return { ok: res.ok, data: data };
                });
            })
            .then(function (result) {
                if (!result.ok || result.data.error) {
                    throw new Error(result.data.error || "Terjadi kesalahan pada server.");
                }

                var reply = result.data.reply;
                removeTypingIndicator();
                callEmma("expression.set", { name: "speaking" });
                addBubble("assistant", reply);
                conversation.push({ role: "assistant", content: reply });

                setTimeout(function () {
                    callEmma("expression.set", { name: "idle" });
                }, speakingDuration(reply));
            })
            .catch(function (err) {
                removeTypingIndicator();
                callEmma("expression.set", { name: "error" });
                showError(err.message || "Gagal terhubung ke EMMA. Coba lagi.");
                setTimeout(function () {
                    callEmma("expression.set", { name: "idle" });
                }, 1500);
            })
            .finally(function () {
                setLoading(false);
                inputEl.focus();
            });
    }

    function handleSubmit(event) {
        event.preventDefault();
        if (isLoading) return;

        var text = inputEl.value.trim();
        if (text === "") return;

        var detected = window.EmmaCommandDetector ? window.EmmaCommandDetector.detect(text) : null;

        if (detected) {
            inputEl.value = "";
            runDetectedCommand(text, detected);
            return;
        }

        if (!isDevicePoweredOn()) {
            showError("Device sedang mati. Nyalakan device terlebih dahulu untuk chat dengan EMMA.");
            return;
        }

        inputEl.value = "";
        sendToAI(text);
    }

    function submitText(text) {
        inputEl.value = text;
        if (typeof formEl.requestSubmit === "function") {
            formEl.requestSubmit();
        } else {
            handleSubmit({ preventDefault: function () {} });
        }
    }

    function buildCommandSwitcher() {
        var container = document.getElementById("commandSwitcher");
        if (!container) return;

        var phrases = [
            "nyalakan lampu",
            "matikan lampu",
            "besarkan volume",
            "kecilkan volume",
            "cek baterai",
            "cek suhu",
            "cek status device",
            "matikan device",
            "nyalakan device"
        ];

        phrases.forEach(function (phrase) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = phrase;
            btn.addEventListener("click", function () { submitText(phrase); });
            container.appendChild(btn);
        });
    }

    function init() {
        if (!formEl) return;
        formEl.addEventListener("submit", handleSubmit);
        buildCommandSwitcher();
        addBubble("assistant", "Hai! Aku EMMA. Ada yang bisa aku bantu? \uD83D\uDE0A");
    }

    document.addEventListener("DOMContentLoaded", init);
})();