/* =========================================================
   EMMA AI — Chat Interface
   Phase 4: Chat UI + koneksi ke backend AI (public/api/chat.php).
   TIDAK ADA API key di file ini - permintaan selalu lewat backend.
   ========================================================= */

(function () {
    "use strict";

    var historyEl = document.getElementById("chatHistory");
    var formEl = document.getElementById("chatForm");
    var inputEl = document.getElementById("chatInput");
    var sendBtn = document.getElementById("chatSend");
    var errorEl = document.getElementById("chatError");

    var conversation = []; // { role: "user"|"assistant", content: string }
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

    function sendMessage(text) {
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

        if (!isDevicePoweredOn()) {
            showError("Device sedang mati. Nyalakan device terlebih dahulu untuk chat dengan EMMA.");
            return;
        }

        inputEl.value = "";
        sendMessage(text);
    }

    function init() {
        if (!formEl) return;
        formEl.addEventListener("submit", handleSubmit);
        addBubble("assistant", "Hai! Aku EMMA. Ada yang bisa aku bantu? \uD83D\uDE0A");
    }

    document.addEventListener("DOMContentLoaded", init);
})();