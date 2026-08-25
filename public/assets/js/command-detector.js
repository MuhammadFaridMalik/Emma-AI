/* =========================================================
   EMMA AI — Command Detection
   Phase 5: mendeteksi apakah pesan user adalah perintah perangkat,
   lalu memanggil Command Processor (window.EMMA.executeCommand) di app.js.
   ========================================================= */

(function () {
    "use strict";

    var COMMANDS = [
        {
            id: "led_on",
            patterns: ["nyalakan lampu", "hidupkan lampu", "nyalain lampu"],
            respond: function (emma) {
                emma.executeCommand("led.on");
                return "Baik, lampu sudah saya nyalakan.";
            }
        },
        {
            id: "led_off",
            patterns: ["matikan lampu", "matiin lampu"],
            respond: function (emma) {
                emma.executeCommand("led.off");
                return "Oke, lampu sudah saya matikan.";
            }
        },
        {
            id: "volume_up",
            patterns: ["besarkan volume", "naikkan volume", "kencangkan suara", "kencangin volume"],
            respond: function (emma) {
                emma.executeCommand("volume.up");
                return "Oke, volume sekarang " + emma.getState().volume + "%.";
            }
        },
        {
            id: "volume_down",
            patterns: ["kecilkan volume", "turunkan volume", "pelankan suara", "kecilin volume"],
            respond: function (emma) {
                emma.executeCommand("volume.down");
                return "Oke, volume sekarang " + emma.getState().volume + "%.";
            }
        },
        {
            id: "check_battery",
            patterns: ["cek baterai", "berapa baterai", "status baterai"],
            respond: function (emma) {
                return "Baterai saat ini " + emma.getState().battery + "%.";
            }
        },
        {
            id: "check_temperature",
            patterns: ["cek suhu", "berapa suhu", "suhu berapa"],
            respond: function (emma) {
                return "Suhu ruangan saat ini " + emma.getState().temperature.toFixed(1) + "\u00B0C.";
            }
        },
        {
            id: "check_status",
            patterns: ["cek status device", "status device", "cek status perangkat"],
            respond: function (emma) {
                var s = emma.getState();
                return "Status device: power " + (s.power ? "ON" : "OFF") +
                    ", baterai " + s.battery + "%, WiFi " + (s.wifi ? "terhubung" : "terputus") +
                    ", suhu " + s.temperature.toFixed(1) + "\u00B0C, LED " + (s.led ? "ON" : "OFF") +
                    ", volume " + s.volume + "%.";
            }
        },
        {
            id: "power_off",
            patterns: ["matikan device", "matiin device", "shutdown device", "matikan perangkat"],
            respond: function (emma) {
                emma.executeCommand("power.off");
                return "Baik, device akan saya matikan. Sampai jumpa!";
            }
        },
        {
            id: "power_on",
            patterns: ["nyalakan device", "nyalain device", "hidupkan device", "nyalakan perangkat"],
            respond: function (emma) {
                emma.executeCommand("power.on");
                return "Device sudah menyala kembali. Halo lagi!";
            }
        }
    ];

    function normalize(text) {
        return String(text).toLowerCase().trim();
    }

    function detect(text) {
        var normalized = normalize(text);

        for (var i = 0; i < COMMANDS.length; i++) {
            var cmd = COMMANDS[i];

            for (var j = 0; j < cmd.patterns.length; j++) {
                if (normalized.indexOf(cmd.patterns[j]) !== -1) {
                    return {
                        id: cmd.id,
                        requiresPower: cmd.id !== "power_on",
                        run: function () {
                            if (!window.EMMA) return "Maaf, device belum siap.";
                            return cmd.respond(window.EMMA);
                        }
                    };
                }
            }
        }

        return null;
    }

    window.EmmaCommandDetector = { detect: detect };
})();