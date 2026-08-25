<?php
declare(strict_types=1);

/**
 * Panggil Gemini API (native endpoint) untuk EMMA.
 *
 * Catatan: sengaja TIDAK memakai endpoint OpenAI-compatible Gemini
 * (/v1beta/openai/...) karena API key format baru Google ("AQ.Ab...",
 * mulai berlaku 2026) belum didukung di jalur itu - hanya jalan di
 * endpoint native Gemini. Endpoint native inilah yang dipakai di sini.
 *
 * @param array<string,string> $aiConfig ['api_url'=>string,'api_key'=>string,'model'=>string]
 * @param array<int,array{role:string,content:string}> $history riwayat percakapan
 * @param string $message pesan baru dari user
 * @return array{ok:bool,reply:string,error:string}
 */
function emma_ai_chat(array $aiConfig, array $history, string $message): array
{
    if (empty($aiConfig['api_key'])) {
        return [
            'ok' => false,
            'reply' => '',
            'error' => 'AI API key belum dikonfigurasi di server. Isi EMMA_AI_API_KEY di file .env.',
        ];
    }

    $systemPrompt = 'Kamu adalah EMMA, virtual AI assistant yang ramah, membantu, natural, ' .
        'dan tidak terlalu formal. Jawab singkat, jelas, dan hangat dalam Bahasa Indonesia ' .
        'kecuali pengguna menulis dalam bahasa lain. Kamu juga dapat menjelaskan sesuatu dan ' .
        'nantinya dapat menerima perintah terkait perangkat (lampu, volume, baterai, suhu, status device).';

    // Gemini memakai role "user" dan "model" (bukan "assistant").
    $contents = [];
    foreach ($history as $item) {
        $role = $item['role'] === 'assistant' ? 'model' : 'user';
        $contents[] = ['role' => $role, 'parts' => [['text' => $item['content']]]];
    }
    $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

    $payload = json_encode([
        'systemInstruction' => ['parts' => [['text' => $systemPrompt]]],
        'contents' => $contents,
        'generationConfig' => [
            'maxOutputTokens' => 400,
            'temperature' => 0.7,
        ],
    ]);

    if ($payload === false) {
        return ['ok' => false, 'reply' => '', 'error' => 'Gagal menyusun permintaan ke AI.'];
    }

    // api_url diharapkan berupa base URL tanpa /models/... di belakangnya,
    // contoh: https://generativelanguage.googleapis.com/v1beta
    $url = rtrim($aiConfig['api_url'], '/') . '/models/' . rawurlencode($aiConfig['model']) . ':generateContent';

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-goog-api-key: ' . $aiConfig['api_key'],
        ],
        CURLOPT_TIMEOUT => 30,
    ]);

    $responseBody = curl_exec($ch);
    $curlErrorMessage = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($responseBody === false) {
        return ['ok' => false, 'reply' => '', 'error' => 'Gagal menghubungi AI: ' . $curlErrorMessage];
    }

    $data = json_decode($responseBody, true);

    if ($httpCode < 200 || $httpCode >= 300) {
        $apiError = is_array($data) && isset($data['error']['message'])
            ? $data['error']['message']
            : ('HTTP ' . $httpCode);
        return ['ok' => false, 'reply' => '', 'error' => 'AI API error: ' . $apiError];
    }

    $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

    if (!is_string($reply) || trim($reply) === '') {
        if (is_array($data) && isset($data['promptFeedback']['blockReason'])) {
            return [
                'ok' => false,
                'reply' => '',
                'error' => 'Permintaan diblokir oleh filter keamanan AI: ' . $data['promptFeedback']['blockReason'],
            ];
        }
        return ['ok' => false, 'reply' => '', 'error' => 'Respons AI kosong atau format tidak dikenal.'];
    }

    return ['ok' => true, 'reply' => trim($reply), 'error' => ''];
}