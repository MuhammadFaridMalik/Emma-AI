<?php
declare(strict_types=1);

// EMMA AI - Chat API Endpoint
// Menerima pesan dari frontend, memanggil AI di sisi server.
// API key TIDAK PERNAH dikirim ke/dilihat oleh frontend.

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../app/core/ai_client.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method tidak diizinkan.']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode((string) $raw, true);

if (!is_array($body) || !isset($body['message']) || !is_string($body['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Format permintaan tidak valid.']);
    exit;
}

$message = trim($body['message']);

if ($message === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Pesan tidak boleh kosong.']);
    exit;
}

if (mb_strlen($message) > 1000) {
    http_response_code(400);
    echo json_encode(['error' => 'Pesan terlalu panjang (maksimal 1000 karakter).']);
    exit;
}

// Sanitasi & validasi riwayat percakapan yang dikirim frontend.
$history = [];
if (isset($body['history']) && is_array($body['history'])) {
    foreach ($body['history'] as $item) {
        if (!is_array($item)) {
            continue;
        }

        $role = $item['role'] ?? '';
        $content = $item['content'] ?? '';

        if (!in_array($role, ['user', 'assistant'], true) || !is_string($content)) {
            continue;
        }

        $history[] = ['role' => $role, 'content' => mb_substr($content, 0, 2000)];
    }

    // Batasi jumlah riwayat yang diteruskan ke AI supaya tetap ringan.
    $history = array_slice($history, -10);
}

$config = require __DIR__ . '/../../app/config/config.php';

$result = emma_ai_chat($config['ai'], $history, $message);

if (!$result['ok']) {
    http_response_code(502);
    echo json_encode(['error' => $result['error']]);
    exit;
}

echo json_encode(['reply' => $result['reply']]);