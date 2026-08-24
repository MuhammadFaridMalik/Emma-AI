<?php
// EMMA AI - Entry Point
// Phase 1: Virtual Device UI only. Tidak ada logic backend di sini.
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EMMA AI — Virtual Device</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<main class="app">

    <div class="device" id="device" data-state="idle">

        <div class="device__topbar">
            <span class="status-dot status-dot--power" id="indicatorPower" title="Power"></span>
            <span class="status-dot status-dot--wifi" id="indicatorWifi" title="WiFi"></span>
            <span class="status-dot status-dot--battery" id="indicatorBattery" title="Battery"></span>
        </div>

        <div class="screen" id="screen">

            <div class="face" id="face">
                <div class="eyes">
                    <div class="eye eye--left"><span class="eye__pupil"></span></div>
                    <div class="eye eye--right"><span class="eye__pupil"></span></div>
                </div>
                <div class="mouth" id="mouth">
                    <span class="mouth__bar"></span>
                    <span class="mouth__bar"></span>
                    <span class="mouth__bar"></span>
                    <span class="mouth__bar"></span>
                    <span class="mouth__bar"></span>
                </div>
                <div class="sleep-z" id="sleepZ">
                    <span>z</span><span>z</span><span>z</span>
                </div>
            </div>

            <div class="screen__ripple" id="ripple"></div>

            <div class="screen__off-label" id="offLabel">POWER OFF</div>

            <div class="led" id="led"></div>

            <div class="state-label" id="stateLabel">IDLE</div>

        </div>

        <div class="controls">
            <button class="btn btn--power" data-action="power" title="Power" aria-label="Power">⏻</button>
            <button class="btn btn--assistant" data-action="assistant" title="Assistant" aria-label="Panggil EMMA">EMMA</button>
            <button class="btn btn--vol" data-action="vol-down" title="Volume Down" aria-label="Volume turun">−</button>
            <button class="btn btn--vol" data-action="vol-up" title="Volume Up" aria-label="Volume naik">+</button>
        </div>

    </div>

    <section class="devtools" id="devtools">
        <p class="devtools__label">Uji Coba State (sementara, untuk testing Phase 1)</p>
        <div class="devtools__buttons" id="stateSwitcher"></div>
    </section>

</main>

<script src="assets/js/app.js"></script>
</body>
</html>