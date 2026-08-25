<?php
declare(strict_types=1);

// Konfigurasi project EMMA AI
// Kredensial AI dibaca dari file .env (di root project), TIDAK di-hardcode
// di sini dan TIDAK pernah dikirim ke frontend/JavaScript.

require_once __DIR__ . '/../core/env.php';
emma_load_env(__DIR__ . '/../../.env');

return [
    'ai' => [
        // Default mengarah ke endpoint OpenAI-compatible (/chat/completions).
        // Kompatibel juga dengan provider lain yang memakai skema sama
        // (OpenRouter, Groq, Together, dsb) - tinggal ganti EMMA_AI_API_URL.
        'api_url' => getenv('EMMA_AI_API_URL') ?: 'https://api.openai.com/v1/chat/completions',
        'api_key' => getenv('EMMA_AI_API_KEY') ?: '',
        'model'   => getenv('EMMA_AI_MODEL') ?: 'gpt-4o-mini',
    ],
];